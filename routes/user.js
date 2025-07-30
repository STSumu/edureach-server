const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const {queries }=require('../queries/queries');
const verifyFirebaseToken = require('./firebase/authMiddleware');

router.post('/sync', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;
    const { username } = req.body;

    const currentTime = new Date();
    const active = true;


    const rolePriority = `
      CASE 
        WHEN role = 'admin' THEN 1
        WHEN role = 'student' THEN 2
        WHEN role = 'teacher' THEN 3
        ELSE 4 
      END
    `;


    let result = await query(
      `SELECT user_id, role FROM "user"
       WHERE firebase_uid = $1
       ORDER BY ${rolePriority}
       LIMIT 1`,
      [uid]
    );


    if (result.rows.length === 0) {
      result = await query(
        `SELECT user_id, role FROM "user"
         WHERE email = $1
         ORDER BY ${rolePriority}
         LIMIT 1`,
        [email]
      );

    
      if (result.rows.length > 0) {
        await query(
          `UPDATE "user" 
           SET firebase_uid = $1, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $2`,
          [uid, result.rows[0].user_id]
        );
      }
    }

    let userId, userRole;

    
    if (result.rows.length === 0) {
      userRole = 'student';
      const insert = await query(
        `INSERT INTO "user" 
         (user_name, email, is_active, firebase_uid, profile_pic, role, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING user_id, role`,
        [name || username, email, active, uid, picture || null, userRole, currentTime]
      );
      userId = insert.rows[0].user_id;
      userRole = insert.rows[0].role;

      return res.json({ user_id: userId, role: userRole, newUser: true });
    }

    
    userId = result.rows[0].user_id;
    userRole = result.rows[0].role;

    await query(
      `UPDATE "user"
       SET last_login_at = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [currentTime, active, userId]
    );

    res.json({ user_id: userId, role: userRole, newUser: false });

  } catch (err) {
    console.error("Error syncing user:", err);
    res.status(500).json({ error: err.message });
  }
});




router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const {uid}=req.user;

    const result = await query(
      `SELECT user_id, user_name, email, profile_pic, role 
       FROM "user" 
       WHERE firebase_uid = $1`,
      [uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows);
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

router.put('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { firstName, lastName, email, biography, facebook, instagram } = req.body;
    const uid = req.user?.uid;

    if (!uid) return res.status(401).json({ message: 'Unauthorized' });

    const result = await query(
      `SELECT user_id FROM "user" WHERE firebase_uid = $1`,
      [uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user_id = result.rows[0].user_id;
    const user_name = `${firstName} ${lastName}`;

    await query(
      queries.editProfile(user_name, email, biography, facebook, instagram, user_id)
    );

    res.status(200).json({ message: 'Profile updated successfully!' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile' });
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
