
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());


const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5174';
app.use(cors({ origin: clientOrigin }));


const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  residentName: String,
  residentId: String,
  roomNo: String,
  amount: Number,
  dueDate: Date,
  status: { type: String, default: 'Pending' },
  meta: Object
}, { timestamps: true });

const paymentSchema = new mongoose.Schema({
  invoiceId: String,
  residentId: String,
  amount: Number,
  method: String,
  providerPaymentId: String,
  providerOrderId: String,
  status: String,
  meta: Object
}, { timestamps: true });

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);


async function connectDb() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hostel_db';
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Mongo connected');
  } catch (err) {
    console.error('Mongo connection error', err);
    
  }
}
connectDb();


app.get('/', (req, res) => {
  res.json({ ok: true, msg: 'Hostel server running' });
});


app.post('/api/payments', async (req, res) => {
  try {
    const { invoiceId, residentId, amount, method, providerPaymentId, providerOrderId, status, meta } = req.body;
    if (amount == null) return res.status(400).json({ ok: false, error: 'amount required' });

    const p = new Payment({ invoiceId, residentId, amount, method, providerPaymentId, providerOrderId, status, meta });
    await p.save();

    
    if (invoiceId && status && String(status).toLowerCase() === 'success') {
      try {
        if (mongoose.Types.ObjectId.isValid(invoiceId)) {
          await Invoice.findByIdAndUpdate(invoiceId, { status: 'Paid' });
        }
      } catch (e) {
        
      }
      await Invoice.findOneAndUpdate({ invoiceNo: invoiceId }, { status: 'Paid' });
    }

    return res.json({ ok: true, payment: p });
  } catch (err) {
    console.error('POST /api/payments err', err);
    return res.status(500).json({ ok: false, error: err.message || 'payments failed' });
  }
});


app.post('/api/invoices', async (req, res) => {
  try {
    const { residentName, residentId, roomNo, amount, dueDate, invoiceNo } = req.body;
    if (!residentName || amount == null) return res.status(400).json({ ok: false, error: 'missing fields' });

    const invNo = invoiceNo || `INV-${Date.now()}`;
    const inv = new Invoice({ invoiceNo: invNo, residentName, residentId, roomNo, amount, dueDate });
    await inv.save();
    return res.json({ ok: true, invoice: inv });
  } catch (err) {
    console.error('POST /api/invoices err', err);
    if (err.code === 11000) {
      return res.status(400).json({ ok: false, error: 'invoiceNo already exists' });
    }
    return res.status(500).json({ ok: false, error: err.message || 'invoices failed' });
  }
});


app.get('/api/billing', async (req, res) => {
  try {
    const rows = await Invoice.find().sort({ createdAt: -1 }).lean();
    const payments = rows.map((r) => ({
      _id: r._id,
      invoiceNo: r.invoiceNo,
      residentName: r.residentName,
      residentId: r.residentId,
      roomNumber: r.roomNo,
      amount: r.amount,
      dueDate: r.dueDate,
      status: r.status,
      notes: r.meta?.notes || ''
    }));
    res.json({ ok: true, payments });
  } catch (err) {
    console.error('GET /api/billing err', err);
    res.status(500).json({ ok: false, error: err.message || 'billing list failed' });
  }
});


app.patch('/api/billing/:id/pay', async (req, res) => {
  try {
    const id = req.params.id;
    const { method, providerPaymentId, providerOrderId, meta } = req.body || {};

    let invoice = null;
   
    if (mongoose.Types.ObjectId.isValid(id)) {
      invoice = await Invoice.findById(id);
    }
    
    if (!invoice) {
      invoice = await Invoice.findOne({ invoiceNo: id });
    }

    if (!invoice) {
      return res.status(404).json({ ok: false, error: 'Invoice not found' });
    }

    invoice.status = 'Paid';
    if (!invoice.meta) invoice.meta = {};
    invoice.meta.lastPayment = { method: method || 'unknown', providerPaymentId, providerOrderId, ts: new Date() };

    await invoice.save();

  
    const payment = new Payment({
      invoiceId: invoice._id.toString(),
      residentId: invoice.residentId || null,
      amount: invoice.amount,
      method: method || 'Manual',
      providerPaymentId: providerPaymentId || null,
      providerOrderId: providerOrderId || null,
      status: 'Success',
      meta: meta || {}
    });
    await payment.save();

    return res.json({
      ok: true,
      payment: { _id: payment._id, status: 'Paid', paidOn: new Date().toISOString().slice(0,10) }
    });
  } catch (err) {
    console.error('PATCH /api/billing/:id/pay err', err);
    return res.status(500).json({ ok: false, error: err.message || 'mark pay failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
