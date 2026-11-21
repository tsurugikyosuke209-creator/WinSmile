import {useEffect, useState} from 'react';
import {
  CheckCircle2,
  Edit3,
  ExternalLink,
  KeyRound,
  LogOut,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import {formatDzd} from '../data/wilayas';
import type {
  AgeGroup,
  AvailabilityStatus,
  ItemType,
  Order,
  OrderStatus,
  Product,
  SkillCategory,
  StoreSettings,
} from '../types/store';
import {SafeImage} from './SafeImage';

interface AdminDashboardProps {
  products: Product[];
  settings: StoreSettings;
  onProductsChanged: (products: Product[]) => void;
  onSettingsChanged: (settings: StoreSettings) => void;
  onExitAdmin: () => void;
}

type AdminTab = 'products' | 'orders' | 'settings';

const AGE_GROUPS: AgeGroup[] = [
  '0–1 سنة',
  '1–2 سنوات',
  '2–4 سنوات',
  '4–6 سنوات',
];
const SKILLS: SkillCategory[] = [
  'الحسّية',
  'الحركية الدقيقة',
  'اللغة',
  'الرياضيات',
  'الحياة العملية',
];

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'طلب جديد',
  preparing: 'قيد التحضير',
  shipped: 'تم الشحن',
  completed: 'مكتمل',
};

export function AdminDashboard({
  products,
  settings,
  onProductsChanged,
  onSettingsChanged,
  onExitAdmin,
}: AdminDashboardProps) {
  const [token, setToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<{
    loading: boolean;
    configured: boolean;
    envManaged: boolean;
  }>({loading: true, configured: true, envManaged: false});

  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Product Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [priceDzd, setPriceDzd] = useState('');
  const [originalPriceDzd, setOriginalPriceDzd] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('1–2 سنوات');
  const [skillCategory, setSkillCategory] = useState<SkillCategory>('الحسّية');
  const [educationalBenefit, setEducationalBenefit] = useState('');
  const [availability, setAvailability] = useState<AvailabilityStatus>('in_stock');
  const [itemType, setItemType] = useState<ItemType>('single');
  const [bundleItemsText, setBundleItemsText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productFeedback, setProductFeedback] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Store Settings Form State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/status')
      .then((res) => res.json())
      .then((data: {configured?: boolean; envManaged?: boolean}) => {
        if (!active) return;
        setAuthStatus({
          loading: false,
          configured: Boolean(data.configured),
          envManaged: Boolean(data.envManaged),
        });
      })
      .catch(() => {
        if (!active) return;
        setAuthStatus({loading: false, configured: true, envManaged: false});
      });
    return () => {
      active = false;
    };
  }, []);

  const loadOrders = async (bearer: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: {Authorization: `Bearer ${bearer}`},
      });
      if (res.ok) {
        const data = (await res.json()) as {orders: Order[]};
        setOrders(data.orders || []);
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === 'orders') {
      loadOrders(token);
    }
  }, [token, activeTab]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authStatus.configured && passwordInput !== confirmPasswordInput) {
      setAuthError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const endpoint = authStatus.configured
        ? '/api/admin/login'
        : '/api/admin/setup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({password: passwordInput}),
      });
      const data = (await res.json()) as {token?: string; error?: string};
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'تعذر التحقق من كلمة المرور.');
      }
      setToken(data.token);
      setPasswordInput('');
      setConfirmPasswordInput('');
      setAuthStatus((prev) => ({...prev, configured: true}));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'فشل تسجيل الدخول.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const resetProductForm = () => {
    setEditingId(null);
    setName('');
    setPriceDzd('');
    setOriginalPriceDzd('');
    setImageUrl('');
    setAgeGroup('1–2 سنوات');
    setSkillCategory('الحسّية');
    setEducationalBenefit('');
    setAvailability('in_stock');
    setItemType('single');
    setBundleItemsText('');
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPriceDzd(String(product.priceDzd));
    setOriginalPriceDzd(
      product.originalPriceDzd ? String(product.originalPriceDzd) : '',
    );
    setImageUrl(product.imageUrl);
    setAgeGroup(product.ageGroup);
    setSkillCategory(product.skillCategory);
    setEducationalBenefit(product.educationalBenefit);
    setAvailability(product.availability);
    setItemType(product.itemType);
    setBundleItemsText((product.bundleItems || []).join('\n'));
    setProductFeedback(null);
    setProductError(null);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleImageFileUpload = async (file: File | null) => {
    if (!file || !token) return;
    setProductError(null);
    setUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('تعذر قراءة الصورة.'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({dataUrl}),
      });
      const data = (await res.json()) as {url?: string; error?: string};
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'فشل رفع الصورة.');
      }
      setImageUrl(data.url);
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'تعذر رفع الصورة.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProductError(null);
    setProductFeedback(null);
    setSavingProduct(true);

    try {
      const bundleItems =
        itemType === 'bundle'
          ? bundleItemsText
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;

      const payload = {
        name,
        priceDzd: Number(priceDzd),
        originalPriceDzd: originalPriceDzd ? Number(originalPriceDzd) : undefined,
        imageUrl,
        ageGroup,
        skillCategory,
        educationalBenefit,
        availability,
        itemType,
        bundleItems,
      };

      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {product?: Product; error?: string};
      if (!res.ok || !data.product) {
        throw new Error(data.error || 'تعذر حفظ المنتج.');
      }

      if (editingId) {
        onProductsChanged(
          products.map((p) => (p.id === editingId ? data.product! : p)),
        );
        setProductFeedback('تم تحديث بيانات المنتج بنجاح.');
      } else {
        onProductsChanged([data.product, ...products]);
        setProductFeedback('تمت إضافة المنتج إلى المتجر بنجاح.');
      }
      resetProductForm();
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleAvailability = async (productId: string) => {
    if (!token) return;
    const res = await fetch(`/api/products/${productId}/toggle`, {
      method: 'PATCH',
      headers: {Authorization: `Bearer ${token}`},
    });
    if (res.ok) {
      const data = (await res.json()) as {product: Product};
      onProductsChanged(
        products.map((p) => (p.id === productId ? data.product : p)),
      );
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!token) return;
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: {Authorization: `Bearer ${token}`},
    });
    if (res.ok) {
      onProductsChanged(products.filter((p) => p.id !== productId));
      setConfirmDeleteId(null);
      if (editingId === productId) resetProductForm();
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    if (!token) return;
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({status}),
    });
    if (res.ok) {
      const data = (await res.json()) as {order: Order};
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSettingsError(null);
    setSettingsFeedback(null);
    setSavingSettings(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsForm),
      });
      const data = (await res.json()) as {settings?: StoreSettings; error?: string};
      if (!res.ok || !data.settings) {
        throw new Error(data.error || 'تعذر حفظ إعدادات المتجر.');
      }
      onSettingsChanged(data.settings);
      setSettingsFeedback('تم حفظ إعدادات المتجر وبيانات الدفع بنجاح.');
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Auth Gate
  if (!token) {
    return (
      <section className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-[#E5DDD0] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#F2EDE4] flex items-center justify-center text-[#4A5D3F]">
              <KeyRound className="w-5 h-5" aria-hidden="true" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#231F1B]">
              {authStatus.loading
                ? 'جاري التحقق...'
                : authStatus.configured
                ? 'تسجيل الدخول إلى إدارة المتجر'
                : 'تعيين كلمة مرور المتجر لأول مرة'}
            </h1>
            <p className="text-sm text-[#6B6257]">
              {authStatus.configured
                ? 'أدخل كلمة مرور البائع لإدارة المنتجات، الطلبات، وإعدادات بريدي موب.'
                : 'لم يتم تعيين كلمة مرور بعد. اختر كلمة مرور خاصة بك لحماية لوحة التحكم.'}
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#FDF2F0] border border-[#E8C5BE] text-xs text-[#8B4A3E] font-medium text-center"
            >
              {authError}
            </div>
          )}

          {!authStatus.loading && (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-[#3D362E]">
                  {authStatus.configured ? 'كلمة المرور' : 'كلمة المرور الجديدة'}
                </span>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-[#231F1B] focus:outline-none focus:border-[#4A5D3F]"
                />
              </label>

              {!authStatus.configured && (
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-[#3D362E]">تأكيد كلمة المرور</span>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-[#231F1B] focus:outline-none focus:border-[#4A5D3F]"
                  />
                </label>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#4A5D3F] hover:bg-[#3B4B32] text-white text-sm font-bold transition-colors cursor-pointer"
              >
                {authSubmitting
                  ? 'جاري التحقق...'
                  : authStatus.configured
                  ? 'دخول لإدارة المتجر'
                  : 'حفظ كلمة المرور والدخول'}
              </button>

              <button
                type="button"
                onClick={onExitAdmin}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-[#6B6257] hover:text-[#231F1B] cursor-pointer"
              >
                العودة إلى واجهة المتجر
              </button>
            </form>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5DDD0]">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#231F1B]">
            إدارة المتجر
          </h1>
          <p className="text-sm text-[#6B6257]">
            أضف منتجات مونتيسوري، عدّل الأسعار وحالة التوفر، وتابع طلبات الولايات الـ 58.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExitAdmin}
            className="px-4 py-2 rounded-lg border border-[#DCD3C4] bg-white hover:bg-[#F2EDE4] text-xs font-semibold text-[#231F1B] cursor-pointer"
          >
            عرض المتجر
          </button>
          <button
            type="button"
            onClick={() => setToken(null)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-[#8B4A3E] hover:bg-[#FDF2F0] cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex flex-wrap gap-1 p-1 bg-[#F2EDE4] rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'products'
              ? 'bg-white text-[#231F1B] shadow-sm'
              : 'text-[#5A5248] hover:text-[#231F1B]'
          }`}
        >
          <Package className="w-4 h-4" aria-hidden="true" />
          <span>المنتجات والباقات ({products.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-white text-[#231F1B] shadow-sm'
              : 'text-[#5A5248] hover:text-[#231F1B]'
          }`}
        >
          <ShoppingCart className="w-4 h-4" aria-hidden="true" />
          <span>الطلبات الواردة</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-white text-[#231F1B] shadow-sm'
              : 'text-[#5A5248] hover:text-[#231F1B]'
          }`}
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
          <span>إعدادات المتجر والـ RIP</span>
        </button>
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add / Edit Form */}
          <form
            onSubmit={handleSaveProduct}
            className="lg:col-span-5 bg-white border border-[#E5DDD0] rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#231F1B]">
                {editingId ? 'تعديل المنتج' : 'إضافة لعبة أو باقة جديدة'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="text-xs font-semibold text-[#6B6257] hover:text-[#231F1B] cursor-pointer"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            {productError && (
              <div className="p-3 rounded-lg bg-[#FDF2F0] border border-[#E8C5BE] text-xs text-[#8B4A3E]">
                {productError}
              </div>
            )}
            {productFeedback && (
              <div className="p-3 rounded-lg bg-[#EFF5EE] border border-[#C9DEC4] text-xs text-[#2F5E3D]">
                {productFeedback}
              </div>
            )}

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-[#3D362E]">اسم اللعبة / الباقة *</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: لوح التدرج اللوني مونتيسوري"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm focus:outline-none focus:border-[#4A5D3F]"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1 text-xs">
                <span className="font-semibold text-[#3D362E]">السعر (د.ج) *</span>
                <input
                  type="number"
                  required
                  min={100}
                  value={priceDzd}
                  onChange={(e) => setPriceDzd(e.target.value)}
                  placeholder="3500"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm tabular-nums focus:outline-none focus:border-[#4A5D3F]"
                />
              </label>

              <label className="block space-y-1 text-xs">
                <span className="font-semibold text-[#3D362E]">السعر قبل الخصم (اختياري)</span>
                <input
                  type="number"
                  min={100}
                  value={originalPriceDzd}
                  onChange={(e) => setOriginalPriceDzd(e.target.value)}
                  placeholder="4500"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm tabular-nums focus:outline-none focus:border-[#4A5D3F]"
                />
              </label>
            </div>

            {/* Image URL or Local Upload */}
            <div className="space-y-2 text-xs">
              <label className="block space-y-1">
                <span className="font-semibold text-[#3D362E]">
                  رابط الصورة أو رفع صورة من الجهاز *
                </span>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... أو ارفع صورة بالأسفل"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm text-left focus:outline-none focus:border-[#4A5D3F]"
                />
              </label>

              <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-dashed border-[#B7AC9B] bg-[#FAF8F4] hover:bg-[#F2EDE4] text-xs font-semibold text-[#3D362E] cursor-pointer">
                <Upload className="w-4 h-4 text-[#4A5D3F]" aria-hidden="true" />
                <span>
                  {uploadingImage ? 'جاري رفع الصورة...' : 'رفع صورة محلية (PNG / JPG / WebP)'}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => handleImageFileUpload(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1 text-xs">
                <span className="font-semibold text-[#3D362E]">الفئة العمرية *</span>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm focus:outline-none focus:border-[#4A5D3F]"
                >
                  {AGE_GROUPS.map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1 text-xs">
                <span className="font-semibold text-[#3D362E]">تصنيف المهارة *</span>
                <select
                  value={skillCategory}
                  onChange={(e) => setSkillCategory(e.target.value as SkillCategory)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm focus:outline-none focus:border-[#4A5D3F]"
                >
                  {SKILLS.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1 text-xs">
                <span className="font-semibold text-[#3D362E]">حالة التوفر *</span>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as AvailabilityStatus)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm focus:outline-none focus:border-[#4A5D3F]"
                >
                  <option value="in_stock">متوفر</option>
                  <option value="out_of_stock">نفدت الكمية</option>
                </select>
              </label>

              <label className="block space-y-1 text-xs">
                <span className="font-semibold text-[#3D362E]">النوع *</span>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as ItemType)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm focus:outline-none focus:border-[#4A5D3F]"
                >
                  <option value="single">لعبة مفردة</option>
                  <option value="bundle">باقة تعليمية</option>
                </select>
              </label>
            </div>

            {itemType === 'bundle' && (
              <label className="block space-y-1 text-xs">
                <span className="font-semibold text-[#3D362E]">
                  محتويات الباقة (كل لعبة في سطر)
                </span>
                <textarea
                  rows={3}
                  value={bundleItemsText}
                  onChange={(e) => setBundleItemsText(e.target.value)}
                  placeholder={'قوس التوازن الخشبي\nصندوق فرز الأشكال'}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm focus:outline-none focus:border-[#4A5D3F]"
                />
              </label>
            )}

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-[#3D362E]">
                ماذا يكتسب الطفل من هذه اللعبة؟ *
              </span>
              <textarea
                rows={3}
                required
                value={educationalBenefit}
                onChange={(e) => setEducationalBenefit(e.target.value)}
                placeholder="اشرح الفوائد التربوية مثل التركيز، التآزر البصري الحركي، أو الاستقلالية..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm focus:outline-none focus:border-[#4A5D3F]"
              />
            </label>

            <button
              type="submit"
              disabled={savingProduct || uploadingImage}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#4A5D3F] hover:bg-[#3B4B32] text-white text-sm font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>
                {savingProduct
                  ? 'جاري الحفظ...'
                  : editingId
                  ? 'حفظ التعديلات'
                  : 'إضافة إلى المتجر'}
              </span>
            </button>
          </form>

          {/* Existing Products List */}
          <div className="lg:col-span-7 space-y-3">
            {products.map((product) => {
              const isInStock = product.availability === 'in_stock';
              return (
                <div
                  key={product.id}
                  className="bg-white border border-[#E5DDD0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#F2EDE4] shrink-0">
                    <SafeImage
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6257]">
                      <span>{product.ageGroup}</span>
                      <span aria-hidden="true">·</span>
                      <span>{product.skillCategory}</span>
                      {product.itemType === 'bundle' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#7A5C3E]">باقة</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-display text-sm font-bold text-[#231F1B] truncate">
                      {product.name}
                    </h3>
                    <div className="text-sm font-bold text-[#4A5D3F] tabular-nums">
                      {formatDzd(product.priceDzd)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(product.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        isInStock
                          ? 'bg-[#EFF5EE] border-[#C9DEC4] text-[#2F5E3D]'
                          : 'bg-[#FDF2F0] border-[#E8C5BE] text-[#8B4A3E]'
                      }`}
                    >
                      {isInStock ? (
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{isInStock ? 'متوفر' : 'نفدت الكمية'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditClick(product)}
                      aria-label={`تعديل ${product.name}`}
                      className="p-2 rounded-lg border border-[#E5DDD0] text-[#3D362E] hover:bg-[#F2EDE4] cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {confirmDeleteId === product.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#8B4A3E] text-white text-xs font-bold cursor-pointer"
                        >
                          تأكيد
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1.5 rounded-lg text-xs text-[#6B6257] cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(product.id)}
                        aria-label={`حذف ${product.name}`}
                        className="p-2 rounded-lg border border-[#E5DDD0] text-[#8B4A3E] hover:bg-[#FDF2F0] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {ordersLoading ? (
            <div className="bg-white border border-[#E5DDD0] rounded-2xl p-8 text-center text-sm text-[#6B6257]">
              جاري تحميل الطلبات...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-[#E5DDD0] rounded-2xl p-10 text-center space-y-2">
              <p className="font-display text-base font-bold text-[#231F1B]">
                لا توجد طلبات مسجلة بعد
              </p>
              <p className="text-sm text-[#6B6257]">
                عند قيام العملاء بإتمام الطلب من المتجر، ستظهر تفاصيل الطلب هنا فوراً.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-[#E5DDD0] rounded-2xl p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F0EAE0] pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#231F1B]">
                      <span dir="ltr" className="tabular-nums">
                        #{order.orderNumber}
                      </span>
                      <span>·</span>
                      <span>{order.customerName}</span>
                    </div>
                    <div className="text-xs text-[#6B6257]">
                      <span dir="ltr" className="tabular-nums">
                        {order.customerPhone}
                      </span>{' '}
                      · {order.wilayaCode} {order.wilayaName} ({order.address})
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-[#4A5D3F] tabular-nums">
                      {formatDzd(order.totalDzd)}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleOrderStatusChange(order.id, e.target.value as OrderStatus)
                      }
                      className="px-3 py-1.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-xs font-semibold focus:outline-none focus:border-[#4A5D3F]"
                    >
                      {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {ORDER_STATUS_LABELS[st]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#3D362E]">
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.productId}>
                        • {item.name} × {item.quantity} ({formatDzd(item.priceDzd * item.quantity)})
                      </div>
                    ))}
                  </div>

                  <div className="text-left space-y-1">
                    <div className="font-semibold">
                      {order.paymentMethod === 'cod' && 'الدفع عند الاستلام (COD)'}
                      {order.paymentMethod === 'card' &&
                        `مدفوع ببطاقة ${order.cardType} (•••• ${order.cardLast4})`}
                      {order.paymentMethod === 'baridimob' &&
                        `تحويل بريدي موب ${order.baridiMobReference ? `(${order.baridiMobReference})` : ''}`}
                    </div>
                    {order.baridiMobReceiptUrl && (
                      <a
                        href={order.baridiMobReceiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#4A5D3F] underline"
                      >
                        <span>عرض وصل التحويل</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-[#E5DDD0] rounded-2xl p-6 sm:p-8 max-w-3xl space-y-5"
        >
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-[#231F1B]">
              إعدادات المتجر ومعلومات الدفع والتواصل
            </h2>
            <p className="text-xs text-[#6B6257]">
              تُحدَّث هذه البيانات مباشرة في كامل صفحات المتجر، روابط واتساب، وقسم التحويل عبر بريدي موب.
            </p>
          </div>

          {settingsError && (
            <div className="p-3 rounded-lg bg-[#FDF2F0] border border-[#E8C5BE] text-xs text-[#8B4A3E]">
              {settingsError}
            </div>
          )}
          {settingsFeedback && (
            <div className="p-3 rounded-lg bg-[#EFF5EE] border border-[#C9DEC4] text-xs text-[#2F5E3D]">
              {settingsFeedback}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <label className="block space-y-1">
              <span className="font-semibold text-[#3D362E]">اسم المتجر *</span>
              <input
                type="text"
                required
                value={settingsForm.storeName}
                onChange={(e) =>
                  setSettingsForm({...settingsForm, storeName: e.target.value})
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm focus:outline-none focus:border-[#4A5D3F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-[#3D362E]">الموقع ونطاق التوصيل *</span>
              <input
                type="text"
                required
                value={settingsForm.locationCoverage}
                onChange={(e) =>
                  setSettingsForm({...settingsForm, locationCoverage: e.target.value})
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm focus:outline-none focus:border-[#4A5D3F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-[#3D362E]">رقم الهاتف للاتصال *</span>
              <input
                type="text"
                required
                dir="ltr"
                value={settingsForm.phone}
                onChange={(e) =>
                  setSettingsForm({...settingsForm, phone: e.target.value})
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm text-right tabular-nums focus:outline-none focus:border-[#4A5D3F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-[#3D362E]">رقم الواتساب (مع رمز البلد 213) *</span>
              <input
                type="text"
                required
                dir="ltr"
                value={settingsForm.whatsapp}
                onChange={(e) =>
                  setSettingsForm({...settingsForm, whatsapp: e.target.value})
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm text-right tabular-nums focus:outline-none focus:border-[#4A5D3F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-[#3D362E]">البريد الإلكتروني</span>
              <input
                type="email"
                dir="ltr"
                value={settingsForm.email}
                onChange={(e) =>
                  setSettingsForm({...settingsForm, email: e.target.value})
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm text-right focus:outline-none focus:border-[#4A5D3F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-[#3D362E]">
                حد التوصيل المجاني (د.ج)
              </span>
              <input
                type="number"
                min={0}
                value={settingsForm.freeShippingThresholdDzd}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    freeShippingThresholdDzd: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm tabular-nums focus:outline-none focus:border-[#4A5D3F]"
              />
            </label>

            <label className="block space-y-1 sm:col-span-2">
              <span className="font-semibold text-[#3D362E]">
                رقم حساب بريدي موب (RIP - 20 رقماً) *
              </span>
              <input
                type="text"
                required
                dir="ltr"
                maxLength={20}
                value={settingsForm.baridiMobRip}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    baridiMobRip: e.target.value.replace(/\D/g, '').slice(0, 20),
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm font-bold tabular-nums focus:outline-none focus:border-[#4A5D3F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-[#3D362E]">رابط إنستغرام</span>
              <input
                type="url"
                dir="ltr"
                value={settingsForm.instagramUrl}
                onChange={(e) =>
                  setSettingsForm({...settingsForm, instagramUrl: e.target.value})
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm text-left focus:outline-none focus:border-[#4A5D3F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-[#3D362E]">رابط فيسبوك</span>
              <input
                type="url"
                dir="ltr"
                value={settingsForm.facebookUrl}
                onChange={(e) =>
                  setSettingsForm({...settingsForm, facebookUrl: e.target.value})
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm text-left focus:outline-none focus:border-[#4A5D3F]"
              />
            </label>

            <label className="block space-y-1 sm:col-span-2">
              <span className="font-semibold text-[#3D362E]">رابط تيك توك</span>
              <input
                type="url"
                dir="ltr"
                value={settingsForm.tiktokUrl}
                onChange={(e) =>
                  setSettingsForm({...settingsForm, tiktokUrl: e.target.value})
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-sm text-left focus:outline-none focus:border-[#4A5D3F]"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="py-3 px-6 rounded-xl bg-[#4A5D3F] hover:bg-[#3B4B32] text-white text-sm font-bold transition-colors cursor-pointer"
          >
            {savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات المتجر'}
          </button>
        </form>
      )}
    </section>
  );
}
