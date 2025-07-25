const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const {queries }=require('../queries/queries');
const verifyFirebaseToken = require('./firebase/authMiddleware');


router.post('/sync', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;
    const { role = 'student', username } = req.body;

    const currentTime = new Date();

    // Check for user with the same Firebase UID AND role
    let result = await query(
      `SELECT user_id FROM "user" WHERE firebase_uid = $1 AND role = $2`,
      [uid, role]
    );

    // Fallback: match by email + role (in case UID is not linked yet)
    if (result.rows.length === 0) {
      result = await query(
        `SELECT user_id FROM "user" WHERE email = $1 AND role = $2`,
        [email, role]
      );
    }
    const active=true;
    let userId;
    if (result.rows.length === 0) {
      
      // New role or new user → create a fresh row
      const insert = await query(
        `INSERT INTO "user" (user_name, email,is_active,firebase_uid, profile_pic, role, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6,$7)
         RETURNING user_id`,
        [name || username, email,active, uid, picture || null, role, currentTime]
      );
      userId = insert.rows[0].user_id;
      return res.json({ user_id: userId, newUser: true });
    }

    // Existing user for this role → update last_login_at
    userId = result.rows[0].user_id;
    await query(
      `UPDATE "user"
       SET last_login_at = $1,is_active=$2,updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [currentTime,active,userId]
    );

    res.json({ user_id: userId, newUser: false });
  } catch (err) {
    console.error("Error syncing user:", err);
    res.status(500).json({ error: err.message });
  }
});


router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await query(
      `SELECT user_id, user_name, email, profile_pic, role 
       FROM "user" 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: err.message });
  }
});


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

router.put('/deactivate', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;

    await query(
      `UPDATE "user" SET is_active = false, last_logout_at = CURRENT_TIMESTAMP WHERE firebase_uid = $1`,
      [uid]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error deactivating user:", err);
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
