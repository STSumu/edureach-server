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

app.use('/users', usersRouter);
app.use('/courses', coursesRouter);
app.use('/material', materialsRouter);
// app.use('/user', userTypeRouter);
app.use('/categories', categoriesRouter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
