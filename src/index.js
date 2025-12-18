require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Room = require("./models/Room");
const Resident = require("./models/Resident");
const Maintenance = require("./models/Maintenance");
const Billing = require("./models/Billing");
const User = require("./models/User");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const verifyToken = require("./middleware/auth");
const requireRole = require("./middleware/requireRole");

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const corsOptions = {
  origin: [
    CLIENT_ORIGIN,
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "https://hostelmanagementttt.netlify.app",
  ],
  methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

function createToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function safeUser(u) {
  if (!u) return null;
  const obj = u.toObject ? u.toObject() : { ...u };
  delete obj.password;
  return obj;
}

async function addToRoom(roomNumber, resident) {
  if (!roomNumber || !resident) return;
  const room = await Room.findOne({ number: roomNumber });
  if (!room) return;

  room.occupants = room.occupants || [];
  const exists = room.occupants.some(
    (o) => String(o.residentId) === String(resident._id)
  );

  if (!exists) {
    room.occupants.push({
      residentId: resident._id,
      name: resident.name,
      checkIn: resident.checkIn,
    });
  }

  room.status = "occupied";
  await room.save();
}

async function ensureDefaultAdmin() {
  const email = "admin@hostel.com";
  const exists = await User.findOne({ email });
  if (!exists) {
    const hashed = await hashPassword("admin123");
    await User.create({
      name: "Admin User",
      email,
      password: hashed,
      role: "Admin",
      status: "Active",
    });
    console.log("Seeded default admin:", email);
  } else {
    console.log("Admin already exists:", email);
  }
}

async function ensureDemoStaff() {
  const email = "staff@hostel.com";
  const exists = await User.findOne({ email });
  if (!exists) {
    const hashed = await hashPassword("staff1234");
    await User.create({
      name: "Demo Staff",
      email,
      password: hashed,
      role: "Staff",
      status: "Active",
    });
    console.log("Seeded demo staff:", email);
  }
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await ensureDefaultAdmin();
    await ensureDemoStaff();
  })
  .catch((err) => console.error("MongoDB Error:", err));

/* ================= AUTH ================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ ok: false, error: "Missing fields" });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(409).json({ ok: false, error: "Email already exists" });

    const hashed = await hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: "Staff",
      status: "Active",
    });

    res.json({ ok: true, user: safeUser(user), token: createToken(user) });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ ok: false, error: "Register failed" });
  }
});

app.use("/api/auth", authRoutes);

app.get("/api/me", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ ok: false });
  res.json({ ok: true, user: safeUser(user) });
});

app.use("/api/users", userRoutes);

/* ================= ROOMS (FIXED) ================= */

app.get("/api/rooms", verifyToken, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ number: 1 });
    res.json({ ok: true, rooms });
  } catch (err) {
    console.error("Rooms load error:", err);
    res.status(500).json({ ok: false, error: "Failed to load rooms" });
  }
});

/* ================= BILLING ================= */

app.get("/api/billing", verifyToken, async (req, res) => {
  const data = await Billing.find().sort({ createdAt: -1 });
  res.json({ ok: true, payments: data });
});

app.post("/api/billing", verifyToken, requireRole("Admin", "Staff"), async (req, res) => {
  const doc = await Billing.create(req.body);
  res.json({ ok: true, payment: doc });
});

/* ================= MAINTENANCE ================= */

app.get("/api/maintenance", verifyToken, async (req, res) => {
  const data = await Maintenance.find().sort({ createdAt: -1 });
  res.json({ ok: true, requests: data });
});

/* ================= RESIDENTS ================= */

app.get("/api/residents", verifyToken, async (req, res) => {
  const data = await Resident.find().sort({ createdAt: -1 });
  res.json({ ok: true, residents: data });
});

app.post("/api/residents", verifyToken, async (req, res) => {
  const resident = await Resident.create({
    ...req.body,
    checkIn: new Date().toISOString().slice(0, 10),
  });
  await addToRoom(resident.roomNumber, resident);
  res.json({ ok: true, resident });
});

/* ================= HEALTH ================= */

app.get("/wake", (req, res) => res.send("awake"));
app.get("/", (req, res) => res.send("Hostel API Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
