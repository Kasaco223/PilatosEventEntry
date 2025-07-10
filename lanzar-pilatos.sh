#!/bin/bash
cd /home/nea/PilatosEventEntry

# Iniciar el backend primero
node serve.js &

# Iniciar el frontend
npm run dev &

sleep 8

while true; do
    # Verifica si Firefox está corriendo
    if pgrep firefox > /dev/null; then
        echo "Firefox ya está abierto."
        break
    else
        echo "Firefox no está abierto. Intentando abrirlo..."
        firefox --kiosk http://localhost:3000 &
    fi
    sleep 5
done 