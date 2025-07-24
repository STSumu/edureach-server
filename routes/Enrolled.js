const express = require("express");
const router = express.Router();
const { query } = require("../db/db");
const { queries } = require("../queries/queries");

router.get("/:stdid", async (req, res) => {
  try {
    const stdId=req.params.stdid;
    const { text, values } = queries.getEnrollCourses(stdId);
    const result = await query(text, values);
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/status/:stdid",async(req,res)=>{
  try{
    const {stdid}=req.params;
    const {courseId}=req.query;
    const result=await query(
      `select status from enrollment where course_id=$1 and student_id=$2;`,
      [courseId,stdid],
    )
    res.send(result.rows[0]);
  }
  catch(err){
    res.status(500).json({ error: err.message });
  }
})

module.exports=router;