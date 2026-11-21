import {Product, StoreSettings} from '../types/store';

/**
 * ============================================================================
 * الإعدادات الثابتة للمتجر (Centralized Store Configuration)
 * يمكنك تعديل بيانات المتجر الافتراضية من هنا مباشرة، أو تعديلها وحفظها
 * من داخل لوحة التحكم "إدارة المتجر".
 *
 * ملاحظة أمنية: كلمة مرور لوحة التحكم تُقرأ حصراً على الخادم:
 * - عبر متغير البيئة ADMIN_PASSWORD (أو الإعداد الأولي من واجهة الإدارة).
 * ============================================================================
 */
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'WinSmile',
  phone: '+213 550 12 34 56',
  whatsapp: '213550123456',
  email: 'contact@montessori-dz.com',
  baridiMobRip: '00799999001234567890',
  instagramUrl: 'https://instagram.com/montessori.algeria',
  facebookUrl: 'https://facebook.com/montessori.algeria',
  tiktokUrl: 'https://tiktok.com/@montessori.algeria',
  locationCoverage: 'الجزائر العاصمة - توصيل إلى 58 ولاية',
  freeShippingThresholdDzd: 12000,
};

export const HERO_IMAGE_PATH =
  '/src/assets/images/hero_montessori_playroom_1795276103290.jpg';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'mnt-pink-tower',
    name: 'البرج الوردي المونتيسوري (10 مكعبات)',
    priceDzd: 4800,
    imageUrl: '/src/assets/images/product_pink_tower_1795276105659.jpg',
    ageGroup: '2–4 سنوات',
    skillCategory: 'الحسّية',
    educationalBenefit:
      'ينمّي التمييز البصري للأحجام والأبعاد الثلاثية، ويعزّز التآزر البصري الحركي والدقة العضلية لليد، كما يهيّئ الطفل بطريقة غير مباشرة لمفاهيم التسلسل والنظام العشري في الرياضيات.',
    availability: 'in_stock',
    itemType: 'single',
    createdAt: '2026-11-01T09:00:00.000Z',
  },
  {
    id: 'mnt-knobbed-cylinders',
    name: 'لوح الأسطوانات الخشبية بمقابض',
    priceDzd: 3600,
    imageUrl: '/src/assets/images/product_knobbed_cylinders_1795276107065.jpg',
    ageGroup: '1–2 سنوات',
    skillCategory: 'الحركية الدقيقة',
    educationalBenefit:
      'يدرّب مسكة الأصابع الثلاثية (مسكة القلم) تمهيداً للكتابة، ويطوّر قدرة الطفل على المقارنة بين السماكة والارتفاع مع تصحيح الخطأ ذاتياً دون تدخل الكبار.',
    availability: 'in_stock',
    itemType: 'single',
    createdAt: '2026-11-02T09:00:00.000Z',
  },
  {
    id: 'mnt-object-permanence',
    name: 'صندوق ديمومة الأشياء مع الكرة الخشبية',
    priceDzd: 3200,
    imageUrl: '/src/assets/images/product_permanence_box_1795276105456.jpg',
    ageGroup: '0–1 سنة',
    skillCategory: 'الحركية الدقيقة',
    educationalBenefit:
      'يساعد الرضيع على فهم مفهوم بقاء الأشياء حتى عند اختفائها عن نظره، ويحفّز الفضول، التركيز الهادئ، والتنسيق بين حركة اليد والمعصم والعين.',
    availability: 'in_stock',
    itemType: 'single',
    createdAt: '2026-11-03T09:00:00.000Z',
  },
  {
    id: 'mnt-tactile-letters',
    name: 'صندوق الحروف اللمسية الخشبي',
    priceDzd: 4500,
    imageUrl: '/src/assets/images/product_arabic_sandpaper_letters_1795276105912.jpg',
    ageGroup: '4–6 سنوات',
    skillCategory: 'اللغة',
    educationalBenefit:
      'يربط بين الصوت وشكل الحرف عبر الذاكرة اللمسية والبصرية، مما يسهّل على الطفل تعلّم القراءة والكتابة المبكرة بأسلوب حسي ممتع وهادئ.',
    availability: 'in_stock',
    itemType: 'single',
    createdAt: '2026-11-04T09:00:00.000Z',
  },
  {
    id: 'mnt-counting-pegs',
    name: 'صينية العد والحلقات الخشبية (1 إلى 10)',
    priceDzd: 5200,
    imageUrl: '/src/assets/images/product_counting_beads_rods_1795276105980.jpg',
    ageGroup: '4–6 سنوات',
    skillCategory: 'الرياضيات',
    educationalBenefit:
      'يجسّد الأرقام المجردة إلى كميات ملموسة، فيستوعب الطفل العلاقة بين الرمز والكمية ويتمرّن على الجمع والطرح البسيط بوضوح وثقة.',
    availability: 'out_of_stock',
    itemType: 'single',
    createdAt: '2026-11-05T09:00:00.000Z',
  },
  {
    id: 'mnt-bundle-two-years',
    name: 'باقة سنتين التعليمية المتكاملة (4 ألعاب خشبية)',
    priceDzd: 9500,
    originalPriceDzd: 11800,
    imageUrl: '/src/assets/images/product_bundle_two_years_1795276105829.jpg',
    ageGroup: '1–2 سنوات',
    skillCategory: 'الحياة العملية',
    educationalBenefit:
      'مجموعة متكاملة لعمر السنتين تجمع بين قوس التوازن الخشبي، لوح الأوتاد، صندوق فرز الأشكال الهندسية، وبرج الحلقات لتطوير الاستقلالية، التصنيف المنطقي، والمهارات الحركية الدقيقة في ركن واحد.',
    availability: 'in_stock',
    itemType: 'bundle',
    bundleItems: [
      'قوس التوازن الخشبي الطبيعي',
      'صندوق فرز الأشكال الهندسية',
      'لوح الأوتاد الملونة',
      'برج الحلقات المتدرج',
    ],
    createdAt: '2026-11-06T09:00:00.000Z',
  },
];
