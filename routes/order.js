const express=require('express');
const router=express.Router();
const { query } = require('../db/db');
const {queries}=require('../queries/queries');

router.post('/', async (req, res) => {
  try{
    const userId=req.body.userId;
    const crsId=req.body.courseId;
    const {text,values}=queries.addToOrder(userId,crsId);
    const result=await query(text,values);
    res.send(result.rows[0]); 
  }
  catch(err){
       res.status(500).json({ error: err.message });
  }
});
router.get('/:userId',async(req,res)=>{
    try{
      const userId=req.params.userId;
    const {text,values}=queries.getOrderContents(userId);
    const result=await query(text,values);
    res.send(result.rows);
    }
    catch(err){
      res.status(500).json({ error: err.message });
    }
});
router.post('/cancel', async (req, res) => {
  const { studentId } = req.body;
  try {
    const result = await query(queries.cancelOrder(studentId));
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports=router;