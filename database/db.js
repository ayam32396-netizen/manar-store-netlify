const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './data/manar_store.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

class SQLiteDatabase {
  constructor(databasePath) {
    this.dbPath = databasePath;
    this.rawDb = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  async init() {
    if (this.isInitialized) return this;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const wasmPath = path.join(path.dirname(require.resolve('sql.js')), 'sql-wasm.wasm');
      const wasmBinary = fs.readFileSync(wasmPath);
      const SQL = await initSqlJs({ wasmBinary });

      if (fs.existsSync(this.dbPath)) {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.rawDb = new SQL.Database(fileBuffer);
      } else {
        this.rawDb = new SQL.Database();
      }

      this.rawDb.run(`
        CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT DEFAULT 'admin',
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          discount REAL DEFAULT NULL,
          category TEXT NOT NULL CHECK(category IN ('hair', 'skin', 'body')),
          image TEXT NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          address TEXT NOT NULL,
          subtotal REAL NOT NULL,
          discount REAL DEFAULT 0,
          total REAL NOT NULL,
          status TEXT DEFAULT 'new' CHECK(status IN ('new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER,
          product_name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          price_at_purchase REAL NOT NULL,
          discount_at_purchase REAL DEFAULT 0,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);

      try {
        this.rawDb.run(`ALTER TABLE admins ADD COLUMN username TEXT DEFAULT 'admin';`);
      } catch (e) {}

      this.save();
      this.isInitialized = true;
      return this;
    })();

    return this.initPromise;
  }

  save() {
    if (!this.rawDb) return;
    try {
      const data = this.rawDb.export();
      fs.writeFileSync(this.dbPath, Buffer.from(data));
    } catch (err) {
      console.error('Error saving SQLite database to disk:', err);
    }
  }

  pragma(str) {
    try {
      if (this.rawDb) this.rawDb.run(`PRAGMA ${str}`);
    } catch (e) {}
  }

  exec(sql) {
    if (!this.rawDb) throw new Error('Database not initialized. Call await db.init() first.');
    this.rawDb.run(sql);
    this.save();
  }

  transaction(fn) {
    const self = this;
    return (...args) => {
      if (!self.rawDb) throw new Error('Database not initialized. Call await db.init() first.');
      const res = fn(...args);
      self.save();
      return res;
    };
  }

  prepare(sql) {
    const self = this;
    return {
      get(...params) {
        if (!self.rawDb) throw new Error('Database not initialized.');
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = self.rawDb.prepare(sql);
        try {
          if (flatParams.length > 0) {
            stmt.bind(flatParams);
          }
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },
      all(...params) {
        if (!self.rawDb) throw new Error('Database not initialized.');
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = self.rawDb.prepare(sql);
        const rows = [];
        try {
          if (flatParams.length > 0) {
            stmt.bind(flatParams);
          }
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          return rows;
        } finally {
          stmt.free();
        }
      },
      run(...params) {
        if (!self.rawDb) throw new Error('Database not initialized.');
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = self.rawDb.prepare(sql);
        try {
          if (flatParams.length > 0) {
            stmt.bind(flatParams);
          }
          stmt.step();
        } finally {
          stmt.free();
        }

        let lastId = 0;
        try {
          const res = self.rawDb.exec('SELECT last_insert_rowid() AS id');
          if (res.length > 0 && res[0].values.length > 0) {
            lastId = res[0].values[0][0];
          }
        } catch (e) {}

        const changes = self.rawDb.getRowsModified();
        self.save();
        return { lastInsertRowid: lastId, changes };
      }
    };
  }
}

const dbInstance = new SQLiteDatabase(dbPath);

module.exports = dbInstance;
