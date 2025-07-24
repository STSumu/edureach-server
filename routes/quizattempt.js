const express=require('express');
const router =express.Router();
const {queries}=require('../queries/queries');
const {query}=require('../db/db');

router.post('/submit-quiz', async (req, res) => {
  const { studentId, quizId, answers } = req.body;

  if (!studentId || !quizId || !answers) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const correctRows = await query(queries.getAnswers(quizId));

    const correctAnswers=correctRows.rows[0].answers;
    const totalMark=correctRows.rows[0].total;
    const correctCount = answers.filter(sa =>
  correctAnswers.some(ca => 
    Number(ca.quesId) === Number(sa.ques_id) &&
    Number(ca.optionId) === Number(sa.option_id)
  )
).length;

const score =(totalMark / correctAnswers.length) * correctCount;
  const result = await query(
  `SELECT insertToQuizAttempt($1, $2, $3::jsonb, $4) AS attempt_id`, 
  [studentId, quizId, JSON.stringify(answers), score]
);
  res.send(result.rows[0]);

  } catch (err) {
    console.error('Error submitting quiz:', err);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }



});
router.get('/:quizId',async(req,res)=>{
    try{
        const {quizId}=req.params;
        const {studentId}=req.query;
        const result=await query(queries.getAttempt(quizId,studentId));
        if (result.rows.length === 0) {
      return res.json({ found: false, attempt: null });
    }
    res.json({ found: true, attempt: result.rows[0] });
    }
    catch(err){
        res.status(500).json({error:'failed to get attempt'});
    }
});
module.exports=router;