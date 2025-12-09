export interface Menu_item {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  preparation_station: string;
  is_active: boolean;
}
export interface Table {
  id: number;
  table_number: string;
  capacity: number;
  status: string;
  current_order_id: number | null;
  updated_at: string;

  orders?: Order[];
  table_groups?: TableGroup | null;
}

export interface TableGroup {
  id: number;
  created_at: string;
  closed_at: string | null;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  is_beverage: boolean;
  active: boolean;
  created_at: string | null;
  inventory_item_id?: number | null;
  station_id?: number | null;
}
export interface Modifier {
  id: number;
  name: string;
  priceDelta: number;
  active: boolean;
}
export interface InventoryItem {
  id: number;
  name: string;
  unit_type: string;
  current_stock: number;
  low_stock_threshold?: number | null;
  category?: string | null;
  created_at: string | null;
}
export interface InventoryWastage {
  id: number;
  inventory_item_id: number;
  amount: number;
  reason: string;
  notes?: string | null;
  adjusted_by: number;
  created_at: string | null;
}
export interface User {
  sub: number | null;
  name: string | null;
  role: string | null;
  email: string | null;
  created_at: string | null;
}
export interface StaffShift {
  id: number;
  staff_id: number;
  start_time: string;
  end_time?: string | null;
}
export interface Order {
  id: number;
  status: string;
  total_amount: string;
  created_at: string;
  closed_at: string | null;
  paid_at: string | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  special_instructions?: string | null;
  share_id?: number | null;
  status: string;
  discount_id?: number | null;
  created_at: string | null;
  cancel_reason?: string | null;
}
export interface OrderReceipt {
  orderId: number;
  tableNumber: string | null;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  serviceCharge: number;
  total: number;
}
export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  method: string;
  share_id?: number | null;
  yape_transaction_id?: string | null;
  yape_sender_phone?: string | null;
  processed_by: number;
  created_at: string | null;
}
export interface PaymentMethod {
  id: number;
  name: string;
}
export interface Discount {
  id: number;
  name: string;
  discount_type?: string | null;
  amount?: number | null;
  active: boolean | null;
}
