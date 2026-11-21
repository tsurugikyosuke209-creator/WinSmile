import {useEffect, useMemo, useState} from 'react';
import {
  CreditCard,
  Leaf,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import {AdminDashboard} from './components/AdminDashboard';
import {CartDrawer} from './components/CartDrawer';
import {CheckoutModal} from './components/CheckoutModal';
import {ContactSection} from './components/ContactSection';
import {type ActivePage, Navbar} from './components/Navbar';
import {ProductCard} from './components/ProductCard';
import {ProductDetailModal} from './components/ProductDetailModal';
import {SafeImage} from './components/SafeImage';
import {WinSmileLogo} from './components/WinSmileLogo';
import {
  DEFAULT_STORE_SETTINGS,
  HERO_IMAGE_PATH,
  INITIAL_PRODUCTS,
} from './config/storeDefaults';
import {formatDzd} from './data/wilayas';
import type {
  AgeGroup,
  CartItem,
  Order,
  Product,
  StoreSettings,
} from './types/store';

const CART_STORAGE_KEY = 'montessori_dz_cart_v1';

type FilterOption = 'all' | 'bundles' | AgeGroup;

const FILTER_TABS: {id: FilterOption; label: string}[] = [
  {id: 'all', label: 'جميع الألعاب'},
  {id: 'bundles', label: 'الباقات التعليمية'},
  {id: '0–1 سنة', label: '0–1 سنة'},
  {id: '1–2 سنوات', label: '1–2 سنوات'},
  {id: '2–4 سنوات', label: '2–4 سنوات'},
  {id: '4–6 سنوات', label: '4–6 سنوات'},
];

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loadingStore, setLoadingStore] = useState(true);

  const [activePage, setActivePage] = useState<ActivePage>('store');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[] | null>(null);
  const [isDirectCheckout, setIsDirectCheckout] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as CartItem[];
      }
    } catch {
      // Ignore storage error
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage error
    }
  }, [cart]);

  useEffect(() => {
    let active = true;
    fetch('/api/store')
      .then((res) => res.json())
      .then((data: {products?: Product[]; settings?: StoreSettings}) => {
        if (!active) return;
        if (Array.isArray(data.products)) {
          setProducts(data.products);
        }
        if (data.settings) {
          setSettings(data.settings);
          document.title = `${data.settings.storeName} | ألعاب مونتيسوري التعليمية`;
        }
      })
      .catch(() => {
        // Fallback to initial defaults already in state
      })
      .finally(() => {
        if (active) setLoadingStore(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (activeFilter === 'bundles' && product.itemType !== 'bundle') {
        return false;
      }
      if (
        activeFilter !== 'all' &&
        activeFilter !== 'bundles' &&
        product.ageGroup !== activeFilter
      ) {
        return false;
      }
      if (!query) return true;
      return (
        product.name.toLowerCase().includes(query) ||
        product.skillCategory.toLowerCase().includes(query) ||
        product.educationalBenefit.toLowerCase().includes(query)
      );
    });
  }, [products, activeFilter, searchQuery]);

  const bundles = useMemo(
    () => products.filter((p) => p.itemType === 'bundle'),
    [products],
  );

  const handleNavigate = (page: ActivePage, sectionId?: string) => {
    setActivePage(page);
    if (page === 'store' && sectionId) {
      setTimeout(() => {
        if (sectionId === 'top') {
          window.scrollTo({top: 0, behavior: 'smooth'});
        } else {
          document
            .getElementById(sectionId)
            ?.scrollIntoView({behavior: 'smooth'});
        }
      }, 40);
    } else {
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  const handleAddToCart = (product: Product) => {
    if (product.availability !== 'in_stock') return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {...item, quantity: item.quantity + 1}
            : item,
        );
      }
      return [...prev, {product, quantity: 1}];
    });
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleOrderNow = (product: Product) => {
    if (product.availability !== 'in_stock') return;
    setSelectedProduct(null);
    setIsDirectCheckout(true);
    setCheckoutItems([{product, quantity: 1}]);
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? {...item, quantity: Math.max(0, item.quantity + delta)}
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleOrderComplete = (_order: Order, clearedCart: boolean) => {
    if (clearedCart) {
      setCart([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#231F1B]">
      <Navbar
        storeName={settings.storeName}
        cartCount={cartCount}
        activePage={activePage}
        onNavigate={handleNavigate}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1">
        {activePage === 'admin' ? (
          <AdminDashboard
            products={products}
            settings={settings}
            onProductsChanged={(updated) => setProducts(updated)}
            onSettingsChanged={(updated) => {
              setSettings(updated);
              document.title = `${updated.storeName} | ألعاب مونتيسوري التعليمية`;
            }}
            onExitAdmin={() => handleNavigate('store', 'top')}
          />
        ) : (
          <>
            {/* Section 1: Calm Editorial Montessori Hero */}
            <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-6 flex flex-col justify-center space-y-6 py-4">
                  <p className="text-xs font-semibold text-[#7A5C3E]">
                    {settings.locationCoverage}
                  </p>
                  <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#231F1B] leading-[1.2]">
                    ألعاب مونتيسوري خشبية تصنع فارقاً هادئاً في نمو طفلك
                  </h1>
                  <p className="text-base sm:text-lg text-[#5A5248] leading-relaxed max-w-xl">
                    مختارات أصلية من الخشب الطبيعي الآمن المصمم وفق منهج ماريا مونتيسوري،
                    لتنمية التركيز، الاستقلالية، والمهارات الحسية من الأشهر الأولى وحتى 6 سنوات.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleNavigate('store', 'catalog')}
                      className="px-6 py-3 rounded-xl bg-[#4A5D3F] hover:bg-[#3B4B32] text-white text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
                    >
                      تصفح الألعاب التعليمية
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilter('bundles');
                        handleNavigate('store', 'bundles');
                      }}
                      className="px-6 py-3 rounded-xl bg-white border border-[#DCD3C4] hover:bg-[#F2EDE4] text-[#231F1B] text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                    >
                      اكتشف باقات الأعمار
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="aspect-[16/10] lg:aspect-auto lg:h-full rounded-2xl overflow-hidden border border-[#E5DDD0] bg-[#F2EDE4]">
                    <SafeImage
                      src={HERO_IMAGE_PATH}
                      alt="ركن ألعاب مونتيسوري الخشبية الطبيعية للأطفال"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Full-width 4-Column Trust Strip Below Hero */}
              <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-[#E5DDD0] py-6">
                <div className="flex items-center gap-3">
                  <Leaf className="w-5 h-5 text-[#4A5D3F] shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-bold text-[#231F1B]">خشب طبيعي آمن</div>
                    <div className="text-xs text-[#6B6257]">أصباغ مائية غير سامة</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-[#4A5D3F] shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-bold text-[#231F1B]">توصيل لـ 58 ولاية</div>
                    <div className="text-xs text-[#6B6257]">للمنزل أو مكتب الشحن</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-[#4A5D3F] shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-bold text-[#231F1B]">دفع مرن بالجزائر</div>
                    <div className="text-xs text-[#6B6257]">عند الاستلام، الذهبية أو بريدي موب</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#4A5D3F] shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-bold text-[#231F1B]">منهج مونتيسوري أصيل</div>
                    <div className="text-xs text-[#6B6257]">مصنفة حسب العمر والمهارة</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Product Showcase & Filters */}
            <section
              id="catalog"
              className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[#7A5C3E]">
                    المجموعة المختارة
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#231F1B]">
                    ألعاب مونتيسوري حسب العمر والمهارة
                  </h2>
                </div>

                {/* Search Input */}
                <div className="relative w-full md:w-72">
                  <Search
                    className="w-4 h-4 text-[#8C8275] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن لعبة أو مهارة..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-[#DCD3C4] bg-white text-sm text-[#231F1B] placeholder:text-[#8C8275] focus:outline-none focus:border-[#4A5D3F]"
                  />
                </div>
              </div>

              {/* Interactive Segmented Filter Tabs */}
              <div
                role="tablist"
                aria-label="تصفية الألعاب حسب العمر والباقات"
                className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F2EDE4] rounded-xl w-fit max-w-full"
              >
                {FILTER_TABS.map((tab) => {
                  const active = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveFilter(tab.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white text-[#231F1B] shadow-sm'
                          : 'text-[#5A5248] hover:text-[#231F1B]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Spacious 3-Column Product Grid */}
              {loadingStore ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-96 rounded-xl bg-[#F2EDE4] animate-pulse border border-[#E5DDD0]"
                    />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white border border-[#E5DDD0] rounded-2xl p-12 text-center space-y-3">
                  <p className="font-display text-lg font-bold text-[#231F1B]">
                    لم نجد ألعاباً مطابقة لبحثك
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-lg bg-[#4A5D3F] text-white text-xs font-bold cursor-pointer"
                  >
                    عرض جميع المنتجات
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={setSelectedProduct}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Section 3: Dedicated Age-Based Educational Bundles */}
            {bundles.length > 0 && (
              <section
                id="bundles"
                className="bg-[#F2EDE4]/70 border-y border-[#E5DDD0] py-14"
              >
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-[#7A5C3E]">
                        توفير مدروس لكل مرحلة
                      </p>
                      <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#231F1B]">
                        الباقات التعليمية حسب العمر
                      </h2>
                      <p className="text-sm text-[#5A5248] max-w-2xl">
                        مجموعات متكاملة تضم أدوات مونتيسوري مترابطة بسعر باقة مخفّض لتجهيز ركن تعلّم منزلي متوازن.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {bundles.map((bundle) => {
                      const isAvailable = bundle.availability === 'in_stock';
                      const savings =
                        bundle.originalPriceDzd &&
                        bundle.originalPriceDzd > bundle.priceDzd
                          ? bundle.originalPriceDzd - bundle.priceDzd
                          : 0;
                      return (
                        <article
                          key={bundle.id}
                          className="bg-white border border-[#E5DDD0] rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 items-stretch"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(bundle)}
                            className="sm:col-span-5 aspect-[4/3] sm:aspect-auto bg-[#F2EDE4] overflow-hidden cursor-pointer"
                          >
                            <SafeImage
                              src={bundle.imageUrl}
                              alt={bundle.name}
                              className="w-full h-full object-cover"
                            />
                          </button>

                          <div className="sm:col-span-7 p-6 flex flex-col justify-between gap-4">
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-2 text-xs text-[#6B6257]">
                                <span>{bundle.ageGroup}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-semibold text-[#7A5C3E]">
                                  باقة اقتصادية
                                </span>
                                {savings > 0 && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-semibold text-[#2F5E3D]">
                                      وفر {formatDzd(savings)}
                                    </span>
                                  </>
                                )}
                              </div>

                              <h3 className="font-display text-xl font-bold text-[#231F1B]">
                                {bundle.name}
                              </h3>

                              <p className="text-sm text-[#5A5248] line-clamp-2">
                                {bundle.educationalBenefit}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-[#F0EAE0] flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-[#231F1B] tabular-nums">
                                  {formatDzd(bundle.priceDzd)}
                                </span>
                                {bundle.originalPriceDzd && (
                                  <span className="text-xs text-[#8C8275] line-through tabular-nums">
                                    {formatDzd(bundle.originalPriceDzd)}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedProduct(bundle)}
                                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#3D362E] bg-[#FAF8F4] border border-[#E5DDD0] hover:bg-[#F2EDE4] cursor-pointer"
                                >
                                  محتويات الباقة
                                </button>
                                <button
                                  type="button"
                                  disabled={!isAvailable}
                                  onClick={() => handleOrderNow(bundle)}
                                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                                    isAvailable
                                      ? 'bg-[#4A5D3F] hover:bg-[#3B4B32] text-white cursor-pointer'
                                      : 'bg-[#E5DDD0] text-[#8C8275] cursor-not-allowed'
                                  }`}
                                >
                                  {isAvailable ? 'اطلب الباقة' : 'نفدت الكمية'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Section 4: Contact Us */}
            <ContactSection settings={settings} />
          </>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-[#F2EDE4] border-t border-[#E5DDD0] py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6257]">
          <div className="inline-flex items-center gap-2 font-display font-semibold text-[#231F1B]">
            <WinSmileLogo className="w-6 h-6 shrink-0" />
            <span>
              {settings.storeName} · {settings.locationCoverage}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => handleNavigate('store', 'catalog')}
              className="hover:text-[#231F1B] cursor-pointer"
            >
              الألعاب
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('store', 'bundles')}
              className="hover:text-[#231F1B] cursor-pointer"
            >
              الباقات
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('store', 'contact')}
              className="hover:text-[#231F1B] cursor-pointer"
            >
              تواصل معنا
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('admin')}
              className="hover:text-[#231F1B] cursor-pointer"
            >
              إدارة المتجر
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        settings={settings}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onOrderNow={handleOrderNow}
      />

      <CartDrawer
        isOpen={isCartOpen}
        items={cart}
        freeShippingThresholdDzd={settings.freeShippingThresholdDzd}
        onClose={() => setIsCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsDirectCheckout(false);
          setCheckoutItems(cart);
        }}
      />

      <CheckoutModal
        isOpen={Boolean(checkoutItems && checkoutItems.length > 0)}
        items={checkoutItems || []}
        settings={settings}
        isDirectOrder={isDirectCheckout}
        onClose={() => setCheckoutItems(null)}
        onOrderComplete={handleOrderComplete}
      />
    </div>
  );
}
