const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');


router.get('/:courseId', async (req, res) => {
  const { courseId } = req.params;
  try {
    const result = await query(
      'SELECT DISTINCT quiz_id FROM quiz WHERE course_id = $1;',
      [courseId]
    );
    res.send(result.rows); 
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load quiz count');
  }
});
router.get('/answer/:quizId',async (req,res)=>{
  try{
    const {quizId}=req.params;
    const {text,values}=queries.getAnswers(quizId);
    const result =await query(text,values);
    res.send(result.rows[0]);
  }
  catch(err){
    res.status(500).send('Failed to load quiz answers');
  }
})


module.exports=router;