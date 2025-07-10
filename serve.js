import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import os from 'os';

const app = express();
app.use(cors());
const db = new sqlite3.Database('./mogdata.db');

app.use(express.json());

// Consultar persona por nombre
app.get('/persona/:nombre', (req, res) => {
  const nombre = req.params.nombre;
  db.get('SELECT * FROM personas WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?))', [nombre], (err, row) => {
    if (err) return res.status(500).json({error: err.message});
    if (!row) return res.status(404).json({error: 'No encontrado'});
    res.json(row);
  });
});

// Marcar ingreso y guardar hora con logs detallados
app.post('/ingreso', (req, res) => {
  let { nombre } = req.body;
  nombre = nombre.trim();
  const hora = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log('Intentando registrar ingreso para:', nombre);
  db.get('SELECT * FROM personas WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?))', [nombre], (err, row) => {
    if (err) {
      console.error('Error buscando persona:', err.message);
      return res.status(500).json({error: err.message});
    }
    if (!row) {
      console.warn('No se encontró la persona en la base:', nombre);
      return res.status(404).json({error: 'No encontrado'});
    }
    // Revisar si ya ha ingresado antes
    let veces = 1;
    let nuevasFechas = hora;
    if (row.ingreso && row.ingreso !== 'No' && row.ingreso !== 'Yes') {
      // Ejemplo: '2 veces'
      const match = row.ingreso.match(/(\d+)/);
      if (match) veces = parseInt(match[1], 10) + 1;
      else veces = 2;
    } else if (row.ingreso === 'Yes') {
      veces = 2;
    }
    if (row.hora_ingreso && row.hora_ingreso.trim() !== '') {
      nuevasFechas = row.hora_ingreso + ' | ' + hora;
    }
    const ingresoStr = veces === 1 ? 'Yes' : `${veces} veces`;
    db.run('UPDATE personas SET ingreso = ?, hora_ingreso = ? WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?))', [ingresoStr, nuevasFechas, nombre], function(err) {
      if (err) {
        console.error('Error en SQLite:', err.message);
        return res.status(500).json({error: err.message});
      }
      console.log('Ingreso actualizado. Veces:', veces, 'Fechas:', nuevasFechas);
      // Determinar el mensaje según si ya tiene una fecha registrada
      let mensaje;
      if (!row.hora_ingreso || row.hora_ingreso.trim() === '') {
        mensaje = `Bienvenido ${row.nombre}. Tu facción es ${row.faccion}`;
      } else {
        mensaje = `Bienvenido de vuelta ${row.nombre}. Tu facción es ${row.faccion}`;
      }
      res.json({success: true, hora_ingreso: nuevasFechas, mensaje});
    });
  });
});

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = 3001;
const HOST = '0.0.0.0';
let isServer = true;

console.log('Intentando iniciar el backend en toda la red local...');
const server = app.listen(PORT, HOST, () => {
  const ip = getLocalIp();
  console.log('==============================================');
  console.log(`✅ API escuchando en http://${ip}:${PORT}`);
  console.log('Puedes acceder desde otros dispositivos en la red local usando esta IP.');
  console.log('==============================================');
  isServer = true;
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    isServer = false;
    console.log('==============================================');
    console.log(`⚠️  Puerto ${PORT} en uso. Actuando como cliente.`);
    console.log('Por favor, abre el frontend y configura la IP del servidor padre (el que tiene la base de datos).');
    console.log('==============================================');
  } else {
    throw err;
  }
}); 