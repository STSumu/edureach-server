const express = require("express");
const cors = require("cors");
const verifyFirebaseToken = require("./routes/firebase/authMiddleware");

const { pool, query } = require("./db/db");
const { queries } = require("./queries/queries");
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 4000;


const usersRouter = require('./routes/user');
const coursesRouter = require('./routes/courses');
const materialsRouter = require('./routes/materials');
// const userTypeRouter = require('./routes/userType');
const categoriesRouter = require('./routes/categories');
const cartRouter = require('./routes/cart');
const wishRouter = require('./routes/wish');
const orderRouter=require('./routes/order');
const payRouter=require('./routes/pay');
const enrollRouter=require('./routes/Enrolled')
const discussionRouter = require('./routes/discussion');
const quizRouter=require('./routes/quiz');
const questionRouter=require('./routes/question');
const quizAttemptRouter=require('./routes/quizattempt');
const progressRouter=require('./routes/progress');
const rateRouter=require('./routes/rate');
const teachRouter=require('./routes/instructor/teach');
const adminRouter=require('./routes/admin');

app.use('/user', usersRouter);
app.use('/courses', coursesRouter);
app.use('/materials', materialsRouter);
app.use('/quiz',quizRouter);
// app.use('/user', userTypeRouter);
app.use('/categories', categoriesRouter);
app.use('/cart', cartRouter);
app.use('/wish', wishRouter);
app.use('/order',orderRouter);
app.use('/pay',payRouter);
app.use('/enroll',enrollRouter);
app.use('/discussion', discussionRouter);
app.use('/question',questionRouter);
app.use('/quizattempt',quizAttemptRouter);
app.use('/progress',progressRouter);
app.use('/rate',rateRouter);
app.use('/teach',teachRouter);
app.use('/admin',adminRouter);


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
