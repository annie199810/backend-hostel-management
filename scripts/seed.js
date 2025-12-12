
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/models/User"); 

async function run() {
  try {
    console.log("Connecting to Mongo...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected!");

    const email = "admin@hostel.com";
    const existing = await User.findOne({ email });

    if (existing) {
      console.log("Admin already exists:", email);
      process.exit(0);
    }

    const hashed = await bcrypt.hash("admin123", 10);

    await User.create({
      name: "Admin User",
      email,
      password: hashed,
      role: "Admin",
      status: "Active",
    });

    console.log("Seeded admin:", email);
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

run();
