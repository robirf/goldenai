import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
});

const BCRYPT_ROUNDS = 10;
const DEFAULT_BUCKET = "uploads";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
let storageBucketReady = false;
const DEFAULT_BUSINESS_HOURS = { open_time: "09:00", close_time: "19:00", slot_minutes: 30 };

const isBcryptHash = (value: unknown): value is string => {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
};

const hashPassword = (password: string) => bcrypt.hashSync(password, BCRYPT_ROUNDS);

const sanitizeProfessional = (professional: any) => {
  const { password, ...professionalWithoutPassword } = professional;
  return professionalWithoutPassword;
};

const sanitizeClient = (client: any) => {
  const { password, ...clientWithoutPassword } = client;
  return clientWithoutPassword;
};

const mapDbError = (error: any, fallbackMessage: string) => {
  if (error?.code === "23505") {
    return { status: 409, message: "Já existe um registro com esse valor único" };
  }
  return { status: 500, message: error?.message || fallbackMessage };
};

const getBusinessHours = async () => {
  const { data, error } = await supabase
    .from("app_settings")
    .select("open_time, close_time, slot_minutes")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return DEFAULT_BUSINESS_HOURS;
    throw error;
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from("app_settings")
      .insert({ id: 1, ...DEFAULT_BUSINESS_HOURS })
      .select("open_time, close_time, slot_minutes")
      .single();
    if (insertError) throw insertError;
    return inserted;
  }

  return data;
};

const ensureStorageBucket = async () => {
  if (storageBucketReady) return;

  const { data, error } = await supabase.storage.getBucket(storageBucket);
  if (!error && data) {
    storageBucketReady = true;
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(storageBucket, { public: true });
  if (createError && !/already exists/i.test(createError.message || "")) {
    throw createError;
  }

  storageBucketReady = true;
};

app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!req.file.mimetype?.startsWith("image/")) {
    return res.status(415).json({ error: "Apenas arquivos de imagem são permitidos" });
  }

  try {
    await ensureStorageBucket();
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Falha ao preparar bucket de upload" });
  }

  const extensionFromMime = req.file.mimetype.replace("image/", "").replace("jpeg", "jpg");
  const extension = path.extname(req.file.originalname || "").toLowerCase() || `.${extensionFromMime}`;
  const filePath = `images/${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return res.status(500).json({ error: uploadError.message });
  }

  const { data } = supabase.storage.from(storageBucket).getPublicUrl(filePath);
  res.json({ url: data.publicUrl });
});

const handleAdminLogin = async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios" });
  }

  const { data: user, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!user || !user.password) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  if (isBcryptHash(user.password)) {
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
  } else if (user.password === password) {
    const upgradedHash = hashPassword(password);
    await supabase.from("professionals").update({ password: upgradedHash }).eq("id", user.id);
  } else {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  res.json(sanitizeProfessional(user));
};

app.post("/api/admin/login", handleAdminLogin);
app.post("/api/admin-login", handleAdminLogin);

app.post("/api/client-login", async (req, res) => {
  const { whatsapp, password, name } = req.body;
  if (!whatsapp || !password) {
    return res.status(400).json({ error: "WhatsApp e senha são obrigatórios" });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });
  }

  const { data: existingClient, error: findError } = await supabase
    .from("clients")
    .select("*")
    .eq("whatsapp", whatsapp)
    .maybeSingle();

  if (findError) return res.status(500).json({ error: findError.message });

  if (!existingClient) {
    if (!name) {
      return res.status(400).json({ error: "Informe seu nome para primeiro acesso" });
    }
    const { data: newClient, error: createError } = await supabase
      .from("clients")
      .insert({
        name,
        whatsapp,
        password: hashPassword(password),
        notifications_enabled: true,
      })
      .select("*")
      .single();
    if (createError) return res.status(500).json({ error: createError.message });
    return res.json(sanitizeClient(newClient));
  }

  const storedPassword = existingClient.password as string | null;
  if (!storedPassword) {
    const { data: upgradedClient, error: upgradeError } = await supabase
      .from("clients")
      .update({
        password: hashPassword(password),
        name: name || existingClient.name,
      })
      .eq("id", existingClient.id)
      .select("*")
      .single();
    if (upgradeError) return res.status(500).json({ error: upgradeError.message });
    return res.json(sanitizeClient(upgradedClient));
  }

  if (isBcryptHash(storedPassword)) {
    if (!bcrypt.compareSync(password, storedPassword)) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
  } else if (storedPassword === password) {
    const upgradedHash = hashPassword(password);
    await supabase.from("clients").update({ password: upgradedHash }).eq("id", existingClient.id);
  } else {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  if (name && name !== existingClient.name) {
    const { data: updatedClient, error: updateNameError } = await supabase
      .from("clients")
      .update({ name })
      .eq("id", existingClient.id)
      .select("*")
      .single();
    if (updateNameError) return res.status(500).json({ error: updateNameError.message });
    return res.json(sanitizeClient(updatedClient));
  }

  res.json(sanitizeClient(existingClient));
});

app.get("/api/services", async (_req, res) => {
  const { data, error } = await supabase
    .from("services")
    .select(`
      id, name, category, price, duration, status, image, description, professional_id,
      professionals(name)
    `)
    .order("id", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  const mapped = (data || []).map((service: any) => ({
    ...service,
    professional_name: service.professionals?.name || null,
  }));
  res.json(mapped);
});

app.post("/api/services", async (req, res) => {
  const { name, category, price, duration, image, description, professional_id } = req.body;
  const { data, error } = await supabase
    .from("services")
    .insert({
      name,
      category,
      price,
      duration,
      image,
      description: description || null,
      professional_id: professional_id || null,
    })
    .select("id")
    .single();

  if (error) {
    const mapped = mapDbError(error, "Erro ao cadastrar serviço");
    return res.status(mapped.status).json({ error: mapped.message });
  }

  res.json({ id: data.id });
});

const handleUpdateService = async (serviceIdRaw: unknown, req: express.Request, res: express.Response) => {
  const serviceId = Number(serviceIdRaw);
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const { name, category, price, duration, image, description, professional_id } = req.body;
  const { error } = await supabase
    .from("services")
    .update({
      name,
      category,
      price,
      duration,
      image,
      description: description || null,
      professional_id: professional_id || null,
    })
    .eq("id", serviceId);

  if (error) {
    const mapped = mapDbError(error, "Erro ao atualizar serviço");
    return res.status(mapped.status).json({ error: mapped.message });
  }

  res.json({ success: true });
};

app.put("/api/services/:id", async (req, res) => handleUpdateService(req.params.id, req, res));
app.post("/api/services-update", async (req, res) => handleUpdateService(req.body?.id, req, res));

app.get("/api/professionals", async (_req, res) => {
  const { data, error } = await supabase
    .from("professionals")
    .select("id, name, specialty, email, role, status, image, created_at")
    .order("id", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/clients", async (_req, res) => {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, whatsapp, status, image, notifications_enabled, created_at")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/business-hours", async (_req, res) => {
  try {
    const settings = await getBusinessHours();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao carregar horário de funcionamento" });
  }
});

app.post("/api/business-hours-update", async (req, res) => {
  const { open_time, close_time, slot_minutes } = req.body;
  if (!open_time || !close_time || !slot_minutes) {
    return res.status(400).json({ error: "open_time, close_time e slot_minutes são obrigatórios" });
  }

  const { error } = await supabase
    .from("app_settings")
    .upsert({ id: 1, open_time, close_time, slot_minutes: Number(slot_minutes) || 30 });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post("/api/professionals", async (req, res) => {
  const { name, specialty, email, password, role, image } = req.body;
  if (!name || !specialty || !email || !password) {
    return res.status(400).json({ error: "Nome, especialidade, e-mail e senha são obrigatórios" });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: "A senha deve ter no mínimo 8 caracteres" });
  }

  const { data, error } = await supabase
    .from("professionals")
    .insert({
      name,
      specialty,
      email,
      password: hashPassword(password),
      role: role === "admin" ? "admin" : "professional",
      image: image || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Já existe um profissional com esse e-mail" });
    }
    return res.status(500).json({ error: "Erro ao cadastrar profissional" });
  }

  res.json({ id: data.id });
});

const handleUpdateProfessional = async (professionalIdRaw: unknown, req: express.Request, res: express.Response) => {
  const professionalId = Number(professionalIdRaw);
  if (!Number.isInteger(professionalId) || professionalId <= 0) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const { name, specialty, email, image, password, role } = req.body;
  if (!name || !specialty || !email) {
    return res.status(400).json({ error: "Nome, especialidade e e-mail são obrigatórios" });
  }
  if (password && String(password).length < 8) {
    return res.status(400).json({ error: "A senha deve ter no mínimo 8 caracteres" });
  }

  const payload: Record<string, unknown> = {
    name,
    specialty,
    email,
    image: image || null,
    role: role === "admin" ? "admin" : "professional",
  };
  if (password && String(password).trim()) {
    payload.password = hashPassword(password);
  }

  const { error } = await supabase.from("professionals").update(payload).eq("id", professionalId);
  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Já existe um profissional com esse e-mail" });
    }
    return res.status(500).json({ error: "Erro ao atualizar profissional" });
  }

  res.json({ success: true });
};

app.put("/api/professionals/:id", async (req, res) => handleUpdateProfessional(req.params.id, req, res));
app.post("/api/professionals-update", async (req, res) => handleUpdateProfessional(req.body?.id, req, res));

const handleDeleteProfessional = async (professionalIdRaw: unknown, res: express.Response) => {
  const professionalId = Number(professionalIdRaw);
  if (!Number.isInteger(professionalId) || professionalId <= 0) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const { data: professional, error: findError } = await supabase
    .from("professionals")
    .select("id, role")
    .eq("id", professionalId)
    .maybeSingle();
  if (findError) return res.status(500).json({ error: findError.message });
  if (!professional) return res.status(404).json({ error: "Profissional não encontrado" });
  if (professional.role === "admin") {
    return res.status(400).json({ error: "Não é permitido excluir usuários administradores" });
  }

  const { error } = await supabase.from("professionals").delete().eq("id", professionalId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

app.delete("/api/professionals/:id", async (req, res) => handleDeleteProfessional(req.params.id, res));
app.post("/api/professionals-delete", async (req, res) => handleDeleteProfessional(req.body?.id, res));

const handleUpdateAdminPassword = async (req: express.Request, res: express.Response) => {
  const { adminId, newPassword } = req.body;
  const parsedAdminId = Number(adminId);
  if (!Number.isInteger(parsedAdminId) || parsedAdminId <= 0) {
    return res.status(400).json({ error: "adminId inválido" });
  }
  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: "A nova senha deve ter no mínimo 8 caracteres" });
  }

  const { data: admin, error: adminError } = await supabase
    .from("professionals")
    .select("id")
    .eq("id", parsedAdminId)
    .eq("role", "admin")
    .maybeSingle();

  if (adminError) return res.status(500).json({ error: adminError.message });
  if (!admin) {
    return res.status(403).json({ error: "Apenas administradores podem alterar a senha por este endpoint" });
  }

  const { error } = await supabase
    .from("professionals")
    .update({ password: hashPassword(newPassword) })
    .eq("id", parsedAdminId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

app.put("/api/admin/password", handleUpdateAdminPassword);
app.post("/api/admin-password-update", handleUpdateAdminPassword);

app.get("/api/bookings", async (req, res) => {
  const whatsapp = typeof req.query.whatsapp === "string" ? req.query.whatsapp : undefined;
  const professionalId = typeof req.query.professional_id === "string" ? Number(req.query.professional_id) : undefined;

  let clientId: number | undefined;
  if (whatsapp) {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("whatsapp", whatsapp)
      .maybeSingle();
    if (clientError) return res.status(500).json({ error: clientError.message });
    if (!client) return res.json([]);
    clientId = client.id;
  }

  let query = supabase
    .from("bookings")
    .select(`
      id, client_id, service_id, professional_id, date, time, status, created_at,
      services(name, duration),
      professionals(name),
      clients(name, whatsapp)
    `)
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }
  if (professionalId && Number.isInteger(professionalId)) {
    query = query.eq("professional_id", professionalId);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const mapped = (data || []).map((booking: any) => ({
    id: booking.id,
    client_id: booking.client_id,
    service_id: booking.service_id,
    professional_id: booking.professional_id,
    date: booking.date,
    time: booking.time,
    status: booking.status,
    service_name: booking.services?.name,
    service_duration: booking.services?.duration,
    professional_name: booking.professionals?.name,
    client_name: booking.clients?.name,
    whatsapp: booking.clients?.whatsapp,
  }));

  res.json(mapped);
});

app.post("/api/bookings", async (req, res) => {
  const { client_name, whatsapp, service_id, professional_id, date, time } = req.body;
  if (!client_name || !whatsapp || !service_id || !professional_id || !date || !time) {
    return res.status(400).json({ error: "Dados obrigatórios ausentes" });
  }

  let clientId: number;
  const { data: existingClient, error: clientLookupError } = await supabase
    .from("clients")
    .select("id")
    .eq("whatsapp", whatsapp)
    .maybeSingle();

  if (clientLookupError) return res.status(500).json({ error: clientLookupError.message });

  if (!existingClient) {
    const { data: newClient, error: createClientError } = await supabase
      .from("clients")
      .insert({ name: client_name, whatsapp, notifications_enabled: true })
      .select("id")
      .single();
    if (createClientError) return res.status(500).json({ error: createClientError.message });
    clientId = newClient.id;
  } else {
    clientId = existingClient.id;
    await supabase.from("clients").update({ name: client_name }).eq("id", clientId);
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      client_id: clientId,
      service_id,
      professional_id,
      date,
      time,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (bookingError) return res.status(500).json({ error: bookingError.message });
  res.json({ id: booking.id });
});

app.get("/api/professional-revenue", async (req, res) => {
  const professionalId = Number(req.query.professional_id);
  if (!Number.isInteger(professionalId) || professionalId <= 0) {
    return res.status(400).json({ error: "professional_id inválido" });
  }

  const { data: confirmedBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("date, service_id")
    .eq("professional_id", professionalId)
    .eq("status", "confirmed");

  if (bookingsError) return res.status(500).json({ error: bookingsError.message });

  const { data: services, error: servicesError } = await supabase.from("services").select("id, price");
  if (servicesError) return res.status(500).json({ error: servicesError.message });

  const servicePriceMap = new Map<number, number>((services || []).map((service: any) => [service.id, service.price]));
  const aggregated = new Map<string, { revenue: number; bookings_count: number }>();

  for (const booking of confirmedBookings || []) {
    const month = String(booking.date || "").slice(0, 7);
    if (!month || month.length !== 7) continue;
    const servicePrice = servicePriceMap.get(booking.service_id) || 0;
    const current = aggregated.get(month) || { revenue: 0, bookings_count: 0 };
    current.revenue += servicePrice;
    current.bookings_count += 1;
    aggregated.set(month, current);
  }

  const result = Array.from(aggregated.entries())
    .map(([month, values]) => ({
      month,
      revenue: Number(values.revenue.toFixed(2)),
      bookings_count: values.bookings_count,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));

  res.json(result);
});

const handleDeleteBooking = async (bookingIdRaw: unknown, res: express.Response) => {
  const bookingId = Number(bookingIdRaw);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

app.delete("/api/bookings/:id", async (req, res) => handleDeleteBooking(req.params.id, res));
app.post("/api/bookings-delete", async (req, res) => handleDeleteBooking(req.body?.id, res));

app.get("/api/stats", async (_req, res) => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const monthStart = `${today.slice(0, 7)}-01`;
  const currentTime = now.toTimeString().substring(0, 5);

  const { count: appointmentsToday, error: appointmentsError } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`);
  if (appointmentsError) return res.status(500).json({ error: appointmentsError.message });

  const { count: newClients, error: clientsError } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`);
  if (clientsError) return res.status(500).json({ error: clientsError.message });

  const { data: confirmedBookings, error: confirmedError } = await supabase
    .from("bookings")
    .select("service_id, date, time")
    .eq("status", "confirmed")
    .gte("date", monthStart)
    .lte("date", today);
  if (confirmedError) return res.status(500).json({ error: confirmedError.message });

  const { data: services, error: servicesError } = await supabase.from("services").select("id, price");
  if (servicesError) return res.status(500).json({ error: servicesError.message });

  const servicePriceMap = new Map<number, number>((services || []).map((service: any) => [service.id, service.price]));

  const revenue = (confirmedBookings || []).reduce((acc: number, booking: any) => {
    const isPast = booking.date < today || (booking.date === today && booking.time <= currentTime);
    if (!isPast) return acc;
    return acc + (servicePriceMap.get(booking.service_id) || 0);
  }, 0);

  res.json({
    appointmentsToday: appointmentsToday || 0,
    newClients: newClients || 0,
    revenue: Number(revenue.toFixed(2)),
  });
});

const handleUpdateClient = async (whatsappRaw: unknown, req: express.Request, res: express.Response) => {
  const whatsapp = String(whatsappRaw || "");
  const { name, email, image } = req.body;
  if (!whatsapp || !name) {
    return res.status(400).json({ error: "WhatsApp e nome são obrigatórios" });
  }

  const { error } = await supabase
    .from("clients")
    .update({ name, email: email || null, image: image || null })
    .eq("whatsapp", whatsapp);

  if (error) {
    const mapped = mapDbError(error, "Erro ao atualizar cliente");
    return res.status(mapped.status).json({ error: mapped.message });
  }

  res.json({ success: true });
};

app.put("/api/clients/:whatsapp", async (req, res) => handleUpdateClient(req.params.whatsapp, req, res));
app.post("/api/clients-update", async (req, res) => handleUpdateClient(req.body?.whatsapp, req, res));
app.post("/api/client-profile-update", async (req, res) => handleUpdateClient(req.body?.whatsapp, req, res));

app.post("/api/client-notifications-update", async (req, res) => {
  const { whatsapp, notifications_enabled } = req.body;
  if (!whatsapp) return res.status(400).json({ error: "WhatsApp é obrigatório" });

  const { error } = await supabase
    .from("clients")
    .update({ notifications_enabled: !!notifications_enabled })
    .eq("whatsapp", whatsapp);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post("/api/client-password-update", async (req, res) => {
  const { whatsapp, newPassword } = req.body;
  if (!whatsapp || !newPassword) {
    return res.status(400).json({ error: "WhatsApp e nova senha são obrigatórios" });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });
  }

  const { error } = await supabase
    .from("clients")
    .update({ password: hashPassword(newPassword) })
    .eq("whatsapp", whatsapp);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Imagem muito grande. Envie um arquivo de até 4MB." });
  }
  if (error) {
    return res.status(500).json({ error: error.message || "Erro interno no upload" });
  }
  return res.status(500).json({ error: "Erro interno no upload" });
});

export default app;
