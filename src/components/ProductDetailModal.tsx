import {CheckCircle2, MessageCircle, ShoppingBag, X, XCircle} from 'lucide-react';
import {formatDzd, sanitizeWhatsappNumber} from '../data/wilayas';
import type {Product, StoreSettings} from '../types/store';
import {SafeImage} from './SafeImage';

interface ProductDetailModalProps {
  product: Product | null;
  settings: StoreSettings;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onOrderNow: (product: Product) => void;
}

export function ProductDetailModal({
  product,
  settings,
  onClose,
  onAddToCart,
  onOrderNow,
}: ProductDetailModalProps) {
  if (!product) return null;

  const isAvailable = product.availability === 'in_stock';
  const hasDiscount =
    typeof product.originalPriceDzd === 'number' &&
    product.originalPriceDzd > product.priceDzd;
  const savingsDzd =
    hasDiscount && product.originalPriceDzd
      ? product.originalPriceDzd - product.priceDzd
      : 0;

  const whatsappMessage = encodeURIComponent(
    `السلام عليكم، أرغب في طلب: ${product.name} (${formatDzd(product.priceDzd)}) من ${settings.storeName}.`,
  );
  const whatsappUrl = `https://wa.me/${sanitizeWhatsappNumber(settings.whatsapp)}?text=${whatsappMessage}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-[#FAF8F4] border border-[#E5DDD0] rounded-2xl shadow-xl overflow-hidden my-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق نافذة المنتج"
          className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 border border-[#E5DDD0] text-[#231F1B] hover:bg-[#F2EDE4] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
          {/* Product Image Column */}
          <div className="bg-[#F2EDE4] flex flex-col justify-between">
            <div className="aspect-[4/3] lg:h-full w-full overflow-hidden">
              <SafeImage
                src={product.imageUrl}
                alt={product.name}
                fallbackTitle={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Contiguous Purchase & Educational Benefit Module */}
          <div className="p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              {/* Unboxed Metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6257]">
                <span>{product.ageGroup}</span>
                <span aria-hidden="true">·</span>
                <span>{product.skillCategory}</span>
                {product.itemType === 'bundle' && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#7A5C3E]">باقة تعليمية متكاملة</span>
                  </>
                )}
              </div>

              <h2
                id="pdp-title"
                className="font-display text-2xl sm:text-3xl font-bold text-[#231F1B] leading-snug"
              >
                {product.name}
              </h2>

              {/* Price & Availability Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-[#231F1B] tabular-nums">
                    {formatDzd(product.priceDzd)}
                  </span>
                  {hasDiscount && product.originalPriceDzd && (
                    <span className="text-sm text-[#8C8275] line-through tabular-nums">
                      {formatDzd(product.originalPriceDzd)}
                    </span>
                  )}
                  {savingsDzd > 0 && (
                    <span className="text-xs font-semibold text-[#2F5E3D]">
                      توفر {formatDzd(savingsDzd)}
                    </span>
                  )}
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                    isAvailable ? 'text-[#2F5E3D]' : 'text-[#8B4A3E]'
                  }`}
                >
                  {isAvailable ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{isAvailable ? 'متوفر للشحن الفوري' : 'نفدت الكمية حالياً'}</span>
                </span>
              </div>

              {/* Educational Benefit Card */}
              <div className="bg-[#F2EDE4] border border-[#E5DDD0] rounded-xl p-4 space-y-2">
                <h3 className="font-display text-sm font-bold text-[#4A5D3F]">
                  ماذا يكتسب الطفل من هذه اللعبة؟
                </h3>
                <p className="text-sm text-[#3D362E] leading-relaxed">
                  {product.educationalBenefit}
                </p>
              </div>

              {/* Bundle Contents if applicable */}
              {product.itemType === 'bundle' &&
                product.bundleItems &&
                product.bundleItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-display text-xs font-bold text-[#6B6257]">
                      محتويات الباقة التعليمية:
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#3D362E]">
                      {product.bundleItems.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4A5D3F] shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-[#E5DDD0]">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onOrderNow(product)}
                  className={`flex-1 py-3 px-5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
                    isAvailable
                      ? 'bg-[#4A5D3F] text-white hover:bg-[#3B4B32] cursor-pointer'
                      : 'bg-[#E5DDD0] text-[#8C8275] cursor-not-allowed'
                  }`}
                >
                  {isAvailable ? 'اطلب الآن' : 'غير متوفر حالياً'}
                </button>
                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onAddToCart(product)}
                  className={`inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap ${
                    isAvailable
                      ? 'border-[#4A5D3F] text-[#4A5D3F] hover:bg-[#F2EDE4] cursor-pointer'
                      : 'border-[#E5DDD0] text-[#8C8275] cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>أضف للسلة</span>
                </button>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-[#2F5E3D] bg-white border border-[#D8E2D2] hover:bg-[#F2EDE4] transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>اطلب سريعاً عبر واتساب ({formatDzd(product.priceDzd)})</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
