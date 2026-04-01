const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// Create database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "tcg_db"
});

// Get all transactions with user info
router.get('/', (req, res) => {
  const sql = `
    SELECT t.id, t.user_id, u.username, t.transaction_date, t.total_amount, t.status
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    ORDER BY t.transaction_date DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching transactions:', err);
      return res.status(500).json({ message: 'Error fetching transactions' });
    }
    
    res.json(results);
  });
});

// Get transaction details with order items
router.get('/:id', (req, res) => {
  const transactionId = req.params.id;
  
  const sql = `
    SELECT oi.*, c.name, c.game, c.image
    FROM order_items oi
    JOIN cards c ON oi.card_id = c.id
    WHERE oi.transaction_id = ?
  `;
  
  db.query(sql, [transactionId], (err, results) => {
    if (err) {
      console.error('Error fetching transaction details:', err);
      return res.status(500).json({ message: 'Error fetching transaction details' });
    }
    
    res.json(results);
  });
});

// Get transactions for a specific user
router.get('/user/:userId', (req, res) => {
  const userId = req.params.userId;
  
  const sql = `
    SELECT t.*
    FROM transactions t
    WHERE t.user_id = ?
    ORDER BY t.transaction_date DESC
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user transactions:', err);
      return res.status(500).json({ message: 'Error fetching user transactions' });
    }
    
    res.json(results);
  });
});

// Update transaction status
router.put('/:id/status', (req, res) => {
  const transactionId = req.params.id;
  const { status } = req.body;
  
  if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }
  
  const sql = `UPDATE transactions SET status = ? WHERE id = ?`;
  
  db.query(sql, [status, transactionId], (err, result) => {
    if (err) {
      console.error('Error updating transaction status:', err);
      return res.status(500).json({ message: 'Error updating transaction status' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ 
      message: 'Transaction status updated successfully',
      status
    });
  });
});

module.exports = router;
