const express = require("express");
const cors = require("cors");
const { pool, query } = require("./db");
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 4000;

async function run() {
  try {
    app.get("/users", async (req, res) => {
      const sqlQuery = {
        name: "fetch-user",
        text: 'SELECT * FROM "user"',
      };

      const result = await query(sqlQuery.text);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(result.rows);
    });
    app.get('/courses',async(req,res)=>{
      const fetchquery={
        name:'fetch-courses',
        text: 'SELECT * FROM COURSE',
      }
      const result=await query(fetchquery.text);
      res.json(result.rows);
    })
    app.get('/material/:courseName',async(req,res)=>{
      const courseName=req.params.courseName;
      const q={
        name:'material-query',
        text:'SELECT M.* FROM MATERIAL M JOIN COURSE C ON(M.COURSE_ID=C.COURSE_ID) WHERE UPPER(C.COURSE_NAME)=UPPER($1)',
        values:[courseName],
      }
      const result=await query(q.text,q.values);
      res.json(result.rows);
    })
    app.get('/user/:usertype',async(req,res)=>{
      const userType=req.params.usertype;
      const userquery={
        name:'count-user',
        text:`SELECT * from ${userType}`,
      }
      const result=await query(userquery.text);
      res.json(result.rows.length);
    })
    app.get('/categories',async(req,res)=>{
      const q={
        name:'allcategory',
        text:'SELECT CATEGORY,JSON_AGG(COURSE_NAME) as COURSES FROM COURSE GROUP BY CATEGORY',
      }
      const result=await query(q.text);
      res.json(result.rows);
    })
    
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
