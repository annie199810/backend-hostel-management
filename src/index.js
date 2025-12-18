require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const residentRoutes = require("./routes/residents");
const billingRoutes = require("./routes/billing");
const maintenanceRoutes = require("./routes/maintenance");
const userRoutes = require("./routes/users");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://hostelmanagementttt.netlify.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("Mongo error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Hostel Management API Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
