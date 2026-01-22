const express = require("express");
const Maintenance = require("../models/Maintenance");
const Room = require("../models/Room");

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const requests = await Maintenance.find().sort({ createdAt: -1 });
    res.json({
      ok: true,
      requests,
    });
  } catch (err) {
    console.error("GET /maintenance error:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to load maintenance requests",
    });
  }
});


router.post("/", async (req, res) => {
  try {
    const {
      roomNumber,
      issue,
      type,
      priority,
      status,
      reportedBy,
      reportedOn,
    } = req.body;

    if (!roomNumber || !issue) {
      return res.status(400).json({
        ok: false,
        error: "Room number and issue are required",
      });
    }

    
    const room = await Room.findOne({ number: String(roomNumber) });

    if (!room) {
      return res.status(400).json({
        ok: false,
        error: `Room ${roomNumber} does not exist`,
      });
    }

    const request = await Maintenance.create({
      roomNumber: String(roomNumber),
      issue,
      type: type || "Others",
      priority: priority || "Medium",
      status: status || "Open",
      reportedBy: reportedBy || "",
      reportedOn: reportedOn || new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({
      ok: true,
      request,
    });
  } catch (err) {
    console.error("POST /maintenance error:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to create maintenance request",
    });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const updated = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        ok: false,
        error: "Request not found",
      });
    }

    res.json({
      ok: true,
      request: updated,
    });
  } catch (err) {
    console.error("PUT /maintenance error:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to update request",
    });
  }
});


router.post("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({
      ok: true,
      request: updated,
    });
  } catch (err) {
    console.error("STATUS update error:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to update status",
    });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({
      ok: true,
      message: "Maintenance request deleted",
    });
  } catch (err) {
    console.error("DELETE /maintenance error:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to delete request",
    });
  }
});

module.exports = router;
