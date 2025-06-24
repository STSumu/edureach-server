const queries = {
  users: {
    text: 'SELECT * FROM "user"',
  },

  courses: {
    text: `SELECT c.*,u.user_name as instructor,u.profile_pic as instructorImg 
           FROM COURSE c 
           JOIN COURSE_REQUEST cr ON c.course_name = cr.course_name 
           JOIN "user" u ON cr.instructor_id = u.user_id`
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
  }
};

module.exports={ queries };
