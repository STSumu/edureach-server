const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { queries } = require('../queries/queries');

// GET all users
router.get('/', async (req, res) => {
  try {
    const result = await query(queries.users.text);
    if (result.rows.length === 0) return res.status(404).json({ message: 'No users found' });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/:userEmail', async (req, res) => {
  try {
    const userEmail = req.params.userEmail;
    const { text, values } = queries.dbUser(userEmail);
    const result = await query(text, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'No users found' });
    res.json(result.rows[0]);
  } 
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new user
router.post('/', async (req, res) => {
  try {
      const user=req.body;
    const { text, values } = queries.user(user);
  const result = await query(text, values);
      res.send(result.rows[0]);
  } catch (err) {
  console.error(err); // <---- Check this console output
  res.status(500).json({ error: err.message });
}

});

module.exports = router;
