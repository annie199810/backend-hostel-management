
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); 

const router = express.Router();

function safeUser(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}

router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({
      ok: true,
      users: users.map(safeUser),
    });
  } catch (err) {
    console.error("GET /api/users error:", err);
    res.status(500).json({
      ok: false,
      error: "Unable to fetch user list. Please try again later.",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Name, email and password are required.",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        ok: false,
        error: "A user with this email already exists.",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hash,
      role: role || "Staff",
      status: status || "Active",
    });

    res.status(201).json({
      ok: true,
      user: safeUser(user),
      message: "User has been created successfully.",
    });
  } catch (err) {
    console.error("POST /api/users error:", err);
    res.status(500).json({
      ok: false,
      error: "Unable to create user. Please try again later.",
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body || {};

    const update = {};
    if (name != null) update.name = name;
    if (email != null) update.email = email.toLowerCase();
    if (role != null) update.role = role;
    if (status != null) update.status = status;

    const user = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "User not found.",
      });
    }

    res.json({
      ok: true,
      user: safeUser(user),
      message: "User details have been updated successfully.",
    });
  } catch (err) {
    console.error("PATCH /api/users/:id error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        ok: false,
        error: "A user with this email already exists.",
      });
    }

    res.status(500).json({
      ok: false,
      error: "Unable to update user. Please try again later.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: "User not found.",
      });
    }

    res.json({
      ok: true,
      message: "User has been removed successfully.",
    });
  } catch (err) {
    console.error("DELETE /api/users/:id error:", err);
    res.status(500).json({
      ok: false,
      error: "Unable to delete user. Please try again later.",
    });
  }
});

module.exports = router;
