#!/bin/bash
cd /home/nea/PilatosEventEntry
node init-db.js
npm run dev &
sleep 8
firefox --kiosk http://localhost:3000 