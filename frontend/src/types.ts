export type Role = "user" | "admin" | "courier";
export type Status =
  "pending" | "picked_up" | "in_transit" | "delivered" | "cancelled";
export interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  created_at?: string;
}
export interface Order {
  id: number;
  user_id: number;
  courier_id: number | null;
  pickup_location: string;
  dropoff_location: string;
  package_details: string;
  delivery_time: string;
  status: Status;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  courier_name: string | null;
  courier_email?: string | null;
  courier_phone: string | null;
  assignment_status?: string;
}
export interface CourierOrder extends Omit<
  Order,
  "id" | "status" | "created_at" | "updated_at"
> {
  id: number;
  order_id: number;
  order_status: Status;
  assigned_at: string;
}
export interface Courier {
  id: number;
  name: string;
  email: string;
  phone: string;
}
export interface History {
  id: number;
  new_status: Status;
  old_status: Status | null;
  created_at: string;
  changed_by_name: string;
}
export interface Assignment {
  id: number;
  courier_name: string;
  courier_phone: string;
  assignment_status: string;
  assigned_at: string;
}
