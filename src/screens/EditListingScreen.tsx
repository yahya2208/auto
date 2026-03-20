import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Upload, Camera, X, AlertCircle, ArrowLeft, ArrowRight, Check, Trash2 } from 'lucide-react';
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

const EditListingScreen = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  
  // States to hold listing data
  const [category, setCategory] = useState<'car'|'motorcycle'|'real_estate'>('car');
  const [listingType, setListingType] = useState('sell');
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
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');

  // Media Management
  const [existingMedia, setExistingMedia] = useState<any[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        const { data, error } = await (supabase
          .from('listings') as any)
          .select(`
            *,
            listing_media (*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        const listingData = data as any;
        if (!listingData) throw new Error('الإعلان غير موجود');

        // Check ownership
        if (listingData.user_id !== user?.id) {
          navigate('/');
          return;
        }

        // Fill states
        setCategory(listingData.category);
        setListingType(listingData.listing_type);
        setTitle(listingData.title || '');
        setDescription(listingData.description || '');
        setCarBrand(listingData.car_brand || '');
        setCarModel(listingData.car_model || '');
        setCarYear(listingData.car_year?.toString() || '');
        setMileage(listingData.mileage?.toString() || '');
        setFuelType(listingData.fuel_type || 'essence');
        setTransmission(listingData.transmission || 'manuelle');
        setCondition(listingData.condition || 'bon');
        setMotoBrand(listingData.moto_brand || '');
        setMotoModel(listingData.moto_model || '');
        setEngineCC(listingData.engine_cc?.toString() || '');
        setPropertyType(listingData.property_type || 'appartement');
        setArea(listingData.property_area_m2?.toString() || '');
        setRooms(listingData.property_rooms?.toString() || '');
        setFloor(listingData.property_floor?.toString() || '');
        setHasElevator(listingData.has_elevator || false);
        setHasParking(listingData.has_parking || false);
        setHasGarden(listingData.has_garden || false);
        setPrice(listingData.price?.toString() || '');
        setIsNegotiable(listingData.is_negotiable || false);
        setWilaya(listingData.wilaya || '');
        setCommune(listingData.commune || '');
        setExistingMedia(listingData.listing_media || []);

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching listing:', err);
        setErrorMsg('فشل تحميل بيانات الإعلان');
        setLoading(false);
      }
    };

    if (user) fetchListing();
  }, [id, user, navigate]);

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

  const removeNewFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (mediaId: string) => {
    setExistingMedia(prev => prev.filter(m => m.id !== mediaId));
    setMediaToDelete(prev => [...prev, mediaId]);
  };

  const uploadMedia = async (listingId: string): Promise<void> => {
    if (files.length === 0) return;
    setUploadProgress({ current: 0, total: files.length });
    
    const uploadPromises = files.map(async (file, index) => {
      try {
        const fileExt = file.name.split('.').pop();
        const isVideo = file.type.startsWith('video/');
        const fileName = `${listingId}/${Date.now()}_edit_${index}.${fileExt}`;

        await (supabase.storage.from('listings') as any).upload(fileName, file);
        const { data: { publicUrl } } = (supabase.storage.from('listings') as any).getPublicUrl(fileName);

        const SUPABASE_URL = supabaseUrl;
        const SUPABASE_KEY = supabaseAnonKey;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token || SUPABASE_KEY;

        await fetch(`${SUPABASE_URL}/rest/v1/listing_media`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listing_id: listingId,
            media_type: isVideo ? 'video' : 'image',
            public_url: publicUrl,
            storage_path: fileName,
            is_cover: existingMedia.length === 0 && index === 0,
            display_order: existingMedia.length + index,
          }),
        });

        setUploadProgress((prev: any) => ({ ...prev, current: prev.current + 1 }));
      } catch (err) {
        console.error('Upload error:', err);
        setUploadProgress((prev: any) => ({ ...prev, current: prev.current + 1 }));
      }
    });

    await Promise.all(uploadPromises);
  };

  const handleUpdate = async () => {
    if (!id || !user) return;
    if (existingMedia.length === 0 && files.length === 0) {
      setErrorMsg('يجب إبقاء صورة واحدة على الأقل!');
      return;
    }

    setUpdating(true);
    setErrorMsg('');

    try {
      const finalTitle = title || autoTitle();
      const payload: any = {
        title: finalTitle,
        description: description || finalTitle,
        listing_type: listingType,
        category,
        price: price ? parseFloat(price) : null,
        wilaya,
        commune,
        is_negotiable: isNegotiable,
      };

      if (category === 'car') {
        payload.car_brand = carBrand;
        payload.car_model = carModel;
        payload.car_year = carYear ? parseInt(carYear) : null;
        payload.mileage = mileage ? parseInt(mileage) : null;
        payload.fuel_type = fuelType;
        payload.transmission = transmission;
        payload.condition = condition;
      } else if (category === 'motorcycle') {
        payload.moto_brand = motoBrand;
        payload.moto_model = motoModel;
        payload.engine_cc = engineCC ? parseInt(engineCC) : null;
        payload.condition = condition;
      } else if (category === 'real_estate') {
        payload.property_type = propertyType;
        payload.property_area_m2 = area ? parseFloat(area) : null;
        payload.property_rooms = rooms ? parseInt(rooms) : null;
        payload.property_floor = floor ? parseInt(floor) : null;
        payload.has_elevator = hasElevator;
        payload.has_parking = hasParking;
        payload.has_garden = hasGarden;
      }

      // 1. Update listing
      const { error: updateError } = await (supabase
        .from('listings') as any)
        .update(payload)
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Delete media
      if (mediaToDelete.length > 0) {
        await (supabase.from('listing_media') as any).delete().in('id', mediaToDelete);
      }

      // 3. Upload new media
      await uploadMedia(id);

      setSuccessMsg('تم تحديث الإعلان بنجاح! ✨');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err: any) {
      console.error('Update error:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '100px' }}>جاري تحميل البيانات...</div>;
  if (successMsg) return (
    <div style={{ padding: '20px', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: '70px', marginBottom: '20px' }}>✅</div>
      <h2>{successMsg}</h2>
    </div>
  );

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

  const canProceed = () => {
    switch(step) {
      case 2: {
        if (category === 'car') return carBrand.length > 0;
        if (category === 'motorcycle') return motoBrand.length > 0;
        return true;
      }
      case 3: return wilaya.length > 0;
      default: return true;
    }
  };

  return (
    <div style={{ padding: '20px 20px 120px 20px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>تعديل الإعلان</h2>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>الخطوة {step} من {TOTAL_STEPS}</span>
      </div>

      {renderProgressBar()}

      {errorMsg && <div style={{ background: 'rgba(233, 69, 96, 0.1)', color: 'var(--color-accent)', padding: '12px', borderRadius: '10px', marginBottom: '15px', textAlign: 'center' }}>{errorMsg}</div>}

      <div className="glass-card" style={{ padding: '20px' }}>
        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>نوع الإعلان والفئة</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
              {LISTING_TYPES.map(lt => (
                <div key={lt.value} onClick={() => setListingType(lt.value)} style={{
                  flex: 1, textAlign: 'center', padding: '15px 5px', borderRadius: '15px',
                  border: `2px solid ${listingType === lt.value ? '#4facfe' : 'var(--color-glass-border)'}`,
                  background: listingType === lt.value ? 'rgba(79,172,254,0.1)' : 'transparent',
                  cursor: 'pointer'
                }}>
                  <div style={{ fontSize: '24px' }}>{lt.emoji}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{lt.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {CATEGORIES.map(c => (
                <div key={c.id} onClick={() => setCategory(c.id as any)} style={{
                  flex: 1, textAlign: 'center', padding: '15px 5px', borderRadius: '15px',
                  border: `2px solid ${category === c.id ? c.color : 'var(--color-glass-border)'}`,
                  background: category === c.id ? `${c.color}20` : 'transparent',
                  cursor: 'pointer'
                }}>
                  <div style={{ fontSize: '30px' }}>{c.emoji}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {category === 'car' && (
              <>
                <label style={labelStyle}>الماركة</label>
                <select value={carBrand} onChange={e => setCarBrand(e.target.value)} style={inputStyle}>
                  {Object.keys(ALL_CAR_BRANDS).map(b => <option key={b} value={b} style={{color: '#000'}}>{b}</option>)}
                </select>
                <label style={labelStyle}>الموديل</label>
                <input type="text" value={carModel} onChange={e => setCarModel(e.target.value)} style={inputStyle} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>السنة</label>
                    <input type="number" value={carYear} onChange={e => setCarYear(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>العداد</label>
                    <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} style={inputStyle} />
                  </div>
                </div>
              </>
            )}
            {category === 'motorcycle' && (
               <>
                 <label style={labelStyle}>الماركة</label>
                 <input type="text" value={motoBrand} onChange={e => setMotoBrand(e.target.value)} style={inputStyle} />
                 <label style={labelStyle}>الموديل</label>
                 <input type="text" value={motoModel} onChange={e => setMotoModel(e.target.value)} style={inputStyle} />
               </>
            )}
            {category === 'real_estate' && (
               <>
                 <label style={labelStyle}>نوع العقار</label>
                 <select value={propertyType} onChange={e => setPropertyType(e.target.value)} style={inputStyle}>
                   {PROPERTY_TYPES.map(p => <option key={p.value} value={p.value} style={{color: '#000'}}>{p.label}</option>)}
                 </select>
               </>
            )}
            <label style={labelStyle}>العنوان</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder={autoTitle()} />
            <label style={labelStyle}>الوصف</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} style={{...inputStyle, minHeight: '100px'}} />
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>السعر (دج)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={{...inputStyle, fontSize: '1.4rem', fontWeight: 'bold'}} />
            </div>
            <div onClick={() => setIsNegotiable(!isNegotiable)} style={checkboxChipStyle(isNegotiable)}>
              {isNegotiable ? '✅ قابل للتفاوض' : '◻️ غير قابل للتفاوض'}
            </div>
            <div>
              <label style={labelStyle}>الولاية</label>
              <select value={wilaya} onChange={e => setWilaya(e.target.value)} style={inputStyle}>
                {WILAYAS.map(w => <option key={w} value={w} style={{color: '#000'}}>{w}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 style={{ marginBottom: '15px' }}>إدارة الصور</h3>
            
            {/* Existing Photos */}
            <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>الصور الحالية:</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {existingMedia.map(media => (
                <div key={media.id} style={{ position: 'relative', width: '80px', height: '80px' }}>
                  <img src={media.public_url} style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} />
                  <button onClick={() => removeExistingMedia(media.id)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--color-accent)', border: 'none', borderRadius: '50%', color: '#fff', padding: '4px' }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* New Photos */}
            <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>إضافة صور جديدة:</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {previewUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                  <img src={url} style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover', border: '2px solid var(--color-electric)' }} />
                  <button onClick={() => removeNewFile(idx)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--color-accent)', border: 'none', borderRadius: '50%', color: '#fff', padding: '4px' }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label style={{ width: '80px', height: '80px', borderRadius: '10px', border: '2px dashed var(--color-glass-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                <Camera size={24} color="var(--color-text-secondary)" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="secondary-btn" style={{flex: 1, padding: '15px'}}><ArrowRight /> السابق</button>
        )}
        {step < TOTAL_STEPS ? (
          <button onClick={() => canProceed() && setStep(step + 1)} className="primary-btn" style={{flex: 2, padding: '15px', opacity: canProceed() ? 1 : 0.5}}>التالي <ArrowLeft /></button>
        ) : (
          <button onClick={handleUpdate} disabled={updating} className="primary-btn" style={{flex: 2, padding: '15px' , background: 'linear-gradient(90deg, #38ef7d, #11998e)' }}>
            {updating ? 'جاري التحديث...' : 'حفظ التعديلات ✨'}
          </button>
        )}
      </div>

      {updating && uploadProgress.total > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <p>جاري رفع الصور الجديدة...</p>
          <div style={{ width: '200px', height: '10px', background: '#333', borderRadius: '5px', overflow: 'hidden', marginTop: '10px' }}>
            <div style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, height: '100%', background: '#4facfe' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--color-glass-border)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '1rem', outline: 'none' };
const checkboxChipStyle = (active: boolean): React.CSSProperties => ({
  padding: '12px', borderRadius: '10px', cursor: 'pointer',
  border: `1px solid ${active ? '#38ef7d' : 'var(--color-glass-border)'}`,
  background: active ? 'rgba(56,239,125,0.1)' : 'transparent',
  textAlign: 'center', transition: 'all 0.3s ease'
});

export default EditListingScreen;
