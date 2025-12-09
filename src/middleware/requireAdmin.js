export function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    if (req.user.role !== "Admin") {
      return res.status(403).json({ ok: false, error: "Access denied: Admins only" });
    }

    next();
  } catch (err) {
    res.status(500).json({ ok: false, error: "Server error" });
  }
}
