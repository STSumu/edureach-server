const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');

router.get('/', async (req, res) => {
  try {
    const result = await query(queries.allCategory.text);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
