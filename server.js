

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


const userRoutes = require("./routes/users");

const app = express();



const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const corsOptions = {
  origin: [CLIENT_ORIGIN, "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());



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

  if (!token) {
    return res.status(401).json({ ok: false, error: "Missing token" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}



async function ensureDefaultAdmin() {
  try {
    const email = "admin@hostel.com";
    const exists = await User.findOne({ email });

    if (!exists) {
      const hashed = await hashPassword("admin123");
      await User.create({
        name: "Admin User",
        email,
        password: hashed,
        role: "Admin",
      });
      console.log("Seeded default admin user:", email);
    }
  } catch (err) {
    console.error("ensureDefaultAdmin error:", err);
  }
}



mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await ensureDefaultAdmin();
  })
  .catch((err) => console.error("MongoDB Error:", err));



app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role = "Staff" } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res
        .status(409)
        .json({ ok: false, error: "Email already exists" });
    }

    const hashed = await hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role,
    });

    res.json({ ok: true, user: safeUser(user), token: createToken(user) });
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    res.status(500).json({ ok: false, error: "Register failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email and password are required.",
      });
    }

    const u = await User.findOne({ email: email.toLowerCase() });

    
    if (!u || !u.password) {
      return res.status(401).json({ ok: false, error: "Invalid login" });
    }

    const match = await bcrypt.compare(password, u.password);
    if (!match) {
      return res.status(401).json({ ok: false, error: "Invalid login" });
    }

    return res.json({
      ok: true,
      user: safeUser(u),
      token: createToken(u),
    });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Login failed due to a server error." });
  }
});

app.get("/api/me", verifyToken, async (req, res) => {
  try {
    const u = await User.findById(req.user.id);
    if (!u) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }
    res.json({ ok: true, user: safeUser(u) });
  } catch (err) {
    console.error("GET /api/me error:", err);
    res.status(500).json({ ok: false, error: "Failed to load profile" });
  }
});



app.use("/api/users", userRoutes);



app.get("/api/billing", async (req, res) => {
  try {
    const data = await Billing.find().sort({ createdAt: -1 });
    res.json({ ok: true, payments: data });
  } catch (err) {
    console.error("GET /api/billing error:", err);
    res.status(500).json({ ok: false, error: "Failed to load billing" });
  }
});

app.post("/api/billing", async (req, res) => {
  try {
    const { residentName, roomNumber, amount, month } = req.body || {};

    if (!residentName || !roomNumber || amount == null || !month) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

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
    console.error("POST /api/billing error:", err);
    res.status(500).json({ ok: false, error: "Failed to create payment" });
  }
});

app.patch("/api/billing/:id/pay", async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await Billing.findByIdAndUpdate(
      id,
      {
        status: "Paid",
        paidOn: new Date().toISOString().slice(0, 10),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }

    res.json({ ok: true, payment: updated });
  } catch (err) {
    console.error("PATCH /api/billing/:id/pay error:", err);
    res.status(500).json({ ok: false, error: "Failed to update" });
  }
});



app.get("/api/maintenance", async (req, res) => {
  try {
    const data = await Maintenance.find().sort({ createdAt: -1 });
    res.json({ ok: true, requests: data });
  } catch (err) {
    console.error("GET /api/maintenance error:", err);
    res.status(500).json({ ok: false, error: "Failed to load maintenance" });
  }
});

app.post("/api/maintenance", async (req, res) => {
  try {
    const { roomNumber, issue } = req.body || {};

    const doc = await Maintenance.create({
      roomNumber,
      issue,
      type: req.body.type || "Others",
      priority: req.body.priority || "Medium",
      status: req.body.status || "Open",
      reportedOn: new Date().toISOString().slice(0, 10),
    });

    res.json({ ok: true, request: doc });
  } catch (err) {
    console.error("POST /api/maintenance error:", err);
    res.status(500).json({ ok: false, error: "Failed to create request" });
  }
});



app.get("/api/residents", async (_, res) => {
  try {
    const data = await Resident.find().sort({ createdAt: -1 });
    res.json({ ok: true, residents: data });
  } catch (err) {
    console.error("GET /api/residents error:", err);
    res.status(500).json({ ok: false, error: "Failed to load residents" });
  }
});

app.post("/api/residents", async (req, res) => {
  try {
    const doc = await Resident.create({
      name: req.body.name,
      roomNumber: req.body.roomNumber,
      phone: req.body.phone,
      status: "active",
      checkIn: new Date().toISOString().slice(0, 10),
    });

    res.json({ ok: true, resident: doc });
  } catch (err) {
    console.error("POST /api/residents error:", err);
    res.status(500).json({ ok: false, error: "Failed to create resident" });
  }
});



app.get("/api/rooms", async (_, res) => {
  try {
    const data = await Room.find().sort({ number: 1 });
    res.json({ ok: true, rooms: data });
  } catch (err) {
    console.error("GET /api/rooms error:", err);
    res.status(500).json({ ok: false, error: "Failed to load rooms" });
  }
});



app.get("/", (req, res) => res.send("Hostel API Running"));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
