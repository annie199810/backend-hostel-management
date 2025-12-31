const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyToken = require("../middleware/auth"); 

const router = express.Router();


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    console.log("LOGIN ATTEMPT:", { email });

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Invalid email or password.",
      });
    }

    const ok = await bcrypt.compare(password, user.password || "");
    if (!ok) {
      return res.status(401).json({
        ok: false,
        error: "Invalid email or password.",
      });
    }

    const payload = {
      id: user._id,
      email: user.email,
      role: user.role || "Staff",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    return res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "Staff",
        status: user.status,
      },
    });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    return res.status(500).json({
      ok: false,
      error: "Login failed. Please try again later.",
    });
  }
});


router.get("/me", verifyToken, (req, res) => {
  return res.json({
    ok: true,
    user: req.user,
  });
});

module.exports = router;
