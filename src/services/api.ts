import { Service, Professional, Booking, Stats } from "../types";

const API_BASE = "/api";

export const api = {
  getServices: async (): Promise<Service[]> => {
    const res = await fetch(`${API_BASE}/services`);
    return res.json();
  },
  getProfessionals: async (): Promise<Professional[]> => {
    const res = await fetch(`${API_BASE}/professionals`);
    return res.json();
  },
  getBookings: async (whatsapp?: string, professional_id?: number): Promise<Booking[]> => {
    let url = `${API_BASE}/bookings`;
    const params = new URLSearchParams();
    if (whatsapp) params.append('whatsapp', whatsapp);
    if (professional_id) params.append('professional_id', professional_id.toString());
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url);
    return res.json();
  },
  createBooking: async (booking: Partial<Booking> & { client_name: string; whatsapp: string }): Promise<{ id: number }> => {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    return res.json();
  },
  deleteBooking: async (id: number): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },
  updateClient: async (whatsapp: string, data: { name: string; email?: string }): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/clients/${whatsapp}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  getStats: async (): Promise<Stats> => {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },
  adminLogin: async (data: any): Promise<Professional> => {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Credenciais inválidas");
    return res.json();
  },
  createService: async (data: any): Promise<Service> => {
    const res = await fetch(`${API_BASE}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateService: async (id: number, data: any): Promise<void> => {
    await fetch(`${API_BASE}/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  createProfessional: async (data: any): Promise<Professional> => {
    const res = await fetch(`${API_BASE}/professionals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Falha no upload");
    return res.json();
  },
};
