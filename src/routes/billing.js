const express = require("express");
const router = express.Router();

/**
 * GET /api/billing
 * Used by Dashboard
 */
router.get("/", async (req, res) => {
  try {
    // Mock billing data (enough for dashboard demo)
    const payments = [
      {
        _id: "1",
        amount: 5000,
        status: "Paid",
      },
      {
        _id: "2",
        amount: 3000,
        status: "Pending",
      },
    ];

    return res.json({ ok: true, payments });
  } catch (err) {
    console.error("GET /api/billing err", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * PATCH /api/billing/:id/pay
 */
router.patch("/:id/pay", async (req, res) => {
  try {
    const id = req.params.id;

    return res.json({
      ok: true,
      payment: {
        _id: id,
        status: "Paid",
        paidOn: new Date().toISOString().slice(0, 10),
      },
    });
  } catch (err) {
    console.error("PATCH /api/billing/:id/pay err", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
