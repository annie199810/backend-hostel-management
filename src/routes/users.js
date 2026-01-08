const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const requireRole = require("../middleware/requireRole");

const router = express.Router();


function safeUser(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}


router.get(
  "/",
  verifyToken,
  requireRole("Admin"),
  async (req, res) => {
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
        error: "Unable to fetch users",
      });
    }
  }
);


router.post(
  "/",
  verifyToken,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const { name, email, password, role, status } = req.body || {};

      if (!name || !email || !password) {
        return res.status(400).json({
          ok: false,
          error: "Name, email and password are required",
        });
      }

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({
          ok: false,
          error: "User with this email already exists",
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
        message: "User created successfully",
      });
    } catch (err) {
      console.error("POST /api/users error:", err);
      res.status(500).json({
        ok: false,
        error: "Unable to create user",
      });
    }
  }
);


router.put(
  "/:id",
  verifyToken,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role, status, password } = req.body || {};

      const update = {};

      if (name != null) update.name = name;
      if (email != null) update.email = email.toLowerCase();
      if (role != null) update.role = role;
      if (status != null) update.status = status;

      if (password && password.trim() !== "") {
        update.password = await bcrypt.hash(password, 10);
      }

      if (email) {
        const exists = await User.findOne({
          email: email.toLowerCase(),
          _id: { $ne: id },
        });
        if (exists) {
          return res.status(409).json({
            ok: false,
            error: "Email already in use",
          });
        }
      }

      const user = await User.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        return res.status(404).json({
          ok: false,
          error: "User not found",
        });
      }

      res.json({
        ok: true,
        user: safeUser(user),
        message: "User updated successfully",
      });
    } catch (err) {
      console.error("PUT /api/users/:id error:", err);
      res.status(500).json({
        ok: false,
        error: "Unable to update user",
      });
    }
  }
);


router.delete(
  "/:id",
  verifyToken,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await User.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({
          ok: false,
          error: "User not found",
        });
      }

      res.json({
        ok: true,
        message: "User deleted successfully",
      });
    } catch (err) {
      console.error("DELETE /api/users/:id error:", err);
      res.status(500).json({
        ok: false,
        error: "Unable to delete user",
      });
    }
  }
);

module.exports = router;