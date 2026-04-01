import express from "express";
import bcrypt from "bcryptjs";
import mysql from "mysql2";

const router = express.Router();

// ✅ PAKAI ENV (BUKAN LOCALHOST)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

// GET ALL USERS
router.get("/", (req, res) => {
  db.query("SELECT id, username, email, role, balance FROM users", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// GET USER BY ID
router.get("/:id", (req, res) => {
  db.query(
    "SELECT id, username, email, role, balance FROM users WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (results.length === 0) return res.status(404).json({ message: "User not found" });
      res.json(results[0]);
    }
  );
});

// UPDATE BALANCE
router.post("/:id/balance", (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || amount < 100000) {
    return res.status(400).json({ message: "Minimum Rp 100.000" });
  }

  db.query("SELECT balance FROM users WHERE id = ?", [req.params.id], (err, results) => {
    if (results.length === 0) return res.status(404).json({ message: "User not found" });

    const newBalance = (results[0].balance || 0) + Number(amount);

    db.query(
      "UPDATE users SET balance = ? WHERE id = ?",
      [newBalance, req.params.id],
      (err) => {
        if (err) return res.status(500).json(err);

        res.json({
          message: "Balance updated",
          balance: newBalance
        });
      }
    );
  });
});

// CREATE USER
router.post("/", (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  const hashed = bcrypt.hashSync(password, 10);

  db.query(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, email],
    (err, results) => {
      if (results.length > 0) {
        return res.status(409).json({ message: "Sudah ada" });
      }

      db.query(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        [username, email, hashed, role || "user"],
        (err, result) => {
          if (err) return res.status(500).json(err);

          res.status(201).json({
            id: result.insertId,
            username,
            email
          });
        }
      );
    }
  );
});

// UPDATE USER
router.put("/:id", (req, res) => {
  const { username, email, role, password } = req.body;

  let sql = "UPDATE users SET username=?, email=?, role=?";
  let values = [username, email, role];

  if (password) {
    const hashed = bcrypt.hashSync(password, 10);
    sql += ", password=?";
    values.push(hashed);
  }

  sql += " WHERE id=?";
  values.push(req.params.id);

  db.query(sql, values, (err, result) => {
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Updated" });
  });
});

// DELETE USER
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM users WHERE id = ?", [req.params.id], (err, result) => {
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Deleted" });
  });
});

export default router;