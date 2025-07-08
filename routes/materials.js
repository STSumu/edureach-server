const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');

router.get('/:courseName', async (req, res) => {
  try {
    const courseName = req.params.courseName;
    const { text, values } = queries.material(courseName);
    const result = await query(text, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
