const express = require("express");
const cors = require("cors");
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

app.use('/user', usersRouter);
app.use('/courses', coursesRouter);
app.use('/materials', materialsRouter);
// app.use('/user', userTypeRouter);
app.use('/categories', categoriesRouter);
app.use('/cart', cartRouter);
app.use('/wish', wishRouter);
app.use('/order',orderRouter);
app.use('/pay',payRouter);
app.use('/enroll',enrollRouter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
