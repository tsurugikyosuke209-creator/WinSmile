import {CheckCircle2, ShoppingBag, XCircle} from 'lucide-react';
import {formatDzd} from '../data/wilayas';
import type {Product} from '../types/store';
import {SafeImage} from './SafeImage';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({product, onSelect, onAddToCart}: ProductCardProps) {
  const isAvailable = product.availability === 'in_stock';
  const hasDiscount =
    typeof product.originalPriceDzd === 'number' &&
    product.originalPriceDzd > product.priceDzd;

  return (
    <article className="group bg-white border border-[#E5DDD0] rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col">
      {/* Spacious 4:3 Product Image Frame */}
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="relative aspect-[4/3] w-full bg-[#F2EDE4] overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-[#4A5D3F]"
      >
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          fallbackTitle={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </button>

      {/* Clean Details Directly Beneath Image */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          {/* Unboxed Metadata Line */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B6257]">
            <div className="flex items-center gap-1.5">
              <span>{product.ageGroup}</span>
              <span aria-hidden="true">·</span>
              <span>{product.skillCategory}</span>
              {product.itemType === 'bundle' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#7A5C3E]">باقة تعليمية</span>
                </>
              )}
            </div>

            <span
              className={`inline-flex items-center gap-1 font-medium ${
                isAvailable ? 'text-[#2F5E3D]' : 'text-[#8B4A3E]'
              }`}
            >
              {isAvailable ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>{isAvailable ? 'متوفر' : 'نفدت الكمية'}</span>
            </span>
          </div>

          {/* Toy Name */}
          <h3 className="font-display text-lg font-semibold text-[#231F1B] leading-snug">
            <button
              type="button"
              onClick={() => onSelect(product)}
              className="text-right hover:text-[#4A5D3F] transition-colors cursor-pointer"
            >
              {product.name}
            </button>
          </h3>
        </div>

        {/* Price & Action Footer */}
        <div className="pt-3 border-t border-[#F0EAE0] flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#231F1B] tabular-nums">
              {formatDzd(product.priceDzd)}
            </span>
            {hasDiscount && product.originalPriceDzd && (
              <span className="text-xs text-[#8C8275] line-through tabular-nums">
                {formatDzd(product.originalPriceDzd)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(product)}
              className="px-3 py-2 text-xs font-medium text-[#5A5248] hover:text-[#231F1B] hover:bg-[#F2EDE4] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              التفاصيل
            </button>
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => onAddToCart(product)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isAvailable
                  ? 'bg-[#4A5D3F] text-white hover:bg-[#3B4B32] cursor-pointer'
                  : 'bg-[#E5DDD0] text-[#8C8275] cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isAvailable ? 'أضف للسلة' : 'غير متوفر'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
