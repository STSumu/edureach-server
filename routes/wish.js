const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');
const verifyFirebaseToken = require('./firebase/authMiddleware');

router.use(verifyFirebaseToken);

router.get('/', async (req, res) => {
  try {
     const userId=req.user.user_id;
  const {text,values}=queries.getWishContents(userId);
  const result=await query(text,values);
  res.send(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/', async (req, res) => {
  try {
    const userId=req.user.user_id;
    const crsId = req.body.course_id;
    const { text, values } = queries.addToWishlist(userId, crsId);
    const result = await query(text, values);
    res.send(result.rows[0]);
  } catch (err) {
    console.error("🔥 Database or query error:", err); 
    res.status(500).json({ error: err.message });
  }
});
router.delete('/:crsId',async(req,res)=>{
  try{
    const userId=req.user.user_id;
    const course_id=req.params.crsId;
    const result=await query(`DELETE FROM public.wishlist
WHERE student_id = $1 AND course_id = $2;
`,
     [userId, course_id]);
  res.send(result.rows);
  }
  catch(err){
      res.status(500).json({ error: err.message });
  }
})

module.exports = router;