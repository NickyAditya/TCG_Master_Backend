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

// Get all cards
router.get('/', (req, res) => {
  const sql = "SELECT * FROM cards";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching cards:', err);
      return res.status(500).json({ message: 'Error fetching cards' });
    }
    res.json(results);
  });
});

// Get a single card by ID
router.get('/:id', (req, res) => {
  const sql = "SELECT * FROM cards WHERE id = ?";
  
  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching card:', err);
      return res.status(500).json({ message: 'Error fetching card' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    res.json(results[0]);
  });
});

// Create a new card
router.post('/', (req, res) => {
  const { name, game, set, rarity, price, stock, image } = req.body;
  
  if (!name || !game) {
    return res.status(400).json({ message: 'Name and game are required' });
  }
  
  const sql = "INSERT INTO cards (name, game, card_set, rarity, price, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?)";
  
  db.query(sql, [name, game, set, rarity, price, stock, image], (err, result) => {
    if (err) {
      console.error('Error creating card:', err);
      return res.status(500).json({ message: 'Error creating card' });
    }
    
    res.status(201).json({ 
      id: result.insertId,
      name,
      game,
      set,
      rarity,
      price,
      stock,
      image
    });
  });
});

// Update a card
router.put('/:id', (req, res) => {
  const { name, game, set, rarity, price, stock, image } = req.body;
  const cardId = req.params.id;
  
  if (!name || !game) {
    return res.status(400).json({ message: 'Name and game are required' });
  }
  
  const sql = "UPDATE cards SET name = ?, game = ?, card_set = ?, rarity = ?, price = ?, stock = ?, image = ? WHERE id = ?";
  
  db.query(sql, [name, game, set, rarity, price, stock, image, cardId], (err, result) => {
    if (err) {
      console.error('Error updating card:', err);
      return res.status(500).json({ message: 'Error updating card' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    res.json({ 
      id: cardId,
      name,
      game,
      set,
      rarity,
      price,
      stock,
      image
    });
  });
});

// Update only the stock of a card
router.patch('/:id/stock', (req, res) => {
  const { stock } = req.body;
  const cardId = req.params.id;
  
  if (stock === undefined) {
    return res.status(400).json({ message: 'Stock value is required' });
  }
  
  const sql = "UPDATE cards SET stock = ? WHERE id = ?";
  
  db.query(sql, [stock, cardId], (err, result) => {
    if (err) {
      console.error('Error updating card stock:', err);
      return res.status(500).json({ message: 'Error updating card stock' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    res.json({ id: cardId, stock });
  });
});

// Delete a card
router.delete('/:id', (req, res) => {
  const sql = "DELETE FROM cards WHERE id = ?";
  
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting card:', err);
      return res.status(500).json({ message: 'Error deleting card' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    res.json({ message: 'Card deleted successfully' });
  });
});

module.exports = router;
