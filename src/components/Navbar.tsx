import {ShoppingBag} from 'lucide-react';
import {WinSmileLogo} from './WinSmileLogo';

export type ActivePage = 'store' | 'admin';

interface NavbarProps {
  storeName: string;
  cartCount: number;
  activePage: ActivePage;
  onNavigate: (page: ActivePage, sectionId?: string) => void;
  onOpenCart: () => void;
}

export function Navbar({
  storeName,
  cartCount,
  activePage,
  onNavigate,
  onOpenCart,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-sm border-b border-[#E5DDD0]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Store Wordmark + Simple Montessori Smile Logo */}
        <button
          type="button"
          onClick={() => onNavigate('store', 'top')}
          className="inline-flex items-center gap-2.5 font-display text-lg sm:text-xl font-bold tracking-tight text-[#231F1B] hover:text-[#4A5D3F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4A5D3F]"
        >
          <WinSmileLogo className="w-8 h-8 shrink-0" />
          <span>{storeName}</span>
        </button>

        {/* Zone 2: 4 Clean Single-Line Nav Links */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5A5248]"
        >
          <button
            type="button"
            onClick={() => onNavigate('store', 'catalog')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activePage === 'store'
                ? 'border-transparent hover:border-[#4A5D3F] hover:text-[#231F1B]'
                : 'border-transparent hover:text-[#231F1B]'
            }`}
          >
            المنتجات
          </button>
          <button
            type="button"
            onClick={() => onNavigate('store', 'bundles')}
            className="py-1 border-b-2 border-transparent hover:border-[#4A5D3F] hover:text-[#231F1B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            الباقات
          </button>
          <button
            type="button"
            onClick={() => onNavigate('store', 'contact')}
            className="py-1 border-b-2 border-transparent hover:border-[#4A5D3F] hover:text-[#231F1B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            تواصل معنا
          </button>
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activePage === 'admin'
                ? 'border-[#4A5D3F] text-[#231F1B] font-semibold'
                : 'border-transparent hover:border-[#4A5D3F] hover:text-[#231F1B]'
            }`}
          >
            إدارة المتجر
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate(activePage === 'admin' ? 'store' : 'admin')}
            className="md:hidden px-3 py-2 text-xs font-medium text-[#4A5D3F] hover:text-[#231F1B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {activePage === 'admin' ? 'المتجر' : 'إدارة المتجر'}
          </button>
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#4A5D3F] hover:bg-[#3B4B32] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A5D3F]"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>السلة</span>
            <span className="tabular-nums font-semibold">({cartCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
}
