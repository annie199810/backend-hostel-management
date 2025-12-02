const mongoose = require("mongoose");

const ResidentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    roomNumber: { type: String, trim: true },
    phone: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "checked-out"],
      default: "active",
    },
    checkIn: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resident", ResidentSchema);
