const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');

router.get('/:userId', async (req, res) => {
  try {
     const userId=req.params.userId;
  const {text,values}=queries.getWishContents(userId);
  const result=await query(text,values);
  console.log(result.rows);
  res.send(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/', async (req, res) => {
  try {
    const stdid = req.body.userId;
    const crsId = req.body.course_id;
    const { text, values } = queries.addToWishlist(stdid, crsId);
    const result = await query(text, values);
    res.send(result.rows[0]);
  } catch (err) {
    console.error("🔥 Database or query error:", err); 
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;