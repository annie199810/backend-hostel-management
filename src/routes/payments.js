const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { invoiceId, amount, method, providerPaymentId } = req.body;

    const payment = {
      _id: String(Date.now()),
      invoiceId,
      amount,
      method: method || "Mock",
      providerPaymentId: providerPaymentId || null,
      status: "Success",
      createdAt: new Date().toISOString()
    };

    return res.json({ ok: true, payment });
  } catch (err) {
    console.error("POST /api/payments error", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
