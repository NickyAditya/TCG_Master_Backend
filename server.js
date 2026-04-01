import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";

// IMPORT ROUTES (WAJIB pakai .js di ESM)
import userRoutes from "./routes/users.js";
import cardRoutes from "./routes/cards.js";
import inventoryRoutes from "./routes/inventory.js";
import transactionRoutes from "./routes/transactions.js";
import uploadRoutes from "./routes/uploads.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/users/inventory", inventoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/uploads", uploadRoutes);

// DB Connection
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

// Test koneksi DB (biar gak crash diam-diam)
db.connect((err) => {
  if (err) {
    console.error("DB ERROR:", err);
  } else {
    console.log("DB CONNECTED");
  }
});

// Register
app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  const hashed = bcrypt.hashSync(password, 10);
  const role = req.body.role || "user";

  const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
  db.query(sql, [username, email, hashed, role], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Registrasi berhasil!" });
  });
});

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM users WHERE username = ?", [username], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(401).json({ message: "User tidak ditemukan" });

    const user = result[0];
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      "SECRET123",
      { expiresIn: "1h" }
    );

    res.json({
      token,
      role: user.role,
      id: user.id,
      username: user.username,
      email: user.email,
      balance: user.balance || 0
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});