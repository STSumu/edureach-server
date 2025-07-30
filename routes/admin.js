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
router.patch('/approve/:reqId', async (req, res) => {
  try {
    const reqId = req.params.reqId;
    const { price, revenue, discount } = req.body;
    const uId = req.user.uid;

    const isAdmin = await query(
      `SELECT user_id FROM "user" WHERE firebase_uid = $1 AND role = 'admin'`,
      [uId]
    );
    const adminId=isAdmin.rows[0].user_id;

    if (isAdmin.rows[0].user_id) {
      await query(
        `UPDATE course_request 
         SET status = 'accepted',admin_id=$2, approved_at = NOW()
         WHERE request_id = $1`,
        [reqId,adminId]
      );
      
      
      const courseRow = await query(
        `SELECT course_id FROM course WHERE request_id = $1`,
        [reqId]
      );

      if (courseRow.rowCount > 0) {
        await query(
          `UPDATE course 
           SET price = COALESCE($1, price),
               discount = COALESCE($2, discount),
               revenue = COALESCE($3, revenue),
               updated_at = NOW()
           WHERE request_id = $4`,
          [price, discount, revenue, reqId]
        );
      }


      res.json({ message: 'Course approved', courseId: courseRow.rows[0]?.course_id || null });
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.patch('/decline/:reqId', async (req, res) => {
  try {
    const reqId = req.params.reqId;
    const { price, revenue, discount } = req.body;
    const uId = req.user.uid;

    const isAdmin = await query(
      `SELECT user_id FROM "user" WHERE firebase_uid = $1 AND role = 'admin'`,
      [uId]
    );
    const adminId=isAdmin.rows[0].user_id;

    if (isAdmin.rows[0].user_id) {
      await query(
        `UPDATE course_request 
         SET status = 'declined',admin_id=$2, approved_at = NOW()
         WHERE request_id = $1`,
        [reqId,adminId]
      );
    
      res.json({ message: 'Course approved', courseId: courseRow.rows[0]?.course_id || null });
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





module.exports = router;
