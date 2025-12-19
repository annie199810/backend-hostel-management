require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");


const roomRoutes = require("./routes/rooms");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const residentRoutes = require("./routes/residents");
const maintenanceRoutes = require("./routes/maintenance");
const billingRoutes = require("./routes/billing");
const paymentRoutes = require("./routes/payments");

const app = express();


app.use(
  cors({
    origin: "*", 
    credentials: true,
  })
);

app.use(express.json());


app.get("/", (req, res) => {
  res.send("✅ Hostel Management API running");
});


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/rooms", roomRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/payments", paymentRoutes);


app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Route not found",
  });
});


const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
