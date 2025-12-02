
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");


async function run() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not found in environment. Set MONGO_URI before running.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const email = "admin@hostel.com";
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log("Admin user already exists:", existing.email);
      await mongoose.disconnect();
      process.exit(0);
    }

    const password = "admin123"; 
    const hashed = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name: "Admin User",
      email: email.toLowerCase(),
      password: hashed,
      role: "Administrator",
      status: "Active",
    });

    console.log("Admin user created:", admin.email);
    console.log("Password (plain):", password);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    try { await mongoose.disconnect(); } catch(e) {}
    process.exit(1);
  }
}

run();
