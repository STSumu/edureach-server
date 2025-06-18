const express = require('express')
const cors=require('cors');
const { pool, query } = require('./db');
const app = express()
const port=process.env.PORT || 4000;



async function run() {
  try {
    app.get('/users', async (req, res) => {
  const userId = req.params.id;

    const sqlQuery = {
      name: 'fetch-user',
      text: 'SELECT * FROM "user"',
      // values: [userId],
    };

    const result = await query(sqlQuery.text, sqlQuery.values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows);
  } )
}
catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
  } 
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
