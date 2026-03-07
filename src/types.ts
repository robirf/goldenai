export interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  duration: number;
  status: 'active' | 'inactive';
  image: string;
  description?: string;
  professional_id?: number | null;
  professional_name?: string;
}

export interface Professional {
  id: number;
  name: string;
  specialty: string;
  email: string;
  role: 'admin' | 'professional';
  status: 'active' | 'inactive';
  image: string;
}

export interface ProfessionalCreatePayload {
  name: string;
  specialty: string;
  email: string;
  password: string;
  image?: string;
  role?: 'admin' | 'professional';
}

export interface ProfessionalUpdatePayload {
  name: string;
  specialty: string;
  email: string;
  image?: string;
  password?: string;
  role?: 'admin' | 'professional';
}

export interface AdminPasswordUpdatePayload {
  adminId: number;
  newPassword: string;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  whatsapp: string;
  status: 'active' | 'inactive';
  image?: string;
  notifications_enabled?: boolean;
  created_at?: string;
}

export interface Booking {
  id: number;
  client_id: number;
  service_id: number;
  professional_id: number;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  service_name?: string;
  service_duration?: number;
  professional_name?: string;
  client_name?: string;
  whatsapp?: string;
}

export interface BusinessHours {
  open_time: string;
  close_time: string;
  slot_minutes: number;
}

export interface Stats {
  appointmentsToday: number;
  newClients: number;
  revenue: number;
}

export interface ProfessionalRevenue {
  month: string;
  revenue: number;
  bookings_count: number;
}
