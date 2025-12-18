
module.exports = function requireRole(...allowedRoles) {
  return function (req, res, next) {
    const user = req.user || {};
    if (!user || !user.role) {
      return res.status(401).json({ ok: false, error: "Authentication required" });
    }

    const userRole = String(user.role).toLowerCase();

    const ok = allowedRoles.some((r) => String(r).toLowerCase() === userRole);
    if (!ok) {
      return res.status(403).json({ ok: false, error: "Insufficient permissions" });
    }

    next();
  };
};
