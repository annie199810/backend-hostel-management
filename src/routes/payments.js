const express = require("express");
const Payment = require("../models/Payment");
const auth = require("../middleware/auth");

const router = express.Router();


router.put("/:id/pay", auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ ok: false, error: "Payment not found" });
    }

    payment.status = "Paid";
    payment.paidOn = new Date().toISOString().slice(0, 10);
    payment.method = req.body.method || "Manual";

    await payment.save();

    res.json({ ok: true, payment });
  } catch (err) {
    console.error("PAY ERROR:", err);
    res.status(500).json({ ok: false, error: "Payment update failed" });
  }
});


router.patch("/:id/remind", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        ok: false,
        error: "Payment not found",
      });
    }

    // 🚫 BLOCK if already paid
    if (payment.status === "Paid" || payment.status === "Success") {
      return res.status(400).json({
        ok: false,
        error: "Payment already paid. Reminder not allowed.",
      });
    }

    payment.reminderCount += 1;
    payment.lastReminderAt = new Date();

    await payment.save();

    return res.json({
      ok: true,
      message: "Payment reminder sent successfully",
      reminderCount: payment.reminderCount,
      lastReminderAt: payment.lastReminderAt,
    });
  } catch (err) {
    console.error("REMINDER ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to send payment reminder",
    });
  }
});


module.exports = router;
