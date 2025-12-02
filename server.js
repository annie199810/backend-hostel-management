
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


let rooms = [
  {
    id: "101",
    number: "101",
    type: "single",
    status: "available",
    pricePerMonth: 5000,
    occupants: []
  },
  {
    id: "102",
    number: "102",
    type: "double",
    status: "occupied",
    pricePerMonth: 8000,
    occupants: [{ name: "Alice" }]
  },
  {
    id: "103",
    number: "103",
    type: "single",
    status: "maintenance",
    pricePerMonth: 4500,
    occupants: []
  }
];


let residents = [
  {
    id: 1,
    name: "Alice",
    room: "101",
    phone: "9999999999",
    status: "Active",
    checkIn: "2024-01-10"
  },
  {
    id: 2,
    name: "Bob",
    room: "102",
    phone: "8888888888",
    status: "Active",
    checkIn: "2024-01-15"
  },
  {
    id: 3,
    name: "Charlie",
    room: "103",
    phone: "7777777777",
    status: "Checked-out",
    checkIn: "2023-12-20"
  }
];


let maintenance = [
  {
    id: 1,
    room: "101",
    issue: "Leaking tap",
    type: "Plumbing",
    priority: "Medium",
    status: "Open",
    reportedBy: "Alice",
    reportedOn: "2024-01-18"
  },
  {
    id: 2,
    room: "102",
    issue: "AC not cooling",
    type: "Electrical",
    priority: "High",
    status: "In-progress",
    reportedBy: "Bob",
    reportedOn: "2024-01-19"
  }
];


let payments = [
  {
    id: 1,
    resident: "Alice",
    room: "101",
    month: "Jan 2025",
    dueDate: "2025-01-10",
    amount: 5000,
    status: "Paid",
    method: "UPI",
    paidOn: "2025-01-08"
  },
  {
    id: 2,
    resident: "Bob",
    room: "102",
    month: "Jan 2025",
    dueDate: "2025-01-10",
    amount: 8000,
    status: "Pending",
    method: "",
    paidOn: ""
  }
];


let users = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@hostel.com",
    role: "Administrator",
    status: "Active",
    lastLogin: "2024-01-20"
  },
  {
    id: 2,
    name: "Staff Member",
    email: "staff@hostel.com",
    role: "Staff",
    status: "Active",
    lastLogin: "2024-01-19"
  }
];



app.get("/api/rooms", (req, res) => {
  res.json({ rooms });
});

app.post("/api/rooms", (req, res) => {
  const body = req.body || {};
  if (!body.number || !body.pricePerMonth) {
    return res.status(400).json({ message: "number and pricePerMonth required" });
  }

  const room = {
    id: body.id || String(Date.now()),
    number: String(body.number),
    type: body.type || "single",
    status: body.status || "available",
    pricePerMonth: Number(body.pricePerMonth) || 0,
    occupants: body.occupants || []
  };

  rooms.push(room);
  res.status(201).json(room);
});

app.put("/api/rooms/:id", (req, res) => {
  const id = req.params.id;
  const idx = rooms.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ message: "Room not found" });

  rooms[idx] = { ...rooms[idx], ...req.body };
  res.json(rooms[idx]);
});

app.delete("/api/rooms/:id", (req, res) => {
  const id = req.params.id;
  const before = rooms.length;
  rooms = rooms.filter(r => r.id !== id);
  if (rooms.length === before) {
    return res.status(404).json({ message: "Room not found" });
  }
  res.json({ success: true });
});



app.get("/api/residents", (req, res) => {
  res.json({ residents });
});

app.post("/api/residents", (req, res) => {
  const body = req.body || {};
  if (!body.name) {
    return res.status(400).json({ message: "name required" });
  }
  const nextId = residents.reduce((m, r) => (r.id > m ? r.id : m), 0) + 1;
  const resident = {
    id: nextId,
    name: body.name,
    room: body.room || "",
    phone: body.phone || "",
    status: body.status || "Active",
    checkIn: body.checkIn || new Date().toISOString().slice(0, 10)
  };
  residents.push(resident);
  res.status(201).json(resident);
});

app.put("/api/residents/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = residents.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ message: "Resident not found" });

  residents[idx] = { ...residents[idx], ...req.body };
  res.json(residents[idx]);
});

app.delete("/api/residents/:id", (req, res) => {
  const id = Number(req.params.id);
  residents = residents.filter(r => r.id !== id);
  res.json({ success: true });
});



app.get("/api/maintenance", (req, res) => {
  res.json({ maintenance });
});



app.get("/api/payments", (req, res) => {
  res.json({ payments });
});



app.get("/api/users", (req, res) => {
  res.json({ users });
});

app.listen(PORT, () => {
  console.log("Hostel API running on http://localhost:" + PORT);
});
