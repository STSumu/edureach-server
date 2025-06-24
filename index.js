const express = require("express");
const cors = require("cors");
const { pool, query } = require("./db");
const { queries } = require("./queries");
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

async function run() {
  try {
    app.get("/users", async (req, res) => {
      const result = await query(queries.users.text);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(result.rows);
    });


    app.get('/courses',async(req,res)=>{
      
      const result=await query(queries.courses.text);
      res.json(result.rows);
    })


    app.get('/material/:courseName',async(req,res)=>{
      const courseName=req.params.courseName;
      
      const result=await query(queries.material.text,queries.material.values);
      res.json(result.rows);
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
