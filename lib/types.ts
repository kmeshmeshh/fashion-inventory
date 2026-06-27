export type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff";
  created_at: string;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  cost_per_unit: number;
  selling_price: number; // ← أضف الخط ده
  current_stock: number;
  created_at: string;
  updated_at: string;
};

// أضف type جديد
export type ProductVariant = {
  id: number;
  product_id: number;
  size: string;
  quantity: number;
  created_at: string;
};

export type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  status: "pending" | "prepared" | "shipped" | "delivered" | "cancelled";
  total_price: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_sale: number;
  created_at: string;
};

export type Shipment = {
  id: number;
  shipment_number: string;
  courier_name: string;
  tracking_number?: string;
  shipped_date: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
};

export type Expense = {
  id: number;
  category: "packaging" | "marketing" | "transport" | "other";
  amount: number;
  description?: string;
  date: string;
  created_by: string;
  created_at: string;
};

export type InventoryLog = {
  id: number;
  product_id: number;
  quantity_changed: number;
  reason: "order" | "restock" | "adjustment";
  reference_id?: number;
  created_by: string;
  created_at: string;
};
