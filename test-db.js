const initSqlJs = require('sql.js');
const fs = require('fs');

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run("CREATE TABLE t (id INTEGER, name TEXT); INSERT INTO t VALUES (1, 'test');");
  const res = db.exec("SELECT * FROM t");
  console.log('Result:', JSON.stringify(res));
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync('./test.db', buffer);
  console.log('Saved to disk:', fs.existsSync('./test.db'));
  fs.unlinkSync('./test.db');
}

main().catch(console.error);
