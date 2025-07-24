const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');


router.get('/:quizId', async (req, res) => {
  const { quizId } = req.params;
  try {
    const result = await query(
     `
     SELECT 
  q.ques_id,
  q.quiz_text,
  json_agg(
    json_build_object(
      'option_id', o.option_id,
      'option_txt', o.option_txt
    ) ORDER BY o.option_id
  ) AS options,
   qu.total_mark
FROM question q
JOIN option o ON q.ques_id = o.ques_id
JOIN quiz qu ON qu.quiz_id = q.quiz_id
WHERE q.quiz_id = $1
GROUP BY q.ques_id, q.quiz_text, qu.total_mark
ORDER BY q.ques_id;`
,
      [quizId]
    );
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load ');
  }
});


module.exports=router;