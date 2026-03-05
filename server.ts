import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const db = new Database("clinic.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    duration INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS professionals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'professional',
    status TEXT DEFAULT 'active',
    image TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    whatsapp TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    service_id INTEGER,
    professional_id INTEGER,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY(client_id) REFERENCES clients(id),
    FOREIGN KEY(service_id) REFERENCES services(id),
    FOREIGN KEY(professional_id) REFERENCES professionals(id)
  );
`);

// Migration: Add created_at if not exists
try {
  db.exec("ALTER TABLE clients ADD COLUMN created_at TEXT DEFAULT (datetime('now', 'localtime'))");
} catch (e) {}
try {
  db.exec("ALTER TABLE bookings ADD COLUMN created_at TEXT DEFAULT (datetime('now', 'localtime'))");
} catch (e) {}

// Migration: Add password and role to professionals if not exists
try {
  db.exec("ALTER TABLE professionals ADD COLUMN password TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE professionals ADD COLUMN role TEXT DEFAULT 'professional'");
} catch (e) {}
try {
  db.exec("ALTER TABLE professionals ADD COLUMN created_at TEXT DEFAULT (datetime('now', 'localtime'))");
} catch (e) {}

// Seed data if empty
const serviceCount = db.prepare("SELECT COUNT(*) as count FROM services").get() as { count: number };
if (serviceCount.count === 0) {
  const insertService = db.prepare("INSERT INTO services (name, category, price, duration, image) VALUES (?, ?, ?, ?, ?)");
  insertService.run("Cílios", "Estética", 150, 60, "https://lh3.googleusercontent.com/aida-public/AB6AXuCHDEfWyk1q8Gc4pUASLNsxROuJp3tqDW4YWfi9-KPODw8jSg8SsrHvyE0SD9zWcH9tg535mmSUoR7YWLZtuHUG-g05R2VkrtgcrpXbVOSEAM-gLVUzPmrJRCyJlyHDIi5hid0teiII2M0Ij6vd1gghxs95ZlCaQMF0UwbA3lnVqBijjSiPDk6OBIqKXLpJl_VvcU4eAsItlj00AaaDs30UM3soAjopXYV5Ei2IxdlHLW5E1Qor9kxk2hTvdLO-NgsMPwxDQZ5BxI40");
  insertService.run("Unhas", "Manicure", 80, 45, "https://lh3.googleusercontent.com/aida-public/AB6AXuD1NFkaILZFUmRFeiB-JOa4Ie54vHemFhCnvO54HMX8UdDbkUcmkyzJk-hg_RzlrumNwixniu-FlMUwwzKNAVyPQZvoSvbbJiv_WOLlF-9Qw7tK0tU3OjtlsEjL1XLhcPrPp-YKgR-XspaLcZK_iLrPR4r6CdtFUZMlijAigzx_miELcy0csatHAYHqbjH02ohRHNlin5uCJS1IZs3rBx32--eDez7_4BNhIwLEViKlXyBHec3lQmzXTeJ63AcBwLtqF1O710cqyle4");
  insertService.run("Bronzeamento a Jato", "Estética", 200, 90, "https://lh3.googleusercontent.com/aida-public/AB6AXuC58MjJq4TMMM8t_FUtKW5Yw5b4K64AKjqOm_NQluIv7L-KuqX3I3CVr-gqqYVnncEC4BUAP39UsuWK5ybTkwQm4JGCrWcGCA3sGkbiiHuYyq__6E7Bmqe7rdyMT4XFDy7WnwC6kCGmTRvFrYOm4UB1EPw-_vyqvFUamfuOrxHb5kGWsdE9hftKQnUXhcR6iCTXnpycxKR4TsxrFCtzTdY5v_6xYW3Tre7s7yA-YZ7FhXdo-Pu0Wfffijv7SYxVS3dny5R5vThg-2-f");
}

// Ensure Admin exists
const adminExists = db.prepare("SELECT id FROM professionals WHERE email = ?").get("admin@goldenclinic.com");
if (!adminExists) {
  const insertProfessional = db.prepare("INSERT INTO professionals (name, specialty, email, password, role, image) VALUES (?, ?, ?, ?, ?, ?)");
  insertProfessional.run("Admin Golden", "Administrador", "admin@goldenclinic.com", "admin123", "admin", "https://lh3.googleusercontent.com/aida-public/AB6AXuC4KYnvGDBsKBBcWNXzUzU_Y8rrCms6FaotglL_lrrigL4z12VIJVaWK0uBqQDL_ssp3SVpNR_X-XBvLygSvVGw_lxArndltzRmR48Jnu91Q3imFCWlT_ldq94IttPxcAX0D1D42DnROEezeM1vlHrDXUsYUYPYMcDEawTZ2eZ1Jj4vEKfWHzLCADh8MxnurGFa9M31T4hDmk3fdGkx4I7OtWsK34LrABV2rJ8a2MvQt7AjYGocmN0jw8SaOE4utMVtY2DeDZKfMSwu");
}

// Ensure Ricardo exists with password
const ricardoExists = db.prepare("SELECT id FROM professionals WHERE email = ?").get("ricardo@goldenclinic.com");
if (!ricardoExists) {
  const insertProfessional = db.prepare("INSERT INTO professionals (name, specialty, email, password, role, image) VALUES (?, ?, ?, ?, ?, ?)");
  insertProfessional.run("Ricardo Oliveira", "Especialista em Corte & Barba", "ricardo@goldenclinic.com", "ricardo123", "professional", "https://lh3.googleusercontent.com/aida-public/AB6AXuACfQiugoHHGPHcsL0bmD5d1Rv7LPBmnKGRDJ4tmOy-4F2iJvCXaGJbWktP0YAQT3C2dgpQbcLbMKFwHkiUCErcL_wbTycrkx3cO4HLQBaqQeax0SZlposWeg0d3XCZ2FNwuRHZn5FTmJa_LBJ9tL3yeyNmnBgeKmIyptPmicWhTe7pkvQld6Tkxq-MK5_k65kpQjOGNMpzxA698OWwync2wmPGFY0r2tT41pnCY_znCBpulkiJ8hLbkMS5scLeZ6V5CBr78AoaswQA");
} else {
  db.prepare("UPDATE professionals SET password = ?, role = ? WHERE email = ? AND (password IS NULL OR password = '')").run("ricardo123", "professional", "ricardo@goldenclinic.com");
}

// Ensure Elena exists with password
const elenaExists = db.prepare("SELECT id FROM professionals WHERE email = ?").get("elena@goldenclinic.com");
if (!elenaExists) {
  const insertProfessional = db.prepare("INSERT INTO professionals (name, specialty, email, password, role, image) VALUES (?, ?, ?, ?, ?, ?)");
  insertProfessional.run("Dra. Elena Rose", "Aesthetics Lead", "elena@goldenclinic.com", "elena123", "professional", "https://lh3.googleusercontent.com/aida-public/AB6AXuC4KYnvGDBsKBBcWNXzUzU_Y8rrCms6FaotglL_lrrigL4z12VIJVaWK0uBqQDL_ssp3SVpNR_X-XBvLygSvVGw_lxArndltzRmR48Jnu91Q3imFCWlT_ldq94IttPxcAX0D1D42DnROEezeM1vlHrDXUsYUYPYMcDEawTZ2eZ1Jj4vEKfWHzLCADh8MxnurGFa9M31T4hDmk3fdGkx4I7OtWsK34LrABV2rJ8a2MvQt7AjYGocmN0jw8SaOE4utMVtY2DeDZKfMSwu");
} else {
  db.prepare("UPDATE professionals SET password = ?, role = ? WHERE email = ? AND (password IS NULL OR password = '')").run("elena123", "professional", "elena@goldenclinic.com");
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.use("/uploads", express.static(uploadDir));

  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM professionals WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  });

  app.get("/api/services", (req, res) => {
    const services = db.prepare("SELECT * FROM services").all();
    res.json(services);
  });

  app.get("/api/professionals", (req, res) => {
    const professionals = db.prepare("SELECT * FROM professionals").all();
    res.json(professionals);
  });

  app.post("/api/services", (req, res) => {
    const { name, category, price, duration, image } = req.body;
    const result = db.prepare("INSERT INTO services (name, category, price, duration, image) VALUES (?, ?, ?, ?, ?)")
      .run(name, category, price, duration, image);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/services/:id", (req, res) => {
    const { id } = req.params;
    const { name, category, price, duration, image } = req.body;
    db.prepare("UPDATE services SET name = ?, category = ?, price = ?, duration = ?, image = ? WHERE id = ?")
      .run(name, category, price, duration, image, id);
    res.json({ success: true });
  });

  app.post("/api/professionals", (req, res) => {
    const { name, specialty, email, password, role, image } = req.body;
    const result = db.prepare("INSERT INTO professionals (name, specialty, email, password, role, image) VALUES (?, ?, ?, ?, ?, ?)")
      .run(name, specialty, email, password, role || 'professional', image);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/bookings", (req, res) => {
    const { whatsapp, professional_id } = req.query;
    let query = `
      SELECT b.*, s.name as service_name, p.name as professional_name, c.name as client_name, c.whatsapp
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN professionals p ON b.professional_id = p.id
      JOIN clients c ON b.client_id = c.id
    `;
    
    let bookings;
    const params: any[] = [];
    if (whatsapp || professional_id) {
      query += " WHERE 1=1";
      if (whatsapp) {
        query += " AND c.whatsapp = ?";
        params.push(whatsapp);
      }
      if (professional_id) {
        query += " AND b.professional_id = ?";
        params.push(professional_id);
      }
      bookings = db.prepare(query).all(...params);
    } else {
      bookings = db.prepare(query).all();
    }
    res.json(bookings);
  });

  app.post("/api/bookings", (req, res) => {
    const { client_name, whatsapp, service_id, professional_id, date, time } = req.body;
    
    // Simple client management
    let client = db.prepare("SELECT id FROM clients WHERE whatsapp = ?").get(whatsapp) as { id: number } | undefined;
    if (!client) {
      const result = db.prepare("INSERT INTO clients (name, whatsapp) VALUES (?, ?)").run(client_name, whatsapp);
      client = { id: Number(result.lastInsertRowid) };
    } else {
      // Update name if it changed
      db.prepare("UPDATE clients SET name = ? WHERE id = ?").run(client_name, client.id);
    }

    const result = db.prepare("INSERT INTO bookings (client_id, service_id, professional_id, date, time) VALUES (?, ?, ?, ?, ?)")
      .run(client.id, service_id, professional_id, date, time);
    
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/bookings/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM bookings WHERE id = ?").run(Number(id));
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm

    // Agendamentos realizados hoje (criados hoje)
    const appointmentsToday = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE date(created_at) = date('now', 'localtime')").get() as { count: number };
    
    // Novos clientes cadastrados hoje
    const newClients = db.prepare("SELECT COUNT(*) as count FROM clients WHERE date(created_at) = date('now', 'localtime')").get() as { count: number };
    
    // Receita total: faturamento baseado no agendamento confirmado, que passou do horário atual
    const revenue = db.prepare(`
      SELECT SUM(s.price) as total 
      FROM bookings b 
      JOIN services s ON b.service_id = s.id 
      WHERE b.status = 'confirmed' 
      AND (b.date < ? OR (b.date = ? AND b.time <= ?))
    `).get(today, today, currentTime) as { total: number };

    res.json({
      appointmentsToday: appointmentsToday.count,
      newClients: newClients.count,
      revenue: revenue.total || 0
    });
  });

  app.put("/api/clients/:whatsapp", (req, res) => {
    const { whatsapp } = req.params;
    const { name, email } = req.body;
    db.prepare("UPDATE clients SET name = ?, email = ? WHERE whatsapp = ?").run(name, email, whatsapp);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
