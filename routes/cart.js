const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');

router.post('/', async (req, res) => {
  try {
    const stdid = req.body.userId;
    const crsId = req.body.course_id;
    const { text, values } = queries.addToCart(stdid, crsId);
    const result = await query(text, values);
    res.send(result.rows[0]);
  } catch (err) { 
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId',async(req,res)=>{
  try{
    const userId=req.params.userId;
  const {text,values}=queries.getCartContents(userId);
  const result=await query(text,values);
  res.send(result.rows);
  }
  catch(err){
    res.status(500).json({ error: err.message });
  }
});
router.get('/total/:userId',async(req,res)=>{
  try{
    const userId=req.params.userId;
  const {text,values}=queries.getCartTotal(userId);
  const result=await query(text,values);
  res.send(result.rows);
  }
  catch(err){
    res.status(500).json({ error: err.message });
  }
});
router.delete('/clear',async(req,res)=>{
  try{
    const {stdId}=req.body;
  const {text,values}=queries.clearCart(stdId);
  const result=await query(text,values);
  if (result.rowCount > 0) {
      res.json({ success: true, deletedRows: result.rowCount });
    } else {
      res.json({ success: false, message: 'No items to delete' });
    }
  }
  catch(err){
      res.status(500).json({ error: err.message });
  }
})
router.delete('/:stdId',async(req,res)=>{
  try{
    const userId=req.params.stdId;
    const course_id=req.query.crsId;
  const {text,values}=queries.removeFromCart(userId,course_id);
  const result=await query(text,values);
  res.send(result.rows);
  }
  catch(err){
      res.status(500).json({ error: err.message });
  }
})


module.exports = router;
