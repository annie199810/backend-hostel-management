export function validateBilling(req, res, next) {
  const { residentName, roomNumber, amount, month } = req.body;

  if (!residentName || !roomNumber || !amount || !month) {
    return res.status(400).json({ ok: false, error: "Missing required billing fields" });
  }

  next();
}
