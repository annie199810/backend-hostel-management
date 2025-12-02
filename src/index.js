// index.js - paste/replace your existing server entry with this
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

const CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://johnshostel.netlify.app", 
  
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); 
    if (CLIENT_ORIGINS.indexOf(origin) !== -1) callback(null, true);
    else callback(null, true); 
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use(function (req, res, next) {
  console.log("[REQ]", req.method, req.url, "| Origin:", req.headers.origin || "(no origin)");
  next();
});


mongoose
  .connect(process.env.MONGO_URI)
  .then(function () {
    console.log("MongoDB Connected");
  })
  .catch(function (err) {
    console.error("MongoDB Error:", err);
  });


const JWT_SECRET = process.env.JWT_SECRET || "please_set_a_secret";

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

function createToken(user) {
  const payload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function safeUser(userDoc) {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  return user;
}

function verifyToken(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const match = String(auth).match(/^Bearer (.+)$/i);
  if (!match) {
    return res.status(401).json({ ok: false, error: "Missing auth token" });
  }
  const token = match[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
}


app.post("/api/auth/register", async function (req, res) {
  try {
    const body = req.body || {};
    const { name, email, password, role = "Staff", status = "Active" } = body;

    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, error: "Name, email and password are required" });
    }

    
    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) {
      return res.status(409).json({ ok: false, error: "Email already exists" });
    }

    const hashed = await hashPassword(String(password));
    const user = await User.create({
      name,
      email: String(email).toLowerCase(),
      password: hashed,
      role,
      status,
    });

    const token = createToken(user);
    res.status(201).json({ ok: true, user: safeUser(user), token });
  } catch (err) {
    console.error("Error in /api/auth/register:", err);
    res.status(500).json({ ok: false, error: "Failed to register user" });
  }
});


app.post("/api/auth/login", async function (req, res) {
  try {
    const body = req.body || {};
    const { email, password } = body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email and password required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(String(password), user.password || "");
    if (!ok) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const token = createToken(user);
    res.json({ ok: true, user: safeUser(user), token });
  } catch (err) {
    console.error("Error in /api/auth/login:", err);
    res.status(500).json({ ok: false, error: "Failed to login" });
  }
});


app.get("/api/me", verifyToken, async function (req, res) {
  try {
    const id = req.user && req.user.id;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });
    res.json({ ok: true, user: safeUser(user) });
  } catch (err) {
    console.error("Error /api/me:", err);
    res.status(500).json({ ok: false, error: "Failed to load user" });
  }
});


app.get("/api/users", async function (req, res) {
  try {
    var data = await User.find().sort({ createdAt: -1 });
    const users = data.map(safeUser);
    res.json({ ok: true, users: users });
  } catch (err) {
    console.error("Error loading users:", err);
    res.status(500).json({ ok: false, error: "Failed to load users" });
  }
});

app.post("/api/users", async function (req, res) {
  try {
    var body = req.body || {};
    var name = body.name;
    var email = body.email;
    var password = body.password;
    var role = body.role || "Staff";
    var status = body.status || "Active";

    if (!name || !email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Name, email and password are required",
      });
    }

    const hashed = await hashPassword(String(password));

    var user = await User.create({
      name: name,
      email: String(email).toLowerCase(),
      password: hashed,
      role: role,
      status: status,
    });

    res.status(201).json({ ok: true, user: safeUser(user) });
  } catch (err) {
    console.error("Error creating user:", err);

    if (err && err.code === 11000) {
      return res.status(409).json({ ok: false, error: "Email already exists" });
    }

    res.status(500).json({ ok: false, error: "Failed to create user" });
  }
});

app.put("/api/users/:id", async function (req, res) {
  try {
    var id = req.params.id;
    var body = req.body || {};
    var updates = {};

    if (body.name != null) updates.name = body.name;
    if (body.email != null) updates.email = String(body.email).toLowerCase();
    if (body.role != null) updates.role = body.role;
    if (body.status != null) updates.status = body.status;
    if (body.password) updates.password = await hashPassword(String(body.password));

    var user = await User.findByIdAndUpdate(id, updates, { new: true });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true, user: safeUser(user) });
  } catch (err) {
    console.error("Error updating user:", err);

    if (err && err.code === 11000) {
      return res.status(409).json({ ok: false, error: "Email already exists" });
    }

    res.status(500).json({ ok: false, error: "Failed to update user" });
  }
});

app.delete("/api/users/:id", async function (req, res) {
  try {
    var id = req.params.id;
    var deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ ok: false, error: "Failed to delete user" });
  }
});


app.get("/api/billing", async function (req, res) {
  try {
    var data = await Billing.find().sort({ createdAt: -1 });
    res.json({ ok: true, payments: data });
  } catch (err) {
    console.error("Error fetching billing records", err);
    res.status(500).json({ ok: false, error: "Failed to load billing records" });
  }
});

app.post("/api/billing", async function (req, res) {
  try {
    var body = req.body || {};
    var residentName = body.residentName;
    var roomNumber = body.roomNumber;
    var amount = body.amount;
    var month = body.month;

    if (!residentName || !roomNumber || amount == null || !month) {
      return res.status(400).json({
        ok: false,
        error: "Resident name, room, amount and month are required",
      });
    }

    var doc = await Billing.create({
      residentName: residentName,
      roomNumber: roomNumber,
      amount: amount,
      month: month,
      status: body.status || "Paid",
      method: body.method || "Cash",
      dueDate: body.dueDate || "",
      paidOn: body.paidOn || new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({ ok: true, payment: doc });
  } catch (err) {
    console.error("Error creating billing record", err);
    res.status(500).json({ ok: false, error: "Failed to create billing record" });
  }
});


app.get("/api/maintenance", async function (req, res) {
  try {
    var data = await Maintenance.find().sort({ createdAt: -1 });
    res.json({ ok: true, requests: data });
  } catch (err) {
    console.error("Error fetching maintenance requests", err);
    res.status(500).json({ ok: false, error: "Failed to load maintenance requests" });
  }
});

app.post("/api/maintenance", async function (req, res) {
  try {
    var body = req.body || {};
    var roomNumber = body.roomNumber;
    var issue = body.issue;

    if (!roomNumber || !issue) {
      return res.status(400).json({
        ok: false,
        error: "Room number and issue are required",
      });
    }

    var doc = await Maintenance.create({
      roomNumber: roomNumber,
      issue: issue,
      type: body.type || "Others",
      priority: body.priority || "Medium",
      status: body.status || "Open",
      reportedBy: body.reportedBy || "",
      reportedOn: body.reportedOn || new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({ ok: true, request: doc });
  } catch (err) {
    console.error("Error creating maintenance request", err);
    res.status(500).json({ ok: false, error: "Failed to create maintenance request" });
  }
});


app.get("/api/residents", async function (req, res) {
  try {
    var data = await Resident.find().sort({ createdAt: -1 });
    res.json({ ok: true, residents: data });
  } catch (err) {
    console.error("Error loading residents:", err);
    res.status(500).json({ ok: false, error: "Failed to load residents" });
  }
});

app.post("/api/residents", async function (req, res) {
  try {
    var body = req.body || {};
    var name = body.name;
    var roomNumber = body.roomNumber;
    var phone = body.phone;
    var status = body.status || "active";
    var checkIn = body.checkIn || new Date().toISOString().slice(0, 10);

    if (!name) {
      return res.status(400).json({ ok: false, error: "Name is required" });
    }

    var newRes = await Resident.create({
      name: name,
      roomNumber: roomNumber,
      phone: phone,
      status: status,
      checkIn: checkIn,
    });

    res.status(201).json({ ok: true, resident: newRes });
  } catch (err) {
    console.error("Error creating resident:", err);
    res.status(500).json({ ok: false, error: "Failed to create resident" });
  }
});

app.put("/api/residents/:id", async function (req, res) {
  try {
    var id = req.params.id;
    var body = req.body || {};

    var updated = await Resident.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ ok: false, error: "Resident not found" });
    }

    res.json({ ok: true, resident: updated });
  } catch (err) {
    console.error("Error updating resident:", err);
    res.status(500).json({ ok: false, error: "Failed to update resident" });
  }
});

app.delete("/api/residents/:id", async function (req, res) {
  try {
    var id = req.params.id;

    var removed = await Resident.findByIdAndDelete(id);

    if (!removed) {
      return res.status(404).json({ ok: false, error: "Resident not found" });
    }

    res.json({ ok: true, message: "Resident deleted" });
  } catch (err) {
    console.error("Error deleting resident:", err);
    res.status(500).json({ ok: false, error: "Failed to delete resident" });
  }
});


app.get("/api/rooms", async function (req, res) {
  try {
    var data = await Room.find().sort({ number: 1 });
    res.json({ ok: true, rooms: data });
  } catch (err) {
    console.error("Error fetching rooms", err);
    res.status(500).json({ ok: false, error: "Failed to load rooms" });
  }
});

app.post("/api/rooms", async function (req, res) {
  try {
    var number = req.body.number;
    var type = req.body.type || "single";
    var status = req.body.status || "available";
    var pricePerMonth = req.body.pricePerMonth;

    if (!number || pricePerMonth == null) {
      return res.status(400).json({
        ok: false,
        error: "Room number and price required",
      });
    }

    var room = await Room.create({
      number: number,
      type: type,
      status: status,
      pricePerMonth: pricePerMonth,
      occupants: [],
    });

    res.status(201).json({ ok: true, room: room });
  } catch (err) {
    console.error("Error creating room", err);
    res.status(500).json({ ok: false, error: "Failed to create room" });
  }
});

app.post("/api/rooms/:id/assign", async function (req, res) {
  try {
    var id = req.params.id;
    var residentId = req.body.residentId;
    var checkInDate = req.body.checkInDate;

    var room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    var resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ ok: false, error: "Resident not found" });
    }

    var occupant = {
      residentId: residentId,
      name: resident.name,
      checkIn: checkInDate || new Date().toISOString(),
    };

    room.occupants.push(occupant);
    room.status = "occupied";

    await room.save();

    res.json({ ok: true, room: room });
  } catch (err) {
    console.error("Error assigning room", err);
    res.status(500).json({ ok: false, error: "Failed to assign room" });
  }
});

app.post("/api/rooms/:id/checkout", async function (req, res) {
  try {
    var id = req.params.id;

    var room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    room.occupants = [];
    room.status = "available";

    await room.save();

    res.json({ ok: true, room: room });
  } catch (err) {
    console.error("Error checking out room", err);
    res.status(500).json({ ok: false, error: "Failed to checkout room" });
  }
});

// Root
app.get("/", function (req, res) {
  res.send("Hostel Management API with MongoDB is running");
});

var PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
  console.log("Server running on port", PORT);
});
