const { text } = require("express");

const queries = {
  users: {
    text: 'SELECT * FROM "user"',
  },

  courses: {
    text: `
    SELECT 
      c.category,
      c.course_name,
      AVG(r.rating) AS rating,
      u.user_name AS instructor,
      c.course_id,
      c.duration,
      c.price,
      c.thumb_url,
      u.profile_pic AS instructorImg
    FROM course c
    JOIN course_request cr ON c.course_name = cr.course_name
    JOIN "user" u ON cr.instructor_id = u.user_id
    JOIN enrollment e ON e.course_id = c.course_id
    JOIN ratings r ON r.course_id = c.course_id
    GROUP BY 
      c.category, c.course_name, c.duration, c.price, c.thumb_url,c.course_id,
      u.user_name, u.profile_pic;
  `,
  },
  getCourse: (courseId) => ({
    text: `SELECT 
    c.*, 
    u.user_name AS instructor,
    u.profile_pic AS instructorImg,
    COUNT(e.student_id) AS totalstudent,
    COUNT(r.rating) AS totalRatings,
    AVG(r.rating) AS rating 
  FROM COURSE c 
  JOIN COURSE_REQUEST cr ON c.course_name = cr.course_name 
  JOIN "user" u ON cr.instructor_id = u.user_id
  JOIN enrollment e ON e.course_id = c.course_id
  JOIN ratings r ON r.course_id = c.course_id
  WHERE c.course_id = ($1)
  GROUP BY c.course_id, u.user_name, u.profile_pic;`,
    values: [courseId],
  }),

  material: (courseId, studentId) => ({
    text: `
    SELECT M.*, islocked(M.material_id, $2) AS islocked
    FROM MATERIAL M 
    JOIN COURSE C ON M.COURSE_ID = C.COURSE_ID 
    WHERE C.course_id = $1
    ORDER BY M."order";
  `,
    values: [courseId, studentId],
  }),
  materialbyId: (matId) => ({
    text: `SELECT M.*
           FROM MATERIAL M 
           JOIN COURSE C ON M.COURSE_ID = C.COURSE_ID 
           WHERE M.MATERIAL_ID = ($1)`,
    values: [matId],
  }),
  getMaterialWithAccess: (matId, studentId) => ({
    text: `SELECT M.*,islocked($1,$2) as isLocked
           FROM MATERIAL M 
           JOIN COURSE C ON M.COURSE_ID = C.COURSE_ID 
           WHERE M.MATERIAL_ID = ($1)`,
    values: [matId, studentId]
  }),
  addToMatComplete: (studentId, matId) => ({
    text: `SELECT matComplete($1,$2) as inserted`,
    values: [studentId, matId],
  }),
  allCategory: {
    text: `SELECT CATEGORY, JSON_AGG(COURSE_NAME) as COURSES 
           FROM COURSE 
           GROUP BY CATEGORY`,
  },
  user: (user) => ({
    text: `INSERT INTO "user"(user_name,email,profile_pic,reg_date,last_login_at,role) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    values: [
      user.name,
      user.email,
      user.profilePic,
      user.reg_date,
      user.lastLogin,
      user.role,
    ],
  }),
  dbUser: (userEmail) => ({
    text: `SELECT *
FROM "user" u
LEFT JOIN instructor i ON u.user_id = i.instructor_id AND u.role = 'teacher'
LEFT JOIN student s ON u.user_id = s.student_id AND u.role = 'student'
WHERE LOWER(u.email) = LOWER($1);
     `,
    values: [userEmail],
  }),

  addToCart: (studentId, courseId) => ({
    text: `SELECT add_to_cart($1, $2) AS cart_id;`,
    values: [studentId, courseId],
  }),
  addToOrder: (studentId, courseId) => ({
    text: `SELECT add_to_order($1, $2) AS order_id`,
    values: [studentId, courseId],
  }),
  addToWishlist: (studentId, courseIds) => ({
    text: `INSERT INTO wishlist(student_id, course_id)
VALUES ($1,$2)
ON CONFLICT DO NOTHING;`,
    values: [studentId, courseIds],
  }),
  getEnrollCourses: (studentId) => (
    {
      text: `select JSON_AGG(course_id) as mycourses from enrollment where student_id=$1;`,
      values: [studentId],
    }
  ),


  getCartContents: (studentId) => ({
    text: `SELECT * FROM get_cart_contents($1);`,
    values: [studentId],
  }),
  getOrderContents: (studentId) => ({
    text: `SELECT * FROM get_order_contents($1);`,
    values: [studentId],
  }),
  cancelOrder: (studentId) => ({
    text: `SELECT * FROM cancel_order($1);`,
    values: [studentId],
  }),
  getWishContents: (studentId) => ({
    text: `SELECT w.*, c.course_name, c.price, c.category
FROM wishlist w
JOIN course c ON w.course_id = c.course_id
WHERE w.student_id = ($1);
`,
    values: [studentId],
  }),
  getAnswers: (quizId) => (
    {
      text: `
      Select JSON_AGG(
  JSON_BUILD_OBJECT(
    'quesId', que.ques_id,
    'optionId', o.option_id
  )
) as answers,
 q.total_mark as total
from quiz q
join question que on (q.quiz_id=que.quiz_id)
join option o on (que.ques_id=o.ques_id)
where o.is_correct=true and q.quiz_id=$1
group by q.total_mark;
      `,
      values: [quizId],
    }
  ),
  getAttempt:(quizId,studentId)=>({
    text:`Select q.* 
    from quiz_attempt q
    join enrollment e on (e.enroll_id=q.enroll_id)
    where e.student_id=$2 and q.quiz_id=$1;
    `,
    values:[quizId,studentId],
  }),

  getCartTotal: (studentId) => ({
    text: `SELECT get_cart_total($1) AS total;`,
    values: [studentId],
  }),
  getOrderTotal: (studentId, status) => ({
    text: `SELECT get_order_total($1,$2) AS total;`,
    values: [studentId, status],
  }),
  confirmOrder: (studentId, method) => ({
    text: `SELECT confirm_order($1,$2) AS orderId;`,
    values: [studentId, method],
  }),
  updatePayment: (orderId, payStatus) => ({
    text: `UPDATE payment
SET payment_status = $2
WHERE order_id = $1`,
    values: [orderId, payStatus],
  }),
  getPayment: (studentId) => ({
    text: `Select * from payment
Where payment_status = 'pending' and
 student_id = $1`,
    values: [studentId],
  }),
  attemptQuiz:(quizId,enrollId,answers)=>({
    text:`
    `,
    values:[quizId,enrollId,answers]
  }),
  getProgress:(studentId,courseId)=>({
    text:`
    SELECT
  g.materials_completed,
  g.total_materials,
  g.quizzes_attempted,
  g.total_quizzes,
  g.quiz_average,
  g.progress
FROM get_progress_details($1,$2) AS g;
    `,
    values:[studentId,courseId],
  }),
  removeFromCart: (studentId, courseId) => ({
    text: `SELECT remove_from_cart($1, $2) AS removed;`,
    values: [studentId, courseId],
  }),
  

  
  clearCart: (studentId) => ({
    text: `SELECT clear_cart($1) AS cleared;`,
    values: [studentId],
  }),
  














  /////////////////////////////////////////////////////////////////////////////////




  discussion: {
    // // 🔹 Get all threads for a course
    // getThreads: (courseId) => ({
    //   text: `SELECT 
    //     dt.thread_id,
    //     dt.title,
    //     dt.status,
    //     dt.created_at,
    //     dt.updated_at,
    //     u.user_name as creator_name,
    //     u.profile_pic as creator_pic,
    //     COUNT(dp.post_id) as post_count,
    //     MAX(dp.created_at) as last_activity
    //   FROM discussion_thread dt
    //   JOIN discussion_post dp ON dt.thread_id = dp.thread_id
    //   JOIN "user" u ON dp.user_id = u.user_id
    //   WHERE dt.course_id = $1
    //   GROUP BY dt.thread_id, dt.title, dt.status, dt.created_at, dt.updated_at, u.user_name, u.profile_pic
    //   ORDER BY dt.created_at DESC`,
    //   values: [courseId],
    // }),
    getThreads: (courseId) => ({
      text: `Select * from discussion_thread where course_id=$1`,
      values: [courseId],
    }),
    // 🔹 Get posts in a thread
    getPosts: (threadId) => ({
      text: `SELECT 
        dp.post_id,
        dp.content,
        dp.created_at,
        dp.updated_at,
        dp.parent_post_id,
        u.user_name,
        u.profile_pic,
        u.role
      FROM discussion_post dp
      JOIN "user" u ON dp.user_id = u.user_id
      WHERE dp.thread_id = $1
      ORDER BY dp.created_at ASC`,
      values: [threadId],
    }),

    // 🔹 Create new thread
    // 🔧 FIXED: Now takes userId separately
    createThread: (courseId, userId, title) => ({
      text: `INSERT INTO discussion_thread (course_id, user_id, title, created_at, updated_at, status)
         VALUES ($1, $2, $3, NOW(), NOW(), 'open') RETURNING *`,
      values: [courseId, userId, title],
    }),


    // 🔹 Add first post to a thread
    createInitialPost: (threadId, userId, content) => ({
      text: `INSERT INTO discussion_post (thread_id, user_id, content, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
      values: [threadId, userId, content],
    }),

    // 🔹 Reply to post
    replyToPost: (threadId, userId, content, parentPostId = null) => ({
      text: `INSERT INTO discussion_post (thread_id, user_id, content, parent_post_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      values: [threadId, userId, content, parentPostId],
    }),

    // 🔹 Update thread status (open/closed)
    updateThreadStatus: (threadId, status) => ({
      text: `UPDATE discussion_thread 
             SET status = $1, updated_at = NOW() 
             WHERE thread_id = $2`,
      values: [status, threadId],
    }),

    // 🔹 Delete post
    deletePost: (postId, userId) => ({
      text: `DELETE FROM discussion_post 
             WHERE post_id = $1 AND user_id = $2`,
      values: [postId, userId],
    }),

    // 🔹 Edit post
    editPost: (postId, userId, content) => ({
      text: `UPDATE discussion_post 
             SET content = $1, updated_at = NOW() 
             WHERE post_id = $2 AND user_id = $3 
             RETURNING *`,
      values: [content, postId, userId],
    }),
  },

  startQuiz: (courseId) => ({
    text: `SELECT qs.quiz_text
    FROM quiz q
      JOIN question qs ON q.quiz_id = qs.quiz_id
      WHERE q.course_id = $1
      ORDER BY q.quiz_id ASC, qs.ques_id ASC;`,
    values: [courseId],
  }),






};

module.exports = { queries };
