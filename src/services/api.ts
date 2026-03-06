import {
  Service,
  Professional,
  Booking,
  Stats,
  ProfessionalCreatePayload,
  ProfessionalUpdatePayload,
  AdminPasswordUpdatePayload,
} from "../types";

const API_BASE = "/api";

const parseResponse = async <T>(res: Response): Promise<T> => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Erro na requisição");
  }
  return data as T;
};

export const api = {
  getServices: async (): Promise<Service[]> => {
    const res = await fetch(`${API_BASE}/services`);
    return parseResponse<Service[]>(res);
  },
  getProfessionals: async (): Promise<Professional[]> => {
    const res = await fetch(`${API_BASE}/professionals`);
    return parseResponse<Professional[]>(res);
  },
  getBookings: async (whatsapp?: string, professional_id?: number): Promise<Booking[]> => {
    let url = `${API_BASE}/bookings`;
    const params = new URLSearchParams();
    if (whatsapp) params.append('whatsapp', whatsapp);
    if (professional_id) params.append('professional_id', professional_id.toString());
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url);
    return parseResponse<Booking[]>(res);
  },
  createBooking: async (booking: Partial<Booking> & { client_name: string; whatsapp: string }): Promise<{ id: number }> => {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    return parseResponse<{ id: number }>(res);
  },
  deleteBooking: async (id: number): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/bookings-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return parseResponse<{ success: boolean }>(res);
  },
  updateClient: async (whatsapp: string, data: { name: string; email?: string }): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/clients-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp, ...data }),
    });
    return parseResponse<{ success: boolean }>(res);
  },
  getStats: async (): Promise<Stats> => {
    const res = await fetch(`${API_BASE}/stats`);
    return parseResponse<Stats>(res);
  },
  adminLogin: async (data: any): Promise<Professional> => {
    const res = await fetch(`${API_BASE}/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return parseResponse<Professional>(res);
  },
  createService: async (data: any): Promise<{ id: number }> => {
    const res = await fetch(`${API_BASE}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return parseResponse<{ id: number }>(res);
  },
  updateService: async (id: number, data: any): Promise<void> => {
    const res = await fetch(`${API_BASE}/services-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    await parseResponse<{ success: boolean }>(res);
  },
  createProfessional: async (data: ProfessionalCreatePayload): Promise<{ id: number }> => {
    const res = await fetch(`${API_BASE}/professionals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return parseResponse<{ id: number }>(res);
  },
  updateProfessional: async (id: number, data: ProfessionalUpdatePayload): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/professionals-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    return parseResponse<{ success: boolean }>(res);
  },
  updateAdminPassword: async (adminId: number, newPassword: string): Promise<{ success: boolean }> => {
    const payload: AdminPasswordUpdatePayload = { adminId, newPassword };
    const res = await fetch(`${API_BASE}/admin-password-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseResponse<{ success: boolean }>(res);
  },
  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
    });
    return parseResponse<{ url: string }>(res);
  },
};
