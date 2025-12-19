const mongoose = require("mongoose");

const ResidentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    roomNumber: { type: String, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    checkIn: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resident", ResidentSchema);
