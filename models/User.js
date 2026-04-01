/*
MySQL Schema for users table in tcg_db:

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  balance DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Index recommendations:
- CREATE INDEX idx_username ON users (username);
- CREATE INDEX idx_email ON users (email);
- CREATE INDEX idx_role ON users (role);
*/

module.exports = {
  // This is just a reference model - MySQL schema is defined in comment above
  tableName: 'users',
  fields: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    username: 'VARCHAR(50) NOT NULL UNIQUE',
    email: 'VARCHAR(100) NOT NULL UNIQUE', 
    password: 'VARCHAR(255) NOT NULL',
    role: "ENUM('user', 'admin') DEFAULT 'user'",
    balance: 'DECIMAL(12,2) DEFAULT 0.00',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};
