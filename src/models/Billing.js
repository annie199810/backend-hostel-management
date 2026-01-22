const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema(
  {
    invoiceNo: String,
    residentName: { type: String, required: true },
    residentId: String,
    roomNumber: { type: String, required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["Paid", "Pending", "Overdue"],
      default: "Pending",
    },

    method: { type: String, default: "Cash" },
    dueDate: String,
    paidOn: String,
    notes: String,
    meta: Object,

   
    reminderCount: { type: Number, default: 0 },
    lastReminderAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Billing", billingSchema);
