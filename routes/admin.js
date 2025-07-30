const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');
const verifyFirebaseToken = require('./firebase/authMiddleware');

router.use(verifyFirebaseToken);
router.get('/requests', async (req, res) => {
  try {
    const uId=req.user.uid;
    const isAdmin=await query(`select user_id from "user" where firebase_uid=$1 and role='admin'`,[uId]);
    if(isAdmin.rows !==0){
       const result = await query(`select cr.*,i.user_name,a.user_name as admin_name
 from course_request cr 
 left outer join "user" i on (cr.instructor_id=i.user_id) 
 left outer join "user" a on (a.user_id=cr.admin_id)`);
       res.json(result.rows);
    }
    else{
        return res.status(404).json({ message: 'Unauthorized' })
    }
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/request/:id', async (req, res) => {
  try {
    const uId=req.user.uid;
    const isAdmin=await query(`select user_id from "user" where firebase_uid=$1 and role='admin'`,[uId]);
    if(isAdmin.rows !==0){
       const result = await query(`select cr.*,i.user_name as instructor,i.profile_pic as instructor_img,a.user_name as admin_name
 from course_request cr 
 left outer join "user" i on (cr.instructor_id=i.user_id) 
 left outer join "user" a on (a.user_id=cr.admin_id) where cr.request_id=$1`,[req.params.id]);
       res.json(result.rows);
    }
    else{
        return res.status(404).json({ message: 'Unauthorized' })
    }
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/approve',async(req,res)=>{
    try{
        const uId=req.user.uid;
        const adminId=await query(`select user_id from "user" where firebase_uid=$1 and role='admin'`,[uId]);
        const result=await query(`Insert into course`)
    }
    catch (err) {
    res.status(500).json({ error: err.message });
  }
})



module.exports = router;
