export interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  duration: number;
  status: 'active' | 'inactive';
  image: string;
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

export interface Client {
  id: number;
  name: string;
  email?: string;
  whatsapp: string;
  status: 'active' | 'inactive';
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
  professional_name?: string;
  client_name?: string;
  whatsapp?: string;
}

export interface Stats {
  appointmentsToday: number;
  newClients: number;
  revenue: number;
}
