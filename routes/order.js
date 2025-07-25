const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');
const verifyFirebaseToken = require('./firebase/authMiddleware');

router.use(verifyFirebaseToken);

router.post('/', async (req, res) => {
  try{
    const userId=req.user.user_id;
    const courseId=req.body.courseId;
       const {text,values}=queries.addToOrder(userId,courseId);
       const result=await query(text,values);
    res.send(result.rows[0]); 
  }
  catch(err){
       res.status(500).json({ error: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const userId=req.user.user_id;
    const { text, values } = queries.getOrderContents(userId);
    const result = await query(text, values);
    res.send(result.rows);
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/total', async (req, res) => {
  try {
    const userId=req.user.user_id;
    const { text, values } = queries.getOrderTotal(userId, "pending");
    const result = await query(text, values);
    res.send(result.rows[0]);
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/cancel', async (req, res) => {
  const userId=req.user.user_id;
  try {
    const result = await query(queries.cancelOrder(userId));
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/confirm', async (req, res) => {
  const userId=req.user.user_id;
  const { method } = req.body;
  try {
    const result = await query(queries.confirmOrder(userId, method));
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;