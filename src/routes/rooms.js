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
    const rooms = await Room.find({
      status: "available",
    }).select("number type ac capacity occupants status");

    res.json({
      ok: true,
      rooms,
    });
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
    const room = new Room(req.body);
    await room.save();
    res.json({ ok: true, room });
  } catch (err) {
    console.error("POST /rooms error", err);
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
