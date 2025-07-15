const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');

// router.get('/:courseId', async (req, res) => {
//   try {
//     const {text,values}=queries.startQuiz(req.params.courseId);
//     const result = await query(text,values);
//     if (result.rows.length === 0) return res.status(404).json({ message: 'No users found' });
//     res.send(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// GET all quizzes for a specific course
// GET quiz count for a specific course
router.get('/:courseId', async (req, res) => {
  const { courseId } = req.params;

  try {
    const result = await query(
      'SELECT DISTINCT quiz_id FROM quiz WHERE course_id = $1;',
      [courseId]
    );
    res.send(result.rows); // { quiz_count: 3 }
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load quiz count');
  }
});


module.exports=router;