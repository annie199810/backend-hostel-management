const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  amount: { type: Number, required: true },
  method: { type: String }, 
  providerPaymentId: { type: String }, 
  providerOrderId: { type: String }, 
  status: { type: String, default: 'Success' }, 
  meta: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
