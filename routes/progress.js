const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');


router.get('/:courseId', async (req, res) => {
  try {
    const {studentId}=req.query;
    const {courseId}=req.params;
    const {text,values}=queries.getProgress(studentId,courseId);
    const result=await query(text,values);
    res.send(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});
module.exports=router;