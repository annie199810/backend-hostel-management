const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String },
    residentName: { type: String, required: true },
    residentId: { type: String },
    roomNumber: { type: String, required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Overdue"],
      default: "Pending",
    },
    method: { type: String, default: "Cash" },
    dueDate: { type: String, default: "" },
    paidOn: { type: String, default: "" },
    notes: { type: String, default: "" },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Billing", billingSchema);
