import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Upload, Camera, X, AlertCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { WILAYAS, ALL_CAR_BRANDS } from '../data';

const LISTING_TYPES = [
  { value: 'sell', label: 'بيع', emoji: '💰', desc: 'عرض للبيع' },
  { value: 'buy', label: 'طلب شراء', emoji: '🛒', desc: 'أبحث عن...' },
  { value: 'exchange', label: 'استبدال', emoji: '🔄', desc: 'مبادلة' },
];

const CATEGORIES = [
  { id: 'car', label: 'سيارة', emoji: '🚗', color: '#4facfe' },
  { id: 'motorcycle', label: 'دراجة', emoji: '🏍️', color: '#e94560' },
  { id: 'real_estate', label: 'عقار', emoji: '🏠', color: '#38ef7d' },
];

const FUEL_TYPES = [
  { value: 'essence', label: 'بنزين', emoji: '⛽' },
  { value: 'diesel', label: 'مازوت', emoji: '🛢️' },
  { value: 'electrique', label: 'كهربائي', emoji: '⚡' },
  { value: 'hybride', label: 'هجين', emoji: '🔋' },
  { value: 'gpl', label: 'غاز GPL', emoji: '💨' },
];

const TRANSMISSION_TYPES = [
  { value: 'manuelle', label: 'يدوي', emoji: '🕹️' },
  { value: 'automatique', label: 'أوتوماتيك', emoji: '🤖' },
];

const CONDITION_TYPES = [
  { value: 'neuf', label: 'جديدة', emoji: '✨', color: '#38ef7d' },
  { value: 'tres_bon', label: 'جيدة جداً', emoji: '👍', color: '#4facfe' },
  { value: 'bon', label: 'جيدة', emoji: '👌', color: '#f7b731' },
  { value: 'acceptable', label: 'مقبولة', emoji: '🤷', color: '#e94560' },
];

const PROPERTY_TYPES = [
  { value: 'appartement', label: 'شقة', emoji: '🏢' },
  { value: 'villa', label: 'فيلا', emoji: '🏡' },
  { value: 'maison', label: 'منزل', emoji: '🏠' },
  { value: 'terrain', label: 'قطعة أرض', emoji: '🌍' },
  { value: 'local_commercial', label: 'محل تجاري', emoji: '🏪' },
];

const TOTAL_STEPS = 4;

const AddListingScreen = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Step 1: Category & Type
  const [category, setCategory] = useState<'car'|'motorcycle'|'real_estate'>('car');
  const [listingType, setListingType] = useState('sell');
  
  // Step 2: Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('essence');
  const [transmission, setTransmission] = useState('manuelle');
  const [condition, setCondition] = useState('bon');
  const [motoBrand, setMotoBrand] = useState('');
  const [motoModel, setMotoModel] = useState('');
  const [engineCC, setEngineCC] = useState('');
  const [propertyType, setPropertyType] = useState('appartement');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [floor, setFloor] = useState('');
  const [hasElevator, setHasElevator] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasGarden, setHasGarden] = useState(false);
  
  // Step 3: Price & Location
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [wilaya, setWilaya] = useState('16 - الجزائر');
  const [commune, setCommune] = useState('');

  // Step 4: Photos
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Auto-generate title
  const autoTitle = () => {
    if (category === 'car' && carBrand && carModel) {
      return `${carBrand} ${carModel}${carYear ? ` ${carYear}` : ''}`;
    }
    if (category === 'motorcycle' && motoBrand && motoModel) {
      return `${motoBrand} ${motoModel}`;
    }
    return title;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (listingId: string): Promise<void> => {
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const isVideo = file.type.startsWith('video/');
        const fileName = `${listingId}/${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(fileName, file);

        if (uploadError) {
          console.error('خطأ في رفع الملف:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(fileName);

        // Use raw fetch for media insert
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token || SUPABASE_KEY;
        
        await fetch(`${SUPABASE_URL}/rest/v1/listing_media`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            listing_id: listingId,
            media_type: isVideo ? 'video' : 'image',
            public_url: publicUrl,
            storage_path: fileName,
            is_cover: i === 0,
            display_order: i,
          }),
        });
      } catch (err) {
        console.error(`خطأ في رفع الصورة ${i}:`, err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!user) { setErrorMsg('يجب تسجيل الدخول أولاً!'); return; }
    if (files.length === 0) { setErrorMsg('يجب إضافة صورة واحدة على الأقل!'); return; }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const finalTitle = title || autoTitle() || 'إعلان بدون عنوان';
      
      const listingPayload: Record<string, any> = {
        user_id: user.id,
        category,
        listing_type: listingType,
        title: finalTitle,
        description: description || finalTitle,
        price: price ? parseFloat(price) : null,
        currency: 'دج',
        wilaya,
        commune: commune || null,
        is_negotiable: isNegotiable,
        is_active: true,
      };

      if (category === 'car') {
        listingPayload.car_brand = carBrand || null;
        listingPayload.car_model = carModel || null;
        listingPayload.car_year = carYear ? parseInt(carYear) : null;
        listingPayload.mileage = mileage ? parseInt(mileage) : null;
        listingPayload.fuel_type = fuelType || null;
        listingPayload.transmission = transmission || null;
        listingPayload.condition = condition || null;
      } else if (category === 'motorcycle') {
        listingPayload.moto_brand = motoBrand || null;
        listingPayload.moto_model = motoModel || null;
        listingPayload.engine_cc = engineCC ? parseInt(engineCC) : null;
        listingPayload.condition = condition || null;
      } else if (category === 'real_estate') {
        listingPayload.property_type = propertyType || null;
        listingPayload.property_area_m2 = area ? parseFloat(area) : null;
        listingPayload.property_rooms = rooms ? parseInt(rooms) : null;
        listingPayload.property_floor = floor ? parseInt(floor) : null;
        listingPayload.has_elevator = hasElevator;
        listingPayload.has_parking = hasParking;
        listingPayload.has_garden = hasGarden;
      }

      console.log('📤 Inserting listing...', listingPayload);

      // Use raw fetch to insert listing - this avoids all supabase-js type issues
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || SUPABASE_KEY;

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/listings`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(listingPayload),
      });

      const insertData = await insertRes.json();
      console.log('📥 Insert response:', insertRes.status, insertData);

      if (!insertRes.ok) {
        const errMsg = insertData?.message || insertData?.error || JSON.stringify(insertData);
        throw new Error('فشل إدراج الإعلان: ' + errMsg);
      }

      const newListing = Array.isArray(insertData) ? insertData[0] : insertData;

      if (!newListing?.id) {
        throw new Error('لم يتم إرجاع بيانات الإعلان.');
      }

      // Upload media
      if (files.length > 0) {
        try {
          console.log('📷 Uploading media...');
          await uploadMedia(newListing.id);
          console.log('✅ Done');
        } catch (uploadErr) {
          console.error('⚠️ Media upload error:', uploadErr);
        }
      }

      setSuccessMsg('تم نشر الإعلان بنجاح! 🎉');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      console.error('❌ Error:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء إضافة الإعلان!');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch(step) {
      case 1: return true; // category and type always selected
      case 2: {
        if (category === 'car') return carBrand.length > 0;
        if (category === 'motorcycle') return motoBrand.length > 0;
        return true;
      }
      case 3: return wilaya.length > 0;
      case 4: return files.length > 0;
      default: return true;
    }
  };

  // ═══════════ RENDER ═══════════

  const renderProgressBar = () => (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '25px' }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: '4px', borderRadius: '2px',
          background: i < step ? 'linear-gradient(90deg, #4facfe, #00f2fe)' : 'rgba(255,255,255,0.1)',
          transition: 'background 0.5s ease'
        }} />
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>ماذا تريد أن تفعل؟ 🎯</h3>
      <p className="text-secondary" style={{ marginBottom: '20px' }}>اختر نوع العملية والفئة</p>
      
      {/* Listing Type */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        {LISTING_TYPES.map(lt => (
          <div key={lt.value} onClick={() => setListingType(lt.value)}
            style={{
              flex: 1, textAlign: 'center', padding: '15px 8px',
              border: `2px solid ${listingType === lt.value ? '#4facfe' : 'var(--color-glass-border)'}`,
              borderRadius: '15px',
              background: listingType === lt.value ? 'rgba(79, 172, 254, 0.15)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: listingType === lt.value ? 'scale(1.02)' : 'scale(1)',
            }}>
            <div style={{ fontSize: '28px', marginBottom: '5px' }}>{lt.emoji}</div>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{lt.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>{lt.desc}</div>
          </div>
        ))}
      </div>

      {/* Category */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {CATEGORIES.map(c => (
          <div key={c.id} onClick={() => setCategory(c.id as any)}
            style={{
              flex: 1, textAlign: 'center', padding: '20px 10px',
              border: `2px solid ${category === c.id ? c.color : 'var(--color-glass-border)'}`,
              borderRadius: '15px',
              background: category === c.id ? `${c.color}20` : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: category === c.id ? 'scale(1.03)' : 'scale(1)',
            }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>{c.emoji}</div>
            <div style={{ fontWeight: 'bold' }}>{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
        {category === 'car' ? '🚗 تفاصيل السيارة' : category === 'motorcycle' ? '🏍️ تفاصيل الدراجة' : '🏠 تفاصيل العقار'}
      </h3>
      <p className="text-secondary" style={{ marginBottom: '20px' }}>أضف المعلومات الأساسية</p>

      {category === 'car' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Brand */}
          <div>
            <label style={labelStyle}>الماركة *</label>
            <select value={carBrand} onChange={e => { setCarBrand(e.target.value); setCarModel(''); }} style={inputStyle}>
              <option value="" style={{color: '#000'}}>اختر الماركة...</option>
              {Object.keys(ALL_CAR_BRANDS).sort().map(brand => (
                <option key={brand} value={brand} style={{color: '#000'}}>{brand}</option>
              ))}
              <option value="Other" style={{color: '#000'}}>ماركة أخرى</option>
            </select>
          </div>

          {/* Model */}
          <div>
            <label style={labelStyle}>الموديل *</label>
            {carBrand && carBrand !== 'Other' ? (
              <select value={carModel} onChange={e => setCarModel(e.target.value)} style={inputStyle}>
                <option value="" style={{color: '#000'}}>اختر الموديل...</option>
                {ALL_CAR_BRANDS[carBrand]?.map(model => (
                  <option key={model} value={model} style={{color: '#000'}}>{model}</option>
                ))}
                <option value="Other" style={{color: '#000'}}>موديل آخر</option>
              </select>
            ) : (
              <input type="text" value={carModel} onChange={e => setCarModel(e.target.value)} style={inputStyle} placeholder="اكتب الموديل..." />
            )}
          </div>

          {/* Year + Mileage */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>السنة</label>
              <input type="number" value={carYear} onChange={e => setCarYear(e.target.value)} style={inputStyle} placeholder="2024" min="1950" max="2026" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>العداد (كم)</label>
              <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} style={inputStyle} placeholder="50000" />
            </div>
          </div>

          {/* Fuel */}
          <div>
            <label style={labelStyle}>نوع الوقود</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {FUEL_TYPES.map(f => (
                <div key={f.value} onClick={() => setFuelType(f.value)} style={{
                  ...chipStyle,
                  border: `1px solid ${fuelType === f.value ? '#4facfe' : 'var(--color-glass-border)'}`,
                  background: fuelType === f.value ? 'rgba(79,172,254,0.15)' : 'transparent',
                }}>
                  {f.emoji} {f.label}
                </div>
              ))}
            </div>
          </div>

          {/* Transmission */}
          <div>
            <label style={labelStyle}>ناقل الحركة</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {TRANSMISSION_TYPES.map(t => (
                <div key={t.value} onClick={() => setTransmission(t.value)} style={{
                  flex: 1, textAlign: 'center', ...chipStyle,
                  border: `2px solid ${transmission === t.value ? '#4facfe' : 'var(--color-glass-border)'}`,
                  background: transmission === t.value ? 'rgba(79,172,254,0.15)' : 'transparent',
                }}>
                  {t.emoji} {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label style={labelStyle}>الحالة</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CONDITION_TYPES.map(c => (
                <div key={c.value} onClick={() => setCondition(c.value)} style={{
                  ...chipStyle,
                  border: `1px solid ${condition === c.value ? c.color : 'var(--color-glass-border)'}`,
                  background: condition === c.value ? `${c.color}20` : 'transparent',
                }}>
                  {c.emoji} {c.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {category === 'motorcycle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={labelStyle}>الماركة *</label>
            <input type="text" value={motoBrand} onChange={e => setMotoBrand(e.target.value)} style={inputStyle} placeholder="Yamaha, Honda..." />
          </div>
          <div>
            <label style={labelStyle}>الموديل</label>
            <input type="text" value={motoModel} onChange={e => setMotoModel(e.target.value)} style={inputStyle} placeholder="MT-07, CBR..." />
          </div>
          <div>
            <label style={labelStyle}>قوة المحرك (CC)</label>
            <input type="number" value={engineCC} onChange={e => setEngineCC(e.target.value)} style={inputStyle} placeholder="125, 250, 600" />
          </div>
          <div>
            <label style={labelStyle}>الحالة</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CONDITION_TYPES.map(c => (
                <div key={c.value} onClick={() => setCondition(c.value)} style={{
                  ...chipStyle,
                  border: `1px solid ${condition === c.value ? c.color : 'var(--color-glass-border)'}`,
                  background: condition === c.value ? `${c.color}20` : 'transparent',
                }}>
                  {c.emoji} {c.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {category === 'real_estate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={labelStyle}>نوع العقار *</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PROPERTY_TYPES.map(p => (
                <div key={p.value} onClick={() => setPropertyType(p.value)} style={{
                  ...chipStyle,
                  border: `1px solid ${propertyType === p.value ? '#38ef7d' : 'var(--color-glass-border)'}`,
                  background: propertyType === p.value ? 'rgba(56,239,125,0.15)' : 'transparent',
                }}>
                  {p.emoji} {p.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>المساحة (م²)</label>
              <input type="number" value={area} onChange={e => setArea(e.target.value)} style={inputStyle} placeholder="80" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>الغرف</label>
              <input type="number" value={rooms} onChange={e => setRooms(e.target.value)} style={inputStyle} placeholder="3" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>الطابق</label>
              <input type="number" value={floor} onChange={e => setFloor(e.target.value)} style={inputStyle} placeholder="2" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <label style={checkboxChipStyle(hasElevator)}><input type="checkbox" checked={hasElevator} onChange={e => setHasElevator(e.target.checked)} style={{display:'none'}} /> 🛗 مصعد</label>
            <label style={checkboxChipStyle(hasParking)}><input type="checkbox" checked={hasParking} onChange={e => setHasParking(e.target.checked)} style={{display:'none'}} /> 🅿️ مرآب</label>
            <label style={checkboxChipStyle(hasGarden)}><input type="checkbox" checked={hasGarden} onChange={e => setHasGarden(e.target.checked)} style={{display:'none'}} /> 🌿 حديقة</label>
          </div>
        </div>
      )}

      {/* Custom title (optional) */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed var(--color-glass-border)', borderRadius: '12px' }}>
        <label style={labelStyle}>العنوان (اختياري - يتم توليده تلقائياً)</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder={autoTitle() || 'عنوان مخصص...'} />
        <label style={{ ...labelStyle, marginTop: '10px' }}>الوصف (اختياري)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} placeholder="تفاصيل إضافية..."></textarea>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>💰 السعر والموقع</h3>
      <p className="text-secondary" style={{ marginBottom: '20px' }}>حدد السعر والولاية</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Price */}
        <div>
          <label style={labelStyle}>السعر (دج)</label>
          <div style={{ position: 'relative' }}>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={{...inputStyle, paddingRight: '50px', fontSize: '1.3rem', fontWeight: 'bold', textAlign: 'center'}} placeholder="0" />
            <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>دج</span>
          </div>
        </div>

        {/* Negotiable */}
        <div onClick={() => setIsNegotiable(!isNegotiable)} style={{
          padding: '15px', borderRadius: '12px', cursor: 'pointer',
          border: `2px solid ${isNegotiable ? '#38ef7d' : 'var(--color-glass-border)'}`,
          background: isNegotiable ? 'rgba(56,239,125,0.1)' : 'transparent',
          display: 'flex', alignItems: 'center', gap: '10px',
          transition: 'all 0.3s ease',
        }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            border: `2px solid ${isNegotiable ? '#38ef7d' : 'var(--color-glass-border)'}`,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: isNegotiable ? '#38ef7d' : 'transparent',
          }}>
            {isNegotiable && <Check size={16} color="#000" />}
          </div>
          <span style={{ fontWeight: isNegotiable ? 'bold' : 'normal' }}>قابل للتفاوض</span>
        </div>

        {/* Wilaya */}
        <div>
          <label style={labelStyle}>الولاية *</label>
          <select value={wilaya} onChange={e => setWilaya(e.target.value)} style={inputStyle}>
            {WILAYAS.map(w => <option key={w} value={w} style={{color: '#000'}}>{w}</option>)}
          </select>
        </div>

        {/* Commune */}
        <div>
          <label style={labelStyle}>البلدية (اختياري)</label>
          <input type="text" value={commune} onChange={e => setCommune(e.target.value)} style={inputStyle} placeholder="اسم البلدية..." />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>📸 أضف الصور</h3>
      <p className="text-secondary" style={{ marginBottom: '20px' }}>الصورة الأولى ستكون الغلاف</p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {previewUrls.map((url, idx) => (
          <div key={idx} style={{ position: 'relative', width: '100px', height: '100px' }}>
            <img src={url} alt={`صورة ${idx + 1}`} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
            {idx === 0 && <span style={{ position: 'absolute', bottom: '5px', left: '5px', background: '#4facfe', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px' }}>غلاف</span>}
            <button 
              type="button"
              onClick={() => removeFile(idx)} 
              style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#e94560', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
              <X size={14} color="#fff" />
            </button>
          </div>
        ))}
        
        <label style={{ 
          width: '100px', height: '100px', borderRadius: '12px', 
          border: '2px dashed var(--color-glass-border)', 
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
          cursor: 'pointer', background: 'rgba(255,255,255,0.02)',
          gap: '5px', transition: 'all 0.3s ease',
        }}>
          <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
          <Camera size={24} color="var(--color-text-secondary)" />
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>إضافة</span>
        </label>
      </div>

      {/* Summary Card */}
      <div style={{ background: 'rgba(79,172,254,0.05)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: '15px', padding: '15px', marginBottom: '15px' }}>
        <h4 style={{ color: '#4facfe', fontSize: '1rem', marginBottom: '10px' }}>📋 ملخص الإعلان</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
          <span className="text-secondary">العنوان:</span>
          <span style={{ fontWeight: 'bold' }}>{title || autoTitle() || '—'}</span>
          <span className="text-secondary">الفئة:</span>
          <span>{CATEGORIES.find(c => c.id === category)?.emoji} {CATEGORIES.find(c => c.id === category)?.label}</span>
          <span className="text-secondary">الولاية:</span>
          <span>{wilaya}</span>
          <span className="text-secondary">السعر:</span>
          <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{price ? `${Number(price).toLocaleString()} دج` : 'غير محدد'}</span>
        </div>
      </div>
    </div>
  );

  // ═══════════ SUCCESS VIEW ═══════════
  if (successMsg) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ fontSize: '80px', marginBottom: '20px', animation: 'bounceIn 0.6s ease' }}>🎉</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>تم النشر بنجاح!</h2>
        <p className="text-secondary">سيتم توجيهك للصفحة الرئيسية...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 20px 120px 20px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>إعلان جديد</h2>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>الخطوة {step} من {TOTAL_STEPS}</span>
      </div>

      {renderProgressBar()}

      {errorMsg && <div style={{ background: 'rgba(233, 69, 96, 0.1)', border: '1px solid rgba(233, 69, 96, 0.3)', padding: '12px', borderRadius: '10px', marginBottom: '15px', color: 'var(--color-accent)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><AlertCircle size={18} />{errorMsg}</div>}

      <div className="glass-card" style={{ padding: '20px' }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} style={{
            flex: 1, padding: '15px', borderRadius: '15px',
            background: 'var(--color-glass-bg)', border: '1px solid var(--color-glass-border)',
            color: '#fff', fontWeight: 'bold', fontSize: '1rem',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            cursor: 'pointer',
          }}>
            <ArrowRight size={18} /> السابق
          </button>
        )}
        
        {step < TOTAL_STEPS ? (
          <button onClick={() => canProceed() && setStep(step + 1)} style={{
            flex: 2, padding: '15px', borderRadius: '15px',
            background: canProceed() ? 'linear-gradient(90deg, #4facfe, #00f2fe)' : 'rgba(255,255,255,0.1)',
            border: 'none', color: '#fff', fontWeight: 'bold', fontSize: '1rem',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            cursor: canProceed() ? 'pointer' : 'not-allowed',
            opacity: canProceed() ? 1 : 0.5,
            boxShadow: canProceed() ? '0 4px 15px rgba(79, 172, 254, 0.4)' : 'none',
          }}>
            التالي <ArrowLeft size={18} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading || files.length === 0} style={{
            flex: 2, padding: '15px', borderRadius: '15px',
            background: files.length > 0 ? 'linear-gradient(90deg, #38ef7d, #11998e)' : 'rgba(255,255,255,0.1)',
            border: 'none', color: '#fff', fontWeight: 'bold', fontSize: '1rem',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            cursor: files.length > 0 ? 'pointer' : 'not-allowed',
            opacity: files.length > 0 ? 1 : 0.5,
            boxShadow: files.length > 0 ? '0 4px 15px rgba(56, 239, 125, 0.4)' : 'none',
          }}>
            {loading ? 'جاري النشر...' : 'نشر الإعلان 🚀'} <Upload size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 15px', borderRadius: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--color-glass-border)',
  color: '#fff', fontFamily: 'inherit', outline: 'none', fontSize: '1rem',
};
const chipStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem',
  display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s ease',
};
const checkboxChipStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
  border: `1px solid ${active ? '#38ef7d' : 'var(--color-glass-border)'}`,
  background: active ? 'rgba(56,239,125,0.15)' : 'transparent',
  display: 'flex', alignItems: 'center', gap: '6px',
  transition: 'all 0.3s ease', fontSize: '0.9rem',
});

export default AddListingScreen;
