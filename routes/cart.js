const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');
const verifyFirebaseToken = require('./firebase/authMiddleware');


router.use(verifyFirebaseToken);

router.post('/', async (req, res) => {
  try {
    
    const stdid = req.user.user_id;
    const crsId = req.body.course_id;
    const { text, values } = queries.addToCart(stdid, crsId);
    const result = await query(text, values);
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const stdid = req.user.user_id;
    const { text, values } = queries.getCartContents(stdid);
    const result = await query(text, values);
    res.send(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/total', async (req, res) => {
  try {
    const stdid = req.user.user_id;
    const { text, values } = queries.getCartTotal(stdid);
    const result = await query(text, values);
    res.send(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/clear', async (req, res) => {
  try {
    const stdid = req.user.user_id;
    const { text, values } = queries.clearCart(stdid);
    const result = await query(text, values);
    if (result.rowCount > 0) {
      res.json({ success: true, deletedRows: result.rowCount });
    } else {
      res.json({ success: false, message: 'No items to delete' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:crsId', async (req, res) => {
  try {
    const stdid = req.user.user_id;
    const course_id = req.params.crsId;
    const { text, values } = queries.removeFromCart(stdid, course_id);
    const result = await query(text, values);
    res.send(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
