
const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: false, unique: false }, 
  residentName: { type: String, required: true },
  residentId: { type: String, required: false },
  roomNumber: { type: String, required: false },
  month: { type: String, required: false },
  amount: { type: Number, required: true, default: 0 },
  status: { type: String, default: 'Pending' }, 
  method: { type: String, default: 'Cash' },
  dueDate: { type: String, default: '' }, 
  paidOn: { type: String, default: '' },  
  notes: { type: String, default: '' },
  meta: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Billing', billingSchema);
