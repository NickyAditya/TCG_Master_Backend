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

// GET ALL
router.get("/", (req, res) => {
  db.query("SELECT * FROM cards", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// GET BY ID
router.get("/:id", (req, res) => {
  db.query("SELECT * FROM cards WHERE id = ?", [req.params.id], (err, results) => {
    if (results.length === 0) return res.status(404).json({ message: "Not found" });
    res.json(results[0]);
  });
});

// CREATE
router.post("/", (req, res) => {
  const { name, game, set, rarity, price, stock, image } = req.body;

  db.query(
    "INSERT INTO cards (name, game, card_set, rarity, price, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name, game, set, rarity, price, stock, image],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.status(201).json({ id: result.insertId });
    }
  );
});

// UPDATE
router.put("/:id", (req, res) => {
  const { name, game, set, rarity, price, stock, image } = req.body;

  db.query(
    "UPDATE cards SET name=?, game=?, card_set=?, rarity=?, price=?, stock=?, image=? WHERE id=?",
    [name, game, set, rarity, price, stock, image, req.params.id],
    (err, result) => {
      if (result.affectedRows === 0) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Updated" });
    }
  );
});

// DELETE
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM cards WHERE id = ?", [req.params.id], (err, result) => {
    if (result.affectedRows === 0) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  });
});

export default router;