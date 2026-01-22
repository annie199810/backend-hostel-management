const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const verifyToken = require("../middleware/auth");


router.get("/", verifyToken, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ number: 1 });
    res.json({ ok: true, rooms });
  } catch (err) {
    console.error("GET /rooms error", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});


router.get("/available", verifyToken, async (req, res) => {
  try {
    const rooms = await Room.find({ status: "available" }).select(
      "number type ac occupants status"
    );

    res.json({ ok: true, rooms });
  } catch (err) {
    console.error("GET /rooms/available error", err);
    res.status(500).json({
      ok: false,
      error: "Failed to load available rooms",
    });
  }
});


router.post("/", verifyToken, async (req, res) => {
  try {
    const { number, type, ac, pricePerMonth } = req.body;

    if (!number || !type || !pricePerMonth) {
      return res.status(400).json({
        ok: false,
        error: "Room number, type and price are required",
      });
    }

    
    const existingRoom = await Room.findOne({
      number: number.trim(),
    });

    if (existingRoom) {
      return res.status(400).json({
        ok: false,
        error: `Room ${number} already exists`,
      });
    }

    const room = new Room({
      number: number.trim(),
      type,
      ac,
      pricePerMonth,
      status: "available",
    });

    await room.save();

    res.status(201).json({ ok: true, room });
  } catch (err) {
    console.error("POST /rooms error", err);

    
    if (err.code === 11000) {
      return res.status(400).json({
        ok: false,
        error: "Room number already exists",
      });
    }

    res.status(500).json({ ok: false, error: "Server error" });
  }
});


router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({
        ok: false,
        error: "Room not found",
      });
    }

    res.json({ ok: true, room: updatedRoom });
  } catch (err) {
    console.error("PUT /rooms/:id error", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});


router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /rooms error", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
