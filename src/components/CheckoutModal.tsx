import {useMemo, useState} from 'react';
import {
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Home,
  Lock,
  MessageCircle,
  Smartphone,
  Upload,
  X,
} from 'lucide-react';
import {
  ALGERIAN_WILAYAS,
  formatDzd,
  sanitizeWhatsappNumber,
} from '../data/wilayas';
import type {
  CartItem,
  DeliveryMethod,
  Order,
  PaymentMethod,
  StoreSettings,
} from '../types/store';

interface CheckoutModalProps {
  isOpen: boolean;
  items: CartItem[];
  settings: StoreSettings;
  onClose: () => void;
  onOrderComplete: (order: Order, clearedCart: boolean) => void;
  isDirectOrder?: boolean;
}

export function CheckoutModal({
  isOpen,
  items,
  settings,
  onClose,
  onOrderComplete,
  isDirectOrder = false,
}: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [wilayaCode, setWilayaCode] = useState('16'); // الجزائر العاصمة default
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home');
  const [shippingHubCarrier, setShippingHubCarrier] = useState<'Yalidine' | 'ZR Express'>('Yalidine');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  // Edahabia / CIB card state (never persisted raw)
  const [cardType, setCardType] = useState<'Edahabia' | 'CIB'>('Edahabia');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // BaridiMob RIP transfer state
  const [baridiMobReference, setBaridiMobReference] = useState('');
  const [baridiMobReceiptUrl, setBaridiMobReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [copiedRip, setCopiedRip] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const selectedWilaya = useMemo(
    () => ALGERIAN_WILAYAS.find((w) => w.code === wilayaCode) || ALGERIAN_WILAYAS[15],
    [wilayaCode],
  );

  const subtotalDzd = useMemo(
    () => items.reduce((sum, item) => sum + item.product.priceDzd * item.quantity, 0),
    [items],
  );

  const threshold = settings.freeShippingThresholdDzd || 12000;
  const rawShipping =
    deliveryMethod === 'home' ? selectedWilaya.homeFeeDzd : selectedWilaya.hubFeeDzd;
  const shippingDzd = subtotalDzd >= threshold ? 0 : rawShipping;
  const totalDzd = subtotalDzd + shippingDzd;

  if (!isOpen) return null;

  const handleCopyRip = async () => {
    try {
      await navigator.clipboard.writeText(settings.baridiMobRip);
      setCopiedRip(true);
      setTimeout(() => setCopiedRip(false), 2200);
    } catch {
      setCopiedRip(false);
    }
  };

  const handleCardNumberChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const grouped = digits.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(grouped);
  };

  const handleExpiryChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExpiry(digits);
    }
  };

  const handleReceiptUpload = async (file: File | null) => {
    if (!file) return;
    setErrorMsg(null);
    setUploadingReceipt(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('تعذر قراءة الملف.'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/uploads/receipt', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({dataUrl}),
      });
      const data = (await res.json()) as {url?: string; error?: string};
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'فشل رفع وصل الدفع.');
      }
      setBaridiMobReceiptUrl(data.url);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'تعذر رفع صورة الوصل.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          customerName,
          customerPhone,
          wilayaCode,
          commune,
          address:
            deliveryMethod === 'hub'
              ? `مكتب ${shippingHubCarrier} - ${commune || selectedWilaya.nameAr}`
              : address,
          deliveryMethod,
          shippingHubCarrier: deliveryMethod === 'hub' ? shippingHubCarrier : undefined,
          paymentMethod,
          cardType: paymentMethod === 'card' ? cardType : undefined,
          cardHolder: paymentMethod === 'card' ? cardHolder : undefined,
          cardNumber: paymentMethod === 'card' ? cardNumber.replace(/\s+/g, '') : undefined,
          cardExpiry: paymentMethod === 'card' ? cardExpiry : undefined,
          cardCvv: paymentMethod === 'card' ? cardCvv : undefined,
          baridiMobReference:
            paymentMethod === 'baridimob' ? baridiMobReference : undefined,
          baridiMobReceiptUrl:
            paymentMethod === 'baridimob' ? baridiMobReceiptUrl : undefined,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });

      const data = (await res.json()) as {order?: Order; error?: string};
      if (!res.ok || !data.order) {
        throw new Error(data.order ? 'خطأ غير متوقع' : data.error || 'تعذر إرسال الطلب.');
      }

      setConfirmedOrder(data.order);
      // Clear sensitive card inputs immediately
      setCardNumber('');
      setCardCvv('');
      setCardExpiry('');
      onOrderComplete(data.order, !isDirectOrder);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء تأكيد الطلب.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setConfirmedOrder(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget) resetAndClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-[#FAF8F4] border border-[#E5DDD0] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E5DDD0] flex items-center justify-between shrink-0">
          <h2 id="checkout-heading" className="font-display text-lg font-bold text-[#231F1B]">
            {confirmedOrder ? 'تأكيد استلام الطلب' : 'إتمام الطلب والتوصيل (58 ولاية)'}
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="إغلاق نافذة الدفع"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#5A5248] hover:bg-[#F2EDE4] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {confirmedOrder ? (
            <div className="bg-white border border-[#E5DDD0] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#2F5E3D]" aria-hidden="true" />
                <h3 className="font-display text-2xl font-bold text-[#231F1B]">
                  شكراً لك، تم تسجيل طلبك بنجاح
                </h3>
                <p className="text-sm text-[#6B6257]">
                  رقم الطلب:{' '}
                  <strong className="text-[#231F1B] tabular-nums" dir="ltr">
                    #{confirmedOrder.orderNumber}
                  </strong>
                </p>
              </div>

              <div className="bg-[#FAF8F4] border border-[#E5DDD0] rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B6257]">العميل:</span>
                  <span className="font-semibold">{confirmedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6257]">الهاتف:</span>
                  <span className="font-semibold tabular-nums" dir="ltr">
                    {confirmedOrder.customerPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6257]">الولاية والعنوان:</span>
                  <span className="font-semibold text-left">
                    {confirmedOrder.wilayaCode} {confirmedOrder.wilayaName} —{' '}
                    {confirmedOrder.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6257]">طريقة الدفع:</span>
                  <span className="font-semibold">
                    {confirmedOrder.paymentMethod === 'cod' && 'الدفع عند الاستلام'}
                    {confirmedOrder.paymentMethod === 'card' &&
                      `بطاقة ${confirmedOrder.cardType} (تنتهي بـ ${confirmedOrder.cardLast4})`}
                    {confirmedOrder.paymentMethod === 'baridimob' &&
                      'تحويل عبر بريدي موب (RIP)'}
                  </span>
                </div>

                <div className="border-t border-[#E5DDD0] pt-3 space-y-1.5">
                  {confirmedOrder.items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-xs">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="tabular-nums font-medium">
                        {formatDzd(item.priceDzd * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-[#6B6257] pt-1">
                    <span>التوصيل:</span>
                    <span className="tabular-nums">
                      {confirmedOrder.shippingDzd === 0
                        ? 'مجاني'
                        : formatDzd(confirmedOrder.shippingDzd)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#231F1B] pt-2 border-t border-[#E5DDD0]">
                    <span>الإجمالي المستحق:</span>
                    <span className="tabular-nums">{formatDzd(confirmedOrder.totalDzd)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://wa.me/${sanitizeWhatsappNumber(settings.whatsapp)}?text=${encodeURIComponent(
                    `مرحباً ${settings.storeName}، قمت بتأكيد الطلب #${confirmedOrder.orderNumber} بقيمة ${formatDzd(confirmedOrder.totalDzd)} إلى ولاية ${confirmedOrder.wilayaName}.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#4A5D3F] hover:bg-[#3B4B32] text-white text-sm font-bold transition-colors"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>إرسال ملخص الطلب عبر واتساب</span>
                </a>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="py-3 px-6 rounded-xl border border-[#E5DDD0] bg-white hover:bg-[#F2EDE4] text-sm font-semibold text-[#231F1B] cursor-pointer"
                >
                  العودة للمتجر
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-[#FDF2F0] border border-[#E8C5BE] text-sm text-[#8B4A3E] font-medium"
                >
                  {errorMsg}
                </div>
              )}

              {/* Order Summary Box */}
              <div className="bg-white border border-[#E5DDD0] rounded-xl p-4 space-y-2.5">
                <h3 className="font-display text-sm font-bold text-[#231F1B]">
                  ملخص المنتجات ({items.reduce((s, i) => s + i.quantity, 0)})
                </h3>
                <div className="space-y-1.5 text-sm">
                  {items.map(({product, quantity}) => (
                    <div key={product.id} className="flex justify-between gap-4">
                      <span className="text-[#3D362E]">
                        {product.name} <span className="text-[#6B6257]">× {quantity}</span>
                      </span>
                      <span className="font-semibold tabular-nums shrink-0">
                        {formatDzd(product.priceDzd * quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#F0EAE0] pt-2.5 flex justify-between text-xs text-[#6B6257]">
                  <span>
                    التوصيل إلى {selectedWilaya.nameAr} (
                    {deliveryMethod === 'home' ? 'للمنزل' : `مكتب ${shippingHubCarrier}`})
                  </span>
                  <span className="tabular-nums font-semibold text-[#231F1B]">
                    {shippingDzd === 0 ? 'مجاني' : formatDzd(shippingDzd)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#231F1B] pt-1">
                  <span>المجموع الكلي:</span>
                  <span className="tabular-nums text-[#4A5D3F]">{formatDzd(totalDzd)}</span>
                </div>
              </div>

              {/* Customer & Wilaya Details */}
              <div className="bg-white border border-[#E5DDD0] rounded-xl p-5 space-y-4">
                <h3 className="font-display text-base font-bold text-[#231F1B]">
                  1. معلومات التوصيل
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium text-[#3D362E]">الاسم الكامل *</span>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: أمين بن علي"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-[#231F1B] focus:outline-none focus:border-[#4A5D3F]"
                    />
                  </label>

                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium text-[#3D362E]">رقم الهاتف *</span>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0550 12 34 56"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-[#231F1B] text-right tabular-nums focus:outline-none focus:border-[#4A5D3F]"
                    />
                  </label>

                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium text-[#3D362E]">الولاية (58 ولاية) *</span>
                    <select
                      value={wilayaCode}
                      onChange={(e) => setWilayaCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-[#231F1B] focus:outline-none focus:border-[#4A5D3F]"
                    >
                      {ALGERIAN_WILAYAS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} - {w.nameAr}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium text-[#3D362E]">البلدية / الدائرة</span>
                    <input
                      type="text"
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      placeholder="مثال: حيدرة / بئر مراد رايس"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-[#231F1B] focus:outline-none focus:border-[#4A5D3F]"
                    />
                  </label>
                </div>

                {/* Delivery Method Selector */}
                <div className="space-y-2 pt-2">
                  <span className="block text-sm font-medium text-[#3D362E]">
                    طريقة الاستلام *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('home')}
                      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-right transition-colors cursor-pointer ${
                        deliveryMethod === 'home'
                          ? 'border-[#4A5D3F] bg-[#F2EDE4]'
                          : 'border-[#DCD3C4] bg-[#FAF8F4] hover:bg-[#F2EDE4]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Home className="w-4 h-4 text-[#4A5D3F] shrink-0" aria-hidden="true" />
                        <div>
                          <div className="text-sm font-bold text-[#231F1B]">
                            توصيل إلى المنزل
                          </div>
                          <div className="text-xs text-[#6B6257]">
                            تسليم مباشر لعنوانك
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-[#231F1B]">
                        {subtotalDzd >= threshold
                          ? 'مجاني'
                          : formatDzd(selectedWilaya.homeFeeDzd)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('hub')}
                      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-right transition-colors cursor-pointer ${
                        deliveryMethod === 'hub'
                          ? 'border-[#4A5D3F] bg-[#F2EDE4]'
                          : 'border-[#DCD3C4] bg-[#FAF8F4] hover:bg-[#F2EDE4]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-[#4A5D3F] shrink-0" aria-hidden="true" />
                        <div>
                          <div className="text-sm font-bold text-[#231F1B]">
                            استلام من مكتب الشحن
                          </div>
                          <div className="text-xs text-[#6B6257]">
                            Yalidine أو ZR Express
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-[#231F1B]">
                        {subtotalDzd >= threshold
                          ? 'مجاني'
                          : formatDzd(selectedWilaya.hubFeeDzd)}
                      </span>
                    </button>
                  </div>
                </div>

                {deliveryMethod === 'home' ? (
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium text-[#3D362E]">العنوان الكامل *</span>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="الحي، الشارع، رقم العمارة أو المنزل"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-[#FAF8F4] text-[#231F1B] focus:outline-none focus:border-[#4A5D3F]"
                    />
                  </label>
                ) : (
                  <div className="space-y-2">
                    <span className="block text-sm font-medium text-[#3D362E]">
                      اختر شركة الشحن الأقرب إليك
                    </span>
                    <div className="flex gap-3">
                      {(['Yalidine', 'ZR Express'] as const).map((carrier) => (
                        <button
                          key={carrier}
                          type="button"
                          onClick={() => setShippingHubCarrier(carrier)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            shippingHubCarrier === carrier
                              ? 'bg-[#4A5D3F] text-white border-[#4A5D3F]'
                              : 'bg-[#FAF8F4] text-[#3D362E] border-[#DCD3C4]'
                          }`}
                        >
                          مكتب {carrier}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-[#E5DDD0] rounded-xl p-5 space-y-4">
                <h3 className="font-display text-base font-bold text-[#231F1B]">
                  2. طريقة الدفع
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3.5 rounded-xl border text-right space-y-1 transition-colors cursor-pointer ${
                      paymentMethod === 'cod'
                        ? 'border-[#4A5D3F] bg-[#F2EDE4]'
                        : 'border-[#DCD3C4] bg-[#FAF8F4]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-[#231F1B]">
                      <Banknote className="w-4 h-4 text-[#4A5D3F] shrink-0" aria-hidden="true" />
                      <span>عند الاستلام</span>
                    </div>
                    <p className="text-xs text-[#6B6257]">الدفع نقداً عند وصول الطرد</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-xl border text-right space-y-1 transition-colors cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-[#4A5D3F] bg-[#F2EDE4]'
                        : 'border-[#DCD3C4] bg-[#FAF8F4]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-[#231F1B]">
                      <CreditCard className="w-4 h-4 text-[#4A5D3F] shrink-0" aria-hidden="true" />
                      <span>البطاقة الذهبية / CIB</span>
                    </div>
                    <p className="text-xs text-[#6B6257]">دفع إلكتروني آمن عبر البطاقة</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('baridimob')}
                    className={`p-3.5 rounded-xl border text-right space-y-1 transition-colors cursor-pointer ${
                      paymentMethod === 'baridimob'
                        ? 'border-[#4A5D3F] bg-[#F2EDE4]'
                        : 'border-[#DCD3C4] bg-[#FAF8F4]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-[#231F1B]">
                      <Smartphone className="w-4 h-4 text-[#4A5D3F] shrink-0" aria-hidden="true" />
                      <span>بريدي موب (RIP)</span>
                    </div>
                    <p className="text-xs text-[#6B6257]">تحويل فوري مع إرفاق الوصل</p>
                  </button>
                </div>

                {/* Integrated Card Checkout Form */}
                {paymentMethod === 'card' && (
                  <div className="bg-[#FAF8F4] border border-[#E5DDD0] rounded-xl p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {(['Edahabia', 'CIB'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setCardType(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              cardType === type
                                ? 'bg-[#4A5D3F] text-white border-[#4A5D3F]'
                                : 'bg-white text-[#3D362E] border-[#DCD3C4]'
                            }`}
                          >
                            {type === 'Edahabia' ? 'البطاقة الذهبية (بريد الجزائر)' : 'بطاقة بنكية (CIB)'}
                          </button>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-[#2F5E3D]">
                        <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>معاملة مشفّرة</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <label className="block space-y-1 text-xs sm:col-span-2">
                        <span className="font-semibold text-[#3D362E]">رقم البطاقة (16 رقماً) *</span>
                        <input
                          type="text"
                          required
                          dir="ltr"
                          inputMode="numeric"
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          placeholder="6280 0000 0000 0000"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-white text-sm tabular-nums focus:outline-none focus:border-[#4A5D3F]"
                        />
                      </label>

                      <label className="block space-y-1 text-xs sm:col-span-2">
                        <span className="font-semibold text-[#3D362E]">الاسم على البطاقة *</span>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="AMINE BENALI"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-white text-sm focus:outline-none focus:border-[#4A5D3F]"
                        />
                      </label>

                      <label className="block space-y-1 text-xs">
                        <span className="font-semibold text-[#3D362E]">تاريخ الانتهاء (MM/YY) *</span>
                        <input
                          type="text"
                          required
                          dir="ltr"
                          inputMode="numeric"
                          value={cardExpiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          placeholder="08/28"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-white text-sm tabular-nums focus:outline-none focus:border-[#4A5D3F]"
                        />
                      </label>

                      <label className="block space-y-1 text-xs">
                        <span className="font-semibold text-[#3D362E]">رمز الأمان (CVV) *</span>
                        <input
                          type="password"
                          required
                          dir="ltr"
                          inputMode="numeric"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                          }
                          placeholder="•••"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-white text-sm tabular-nums focus:outline-none focus:border-[#4A5D3F]"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* BaridiMob RIP Transfer */}
                {paymentMethod === 'baridimob' && (
                  <div className="bg-[#FAF8F4] border border-[#E5DDD0] rounded-xl p-4 space-y-4">
                    <div className="space-y-1.5">
                      <span className="block text-xs font-semibold text-[#6B6257]">
                        حساب بريدي موب (RIP) الخاص بالمتجر (20 رقماً):
                      </span>
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#DCD3C4] rounded-lg px-3.5 py-2.5">
                        <code
                          dir="ltr"
                          className="text-sm sm:text-base font-bold text-[#231F1B] tabular-nums tracking-wider"
                        >
                          {settings.baridiMobRip}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyRip}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4A5D3F] text-white text-xs font-semibold hover:bg-[#3B4B32] transition-colors cursor-pointer"
                        >
                          {copiedRip ? (
                            <>
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>نسخ رقم RIP</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <label className="block space-y-1 text-xs">
                        <span className="font-semibold text-[#3D362E]">
                          مرجع العملية أو رقم التحويل
                        </span>
                        <input
                          type="text"
                          value={baridiMobReference}
                          onChange={(e) => setBaridiMobReference(e.target.value)}
                          placeholder="مثال: REF-948201"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCD3C4] bg-white text-sm focus:outline-none focus:border-[#4A5D3F]"
                        />
                      </label>

                      <div className="space-y-1 text-xs">
                        <span className="block font-semibold text-[#3D362E]">
                          أو إرفاق صورة وصل الدفع (اختياري)
                        </span>
                        <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-dashed border-[#B7AC9B] bg-white hover:bg-[#F2EDE4] text-xs font-semibold text-[#3D362E] cursor-pointer">
                          <Upload className="w-4 h-4 text-[#4A5D3F]" aria-hidden="true" />
                          <span>
                            {uploadingReceipt
                              ? 'جاري رفع الوصل...'
                              : baridiMobReceiptUrl
                              ? 'تم إرفاق الوصل بنجاح'
                              : 'اختر صورة الوصل (PNG / JPG)'}
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="sr-only"
                            onChange={(e) =>
                              handleReceiptUpload(e.target.files?.[0] || null)
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || uploadingReceipt}
                className="w-full py-3.5 px-6 rounded-xl bg-[#4A5D3F] hover:bg-[#3B4B32] disabled:opacity-60 text-white font-bold text-sm transition-colors cursor-pointer"
              >
                {submitting
                  ? 'جاري تأكيد الطلب...'
                  : `تأكيد الطلب (${formatDzd(totalDzd)})`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
