# 🔍 Escáner de Códigos de Barras y QR

Un escáner web moderno que permite escanear tanto códigos QR como códigos de barras 1D usando la cámara del navegador.

## ✨ Características

- **Escaneo de códigos QR** usando HTML5-QRCode
- **Escaneo de códigos de barras 1D** usando Quagga2
- **Interfaz moderna y responsiva** con diseño atractivo
- **Vista previa en vivo** de la cámara
- **Guías visuales** para el escaneo
- **Historial de resultados** con timestamps
- **Preparado para integración** con backend via WebSocket o HTTP
- **Compatible con móviles** y tablets

## 🚀 Instalación y Uso

### Requisitos Previos

- Node.js 16+ instalado
- Navegador moderno con soporte para `getUserMedia`
- Cámara web funcional
- Para producción: conexión HTTPS (requerido para acceso a cámara)

### Instalación con Vite (Recomendado)

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

3. **Acceder a la aplicación:**
   - El navegador se abrirá automáticamente en `http://localhost:3000`
   - O ve manualmente a `http://localhost:3000`

### Instalación Manual (Sin Vite)

1. **Descarga los archivos:**
   ```bash
   # Clona o descarga los archivos del proyecto
   # Asegúrate de tener estos archivos en tu directorio:
   # - index.html
   # - style.css
   # - main.js
   ```

2. **Abre el proyecto:**
   ```bash
   # Opción 1: Abrir directamente en el navegador
   # Haz doble clic en index.html
   
   # Opción 2: Servidor local (recomendado)
   # Usando Python 3:
   python -m http.server 8000
   
   # Usando Node.js (si tienes http-server instalado):
   npx http-server
   
   # Usando PHP:
   php -S localhost:8000
   ```

3. **Accede a la aplicación:**
   - Abre tu navegador
   - Ve a `http://localhost:8000` (si usaste servidor local)
   - O abre directamente el archivo `index.html`

### Uso de la Aplicación

1. **Permitir acceso a la cámara** cuando el navegador lo solicite
2. **Seleccionar el modo** de escaneo:
   - **Código QR**: Para escanear códigos QR
   - **Código de Barras**: Para escanear códigos de barras 1D
3. **Hacer clic en "Iniciar Escaneo"**
4. **Apunta la cámara** hacia el código que deseas escanear
5. **Los resultados aparecerán** en la sección inferior
6. **Hacer clic en "Detener Escaneo"** cuando termines

### Build de Producción

Para crear una versión optimizada para producción:

```bash
# Crear build de producción
npm run build

# Previsualizar el build
npm run preview
```

El build se generará en la carpeta `dist/` y estará optimizado para producción.

## 🛠️ Configuración Avanzada

### Ventajas de usar Vite

- **⚡ Desarrollo rápido**: Hot Module Replacement (HMR) instantáneo
- **📦 Optimización automática**: Bundling y minificación automática
- **🔧 Configuración simple**: Configuración mínima requerida
- **📱 Soporte móvil**: Acceso desde otros dispositivos en la red local
- **🚀 Build optimizado**: Generación de assets optimizados para producción
- **🔄 Módulos ES6**: Soporte nativo para import/export

### Librerías Utilizadas

- **HTML5-QRCode** (v2.3.8): Para escaneo de códigos QR
- **Quagga2** (v0.12.1): Para escaneo de códigos de barras 1D

### Formatos de Códigos Soportados

**Códigos QR:**
- QR Code estándar
- Micro QR Code

**Códigos de Barras 1D:**
- Code 128
- EAN-13
- EAN-8
- Code 39
- Code 39 VIN
- Codabar
- UPC-A
- UPC-E
- Interleaved 2 of 5

## 🔧 Integración con Backend

### Opción 1: WebSocket (Tiempo Real)

Para enviar los resultados escaneados a un servidor WebSocket:

1. **Descomenta el código en `main.js`:**
   ```javascript
   // En la función connectWebSocket()
   this.websocket = new WebSocket(url);
   // ... resto del código
   ```

2. **Conecta desde la consola del navegador:**
   ```javascript
   // Conectar al servidor WebSocket
   window.codeScanner.connectWebSocket("ws://tu-servidor:puerto");
   ```

3. **Ejemplo de servidor WebSocket (Node.js):**
   ```javascript
   const WebSocket = require('ws');
   const wss = new WebSocket.Server({ port: 8080 });

   wss.on('connection', (ws) => {
     ws.on('message', (message) => {
       const data = JSON.parse(message);
       console.log('Código escaneado:', data);
       // Procesar el código aquí
     });
   });
   ```

### Opción 2: HTTP (REST API)

Para enviar los resultados via HTTP POST:

1. **Descomenta el código en `main.js`:**
   ```javascript
   // En la función sendToBackend()
   fetch('/api/scan', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(scanResult)
   })
   ```

2. **Configura tu endpoint:**
   ```javascript
   // Cambia la URL según tu backend
   fetch('https://tu-api.com/scan', {
     // ... configuración
   })
   ```

3. **Ejemplo de servidor HTTP (Node.js/Express):**
   ```javascript
   const express = require('express');
   const app = express();
   
   app.use(express.json());
   
   app.post('/api/scan', (req, res) => {
     const scanResult = req.body;
     console.log('Código escaneado:', scanResult);
     // Procesar el código aquí
     res.json({ success: true });
   });
   
   app.listen(3000, () => {
     console.log('Servidor en puerto 3000');
   });
   ```

## 📱 Compatibilidad

### Navegadores Soportados

- ✅ Chrome 53+
- ✅ Firefox 36+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Opera 40+

### Dispositivos

- ✅ Computadoras de escritorio
- ✅ Laptops
- ✅ Tablets
- ✅ Smartphones

## 🔒 Seguridad

### Consideraciones de Seguridad

1. **HTTPS Requerido**: En producción, el acceso a la cámara requiere HTTPS
2. **Permisos de Cámara**: El usuario debe autorizar explícitamente el acceso
3. **Datos Sensibles**: Los códigos escaneados pueden contener información sensible

### Configuración de HTTPS Local

Para desarrollo local con HTTPS:

```bash
# Usando mkcert (recomendado)
mkcert localhost
python -m http.server 8000 --bind localhost

# Usando OpenSSL
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
python -m http.server 8000 --bind localhost
```

## 🐛 Solución de Problemas

### Problemas Comunes

1. **"Error al acceder a la cámara"**
   - Verifica que el navegador tenga permisos de cámara
   - Asegúrate de usar HTTPS en producción
   - Revisa que no haya otras aplicaciones usando la cámara

2. **"No se detectan códigos"**
   - Verifica que el código esté bien iluminado
   - Asegúrate de que el código esté dentro del marco de escaneo
   - Prueba con diferentes códigos

3. **"La cámara no se inicia"**
   - Refresca la página
   - Verifica que el navegador soporte getUserMedia
   - Intenta en modo incógnito

### Debugging

Abre la consola del navegador (F12) para ver mensajes de debug:

```javascript
// Ver el estado del escáner
console.log(window.codeScanner);

// Ver códigos escaneados
console.log(window.codeScanner.scannedCodes);

// Verificar conexión WebSocket
console.log(window.codeScanner.websocket);
```

## 📄 Licencia

Este proyecto utiliza librerías de código abierto:

- **HTML5-QRCode**: MIT License
- **Quagga2**: MIT License

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la sección de solución de problemas
2. Abre un issue en el repositorio
3. Consulta la documentación de las librerías utilizadas

---

**¡Disfruta escaneando códigos! 🎉** 