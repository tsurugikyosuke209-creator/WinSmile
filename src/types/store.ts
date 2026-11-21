export type AgeGroup =
  | '0–1 سنة'
  | '1–2 سنوات'
  | '2–4 سنوات'
  | '4–6 سنوات';

export type SkillCategory =
  | 'الحسّية'
  | 'الحركية الدقيقة'
  | 'اللغة'
  | 'الرياضيات'
  | 'الحياة العملية';

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
