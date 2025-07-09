const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');

router.get('/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { text, values } = queries.material(courseId);
<<<<<<< HEAD
=======
    const result = await query(text, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/mat/:matId', async (req, res) => {
  try {
    const matId = req.params.matId;
    const { text, values } = queries.materialbyId(matId);
>>>>>>> 0ee6974f38ed17e3346c91e02a716285e2a4e1a6
    const result = await query(text, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
