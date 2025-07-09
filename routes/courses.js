const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');

router.get('/', async (req, res) => {
  try {
    const result = await query(queries.courses.text);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/:courseId', async (req, res) => {
  try {
    const courseId=req.params.courseId;
    const {text,values}=queries.getCourse(courseId);
    const result = await query(text,values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
