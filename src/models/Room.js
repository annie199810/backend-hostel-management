const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    number: { type: String, required: true },
    type: { type: String, required: true }, // single / double
    ac: { type: String, enum: ["AC", "NON"], default: "NON" }, // 👈 IMPORTANT
    pricePerMonth: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },
    occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resident" }],
  },
  { timestamps: true }
);


module.exports = mongoose.model("Room", RoomSchema);
