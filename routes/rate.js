const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');


router.post('/', async (req, res) => {
  try {
    const {userId,courseId,rating,comment}=req.body;
    const result=await query(
        `insert into ratings (student_id,course_id,rating,comment)
        values($1,$2,$3,$4)
        ON CONFLICT (student_id, course_id)
         DO UPDATE SET
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment
RETURNING ratings_id;
        `,
        [userId,courseId,rating,comment]
    )
    res.send(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});
module.exports=router;