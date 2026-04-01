const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

// Create database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "tcg_db"
});

// Get all users
router.get('/', (req, res) => {
  const sql = "SELECT id, username, email, role, balance FROM users";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ message: 'Error fetching users' });
    }
    res.json(results);
  });
});

// Get a single user by ID
router.get('/:id', (req, res) => {
  const sql = "SELECT id, username, email, role, balance FROM users WHERE id = ?";
  
  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ message: 'Error fetching user' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(results[0]);
  });
});

// Update user balance
router.post('/:id/balance', (req, res) => {
  const userId = req.params.id;
  const { amount } = req.body;
  
  if (!amount || isNaN(amount) || amount < 100000) {
    return res.status(400).json({ message: 'Valid amount required (minimum Rp. 100,000)' });
  }
  
  // Get current balance first
  db.query(
    "SELECT balance FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error fetching user balance:', err);
        return res.status(500).json({ message: 'Error updating balance' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const currentBalance = parseFloat(results[0].balance) || 0;
      const newBalance = currentBalance + parseFloat(amount);
      
      // Update balance
      db.query(
        "UPDATE users SET balance = ? WHERE id = ?",
        [newBalance, userId],
        (err, result) => {
          if (err) {
            console.error('Error updating balance:', err);
            return res.status(500).json({ message: 'Error updating balance' });
          }
          
          res.json({ 
            message: 'Balance updated successfully',
            balance: newBalance
          });
        }
      );
    }
  );
});

// Create a new user
router.post('/', (req, res) => {
  const { username, email, password, role } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }
  
  const hashed = bcrypt.hashSync(password, 10);
  const userRole = role || 'user';
  
  // Check if username or email already exists
  db.query(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, email],
    (err, results) => {
      if (err) {
        console.error('Error checking existing user:', err);
        return res.status(500).json({ message: 'Error creating user' });
      }
      
      if (results.length > 0) {
        return res.status(409).json({ message: 'Username or email already exists' });
      }
      
      // Insert new user
      const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
      
      db.query(sql, [username, email, hashed, userRole], (err, result) => {
        if (err) {
          console.error('Error creating user:', err);
          return res.status(500).json({ message: 'Error creating user' });
        }
        
        res.status(201).json({ 
          id: result.insertId,
          username,
          email,
          role: userRole
        });
      });
    }
  );
});

// Update a user
router.put('/:id', (req, res) => {
  const { username, email, role, password } = req.body;
  const userId = req.params.id;
  
  // Get the existing user to check what's being updated
  db.query(
    "SELECT * FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error fetching user for update:', err);
        return res.status(500).json({ message: 'Error updating user' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const user = results[0];
      
      // Check if username or email is being changed and verify they don't conflict
      if (username !== user.username || email !== user.email) {
        db.query(
          "SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?",
          [username, email, userId],
          (err, conflicts) => {
            if (err) {
              console.error('Error checking for conflicts:', err);
              return res.status(500).json({ message: 'Error updating user' });
            }
            
            if (conflicts.length > 0) {
              return res.status(409).json({ message: 'Username or email already exists' });
            }
            
            // No conflicts, proceed with update
            performUpdate();
          }
        );
      } else {
        // No potential conflicts, proceed with update
        performUpdate();
      }
      
      function performUpdate() {
        // If password is provided, hash it
        let updateValues = [username, email, role];
        let updateSql = "UPDATE users SET username = ?, email = ?, role = ?";
        
        if (password && password.trim() !== '') {
          const hashed = bcrypt.hashSync(password, 10);
          updateSql += ", password = ?";
          updateValues.push(hashed);
        }
        
        updateSql += " WHERE id = ?";
        updateValues.push(userId);
        
        db.query(updateSql, updateValues, (err, result) => {
          if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ message: 'Error updating user' });
          }
          
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
          }
          
          res.json({ 
            id: userId,
            username,
            email,
            role
          });
        });
      }
    }
  );
});

// Delete a user
router.delete('/:id', (req, res) => {
  const sql = "DELETE FROM users WHERE id = ?";
  
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ message: 'Error deleting user' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  });
});

module.exports = router;
