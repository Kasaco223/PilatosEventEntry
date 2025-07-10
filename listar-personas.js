import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./mogdata.db');

db.all('SELECT * FROM personas', (err, rows) => {
  if (err) throw err;
  console.log(rows);
  db.close();
}); 