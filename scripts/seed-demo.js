
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {});

  const users = [
    { name: "Admin Demo", email: "admin@hostel.com", password: "admin123", role: "Admin", status: "Active" },
    { name: "Staff Demo", email: "staff@hostel.com", password: "staff1234", role: "Staff", status: "Active" },
    { name: "Resident Demo", email: "resident@hostel.com", password: "resident123", role: "Resident", status: "Active" }
  ];

  for (const u of users) {
    const exists = await User.findOne({ email: u.email.toLowerCase() });
    if (exists) {
      console.log("Already exists:", u.email);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({ name: u.name, email: u.email.toLowerCase(), password: hashed, role: u.role, status: u.status });
    console.log("Created:", u.email);
  }

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
