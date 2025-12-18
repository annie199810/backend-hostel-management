const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ number: 1 });
    res.json({ ok: true, rooms });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to load rooms" });
  }
});

module.exports = router;
