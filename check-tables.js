const mysql = require('mysql2');

// Buat koneksi ke database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "tcg_db"
});

// Fungsi untuk memeriksa apakah tabel ada
const checkTable = (tableName) => {
  return new Promise((resolve, reject) => {
    db.query(`SHOW TABLES LIKE '${tableName}'`, (err, results) => {
      if (err) {
        console.error(`Error checking table ${tableName}:`, err);
        reject(err);
        return;
      }
      
      // Jika tabel ditemukan, results akan punya length > 0
      const tableExists = results.length > 0;
      console.log(`Table ${tableName} exists: ${tableExists}`);
      resolve(tableExists);
    });
  });
};

// Fungsi untuk membuat tabel jika tidak ada
const createTablesIfNeeded = async () => {
  try {
    console.log('Checking required tables...');
    
    // Cek tabel user_inventory
    const hasUserInventory = await checkTable('user_inventory');
    
    // Cek tabel transactions
    const hasTransactions = await checkTable('transactions');
    
    // Cek tabel order_items
    const hasOrderItems = await checkTable('order_items');
    
    // Jika salah satu tabel tidak ada, buat semua tabel
    if (!hasUserInventory || !hasTransactions || !hasOrderItems) {
      console.log('Some tables are missing. Creating tables...');
      
      // Baca file SQL
      const fs = require('fs');
      const path = require('path');
      const sqlPath = path.join(__dirname, '..', 'inventory_tables.sql');
      
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Split SQL statements
        const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
        
        // Execute each statement
        for (const stmt of statements) {
          await new Promise((resolve, reject) => {
            db.query(stmt, err => {
              if (err) {
                console.error('Error executing SQL:', err);
                reject(err);
                return;
              }
              resolve();
            });
          });
        }
        
        console.log('All tables created successfully!');
      } else {
        console.error('SQL file not found:', sqlPath);
      }
    } else {
      console.log('All required tables exist.');
    }
  } catch (err) {
    console.error('Error setting up tables:', err);
  } finally {
    // Close the connection
    db.end();
  }
};

// Jalankan pemeriksaan tabel
createTablesIfNeeded();
