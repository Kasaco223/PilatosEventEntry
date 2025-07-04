# 🚀 Setup Rápido con Vite

## Instalación en 3 pasos

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar en desarrollo
```bash
npm run dev
```

### 3. ¡Listo!
- El navegador se abrirá automáticamente en `http://localhost:3000`
- Permite acceso a la cámara cuando se solicite
- ¡Comienza a escanear códigos!

## Comandos útiles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo en puerto 3000

# Producción
npm run build        # Crear build optimizado
npm run preview      # Previsualizar build de producción

# Otros
npm run serve        # Alias para preview
```

## Acceso desde móvil

El servidor de desarrollo está configurado para permitir acceso desde otros dispositivos en tu red local:

1. Ejecuta `npm run dev`
2. Vite mostrará la IP local (ej: `http://192.168.1.100:3000`)
3. Abre esa URL en tu móvil
4. ¡Escanea códigos desde tu teléfono!

## Troubleshooting

### Error: "Cannot find module"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3000 is already in use"
```bash
# Cambiar puerto en vite.config.js o usar otro puerto
npm run dev -- --port 3001
```

### Error de cámara en móvil
- Asegúrate de usar HTTPS en producción
- Verifica permisos de cámara en el navegador móvil
- Prueba en modo incógnito

---

**¡Disfruta escaneando códigos! 🎉** 