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
    
    let processedCount = 0;
    let skippedCount = 0;
    
    lines.forEach((line, index) => {
      // Filtrar líneas vacías o que solo contengan espacios
      if (line.trim() === '') {
        skippedCount++;
        return;
      }
      
      const [nombre, faccion, ingreso] = line.split(',');
      
      // Validar que nombre y faccion existan y no estén vacíos
      if (nombre && faccion && nombre.trim() !== '' && faccion.trim() !== '') {
        stmt.run(nombre.trim(), faccion.trim(), (ingreso || '').trim(), '');
        processedCount++;
      } else {
        console.log(`Línea ${index + 2} saltada: nombre="${nombre}", faccion="${faccion}"`);
        skippedCount++;
      }
    });
    
    stmt.finalize(() => {
      console.log(`Base de datos inicializada desde CSV.`);
      console.log(`Procesadas: ${processedCount} líneas`);
      console.log(`Saltadas: ${skippedCount} líneas`);
      console.log(`Total líneas en CSV: ${lines.length}`);
      db.close();
    });
  });
});