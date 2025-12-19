const express = require("express");
const Resident = require("../models/Resident");
const Room = require("../models/Room");

const router = express.Router();

/* ------------------ Helpers ------------------ */

async function removeFromRoom(roomNumber, residentId) {
  if (!roomNumber) return;

  const room = await Room.findOne({ number: roomNumber });
  if (!room) return;

  room.occupants = (room.occupants || []).filter(function (occ) {
    return String(occ.residentId) !== String(residentId);
  });

  if (!room.occupants.length) {
    room.status = "available";
  }

  await room.save();
}

async function addToRoom(roomNumber, resident) {
  if (!roomNumber || !resident) return;

  const room = await Room.findOne({ number: roomNumber });
  if (!room) return;

  const alreadyExists = (room.occupants || []).some(function (occ) {
    return String(occ.residentId) === String(resident._id);
  });

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

/* ------------------ GET ALL ------------------ */

router.get("/", async function (req, res) {
  try {
    const residents = await Resident.find().sort({ createdAt: -1 });
    return res.json({ ok: true, residents });
  } catch (err) {
    console.error("GET /api/residents error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to load residents" });
  }
});

/* ------------------ CREATE ------------------ */

router.post("/", async function (req, res) {
  try {
    const { name, roomNumber, phone, status } = req.body || {};

    if (!name || !roomNumber || !phone) {
      return res.status(400).json({
        ok: false,
        error: "Name, room number and phone are required.",
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    const resident = await Resident.create({
      name,
      roomNumber,
      phone,
      status: status || "active",
      checkIn: today,
    });

    if ((resident.status || "active") === "active") {
      await addToRoom(roomNumber, resident);
    }

    return res.status(201).json({ ok: true, resident });
  } catch (err) {
    console.error("POST /api/residents error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to create resident" });
  }
});

/* ------------------ UPDATE (FIXED) ------------------ */

router.put("/:id", async function (req, res) {
  try {
    const id = req.params.id;
    const body = req.body || {};

    const existing = await Resident.findById(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Resident not found" });
    }

    const update = {};
    if (body.name != null) update.name = body.name;
    if (body.phone != null) update.phone = body.phone;
    if (body.roomNumber != null) update.roomNumber = body.roomNumber;
    if (body.status != null) update.status = body.status;

    const updated = await Resident.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    /* ✅ SAFE ROOM SYNC */
    try {
      if (existing.roomNumber !== updated.roomNumber) {
        await removeFromRoom(existing.roomNumber, id);

        if ((updated.status || "active") === "active" && updated.roomNumber) {
          await addToRoom(updated.roomNumber, updated);
        }
      }
    } catch (e) {
      console.warn("Room sync warning:", e);
    }

    return res.json({
      ok: true,
      resident: updated,
      message: "Resident updated successfully",
    });
  } catch (err) {
    console.error("PUT /api/residents/:id error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to update resident" });
  }
});

/* ------------------ DELETE ------------------ */

router.delete("/:id", async function (req, res) {
  try {
    const id = req.params.id;

    const existing = await Resident.findById(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Resident not found" });
    }

    await Resident.findByIdAndDelete(id);

    try {
      await removeFromRoom(existing.roomNumber, id);
    } catch (e) {
      console.warn("Room cleanup warning:", e);
    }

    return res.json({
      ok: true,
      message: "Resident deleted successfully",
    });
  } catch (err) {
    console.error("DELETE /api/residents/:id error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to delete resident" });
  }
});

module.exports = router;
