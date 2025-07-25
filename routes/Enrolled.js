const express = require("express");
const router = express.Router();
const { query } = require("../db/db");
const { queries } = require("../queries/queries");
const verifyFirebaseToken = require('./firebase/authMiddleware');

router.use(verifyFirebaseToken);

router.get("/", async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { text, values } = queries.getEnrollCourses(userId);
    const result = await query(text, values);
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/status/:crsId",async(req,res)=>{
  try{
    const userId = req.user.user_id;
    const courseId=req.params.crsId;
    const result=await query(
      `select status from enrollment where course_id=$1 and student_id=$2;`,
      [courseId,userId],
    )
    res.send(result.rows[0]);
  }
  catch(err){
    res.status(500).json({ error: err.message });
  }
})

module.exports=router;