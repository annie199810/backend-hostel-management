
const mongoose = require("mongoose");

var UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    role: { type: String, default: "Staff" },   
    status: { type: String, default: "Active" } 
  },
  {
    timestamps: true 
  }
);

module.exports = mongoose.model("User", UserSchema);
