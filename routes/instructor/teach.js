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
      `SELECT * FROM "user" WHERE firebase_uid = $1`,
      [uid]
    );
    const exist = searchUser.rows[0];
    if (!exist) return res.status(404).json({ error: 'Student user not found' });

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


router.get('/',async(req,res)=>{
    try{
        const {uid} = req.user;
        let teacherUser = await query(
      `SELECT user_id FROM "user" WHERE firebase_uid = $1 AND role = 'teacher'`,
      [uid]
    );
    if(teacherUser.rows[0].user_id){
      const userId=teacherUser.rows[0].user_id;
        const result=await query(`select JSON_AGG(c.course_id) as mycourses
             from course c
             join course_request cr on(c.request_id=cr.request_id) 
             where cr.instructor_id=$1`,
            [userId]
        )
        res.send(result.rows[0]);
      }
    }
    catch (err) {
    console.error("Error syncing user:", err);
    res.status(500).json({ error: err.message });
  }
})
router.post('/request',async(req,res)=>{
  try{
    
    const uid=req.user.uid;
    let teacherUser = await query(
      `SELECT user_id FROM "user" WHERE firebase_uid = $1 AND role = 'teacher'`,
      [uid]
    );
    const userId=teacherUser.rows[0].user_id;
    const req_at=new Date();
    const {course_name,course_description,start_date,price,intro_url,course_image_url}=req.body;
    const result = await query(`
  INSERT INTO course_request (
    instructor_id, requested_at, status, start_date, 
    course_name, course_description, intro_url, req_price, img_url
  ) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
  RETURNING request_id`,
  [userId, req_at, 'pending', start_date, course_name, course_description, intro_url, price, course_image_url]
);
    res.send(result.rows[0]);
  }
  catch (err) {
    console.error("Error syncing user:", err);
    res.status(500).json({ error: err.message });
  }
});
router.post('/mat', async (req, res) => {
  try {
    const { title, order, link, type, courseId } = req.body;
    const { uid } = req.user;

    const teacherResult = await query(
      `SELECT user_id FROM "user" WHERE firebase_uid = $1 AND role = 'teacher'`,
      [uid]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(403).json({ error: "Unauthorized: not a teacher" });
    }

    const insertResult = await query(
      `INSERT INTO material (course_id, title, "order", type, url)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (course_id, "order")
DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  url = EXCLUDED.url,
  updated_at = CURRENT_TIMESTAMP
RETURNING *;`,[courseId, title, order, type, link]

    );

    res.status(201).json({ message: "Material uploaded", material: insertResult.rows[0] });
  } catch (err) {
    console.error("Error inserting material:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post('/quiz', async (req, res) => {
  try {
    const {courseId,quizTitle,questions}=req.body;
    const { uid } = req.user;

    const teacherResult = await query(
      `SELECT user_id FROM "user" WHERE firebase_uid = $1 AND role = 'teacher'`,
      [uid]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(403).json({ error: "Unauthorized: not a teacher" });
    }
    const result=await query(`select createQuiz($1,$2,$3) as quiz`,[courseId,quizTitle,JSON.stringify(questions)]);
    res.send(result.rows[0]);
  } catch (err) {
    console.error("Error inserting material:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports=router;