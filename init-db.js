import sqlite3 from 'sqlite3';
import fs from 'fs';

const dbFile = './mogdata.db';
const csvFile = './mogdata.csv';

const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS personas`);
  db.run(`CREATE TABLE personas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    faccion TEXT,
    ingreso TEXT,
    hora_ingreso TEXT
  )`, (err) => {
    if (err) throw err;

    const lines = fs.readFileSync(csvFile, 'utf8').split('\n').slice(1);
    const stmt = db.prepare("INSERT INTO personas (nombre, faccion, ingreso, hora_ingreso) VALUES (?, ?, ?, ?)");
    lines.forEach(line => {
      const [nombre, faccion, ingreso] = line.split(',');
      if (nombre && faccion) {
        stmt.run(nombre.trim(), faccion.trim(), (ingreso || '').trim(), '');
      }
    });
    stmt.finalize();
    console.log('Base de datos inicializada desde CSV.');
    db.close();
  });
});