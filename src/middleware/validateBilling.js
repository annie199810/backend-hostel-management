function validateBilling(req, res, next) {
  const { residentName, roomNumber, amount, month } = req.body;

  if (!residentName || !roomNumber || amount == null || !month) {
    return res.status(400).json({
      ok: false,
      error: "Missing required billing fields",
    });
  }

  if (Number(amount) <= 0) {
    return res.status(400).json({
      ok: false,
      error: "Amount must be greater than zero",
    });
  }

  next();
}

module.exports = validateBilling;
