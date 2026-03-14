-- تمهيد: تفعيل امتداد uuid-ossp لإنشاء المعرفات الفريدة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------------------------------------
-- 1. جدول الحسابات الشخصية (profiles)
-------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    wilaya TEXT,
    avatar_url TEXT,
    qr_code_token TEXT UNIQUE NOT NULL,
    total_qr_scans INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-------------------------------------------------------
-- 2. Trigger لإنشاء الحساب تلقائياً عند التسجيل (لحل مشكلة التفريغ)
-------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  qr_token TEXT;
BEGIN
  -- جلب QR Token من الميتاداتا التي نرسلها من الواجهة أو توليد واحد تلقائياً
  qr_token := COALESCE(
    NEW.raw_user_meta_data->>'qr_code_token', 
    encode(gen_random_bytes(10), 'hex')
  );

  INSERT INTO public.profiles (id, full_name, phone_number, wilaya, qr_code_token)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    NEW.raw_user_meta_data->>'wilaya',
    qr_token
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ربط الـ Trigger بجدول auth.users (الخاص بسوبابيز)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-------------------------------------------------------
-- 3. جدول الإعلانات (listings)
-------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('car', 'motorcycle', 'real_estate')),
    listing_type TEXT NOT NULL CHECK (listing_type IN ('sell', 'buy', 'exchange')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC,
    currency TEXT DEFAULT 'دج',
    wilaya TEXT NOT NULL,
    commune TEXT,
    is_negotiable BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    
    -- بيانات السيارة
    car_brand TEXT,
    car_model TEXT,
    car_year INTEGER,
    mileage NUMERIC,
    fuel_type TEXT,
    transmission TEXT,
    condition TEXT,
    
    -- بيانات الدراجة
    moto_brand TEXT,
    moto_model TEXT,
    engine_cc NUMERIC,
    
    -- بيانات العقار
    property_type TEXT,
    property_area_m2 NUMERIC,
    property_rooms INTEGER,
    property_floor INTEGER,
    has_elevator BOOLEAN DEFAULT false,
    has_parking BOOLEAN DEFAULT false,
    has_garden BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listings are viewable by everyone." 
ON public.listings FOR SELECT USING (true);

CREATE POLICY "Users can create their own listings." 
ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings." 
ON public.listings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings." 
ON public.listings FOR DELETE USING (auth.uid() = user_id);


-------------------------------------------------------
-- 4. جدول الوسائط والصور (listing_media)
-------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listing_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    public_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    is_cover BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listing media is viewable by everyone." 
ON public.listing_media FOR SELECT USING (true);

CREATE POLICY "Users can insert media to their own listings." 
ON public.listing_media FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_media.listing_id AND user_id = auth.uid())
);

CREATE POLICY "Users can delete media of their own listings." 
ON public.listing_media FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_media.listing_id AND user_id = auth.uid())
);


-------------------------------------------------------
-- 5. جدول عمليات مسح الكود (qr_scans)
-------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.qr_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scanner_ip TEXT,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can insert a qr scan." 
ON public.qr_scans FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own qr scans." 
ON public.qr_scans FOR SELECT USING (auth.uid() = user_id);


-------------------------------------------------------
-- 6. إعداد حاوية التخزين (Storage Bucket) للصور
-------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT USING (bucket_id = 'listings');

CREATE POLICY "Authenticated users can upload media" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listings' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own media" 
ON storage.objects FOR DELETE USING (bucket_id = 'listings' AND auth.uid() = owner);


-------------------------------------------------------
-- 7. دوال قاعدة البيانات (RPC Functions) للعدادات
-------------------------------------------------------

CREATE OR REPLACE FUNCTION increment_view_count(listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.listings
  SET view_count = view_count + 1
  WHERE id = listing_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_qr_scans(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET total_qr_scans = total_qr_scans + 1
  WHERE id = user_id_param;
  
  INSERT INTO public.qr_scans (user_id)
  VALUES (user_id_param);
END;
$$;
