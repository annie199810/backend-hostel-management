const express = require("express");
const Resident = require("../models/Resident");
const Room = require("../models/Room");

const router = express.Router();

/* ---------------- ROOM HELPERS ---------------- */

async function removeFromRoom(roomNumber, residentId) {
  if (!roomNumber) return;

  const room = await Room.findOne({ number: String(roomNumber) });
  if (!room) return;

  room.occupants = (room.occupants || []).filter(
    (o) => String(o.residentId) !== String(residentId)
  );

  if (room.occupants.length === 0) {
    room.status = "available";
  }

  await room.save();
}

async function addToRoom(roomNumber, resident) {
  if (!roomNumber || !resident) return;

  const room = await Room.findOne({ number: String(roomNumber) });
  if (!room) return;

  const exists = (room.occupants || []).some(
    (o) => String(o.residentId) === String(resident._id)
  );

  if (!exists) {
    room.occupants.push({
      residentId: String(resident._id),
      name: resident.name,
      checkIn: resident.checkIn,
    });
  }

  room.status = "occupied";
  await room.save();
}

/* ---------------- ROUTES ---------------- */

// GET all residents
router.get("/", async (req, res) => {
  try {
    const residents = await Resident.find().sort({ createdAt: -1 });
    res.json({ ok: true, residents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Failed to load residents" });
  }
});

// ADD resident
router.post("/", async (req, res) => {
  try {
    let { name, roomNumber, phone, status } = req.body;

    if (!name || !roomNumber || !phone) {
      return res.status(400).json({
        ok: false,
        error: "Name, room number and phone are required",
      });
    }

    roomNumber = String(roomNumber).trim();

    const today = new Date().toISOString().slice(0, 10);

    const resident = await Resident.create({
      name: String(name).trim(),
      roomNumber,
      phone: String(phone).trim(),
      status: status || "active",
      checkIn: today,
    });

    if (resident.status === "active") {
      await addToRoom(roomNumber, resident);
    }

    res.status(201).json({ ok: true, resident });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Failed to create resident" });
  }
});

// UPDATE resident  ⭐ FIXED
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let body = req.body || {};

    const existing = await Resident.findById(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Resident not found" });
    }

    if (body.roomNumber) {
      body.roomNumber = String(body.roomNumber).trim();
    }

    const updated = await Resident.findByIdAndUpdate(
      id,
      {
        name: body.name,
        phone: body.phone,
        status: body.status,
        roomNumber: body.roomNumber,
      },
      { new: true, runValidators: true }
    );

    // Room sync
    await removeFromRoom(existing.roomNumber, id);

    if (updated.status === "active") {
      await addToRoom(updated.roomNumber, updated);
    }

    res.json({
      ok: true,
      resident: updated,
      message: "Resident updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Failed to update resident" });
  }
});

// DELETE resident
router.delete("/:id", async (req, res) => {
  try {
    const existing = await Resident.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Resident not found" });
    }

    await Resident.findByIdAndDelete(req.params.id);
    await removeFromRoom(existing.roomNumber, req.params.id);

    res.json({ ok: true, message: "Resident deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Failed to delete resident" });
  }
});

module.exports = router;
