const express = require("express");
const router = express.Router();
const { query } = require("../db/db");
const { queries } = require("../queries/queries");

router.get("/:stdid", async (req, res) => {
  try {
    const stdId=req.params.stdid;
    const courseId=req.query.courseId;
    const { text, values } = queries.checkEnroll(stdId, courseId);
    const result = await query(text, values);
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports=router;