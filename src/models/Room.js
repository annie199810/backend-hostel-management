
const mongoose = require("mongoose");

var RoomSchema = new mongoose.Schema(
  {
    number: { type: String, required: true },
    type: { type: String, default: "single" },      
    status: { type: String, default: "available" }, 
    pricePerMonth: { type: Number, required: true },
    occupants: [
      {
        residentId: String,
        name: String,
        checkIn: String, 
      },
    ],
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Room", RoomSchema);
