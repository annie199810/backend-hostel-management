

function requireAdmin(req, res, next) {

  const user = req.user || {};


  const role = user.role;
  const isAdmin =
    role === "Admin" ||
    role === "Administrator";

  if (!user || !isAdmin) {
    return res.status(403).json({
      ok: false,
      error: "Admin access required",
    });
  }

  next();
}

module.exports = requireAdmin;
