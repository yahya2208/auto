import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Upload, Camera, X, AlertCircle } from 'lucide-react';

const WILAYAS = [
  "01 - أدرار", "02 - الشلف", "03 - الأغواط", "04 - أم البواقي", "05 - باتنة",
  "06 - بجاية", "07 - بسكرة", "08 - بشار", "09 - البليدة", "10 - البويرة",
  "11 - تمنراست", "12 - تبسة", "13 - تلمسان", "14 - تيارت", "15 - تيزي وزو",
  "16 - الجزائر", "17 - الجلفة", "18 - جيجل", "19 - سطيف", "20 - سعيدة",
  "21 - سكيكدة", "22 - سيدي بلعباس", "23 - عنابة", "24 - قالمة", "25 - قسنطينة",
  "26 - المدية", "27 - مستغانم", "28 - المسيلة", "29 - معسكر", "30 - ورقلة",
  "31 - وهران", "32 - البيض", "33 - إليزي", "34 - برج بوعريريج", "35 - بومرداس",
  "36 - الطارف", "37 - تندوف", "38 - تيسمسيلت", "39 - الوادي", "40 - خنشلة",
  "41 - سوق أهراس", "42 - تيبازة", "43 - ميلة", "44 - عين الدفلى", "45 - النعامة",
  "46 - عين تموشنت", "47 - غرداية", "48 - غليزان",
  "49 - تيميمون", "50 - برج باجي مختار", "51 - أولاد جلال", "52 - بني عباس",
  "53 - عين صالح", "54 - عين قزام", "55 - تقرت", "56 - جانت", "57 - المغير", "58 - المنيعة"
];

const LISTING_TYPES = [
  { value: 'sell', label: 'بيع' },
  { value: 'buy', label: 'شراء' },
  { value: 'exchange', label: 'استبدال' },
];

const FUEL_TYPES = [
  { value: 'essence', label: 'بنزين' },
  { value: 'diesel', label: 'مازوت' },
  { value: 'electrique', label: 'كهربائي' },
  { value: 'hybride', label: 'هجين' },
  { value: 'gpl', label: 'غاز GPL' },
];

const TRANSMISSION_TYPES = [
  { value: 'manuelle', label: 'يدوي' },
  { value: 'automatique', label: 'أوتوماتيك' },
];

const CONDITION_TYPES = [
  { value: 'neuf', label: 'جديدة' },
  { value: 'tres_bon', label: 'جيدة جداً' },
  { value: 'bon', label: 'جيدة' },
  { value: 'acceptable', label: 'مقبولة' },
];

const PROPERTY_TYPES = [
  { value: 'appartement', label: 'شقة' },
  { value: 'villa', label: 'فيلا' },
  { value: 'maison', label: 'منزل' },
  { value: 'terrain', label: 'قطعة أرض' },
  { value: 'local_commercial', label: 'محل تجاري' },
];

const AddListingScreen = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [category, setCategory] = useState<'car'|'motorcycle'|'real_estate'>('car');
  const [listingType, setListingType] = useState('sell');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [wilaya, setWilaya] = useState('16 - الجزائر');
  const [commune, setCommune] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // Car fields
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('essence');
  const [transmission, setTransmission] = useState('manuelle');
  const [condition, setCondition] = useState('bon');

  // Moto fields
  const [motoBrand, setMotoBrand] = useState('');
  const [motoModel, setMotoModel] = useState('');
  const [engineCC, setEngineCC] = useState('');

  // Real estate fields
  const [propertyType, setPropertyType] = useState('appartement');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [floor, setFloor] = useState('');
  const [hasElevator, setHasElevator] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasGarden, setHasGarden] = useState(false);

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

      await supabase.from('listing_media').insert({
        listing_id: listingId,
        media_type: isVideo ? 'video' : 'image',
        public_url: publicUrl,
        storage_path: fileName,
        is_cover: i === 0,
        display_order: i,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setErrorMsg('يجب تسجيل الدخول أولاً!'); return; }
    if (files.length === 0) { setErrorMsg('يجب إضافة صورة واحدة على الأقل!'); return; }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // بناء كائن البيانات
      const listingPayload: Record<string, any> = {
        user_id: user.id,
        category,
        listing_type: listingType,
        title,
        description,
        price: price ? parseFloat(price) : null,
        currency: 'دج',
        wilaya,
        commune: commune || null,
        is_negotiable: isNegotiable,
        is_active: true,
      };

      // إضافة الحقول الخاصة بالفئة
      if (category === 'car') {
        listingPayload.car_brand = carBrand;
        listingPayload.car_model = carModel;
        listingPayload.car_year = carYear ? parseInt(carYear) : null;
        listingPayload.mileage = mileage ? parseInt(mileage) : null;
        listingPayload.fuel_type = fuelType;
        listingPayload.transmission = transmission;
        listingPayload.condition = condition;
      } else if (category === 'motorcycle') {
        listingPayload.moto_brand = motoBrand;
        listingPayload.moto_model = motoModel;
        listingPayload.engine_cc = engineCC ? parseInt(engineCC) : null;
        listingPayload.condition = condition;
      } else if (category === 'real_estate') {
        listingPayload.property_type = propertyType;
        listingPayload.property_area_m2 = area ? parseFloat(area) : null;
        listingPayload.property_rooms = rooms ? parseInt(rooms) : null;
        listingPayload.property_floor = floor ? parseInt(floor) : null;
        listingPayload.has_elevator = hasElevator;
        listingPayload.has_parking = hasParking;
        listingPayload.has_garden = hasGarden;
      }

      // 1. إدراج الإعلان في قاعدة البيانات
      const { data: newListing, error: insertError } = await supabase
        .from('listings')
        .insert(listingPayload)
        .select()
        .single();

      if (insertError) {
        throw new Error('فشل إدراج الإعلان: ' + insertError.message);
      }

      // 2. رفع الصور والفيديوهات
      if (newListing && files.length > 0) {
        await uploadMedia(newListing.id);
      }

      setSuccessMsg('تم نشر الإعلان بنجاح! 🎉');
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      console.error('Failed to create listing:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء إضافة الإعلان!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px 20px 100px 20px', overflowY: 'auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>إضافة إعلان جديد</h2>
        <p className="text-secondary">انشر ما تريد بيعه بسرعة وبسهولة</p>
      </div>

      {successMsg && <div style={{ background: 'rgba(56, 239, 125, 0.1)', border: '1px solid rgba(56, 239, 125, 0.3)', padding: '12px', borderRadius: '10px', marginBottom: '15px', color: '#38ef7d', textAlign: 'center', fontWeight: 'bold' }}>{successMsg}</div>}
      {errorMsg && <div style={{ background: 'rgba(233, 69, 96, 0.1)', border: '1px solid rgba(233, 69, 96, 0.3)', padding: '12px', borderRadius: '10px', marginBottom: '15px', color: 'var(--color-accent)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><AlertCircle size={18} />{errorMsg}</div>}

      <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* نوع الإعلان (بيع/شراء/استبدال) */}
        <div>
          <label style={labelStyle}>نوع العملية</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {LISTING_TYPES.map(lt => (
              <div key={lt.value} onClick={() => setListingType(lt.value)}
                style={{ flex: 1, textAlign: 'center', padding: '10px', border: `1px solid ${listingType === lt.value ? 'var(--color-electric)' : 'var(--color-glass-border)'}`, borderRadius: '10px', background: listingType === lt.value ? 'rgba(79, 172, 254, 0.1)' : 'transparent', cursor: 'pointer', fontWeight: listingType === lt.value ? 'bold' : 'normal' }}>
                {lt.label}
              </div>
            ))}
          </div>
        </div>

        {/* فئة الإعلان */}
        <div>
          <label style={labelStyle}>الفئة</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { id: 'car', label: 'سيارة 🚗' },
              { id: 'motorcycle', label: 'دراجة 🏍️' },
              { id: 'real_estate', label: 'عقار 🏠' },
            ].map(c => (
              <div key={c.id} onClick={() => setCategory(c.id as any)}
                style={{ flex: 1, textAlign: 'center', padding: '10px', border: `1px solid ${category === c.id ? 'var(--color-accent)' : 'var(--color-glass-border)'}`, borderRadius: '10px', background: category === c.id ? 'rgba(233, 69, 96, 0.1)' : 'transparent', cursor: 'pointer', fontWeight: category === c.id ? 'bold' : 'normal' }}>
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* العنوان */}
        <div>
          <label style={labelStyle}>العنوان *</label>
          <input required type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="مثال: سيارة رينو كليو 4 موديل 2020" />
        </div>

        {/* الوصف */}
        <div>
          <label style={labelStyle}>الوصف *</label>
          <textarea required value={description} onChange={e => setDescription(e.target.value)} style={{...inputStyle, minHeight: '100px', resize: 'vertical'}} placeholder="تفاصيل الإعلان: الحالة، المواصفات، سبب البيع..."></textarea>
        </div>

        {/* السعر + الولاية */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>السعر (دج)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} placeholder="اختياري" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>الولاية *</label>
            <select required value={wilaya} onChange={e => setWilaya(e.target.value)} style={inputStyle}>
              {WILAYAS.map(w => <option key={w} value={w} style={{color: '#000'}}>{w}</option>)}
            </select>
          </div>
        </div>

        {/* البلدية + قابل للتفاوض */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>البلدية</label>
            <input type="text" value={commune} onChange={e => setCommune(e.target.value)} style={inputStyle} placeholder="اختياري" />
          </div>
          <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--color-glass-border)', cursor: 'pointer' }}>
            <input type="checkbox" checked={isNegotiable} onChange={e => setIsNegotiable(e.target.checked)} />
            <span style={{ fontSize: '0.9rem' }}>قابل للتفاوض</span>
          </label>
        </div>

        {/* ═══ حقول السيارة ═══ */}
        {category === 'car' && (
          <div style={{ border: '1px solid var(--color-glass-border)', borderRadius: '15px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ color: 'var(--color-electric)', marginBottom: '5px' }}>🚗 مواصفات السيارة</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>الماركة *</label>
                <input required type="text" value={carBrand} onChange={e => setCarBrand(e.target.value)} style={inputStyle} placeholder="Renault, Toyota..." />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>الموديل *</label>
                <input required type="text" value={carModel} onChange={e => setCarModel(e.target.value)} style={inputStyle} placeholder="Clio 4, Corolla..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>السنة</label>
                <input type="number" value={carYear} onChange={e => setCarYear(e.target.value)} style={inputStyle} placeholder="2020" min="1950" max="2026" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>العداد (كم)</label>
                <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} style={inputStyle} placeholder="50000" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>الوقود</label>
                <select value={fuelType} onChange={e => setFuelType(e.target.value)} style={inputStyle}>
                  {FUEL_TYPES.map(f => <option key={f.value} value={f.value} style={{color:'#000'}}>{f.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>الناقل</label>
                <select value={transmission} onChange={e => setTransmission(e.target.value)} style={inputStyle}>
                  {TRANSMISSION_TYPES.map(t => <option key={t.value} value={t.value} style={{color:'#000'}}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>الحالة</label>
              <select value={condition} onChange={e => setCondition(e.target.value)} style={inputStyle}>
                {CONDITION_TYPES.map(c => <option key={c.value} value={c.value} style={{color:'#000'}}>{c.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ═══ حقول الدراجة ═══ */}
        {category === 'motorcycle' && (
          <div style={{ border: '1px solid var(--color-glass-border)', borderRadius: '15px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ color: 'var(--color-violet)', marginBottom: '5px' }}>🏍️ مواصفات الدراجة</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>الماركة *</label>
                <input required type="text" value={motoBrand} onChange={e => setMotoBrand(e.target.value)} style={inputStyle} placeholder="Yamaha, Honda..." />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>الموديل *</label>
                <input required type="text" value={motoModel} onChange={e => setMotoModel(e.target.value)} style={inputStyle} placeholder="MT-07, CBR..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>قوة المحرك (CC)</label>
                <input type="number" value={engineCC} onChange={e => setEngineCC(e.target.value)} style={inputStyle} placeholder="125, 250, 600" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>الحالة</label>
                <select value={condition} onChange={e => setCondition(e.target.value)} style={inputStyle}>
                  {CONDITION_TYPES.map(c => <option key={c.value} value={c.value} style={{color:'#000'}}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ═══ حقول العقار ═══ */}
        {category === 'real_estate' && (
          <div style={{ border: '1px solid var(--color-glass-border)', borderRadius: '15px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ color: '#00d9a3', marginBottom: '5px' }}>🏠 مواصفات العقار</h4>
            <div>
              <label style={labelStyle}>نوع العقار *</label>
              <select required value={propertyType} onChange={e => setPropertyType(e.target.value)} style={inputStyle}>
                {PROPERTY_TYPES.map(p => <option key={p.value} value={p.value} style={{color:'#000'}}>{p.label}</option>)}
              </select>
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
              <label style={checkboxStyle}><input type="checkbox" checked={hasElevator} onChange={e => setHasElevator(e.target.checked)} /> مصعد</label>
              <label style={checkboxStyle}><input type="checkbox" checked={hasParking} onChange={e => setHasParking(e.target.checked)} /> مرآب</label>
              <label style={checkboxStyle}><input type="checkbox" checked={hasGarden} onChange={e => setHasGarden(e.target.checked)} /> حديقة</label>
            </div>
          </div>
        )}

        {/* ═══ رفع الصور ═══ */}
        <div>
          <label style={labelStyle}>الصور / الفيديو * (أضف صورة واحدة على الأقل)</label>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', flexWrap: 'wrap' }}>
            {previewUrls.map((url, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img src={url} alt={`صورة ${idx + 1}`} style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' }} />
                <button 
                  type="button"
                  onClick={() => removeFile(idx)} 
                  style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--color-accent)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                  <X size={14} color="#fff" />
                </button>
              </div>
            ))}
            
            <label style={{ 
              width: '80px', height: '80px', borderRadius: '10px', 
              border: '2px dashed var(--color-glass-border)', 
              display: 'flex', justifyContent: 'center', alignItems: 'center', 
              cursor: 'pointer', background: 'rgba(255,255,255,0.02)',
              flexShrink: 0,
            }}>
              <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
              <Camera size={24} color="var(--color-text-secondary)" />
            </label>
          </div>
        </div>

        <button type="submit" className="primary-btn mt-4" disabled={loading}>
          {loading ? 'جاري النشر...' : 'نشر الإعلان'} <Upload size={18} />
        </button>
      </form>
    </div>
  );
};

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 15px', borderRadius: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--color-glass-border)',
  color: '#fff', fontFamily: 'inherit', outline: 'none', fontSize: '1rem',
};
const checkboxStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
  background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--color-glass-border)', cursor: 'pointer',
};

export default AddListingScreen;
