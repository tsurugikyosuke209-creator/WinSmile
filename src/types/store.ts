export type AgeGroup =
  | 'أقل من سنة (0-12 شهر)'
  | 'سنتان (1-2 سنة)'
  | '3 سنوات (2-3 سنوات)'
  | '4 سنوات (3-4 سنوات)'
  | '5 سنوات فما فوق (+5 سنوات)';

export type SkillCategory =
  | 'ألعاب ذكاء ومنطق'
  | 'ألعاب حسية'
  | 'مهارات حركية دقيقة'
  | 'رياضيات وأرقام'
  | 'لغة وحروف'
  | 'حياة عملية واستقلالية'
  | 'رزم تعليمية';

export type ItemType = 'single' | 'bundle';

export type AvailabilityStatus = 'in_stock' | 'out_of_stock';

export interface Product {
  id: string;
  name: string;
  priceDzd: number;
  originalPriceDzd?: number;
  imageUrl: string;
  ageGroup: AgeGroup;
  skillCategory: SkillCategory;
  educationalBenefit: string;
  availability: AvailabilityStatus;
  itemType: ItemType;
  bundleItems?: string[];
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  phone: string;
  whatsapp: string;
  email: string;
  baridiMobRip: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  locationCoverage: string;
  freeShippingThresholdDzd: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type DeliveryMethod = 'home' | 'hub';

export type PaymentMethod = 'cod' | 'card' | 'baridimob';

export type OrderStatus = 'new' | 'preparing' | 'shipped' | 'completed';

export interface OrderItemSummary {
  productId: string;
  name: string;
  priceDzd: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  wilayaCode: string;
  wilayaName: string;
  commune: string;
  address: string;
  deliveryMethod: DeliveryMethod;
  shippingHubCarrier?: 'Yalidine' | 'ZR Express';
  paymentMethod: PaymentMethod;
  cardType?: 'Edahabia' | 'CIB';
  cardLast4?: string;
  baridiMobReference?: string;
  baridiMobReceiptUrl?: string;
  items: OrderItemSummary[];
  subtotalDzd: number;
  shippingDzd: number;
  totalDzd: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Wilaya {
  code: string;
  nameAr: string;
  homeFeeDzd: number;
  hubFeeDzd: number;
}
