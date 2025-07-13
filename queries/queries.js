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

  material: (courseId) => ({
    text: `SELECT M.* 
           FROM MATERIAL M 
           JOIN COURSE C ON M.COURSE_ID = C.COURSE_ID 
           WHERE C.course_id= ($1)`,
    values: [courseId],
  }),
  materialbyId: (matId) => ({
    text: `SELECT M.*
           FROM MATERIAL M 
           JOIN COURSE C ON M.COURSE_ID = C.COURSE_ID 
           WHERE M.MATERIAL_ID = ($1)`,
    values: [matId],
  }),

  allCategory: {
    text: `SELECT CATEGORY, JSON_AGG(COURSE_NAME) as COURSES 
           FROM COURSE 
           GROUP BY CATEGORY`,
  },
  user: (user) => ({
    text: `INSERT INTO "user"(user_name,email,profile_pic,reg_date,last_login_at,role) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    values: [user.name, user.email, user.profilePic, user.reg_date, user.lastLogin, user.role],

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

  getEnrollCourses: (studentId)=>(
    {
      text:`select JSON_AGG(course_id) as mycourses from enrollment where student_id=$1;`,
      values:[studentId],
    }
  ),

  // 🔹 Get all cart items for a student
  getCartContents: (studentId) => ({
    text: `SELECT * FROM get_cart_contents($1);`,
    values: [studentId],
  }),
  getOrderContents: (studentId) => ({
    text: `SELECT * FROM get_order_contents($1);`,
    values: [studentId],
  }),
  cancelOrder:(studentId)=>({
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

  // 🔹 Get total cost of cart
  getCartTotal: (studentId) => ({
    text: `SELECT get_cart_total($1) AS total;`,
    values: [studentId],
  }),
  getOrderTotal: (studentId,status) => ({
    text: `SELECT get_order_total($1,$2) AS total;`,
    values: [studentId,status],
  }),
  confirmOrder:(studentId,method)=>({
    text: `SELECT confirm_order($1,$2) AS orderId;`,
    values: [studentId,method],
  }),
  updatePayment:(orderId,payStatus)=>({
    text: `UPDATE payment
SET payment_status = $2
WHERE order_id = $1`,
    values: [orderId,payStatus],
  }),
  getPayment:(studentId)=>({
    text: `Select * from payment
Where payment_status = 'pending' and
 student_id = $1`,
    values: [studentId],
  }),


  // 🔹 Remove a specific course from cart
  removeFromCart: (studentId, courseId) => ({
    text: `SELECT remove_from_cart($1, $2) AS removed;`,
    values: [studentId, courseId],
  }),

  // 🔹 Clear the whole cart for a student
  clearCart: (studentId) => ({
    text: `SELECT clear_cart($1) AS cleared;`,
    values: [studentId],
  }),
  // cart:(user)=>({
  //    text:`INSERT INTO "user"(user_name,email,profile_pic,reg_date,last_login_at,role)
  //          VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
  //    values:[user.name,user.email,user.profilePic,user.reg_date,user.lastLogin,user.role],
  // })
};

module.exports = { queries };
