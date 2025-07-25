const express=require('express');
const router=express.Router();
const {query}=require('../db/db');
const {queries }=require('../queries/queries');
const verifyFirebaseToken = require('./firebase/authMiddleware');

router.use(verifyFirebaseToken);

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
router.get('/',async(req,res)=>{
    try{
        const stdId=req.user.user_id;
        const {text,values}=queries.getPayment(stdId);
        const result=await query(text,values);
        res.send(result.rows);
    }
    catch(err){
        res.status(500).json({ error: err.message });
    }
});
module.exports=router;