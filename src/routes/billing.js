const express = require("express");
const Billing = require("../models/Billing");
const validateBilling = require("../middleware/validateBilling");

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const payments = await Billing.find().sort({ createdAt: -1 });
    return res.json({ ok: true, payments });
  } catch (err) {
    console.error("GET /api/billing error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to load billing records",
    });
  }
});


router.post("/", validateBilling, async (req, res) => {
  try {
    const payment = await Billing.create(req.body);
    return res.status(201).json({ ok: true, payment });
  } catch (err) {
    console.error("POST /api/billing error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to create payment",
    });
  }
});


router.put("/:id", validateBilling, async (req, res) => {
  try {
    const updated = await Billing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        ok: false,
        error: "Payment not found",
      });
    }

    return res.json({ ok: true, payment: updated });
  } catch (err) {
    console.error("PUT /api/billing error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to update payment",
    });
  }
});


router.patch("/:id/pay", async (req, res) => {
  try {
    const updated = await Billing.findByIdAndUpdate(
      req.params.id,
      {
        status: "Paid",
        paidOn: new Date().toISOString().slice(0, 10),
        method: req.body.method || "Manual",
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        ok: false,
        error: "Payment not found",
      });
    }

    return res.json({ ok: true, payment: updated });
  } catch (err) {
    console.error("PATCH /api/billing/:id/pay error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to mark payment as paid",
    });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Billing.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: "Payment not found",
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/billing error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to delete payment",
    });
  }
});


router.patch("/:id/remind", async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        ok: false,
        error: "Billing record not found",
      });
    }

    // 🚫 Block reminder if already paid
    if (bill.status === "Paid") {
      return res.status(400).json({
        ok: false,
        error: "Payment already completed. Reminder not allowed.",
      });
    }

    bill.reminderCount = (bill.reminderCount || 0) + 1;
    bill.lastReminderAt = new Date();

    await bill.save();

    console.log("🔔 Reminder sent to:", bill.residentName);

    res.json({
      ok: true,
      message: "Payment reminder sent successfully",
      reminderCount: bill.reminderCount,
      lastReminderAt: bill.lastReminderAt,
    });
  } catch (err) {
    console.error("REMINDER ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to send reminder",
    });
  }
});

module.exports = router;
