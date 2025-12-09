
function requireAdmin(req, res, next) {
 
  if (!req.user || req.user.role !== "Admin") {
    return res
      .status(403)
      .json({ ok: false, error: "Admin access required" });
  }
  next();
}

module.exports = requireAdmin;
