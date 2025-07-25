const express=require('express');
const router=express.Router();
const {query}=require('../../db/db');
const {queries}=require('../../queries/queries');
const verifyFirebaseToken = require('../firebase/authMiddleware');

router.use(verifyFirebaseToken);

router.post('/', async (req, res) => {
  try {
    const { uid } = req.user;
    const { expertise, about, experience_years = 0, linkedin, website } = req.body;
    let expYears = Number(experience_years);
if (isNaN(expYears)) expYears = 0;
    const currentTime = new Date();

    // Find the student user
    const searchUser = await query(
      `SELECT * FROM "user" WHERE firebase_uid = $1 AND role = 'student'`,
      [uid]
    );
    const exist = searchUser.rows[0];
    if (!exist) return res.status(404).json({ error: 'Student user not found' });

    // Check if the teacher entry exists
    let teacherUser = await query(
      `SELECT user_id FROM "user" WHERE firebase_uid = $1 AND role = 'teacher'`,
      [uid]
    );

    let teacherUserId;
    if (teacherUser.rows.length === 0) {
      
      const insertTeacher = await query(
        `INSERT INTO "user"
          (user_name, email, profile_pic, reg_date, is_active, last_login_at, updated_at, role, firebase_uid, last_logout_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'teacher',$8,$9)
         RETURNING user_id`,
        [
          exist.user_name,
          exist.email,
          exist.profile_pic,
          currentTime,
          true,
          currentTime,
          currentTime,
          exist.firebase_uid,
          exist.last_logout_at
        ]
      );
      teacherUserId = insertTeacher.rows[0].user_id;
    } else {
      teacherUserId = teacherUser.rows[0].user_id;
    }
    // Update instructor fields (trigger has already inserted the row)
    await query(
      `UPDATE instructor
       SET expertise = $1,
           about = $2,
           experience_years = $3,
           linkedin = $4,
           website = $5
       WHERE instructor_id = $6`,
      [expertise, about, expYears, linkedin, website, teacherUserId]
    );

    res.json({ teacher:true, instructor_id: teacherUserId });
  } catch (err) {
    console.error("Error promoting to instructor:", err);
    res.status(500).send(err.message);
  }
});
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const searchUser = await query(
      `SELECT * FROM "user" WHERE firebase_uid = $1 AND role = 'student'`,
      [uid]
    );
    const exist = searchUser.rows[0].firebase_uid;
    const result = await query(
      `SELECT user_id, user_name, email, profile_pic, role 
       FROM "user" 
       WHERE firebase_uid = $1 and role='teacher'`,
      [exist]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.send(result.rows[0]);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/',async(req,res)=>{
    try{
        const userId = req.user.user_id;
        const result=await query(`select JSON_AGG(c.course_id) as mycourses
             from course c
             join course_request cr on(c.request_id,cr.request_id) 
             where cr.instructor_id=$1`,
            [userId]
        )
        res.send(result.rows[0]);
    }
    catch (err) {
    console.error("Error syncing user:", err);
    res.status(500).json({ error: err.message });
  }
})
module.exports=router;