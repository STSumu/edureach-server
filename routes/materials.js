const express = require("express");
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');

router.get("/:courseId", async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const stdId=req.query.stdId;
    const { text, values } = queries.material(courseId,stdId);
    const result = await query(text, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/mat/:matId", async (req, res) => {
  try {
    const matId = req.params.matId;
    const stdId=req.query.stdId;
    const { text, values } = queries.getMaterialWithAccess(matId,stdId);
    const result = await query(text, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/",async(req,res)=>{
  try{
    const {studentId,matId}=req.body;
  const {text,values}=queries.addToMatComplete(studentId,matId);
  const result=await query(text,values);
  res.send(result.rows[0]);
  }
  catch(err){
    res.status(500).json({error:err.message});
  }
})

module.exports = router;
