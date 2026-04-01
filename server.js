import dotenv from "dotenv";
dotenv.config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const userRoutes = require("./routes/users");
const cardRoutes = require("./routes/cards");
const inventoryRoutes = require("./routes/inventory");
const transactionRoutes = require("./routes/transactions");
const uploadRoutes = require("./routes/uploads");
const PORT = process.env.PORT || 10000;

const app = express();
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/users/inventory", inventoryRoutes); // Endpoint untuk akses inventory user
app.use("/api/transactions", transactionRoutes); // Endpoint untuk akses log transaksi
app.use("/api/uploads", uploadRoutes); // Endpoint untuk upload gambar

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

app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  const hashed = bcrypt.hashSync(password, 10);
  const role = req.body.role || 'user';

  const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
  db.query(sql, [username, email, hashed, role], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Registrasi berhasil!" });
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM users WHERE username = ?", [username], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(401).json({ message: "User tidak ditemukan" });

    const user = result[0];
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign({ id: user.id, role: user.role }, "SECRET123", { expiresIn: "1h" });

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


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});