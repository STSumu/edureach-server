const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');

router.get('/', async (req, res) => {
  try {
     const userId=req.params.userId;
  const {text,values}=queries.get(userId);
  const result=await query(text,values);
  res.send(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;