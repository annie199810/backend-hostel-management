
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

const app = express();


const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const corsOptions = {
  origin: [CLIENT_ORIGIN, "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));


const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

function createToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function safeUser(u) {
  const obj = u.toObject();
  delete obj.password;
  return obj;
}

function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  if (!token) return res.status(401).json({ ok: false, error: "Missing token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}


app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role = "Staff" } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ ok: false, error: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ ok: false, error: "Email already exists" });

    const hashed = await hashPassword(password);
    const user = await User.create({ name, email, password: hashed, role });

    res.json({ ok: true, user: safeUser(user), token: createToken(user) });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Register failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const u = await User.findOne({ email });
    if (!u) return res.status(401).json({ ok: false, error: "Invalid login" });

    const match = await bcrypt.compare(password, u.password);
    if (!match)
      return res.status(401).json({ ok: false, error: "Invalid login" });

    res.json({ ok: true, user: safeUser(u), token: createToken(u) });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Login failed" });
  }
});


app.get("/api/billing", async (req, res) => {
  try {
    const data = await Billing.find().sort({ createdAt: -1 });
    res.json({ ok: true, payments: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to load billing" });
  }
});

app.post("/api/billing", async (req, res) => {
  try {
    const { residentName, roomNumber, amount, month } = req.body;

    if (!residentName || !roomNumber || amount == null || !month)
      return res.status(400).json({ ok: false, error: "Missing fields" });

    const doc = await Billing.create({
      residentName,
      roomNumber,
      amount,
      month,
      status: req.body.status || "Pending",
      method: req.body.method || "Cash",
      dueDate: req.body.dueDate || "",
      paidOn: req.body.paidOn || "",
      notes: req.body.notes || "",
      invoiceNo: req.body.invoiceNo || "",
    });

    res.json({ ok: true, payment: doc });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to create payment" });
  }
});


app.patch("/api/billing/:id/pay", async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await Billing.findByIdAndUpdate(
      id,
      { status: "Paid", paidOn: new Date().toISOString().slice(0, 10) },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ ok: false, error: "Not found" });

    res.json({ ok: true, payment: updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to update" });
  }
});


app.get("/api/maintenance", async (req, res) => {
  const data = await Maintenance.find().sort({ createdAt: -1 });
  res.json({ ok: true, requests: data });
});

app.post("/api/maintenance", async (req, res) => {
  const { roomNumber, issue } = req.body;
  const doc = await Maintenance.create({
    roomNumber,
    issue,
    type: req.body.type || "Others",
    priority: req.body.priority || "Medium",
    status: req.body.status || "Open",
    reportedOn: new Date().toISOString().slice(0, 10),
  });
  res.json({ ok: true, request: doc });
});


app.get("/api/residents", async (_, res) => {
  const data = await Resident.find().sort({ createdAt: -1 });
  res.json({ ok: true, residents: data });
});

app.post("/api/residents", async (req, res) => {
  const doc = await Resident.create({
    name: req.body.name,
    roomNumber: req.body.roomNumber,
    phone: req.body.phone,
    status: "active",
    checkIn: new Date().toISOString().slice(0, 10),
  });

  res.json({ ok: true, resident: doc });
});


app.get("/api/rooms", async (_, res) => {
  const data = await Room.find().sort({ number: 1 });
  res.json({ ok: true, rooms: data });
});


app.get("/", (req, res) => res.send("Hostel API Running"));


app.listen(process.env.PORT || 5000, () =>
  console.log("Server running on port", process.env.PORT || 5000)
);
