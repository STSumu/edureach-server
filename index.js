const express = require("express");
const cors = require("cors");
const { pool, query } = require("./db");
const { queries } = require("./queries");
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 4000;


async function run() {
  try {
    app.get("/users", async (req, res) => {
      const result = await query(queries.users.text);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(result.rows);
    });

    app.post('/user',async(req,res)=>{
      const user=req.body;
      console.log(req.body);
    const { text, values } = queries.user(user);
    console.log(text,values);
  const result = await query(text, values);
      res.send(result.rows[0]);
    })

  //   app.post('/cart/:course_name',async(req,res)=>{
  //     const course=req.body;
  //     console.log(req.body);
  // const result = await query(text, values);
  //     res.send(result.rows[0]);
  //   })

    app.get('/courses',async(req,res)=>{
      
      const result=await query(queries.courses.text);
      res.json(result.rows);
    })


    app.get('/material/:courseName',async(req,res)=>{
      const courseName=req.params.courseName;
      
      const result=await query(queries.material.text,queries.material.values);
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
      const result=await query(queries.allCategory.text);
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
