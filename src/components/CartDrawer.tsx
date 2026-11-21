import {Minus, Plus, ShoppingBag, Trash2, X} from 'lucide-react';
import {formatDzd} from '../data/wilayas';
import type {CartItem} from '../types/store';
import {SafeImage} from './SafeImage';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  freeShippingThresholdDzd: number;
  onClose: () => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  items,
  freeShippingThresholdDzd,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.priceDzd * item.quantity,
    0,
  );
  const remainingForFree = Math.max(0, freeShippingThresholdDzd - subtotal);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="سلة المشتريات"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[#FAF8F4] h-full flex flex-col border-r border-[#E5DDD0] shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5DDD0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#4A5D3F]" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-[#231F1B]">
              سلة المشتريات
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق السلة"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#5A5248] hover:bg-[#F2EDE4] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Notice */}
        {items.length > 0 && freeShippingThresholdDzd > 0 && (
          <div className="px-6 py-2.5 bg-[#F2EDE4] border-b border-[#E5DDD0] text-xs text-[#3D362E]">
            {remainingForFree === 0 ? (
              <span className="font-semibold text-[#2F5E3D]">
                مبروك! طلبك مؤهل للتوصيل المجاني لجميع الولايات.
              </span>
            ) : (
              <span>
                أضف منتجات بقيمة{' '}
                <strong className="tabular-nums">{formatDzd(remainingForFree)}</strong>{' '}
                للحصول على توصيل مجاني.
              </span>
            )}
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
              <ShoppingBag className="w-10 h-10 text-[#A89E91]" aria-hidden="true" />
              <p className="font-display text-base font-semibold text-[#231F1B]">
                سلة المشتريات فارغة حالياً
              </p>
              <p className="text-sm text-[#6B6257] max-w-xs">
                تصفح ألعاب مونتيسوري الخشبية والباقات التعليمية لإضافتها إلى طلبك.
              </p>
            </div>
          ) : (
            items.map(({product, quantity}) => (
              <div
                key={product.id}
                className="flex gap-4 bg-white border border-[#E5DDD0] rounded-xl p-3.5"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#F2EDE4] shrink-0">
                  <SafeImage
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-[#231F1B] line-clamp-2">
                      {product.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(product.id)}
                      aria-label={`حذف ${product.name}`}
                      className="text-[#8C8275] hover:text-[#8B4A3E] p-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <div className="inline-flex items-center border border-[#E5DDD0] rounded-lg bg-[#FAF8F4]">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(product.id, -1)}
                        aria-label="إنقاص الكمية"
                        className="w-8 h-8 flex items-center justify-center text-[#5A5248] hover:text-[#231F1B] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(product.id, 1)}
                        aria-label="زيادة الكمية"
                        className="w-8 h-8 flex items-center justify-center text-[#5A5248] hover:text-[#231F1B] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-[#231F1B] tabular-nums">
                      {formatDzd(product.priceDzd * quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-[#E5DDD0] space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B6257]">المجموع الفرعي</span>
              <span className="text-lg font-bold text-[#231F1B] tabular-nums">
                {formatDzd(subtotal)}
              </span>
            </div>
            <p className="text-xs text-[#6B6257]">
              يتم احتساب تكلفة التوصيل بدقة عند اختيار الولاية وطريقة الشحن.
            </p>
            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-6 rounded-xl bg-[#4A5D3F] hover:bg-[#3B4B32] text-white font-bold text-sm transition-colors cursor-pointer"
            >
              إتمام الطلب
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
