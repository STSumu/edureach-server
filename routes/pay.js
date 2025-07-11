const express=require('express');
const router=express.Router();
const {query}=require('../db/db');
const {queries }=require('../queries/queries');

router.patch('/',async(req,res)=>{
    try{
        const {orderId,paymentStatus}=req.body;
        const {text,values}=queries.updatePayment(orderId,paymentStatus);
        const result=await query(text,values);
        res.status(200).json({ updated: result.rowCount });
    }
    catch(err){
        res.status(500).json({ error: err.message });
    }
});
router.get('/:stdId',async(req,res)=>{
    try{
        const {text,values}=queries.getPayment(req.params.stdId);
        const result=await query(text,values);
        res.send(result.rows);
    }
    catch(err){
        res.status(500).json({ error: err.message });
    }
});
module.exports=router;