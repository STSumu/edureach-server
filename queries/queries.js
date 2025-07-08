const queries = {
  users: {
    text: 'SELECT * FROM "user"',
  },

  courses: {
    text: `SELECT c.*,u.user_name as instructor,u.profile_pic as instructorImg,count(e.student_id) as totalstudent,
           avg(r.rating) as rating 
           FROM COURSE c 
           JOIN COURSE_REQUEST cr ON c.course_name = cr.course_name 
           JOIN "user" u ON cr.instructor_id = u.user_id
           JOIN enrollment e ON e.course_id=c.course_id
           JOIN ratings r ON r.course_id=c.course_id
           Group by c.course_id,u.user_name,u.profile_pic;`
  },

  material: (courseName) => ({
    text: `SELECT M.* 
           FROM MATERIAL M 
           JOIN COURSE C ON M.COURSE_ID = C.COURSE_ID 
           WHERE UPPER(C.COURSE_NAME) = UPPER($1)`,
    values: [courseName],
  }),

  allCategory: {
    text: `SELECT CATEGORY, JSON_AGG(COURSE_NAME) as COURSES 
           FROM COURSE 
           GROUP BY CATEGORY`
  },
  user:(user)=>({
     text:`INSERT INTO "user"(user_name,email,profile_pic,reg_date,last_login_at,role) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
     values:[user.name,user.email,user.profilePic,user.reg_date,user.lastLogin,user.role],
  }),
  dbUser:(userEmail)=>({
     text:`SELECT *
FROM "user" u
LEFT JOIN instructor i ON u.user_id = i.instructor_id AND u.role = 'teacher'
LEFT JOIN student s ON u.user_id = s.student_id AND u.role = 'student'
WHERE LOWER(u.email) = LOWER($1);
     `,
     values:[userEmail],
  })

  // cart:(user)=>({
  //    text:`INSERT INTO "user"(user_name,email,profile_pic,reg_date,last_login_at,role) 
  //          VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
  //    values:[user.name,user.email,user.profilePic,user.reg_date,user.lastLogin,user.role],
  // })
};

module.exports={ queries };
