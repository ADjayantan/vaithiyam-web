/**
 * In-memory demo store. Supabase-ready repository modules in lib/db/* wrap this
 * fallback so local development keeps working without environment variables.
 */
import { SEED_PRODUCTS, type SeedMedicine } from '@/lib/medicineData';

export interface DbUser {
  id: string;
  name: string;
  mobile: string;
  email: string;
  password: string; // demo fallback only; never use plaintext passwords in production
  role: 'customer' | 'admin';
  photoUrl?: string;
  otp?: string;
  otpExpiry?: number;
  createdAt: string;
}

export interface DbAddress {
  id: string;
  userId: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface DbWishlistItem {
  id: string;
  userId: string;
  productId: string;
  slug: string;
  nameTa: string;
  nameEn: string;
  imageUrl?: string;
  tradition: SeedMedicine['tradition'];
  price: number;
  mrp: number;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  stockCount?: number;
  addedAt: string;
  prescriptionRequired?: boolean;
}

export interface DbCartItem {
  id: string;
  userId: string;
  productId: string;
  qty: number;
  price: number;
  nameTa: string;
  nameEn: string;
  imageUrl?: string;
}

export interface DbOrder {
  id: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: DbCartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  addressId: string;
  paymentMethod: string;
  prescriptionStatus?: 'not_required' | 'pending_review' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}


export interface DbReview {
  id:        string;
  productId: string;
  userId:    string;
  userName:  string;
  rating:    number;   // 1–5
  title:     string;
  body:      string;
  createdAt: string;
}
export interface DbPrescription {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileUrl?: string;
  status: 'pending_review' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
}

const SEED_USER: DbUser = {
  id: 'usr_demo_001',
  name: 'கார்த்திக் ராஜன்',
  mobile: '9876543210',
  email: 'karthik@example.com',
  password: 'demo1234',
  role: 'customer',
  createdAt: new Date().toISOString(),
};

const SEED_ADMIN: DbUser = {
  id: 'usr_admin_001',
  name: 'Vaithiyam Admin',
  mobile: '9000000000',
  email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@vaithiyam.local',
  password: 'admin1234',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

const SEED_ADDRESS: DbAddress = {
  id: 'addr_001',
  userId: 'usr_demo_001',
  label: 'வீடு',
  line1: '42, கோவிந்தசாமி நகர்',
  line2: 'அண்ணாநகர்',
  city: 'கோயம்புத்தூர்',
  state: 'Tamil Nadu',
  pincode: '641001',
  isDefault: true,
};

const SEED_WISHLIST: DbWishlistItem[] = SEED_PRODUCTS.slice(0, 8).map((product, index) => ({
  id: `wl_${String(index + 1).padStart(3, '0')}`,
  userId: 'usr_demo_001',
  productId: product.id,
  slug: product.slug,
  nameTa: product.nameTa,
  nameEn: product.nameEn,
  imageUrl: product.imageUrl,
  tradition: product.tradition,
  price: product.price,
  mrp: product.mrp,
  rating: product.rating,
  reviewCount: product.reviewCount,
  inStock: product.inStock,
  stockCount: product.stockCount,
  addedAt: new Date(Date.now() - index * 86400000).toISOString(),
  prescriptionRequired: product.prescriptionRequired,
}));

const SEED_CART: DbCartItem[] = [
  {
    id: 'ci_001',
    userId: 'usr_demo_001',
    productId: 'prod_001',
    qty: 2,
    price: SEED_PRODUCTS[0].price,
    nameTa: SEED_PRODUCTS[0].nameTa,
    nameEn: SEED_PRODUCTS[0].nameEn,
    imageUrl: SEED_PRODUCTS[0].imageUrl,
  },
  {
    id: 'ci_002',
    userId: 'usr_demo_001',
    productId: 'prod_004',
    qty: 1,
    price: SEED_PRODUCTS[3].price,
    nameTa: SEED_PRODUCTS[3].nameTa,
    nameEn: SEED_PRODUCTS[3].nameEn,
    imageUrl: SEED_PRODUCTS[3].imageUrl,
  },
];

const SEED_ORDERS: DbOrder[] = [
  {
    id: 'VT2024001',
    userId: 'usr_demo_001',
    status: 'delivered',
    items: [SEED_CART[0]],
    subtotal: 360,
    deliveryFee: 0,
    total: 360,
    addressId: 'addr_001',
    paymentMethod: 'upi',
    prescriptionStatus: 'not_required',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'VT2024002',
    userId: 'usr_demo_001',
    status: 'shipped',
    items: [SEED_CART[1]],
    subtotal: 350,
    deliveryFee: 50,
    total: 400,
    addressId: 'addr_001',
    paymentMethod: 'cod',
    prescriptionStatus: 'pending_review',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

class MockDb {
  users: Map<string, DbUser> = new Map();
  addresses: Map<string, DbAddress> = new Map();
  wishlist: Map<string, DbWishlistItem> = new Map();
  cart: Map<string, DbCartItem> = new Map();
  orders: Map<string, DbOrder> = new Map();
  prescriptions: Map<string, DbPrescription> = new Map();
  products: SeedMedicine[] = [...SEED_PRODUCTS];
  reviews: DbReview[] = [];

  constructor() {
    this.users.set(SEED_USER.id, SEED_USER);
    this.users.set(SEED_ADMIN.id, SEED_ADMIN);
    this.addresses.set(SEED_ADDRESS.id, SEED_ADDRESS);
    SEED_WISHLIST.forEach((item) => this.wishlist.set(item.id, item));
    SEED_CART.forEach((item) => this.cart.set(item.id, item));
    SEED_ORDERS.forEach((order) => this.orders.set(order.id, order));
  }

  getUserByMobile(mobile: string): DbUser | undefined {
    return Array.from(this.users.values()).find((user) => user.mobile === mobile);
  }

  getUserByEmail(email: string): DbUser | undefined {
    return Array.from(this.users.values()).find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): DbUser | undefined {
    return this.users.get(id);
  }

  getWishlistForUser(userId: string, page = 1, limit = 10): { items: DbWishlistItem[]; total: number; hasMore: boolean } {
    const all = Array.from(this.wishlist.values())
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    const total = all.length;
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);
    return { items, total, hasMore: start + items.length < total };
  }

  getAddressesForUser(userId: string): DbAddress[] {
    return Array.from(this.addresses.values())
      .filter((address) => address.userId === userId)
      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  }

  getCartForUser(userId: string): DbCartItem[] {
    return Array.from(this.cart.values()).filter((item) => item.userId === userId);
  }

  getOrdersForUser(userId: string, filters?: { status?: string; search?: string }): DbOrder[] {
    let all = Array.from(this.orders.values()).filter((order) => order.userId === userId);
    if (filters?.status && filters.status !== 'all') {
      all = all.filter((order) => order.status === filters.status);
    }
    if (filters?.search) {
      const query = filters.search.toLowerCase();
      all = all.filter((order) =>
        order.id.toLowerCase().includes(query) ||
        order.items.some((item) => item.nameTa.includes(query) || item.nameEn.toLowerCase().includes(query))
      );
    }
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getPrescriptionsForUser(userId: string): DbPrescription[] {
    return Array.from(this.prescriptions.values())
      .filter((prescription) => prescription.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addPrescription(input: Omit<DbPrescription, 'id' | 'createdAt'>): DbPrescription {
    const prescription: DbPrescription = {
      ...input,
      id: `rx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.prescriptions.set(prescription.id, prescription);
    return prescription;
  }
}

const globalForDb = globalThis as unknown as { __vaithiyamDb?: MockDb };
if (!globalForDb.__vaithiyamDb) {
  globalForDb.__vaithiyamDb = new MockDb();
}

export const db = globalForDb.__vaithiyamDb;
