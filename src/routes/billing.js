
import express from 'express';
const router = express.Router();


router.patch('/:id/pay', async (req, res) => {
  try {
    const id = req.params.id;
 
    return res.json({
      ok: true,
      payment: { _id: id, status: 'Paid', paidOn: new Date().toISOString().slice(0,10) }
    });
  } catch (err) {
    console.error('PATCH /api/billing/:id/pay err', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
