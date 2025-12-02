
const mongoose = require("mongoose");

const BillingSchema = new mongoose.Schema(
  {
    residentName: { type: String, required: true }, 
    roomNumber:   { type: String, required: true }, 
    amount:       { type: Number, required: true }, 
    month:        { type: String, required: true }, 

    status: { type: String, default: "Pending" },   
    method: { type: String, default: "Cash" },      

    dueDate: { type: String },  
    paidOn:  { type: String },  
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Billing", BillingSchema);
