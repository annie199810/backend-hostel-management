const express = require("express");
const Resident = require("../models/Resident");
const Room = require("../models/Room");

const router = express.Router();


async function removeFromRoom(roomNumber, residentId) {
  if (!roomNumber || !residentId) return;

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

  
  if (!room) {
    throw new Error("Room does not exist");
  }

  const alreadyExists = (room.occupants || []).some(
    (o) => String(o.residentId) === String(resident._id)
  );

  if (!alreadyExists) {
    room.occupants.push({
      residentId: String(resident._id),
      name: resident.name,
      checkIn: resident.checkIn,
    });
  }

  room.status = "occupied";
  await room.save();
}


router.get("/", async (req, res) => {
  try {
    const residents = await Resident.find().sort({ createdAt: -1 });
    return res.json({ ok: true, residents });
  } catch (err) {
    console.error("GET /api/residents error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to load residents",
    });
  }
});


router.post("/", async (req, res) => {
  try {
    let { name, roomNumber, phone, status } = req.body || {};

    if (!name || !roomNumber || !phone) {
      return res.status(400).json({
        ok: false,
        error: "Name, room number and phone are required",
      });
    }

    roomNumber = String(roomNumber).trim();

    
    const roomExists = await Room.findOne({ number: roomNumber });
    if (!roomExists) {
      return res.status(400).json({
        ok: false,
        error: "Selected room does not exist",
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    const resident = await Resident.create({
      name: String(name).trim(),
      roomNumber,
      phone: String(phone).trim(),
      status: status || "active",
      checkIn: today,
    });

    if ((resident.status || "active") === "active") {
      await addToRoom(roomNumber, resident);
    }

    return res.status(201).json({ ok: true, resident });
  } catch (err) {
    console.error("POST /api/residents error:", err.message);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to create resident",
    });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    const existing = await Resident.findById(id);
    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: "Resident not found",
      });
    }

    const update = {};
    if (body.name != null) update.name = body.name;
    if (body.roomNumber != null) update.roomNumber = String(body.roomNumber);
    if (body.phone != null) update.phone = body.phone;
    if (body.status != null) update.status = body.status;

    const updated = await Resident.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    
    try {
      await removeFromRoom(existing.roomNumber, id);

      if ((updated.status || "active") === "active" && updated.roomNumber) {
        await addToRoom(updated.roomNumber, updated);
      }
    } catch (e) {
      console.warn("PUT /api/residents room sync warning:", e.message);
    }

    return res.json({
      ok: true,
      resident: updated,
      message: "Resident updated successfully",
    });
  } catch (err) {
    console.error("PUT /api/residents error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to update resident",
    });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await Resident.findById(id);
    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: "Resident not found",
      });
    }

    await Resident.findByIdAndDelete(id);

    try {
      await removeFromRoom(existing.roomNumber, id);
    } catch (e) {
      console.warn("DELETE /api/residents room sync warning:", e.message);
    }

    return res.json({
      ok: true,
      message: "Resident deleted successfully",
    });
  } catch (err) {
    console.error("DELETE /api/residents error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to delete resident",
    });
  }
});

module.exports = router;
