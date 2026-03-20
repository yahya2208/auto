-- ============================================================
-- كوورتي Courtier - Schema الكامل والمحدث
-- قم بنسخ هذا الملف بالكامل وتشغيله في Supabase SQL Editor
-- ============================================================

-- تمهيد: تفعيل الامتدادات
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
    followers_count INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-------------------------------------------------------
-- 2. Trigger لإنشاء الحساب تلقائياً عند التسجيل
-------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  qr_token TEXT;
BEGIN
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-------------------------------------------------------
-- 3. جدول الإعلانات (listings) - محدث بكل الأعمدة
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
    share_count INTEGER DEFAULT 0,
    
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

-- إضافة الأعمدة الناقصة في حال كان الجدول موجوداً مسبقاً
DO $$ BEGIN
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS fuel_type TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS transmission TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS condition TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS car_brand TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS car_model TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS car_year INTEGER;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS mileage NUMERIC;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS moto_brand TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS moto_model TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS engine_cc NUMERIC;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS property_type TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS property_area_m2 NUMERIC;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS property_rooms INTEGER;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS property_floor INTEGER;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS has_elevator BOOLEAN DEFAULT false;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT false;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS has_garden BOOLEAN DEFAULT false;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS commune TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT false;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Listings are viewable by everyone." ON public.listings;
CREATE POLICY "Listings are viewable by everyone." 
ON public.listings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own listings." ON public.listings;
CREATE POLICY "Users can create their own listings." 
ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own listings." ON public.listings;
CREATE POLICY "Users can update their own listings." 
ON public.listings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own listings." ON public.listings;
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

DROP POLICY IF EXISTS "Listing media is viewable by everyone." ON public.listing_media;
CREATE POLICY "Listing media is viewable by everyone." 
ON public.listing_media FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert media to their own listings." ON public.listing_media;
CREATE POLICY "Users can insert media to their own listings." 
ON public.listing_media FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_media.listing_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete media of their own listings." ON public.listing_media;
CREATE POLICY "Users can delete media of their own listings." 
ON public.listing_media FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_media.listing_id AND user_id = auth.uid())
);


-------------------------------------------------------
-- جدول التعليقات (comments)
-------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.comments;
CREATE POLICY "Comments are viewable by everyone." 
ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add comments." ON public.comments;
CREATE POLICY "Users can add comments." 
ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

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

DROP POLICY IF EXISTS "Everyone can insert a qr scan." ON public.qr_scans;
CREATE POLICY "Everyone can insert a qr scan." 
ON public.qr_scans FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own qr scans." ON public.qr_scans;
CREATE POLICY "Users can view their own qr scans." 
ON public.qr_scans FOR SELECT USING (auth.uid() = user_id);


-------------------------------------------------------
-- 6. جدول المتابعات (follows) - جديد!
-------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their follows." ON public.follows;
CREATE POLICY "Users can see their follows." 
ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can follow." ON public.follows;
CREATE POLICY "Authenticated users can follow." 
ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow." ON public.follows;
CREATE POLICY "Users can unfollow." 
ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- إضافة أعمدة إضافية إلى profiles إن لم تكن موجودة
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-------------------------------------------------------
-- 9. تحديث إضافة سوق الهواتف والملابس الأصلية (Marketplace Expansion)
-------------------------------------------------------
DO $$ BEGIN
  -- Drop category check constraint to allow new types
  ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_category_check;
  -- Re-add with new categories
  ALTER TABLE public.listings ADD CONSTRAINT listings_category_check CHECK (category IN ('car', 'motorcycle', 'real_estate', 'phone', 'clothing'));
  
  -- Add specific fields for Phones
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS phone_brand TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS phone_model TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS storage_capacity INTEGER;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS ram INTEGER;
  
  -- Add specific fields for Clothing (Original Brands)
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS clothing_category TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS clothing_type TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS clothing_brand TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS clothing_size TEXT;
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS clothing_gender TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-------------------------------------------------------
-- 7. إعداد حاوية التخزين (Storage Bucket) للصور
-------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT USING (bucket_id = 'listings');

DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listings' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
CREATE POLICY "Users can delete their own media" 
ON storage.objects FOR DELETE USING (bucket_id = 'listings' AND auth.uid() = owner);


-------------------------------------------------------
-- 8. دوال RPC
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

-- دالة المتابعة
CREATE OR REPLACE FUNCTION follow_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.follows (follower_id, following_id)
  VALUES (auth.uid(), target_user_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;
  
  UPDATE public.profiles
  SET followers_count = followers_count + 1
  WHERE id = target_user_id;
END;
$$;

-- دالة إلغاء المتابعة
CREATE OR REPLACE FUNCTION unfollow_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  was_following BOOLEAN;
BEGIN
  DELETE FROM public.follows 
  WHERE follower_id = auth.uid() AND following_id = target_user_id
  RETURNING true INTO was_following;
  
  IF was_following THEN
    UPDATE public.profiles
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE id = target_user_id;
  END IF;
END;
$$;

-- تحديث المشاركات
CREATE OR REPLACE FUNCTION increment_shares(listing_id_param UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.listings SET share_count = share_count + 1 WHERE id = listing_id_param;
$$;

-- جلب معرّف الأدمن (للمتابعة التلقائية)
CREATE OR REPLACE FUNCTION get_admin_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- نأخذ أول حساب أدمن، أو أي أدمن موجود
  SELECT id FROM public.profiles WHERE is_admin = true LIMIT 1;
$$;

-- تحديث الذاكرة المخفية
NOTIFY pgrst, 'reload schema';
