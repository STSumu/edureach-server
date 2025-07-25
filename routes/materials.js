const express = require("express");
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');
const verifyFirebaseToken = require('./firebase/authMiddleware');


router.get("/:courseId",verifyFirebaseToken, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.user_id;
    const { text, values } = queries.material(courseId,userId);
    const result = await query(text, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/mat/:matId",verifyFirebaseToken, async (req, res) => {
  try {
    const matId = req.params.matId;
    const stdId=req.user.user_id;
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
