const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  residentName: { type: String },
  roomNo: { type: String },
  amount: { type: Number, required: true },
  dueDate: { type: Date },
  status: { type: String, default: 'Pending' }, 
  meta: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
