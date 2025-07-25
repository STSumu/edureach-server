const admin = require("./firebase");
const { query } = require('../../db/db');

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Look up internal user_id (if exists)
    const result = await query('SELECT user_id FROM "user" WHERE firebase_uid = $1', [decodedToken.uid]);
    const userId = result.rows.length > 0 ? result.rows[0].user_id : null;

    req.user = {
      ...decodedToken,
      user_id: userId, // Might be null for new users
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

module.exports = verifyFirebaseToken;
