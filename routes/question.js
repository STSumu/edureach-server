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
router.get('/:quizId', async (req, res) => {
  const { quizId } = req.params;
  console.log(quizId);
  try {
    const result = await query(
     `
     SELECT 
  q.ques_id,
  q.quiz_text,
  qu.total_mark,
  json_agg(
    json_build_object(
      'option_id', o.option_id,
      'option_txt', o.option_txt,
      'is_correct', o.is_correct
    ) ORDER BY o.option_id
  ) AS options
FROM question q
JOIN option o ON q.ques_id = o.ques_id
JOIN quiz qu ON qu.quiz_id = q.quiz_id
WHERE q.quiz_id = $1
GROUP BY q.ques_id, q.quiz_text, qu.total_mark
ORDER BY q.ques_id;`
,
      [quizId]
    );
    res.send(result.rows); // { quiz_count: 3 }
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load ');
  }
});


module.exports=router;