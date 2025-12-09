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

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const corsOptions = {
  origin: [
    CLIENT_ORIGIN,
    "http://127.0.0.1:5173",
    "https://hostelmanagementttt.netlify.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
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

async function ensureDefaultAdmin() {
  try {
    const email = "admin@hostel.com";
    const existing = await User.findOne({ email: email.toLowerCase() });

    if (!existing) {
      const hashed = await hashPassword("admin123");
      await User.create({
        name: "Admin User",
        email: email.toLowerCase(),
        password: hashed,
        role: "Admin",
        status: "Active",
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
      status: "Active",
    });

    return res.json({
      ok: true,
      user: safeUser(user),
      token: createToken(user),
    });
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    return res.status(500).json({ ok: false, error: "Register failed" });
  }
});

app.use("/api/auth", authRoutes);

app.get("/api/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }
    return res.json({ ok: true, user: safeUser(user) });
  } catch (err) {
    console.error("GET /api/me error:", err);
    return res.status(500).json({ ok: false, error: "Failed to load profile" });
  }
});



app.use("/api/users", userRoutes);



app.post("/api/payments", async (req, res) => {
  try {
    console.log("Received payment payload:", req.body);
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/payments error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to record payment" });
  }
});



app.get("/api/billing", async (req, res) => {
  try {
    const data = await Billing.find().sort({ createdAt: -1 });
    return res.json({ ok: true, payments: data });
  } catch (err) {
    console.error("GET /api/billing error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to load billing" });
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

    return res.json({ ok: true, payment: doc });
  } catch (err) {
    console.error("POST /api/billing error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to create payment" });
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

    return res.json({ ok: true, payment: updated });
  } catch (err) {
    console.error("PATCH /api/billing/:id/pay error:", err);
    return res.status(500).json({ ok: false, error: "Failed to update" });
  }
});



app.get("/api/maintenance", async (req, res) => {
  try {
    const data = await Maintenance.find().sort({ createdAt: -1 });
    return res.json({ ok: true, requests: data });
  } catch (err) {
    console.error("GET /api/maintenance error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to load maintenance" });
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

    return res.json({ ok: true, request: doc });
  } catch (err) {
    console.error("POST /api/maintenance error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to create request" });
  }
});



app.get("/api/residents", async (req, res) => {
  try {
    const data = await Resident.find().sort({ createdAt: -1 });
    return res.json({ ok: true, residents: data });
  } catch (err) {
    console.error("GET /api/residents error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to load residents" });
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

    return res.json({ ok: true, resident: doc });
  } catch (err) {
    console.error("POST /api/residents error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to create resident" });
  }
});


app.get("/api/rooms", async (req, res) => {
  try {
    const data = await Room.find().sort({ number: 1 });
    return res.json({ ok: true, rooms: data });
  } catch (err) {
    console.error("GET /api/rooms error:", err);
    return res.status(500).json({ ok: false, error: "Failed to load rooms" });
  }
});


app.post("/api/rooms", verifyToken, async (req, res) => {
  try {
    const { number, type, status, pricePerMonth } = req.body || {};

    if (!number || pricePerMonth == null) {
      return res
        .status(400)
        .json({ ok: false, error: "Room number and price are required" });
    }

    const existing = await Room.findOne({ number: String(number) });
    if (existing) {
      return res
        .status(409)
        .json({ ok: false, error: "A room with this number already exists" });
    }

    const room = await Room.create({
      number: String(number),
      type: type || "single",
      status: status || "available",
      pricePerMonth: Number(pricePerMonth),
      occupants: [],
    });

    return res.status(201).json({ ok: true, room });
  } catch (err) {
    console.error("POST /api/rooms error:", err);
    return res.status(500).json({ ok: false, error: "Failed to create room" });
  }
});


app.put("/api/rooms/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { number, type, status, pricePerMonth } = req.body || {};

    const update = {};
    if (number != null) update.number = String(number);
    if (type != null) update.type = type;
    if (status != null) update.status = status;
    if (pricePerMonth != null) update.pricePerMonth = Number(pricePerMonth);

   
    if (number != null) {
      const clash = await Room.findOne({
        number: String(number),
        _id: { $ne: id },
      });
      if (clash) {
        return res.status(409).json({
          ok: false,
          error: "Another room with this number already exists",
        });
      }
    }

    const room = await Room.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!room) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    return res.json({ ok: true, room });
  } catch (err) {
    console.error("PUT /api/rooms/:id error:", err);
    return res.status(500).json({ ok: false, error: "Failed to update room" });
  }
});


app.delete("/api/rooms/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByIdAndDelete(id);

    if (!room) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    return res.json({ ok: true, message: "Room deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/rooms/:id error:", err);
    return res.status(500).json({ ok: false, error: "Failed to delete room" });
  }
});



app.get("/", (req, res) => res.send("Hostel API Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
