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

/* ================= CORS ================= */

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: [
      CLIENT_ORIGIN,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://hostelmanagementttt.netlify.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

/* ================= JWT ================= */

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

function createToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

function safeUser(u) {
  if (!u) return null;
  const obj = u.toObject();
  delete obj.password;
  return obj;
}

/* ================= DB ================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");

    // Default Admin
    const adminEmail = "admin@hostel.com";
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: "Admin User",
        email: adminEmail,
        password: await hashPassword("admin123"),
        role: "Admin",
        status: "Active",
      });
    }

    // Demo Staff
    const staffEmail = "staff@hostel.com";
    const staffExists = await User.findOne({ email: staffEmail });
    if (!staffExists) {
      await User.create({
        name: "Demo Staff",
        email: staffEmail,
        password: await hashPassword("staff1234"),
        role: "Staff",
        status: "Active",
      });
    }
  })
  .catch((err) => console.error("MongoDB error", err));

/* ================= AUTH ================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ ok: false, error: "Missing fields" });

    if (await User.findOne({ email }))
      return res.status(409).json({ ok: false, error: "Email exists" });

    const user = await User.create({
      name,
      email,
      password: await hashPassword(password),
      role: "Staff",
      status: "Active",
    });

    res.json({ ok: true, user: safeUser(user), token: createToken(user) });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Register failed" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/api/me", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ ok: true, user: safeUser(user) });
});

/* ================= ROOMS (FIXED) ================= */

app.get("/api/rooms", verifyToken, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ number: 1 });
    res.json({ ok: true, rooms });
  } catch {
    res.status(500).json({ ok: false, error: "Rooms API error" });
  }
});

/* ================= RESIDENTS ================= */

app.get("/api/residents", verifyToken, async (req, res) => {
  const residents = await Resident.find().sort({ createdAt: -1 });
  res.json({ ok: true, residents });
});

app.post("/api/residents", verifyToken, async (req, res) => {
  const resident = await Resident.create({
    ...req.body,
    checkIn: new Date().toISOString().slice(0, 10),
  });
  res.json({ ok: true, resident });
});

/* ================= BILLING ================= */

app.get("/api/billing", verifyToken, async (req, res) => {
  const payments = await Billing.find().sort({ createdAt: -1 });
  res.json({ ok: true, payments });
});

app.post(
  "/api/billing",
  verifyToken,
  requireRole("Admin", "Staff"),
  async (req, res) => {
    const payment = await Billing.create(req.body);
    res.json({ ok: true, payment });
  }
);

/* ================= MAINTENANCE ================= */

app.get("/api/maintenance", verifyToken, async (req, res) => {
  const requests = await Maintenance.find().sort({ createdAt: -1 });
  res.json({ ok: true, requests });
});

/* ================= REPORTS (FIXED) ================= */

app.get("/api/reports", verifyToken, async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const totalResidents = await Resident.countDocuments();
    const totalRevenue = await Billing.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);

    res.json({
      ok: true,
      report: {
        totalRooms,
        totalResidents,
        revenue: totalRevenue[0]?.sum || 0,
      },
    });
  } catch {
    res.status(500).json({ ok: false, error: "Reports error" });
  }
});

/* ================= HEALTH ================= */

app.get("/wake", (req, res) => res.send("awake"));
app.get("/", (req, res) => res.send("Hostel API Running"));

/* ================= START ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
