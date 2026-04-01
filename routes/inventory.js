import express from "express";
import mysql from "mysql2";

const router = express.Router();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

// GET INVENTORY
router.get("/:userId", (req, res) => {
  const sql = `
    SELECT ui.*, c.name, c.game, c.image
    FROM user_inventory ui
    JOIN cards c ON ui.card_id = c.id
    WHERE ui.user_id = ?
  `;

  db.query(sql, [req.params.userId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

export default router;