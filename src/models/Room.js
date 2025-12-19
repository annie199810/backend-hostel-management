const mongoose = require("mongoose");

const OccupantSchema = new mongoose.Schema(
  {
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    name: String,
    checkIn: String,
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
    },
    ac: {
      type: String,
      enum: ["AC", "NON"],
      default: "NON",
    },
    pricePerMonth: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "occupied"],
      default: "available",
    },
    occupants: {
      type: [OccupantSchema], // ✅ THIS IS THE FIX
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", RoomSchema);
