/**
 * Escáner de Códigos de Barras y QR
 * Utiliza HTML5-QRCode para códigos QR y Quagga para códigos de barras 1D
 */

// Importar ZXing para escaneo universal
import { BrowserMultiFormatReader } from '@zxing/browser';
// Eliminar imports de Firebase
// import { initializeApp } from "firebase/app";
// import { getDatabase, ref, set, get } from "firebase/database";
// import { getAnalytics } from "firebase/analytics";
import { LectorQR } from './lector.js';

// Eliminar la clase CodeScanner y toda la lógica de escaneo QR

document.addEventListener('DOMContentLoaded', () => {
    // cargarQrCounter(); // Eliminado porque ya no se usa el contador
    preloadVideosSequentially(faccionList, () => {
        // Oculta el overlay y elimina los videos del DOM (los guardamos en memoria)
        preloadOverlay.style.display = 'none';
        faccionList.forEach(f => {
            if (faccionVideos[f] && faccionVideos[f].parentNode) {
                faccionVideos[f].parentNode.removeChild(faccionVideos[f]);
            }
        });
        // Ahora sí, inicia el escáner
        // Crear instancia del lector y pasarle el callback para procesar el QR
        const lector = new LectorQR({
            onDetect: (qrText) => {
                handleScanResult(qrText); // Usa tu función actual para procesar el QR
            },
            cooldown: 5000 // ms de espera tras cada QR detectado
        });
        lector.start();
    const video = document.getElementById('effect-video');
    if (video) {
        video.load();
    }
    });
});

/**
 * INSTRUCCIONES DE USO:
 * 
 * 1. Abre el archivo index.html en un navegador moderno
 * 2. Permite el acceso a la cámara cuando se solicite
 * 3. Selecciona el modo (QR o Código de Barras)
 * 4. Haz clic en "Iniciar Escaneo"
 * 5. Apunta la cámara hacia el código que deseas escanear
 * 6. Los resultados aparecerán en la sección de abajo
 * 
 * PARA INTEGRAR CON BACKEND:
 * 
 * WebSocket:
 * - Descomenta el código en connectWebSocket()
 * - Llama: scanner.connectWebSocket("ws://tu-servidor:puerto")
 * 
 * HTTP:
 * - Descomenta el código en sendToBackend()
 * - Configura la URL del endpoint en el fetch()
 * 
 * REQUISITOS:
 * - Navegador con soporte para getUserMedia
 * - Conexión HTTPS (requerido para acceso a cámara en producción)
 * - Cámara web funcional
 */

// Facciones válidas y su inicial
const FACCIONES = {
    'O': 'Obscura',
    'L': 'Lumen',
    'P': 'Prima',
    'T': 'Terra',
    'A': 'Azur'
};

// Precarga de videos de facción
const faccionVideos = {};
const faccionList = Object.values(FACCIONES).map(f => f.toLowerCase());
const preloadOverlay = document.getElementById('preload-overlay');
const preloadText = document.getElementById('preload-text');
const videoPreloadStore = document.getElementById('video-preload-store');

function preloadVideosSequentially(facciones, onComplete) {
    let index = 0;
    function loadNext() {
        if (index >= facciones.length) {
            onComplete();
            return;
        }
        const faccion = facciones[index];
        const video = document.createElement('video');
        video.src = `/${faccion.charAt(0).toUpperCase() + faccion.slice(1)}.mp4`;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.style.display = 'none';
        video.addEventListener('canplaythrough', () => {
            faccionVideos[faccion] = video;
            videoPreloadStore.appendChild(video); // Mantener en el DOM oculto
            index++;
            loadNext();
        });
        video.addEventListener('error', () => {
            preloadText.textContent = `Error cargando video de ${faccion}`;
            index++;
            loadNext();
        });
        preloadText.textContent = `Cargando ${faccion.charAt(0).toUpperCase() + faccion.slice(1)}...`;
    }
    loadNext();
}

// Base de datos en memoria
let mogData = [];

// --- Manejo de almacenamiento en LocalStorage ---
const LOCAL_KEY = 'mogdata_cache';

function guardarEnLocalStorage() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(mogData));
}
//Testeo
function cargarDeLocalStorage() {
    const data = localStorage.getItem(LOCAL_KEY);
    if (data) {
        try {
            mogData = JSON.parse(data);
            return true;
        } catch (e) {
            console.warn('Error leyendo LocalStorage, se usará CSV.');
        }
    }
    return false;
}

// Al iniciar, primero intenta cargar de LocalStorage, si no, del CSV
if (!cargarDeLocalStorage()) {
    fetch('mogdata.csv')
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n').filter(Boolean);
            mogData = lines.slice(1).map(line => {
                const cols = line.split(',');
                return {
                    nombre: cols[0]?.trim(),
                    faccion: cols[1]?.trim(),
                    ingreso: cols[2]?.trim()
                };
            });
            guardarEnLocalStorage();
            console.log('Base de datos cargada automáticamente y guardada en LocalStorage.');
        });
}
// Descargar CSV actualizado
function descargarCSV() {
    let csv = 'Nombre Persona,Facción,Ingreso\n';
    mogData.forEach(row => {
        csv += `${row.nombre},${row.faccion},${row.ingreso}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mogdata_actualizado.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- Contador de QR escaneados ---
// const QR_COUNTER_KEY = 'qr_counter_V8';
// let qrCounter = 0;

// function cargarQrCounter() {
//     const val = localStorage.getItem(QR_COUNTER_KEY);
//     qrCounter = val ? parseInt(val, 10) : 0;
//     actualizarQrCounterUI();
// }

// function incrementarQrCounter() {
//     qrCounter++;
//     localStorage.setItem(QR_COUNTER_KEY, qrCounter);
//     actualizarQrCounterUI();
// }

// function actualizarQrCounterUI() {
//     let counterDiv = document.getElementById('qr-counter');
//     if (!counterDiv) {
//         counterDiv = document.createElement('div');
//         counterDiv.id = 'qr-counter';
//         document.body.appendChild(counterDiv);
//     }
//     counterDiv.textContent = qrCounter;
// }

// --- Configuración de IP del backend ---
//192.168.0.115:4321 TpLink Ras
//192.168.156.20:4321 celular Ras
//192.168.1.2:4321 Casa Pc
//192.168.1.13:4321 Ofi 
//10.10.16.121:4321" rooftoop 

const backendIp = "192.168.0.115:4321";
 // IP FIJA DEL BACKEND
function getBackendUrl(path) {
    return `http://${backendIp}${path}`;
}

// Eliminar configuración y funciones de Firebase
// const firebaseConfig = { ... };
// const app = initializeApp(firebaseConfig);
// const db = getDatabase(app);
// const analytics = getAnalytics(app);
// function guardarIngresoEnFirebase(...) { ... }

// --- Procesamiento de QR detectado ---
async function handleScanResult(value) {
    // Evitar procesar el mismo QR múltiples veces
    const now = Date.now();
    if (value === handleScanResult.lastQrText && (now - handleScanResult.lastQrTime) < 5000) {
        return;
    }
    handleScanResult.lastQrText = value;
    handleScanResult.lastQrTime = now;

    console.log('QR detectado:', value);
    
    // Extraer nombre y facción del QR
    let nombre = value.trim();
    let faccion = null;
    
    // Validar formato del QR (debe empezar con letra de facción + guión)
    if (!nombre.match(/^[OLPTA]-/)) {
        showQrPopup('Lo sentimos, este QR no está registrado', '');
        return;
    }
    
    // Detectar facción basada en el primer carácter
    if (nombre.startsWith('O')) {
        faccion = 'Obscura';
    } else if (nombre.startsWith('L')) {
        faccion = 'Lumen';
    } else if (nombre.startsWith('P')) {
        faccion = 'Prima';
    } else if (nombre.startsWith('T')) {
        faccion = 'Terra';
    } else if (nombre.startsWith('A')) {
        faccion = 'Azur';
    } else {
        showQrPopup('Lo sentimos, este QR no está registrado', '');
        return;
    }
    
    // Eliminar el prefijo de facción (primera letra + guión) del nombre
    nombre = nombre.substring(2).trim();
    
    // Validar que el nombre no esté vacío después de quitar el prefijo
    if (!nombre || nombre === '') {
        showQrPopup('Lo sentimos, este QR no está registrado', '');
        return;
    }

    let mensaje = '';
    
    try {
        // Intentar consultar si el usuario ya existe
        const res = await fetch(getBackendUrl(`/persona/${encodeURIComponent(nombre)}`));
        
        if (!res.ok) {
            // Usuario no existe, agregarlo como nuevo
            const newUserData = {
                nombre: nombre,
                faccion: faccion,
                ingreso: 'No'
            };
            
            // Agregar a la base de datos
            const addRes = await fetch(getBackendUrl('/persona'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUserData)
            });
            
            if (addRes.ok) {
                mensaje = `Bienvenido ${nombre}. Tu facción es ${faccion}`;
            } else {
                mensaje = `Error agregando nuevo usuario: ${nombre}`;
            }
        } else {
            // Usuario existe, registrar ingreso
            const ingresoRes = await fetch(getBackendUrl('/ingreso'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre })
            });
            
            if (ingresoRes.ok) {
                const data = await ingresoRes.json();
                mensaje = data.mensaje || `Bienvenido ${nombre}. Tu facción es ${faccion}`;
            } else {
                mensaje = `Error registrando ingreso para: ${nombre}`;
            }
        }
    } catch (err) {
        console.error('Error procesando QR:', err);
        mensaje = `Error procesando QR: ${nombre}`;
    }
    
    showQrPopup(mensaje, nombre);
}
handleScanResult.lastQrText = '';
handleScanResult.lastQrTime = 0; 

// Eliminar funciones y referencias a mensaje-escaneo
// function mostrarMensajeEscaneo() { ... }
// function ocultarMensajeEscaneo() { ... }
// mostrarMensajeEscaneo();

function mostrarPreviewCamara(stream) {
    let preview = document.getElementById('preview-camara');
    if (!preview) {
        preview = document.createElement('video');
        preview.id = 'preview-camara';
        preview.autoplay = true;
        preview.playsInline = true;
        preview.muted = true;
        preview.style.border = '20%';
        preview.style.filter = 'grayscale(1)';
        preview.style.pointerEvents = 'none';
        preview.style.borderRadius = '0px';
        preview.style.boxShadow = '0 0 16px #0008';
        document.body.appendChild(preview);
    }
    preview.srcObject = stream;
    preview.play();
}
function ocultarPreviewCamara() {
    let preview = document.getElementById('preview-camara');
    if (preview) preview.style.display = 'none';
}
function mostrarPreviewCamaraVisible() {
    let preview = document.getElementById('preview-camara');
    if (preview) preview.style.display = '';
}
window.mostrarPreviewCamara = mostrarPreviewCamara;
window.ocultarPreviewCamara = ocultarPreviewCamara;
window.mostrarPreviewCamaraVisible = mostrarPreviewCamaraVisible;

function showQrPopup(value, nombreParam) {
    ocultarPreviewCamara();
    const qrPopup = document.getElementById('qr-popup');
    qrPopup.classList.remove('obscura', 'lumen', 'prima', 'terra', 'azur');
    let faccion = null;
    let nombre = nombreParam || '';
    let fac = '';
    let mensaje = value;
    
    // Si es QR incorrecto, usar fondo negro
    if (value === 'Lo sentimos, este QR no está registrado') {
        qrPopup.classList.add('qr-incorrecto');
        mensaje = `<span class='qr-incorrecto-text'>Lo sentimos, este QR no está registrado</span>`;
    } else {
        // Detectar facción y nombre si el mensaje es del tipo esperado
        if (typeof value === 'string') {
            if (value.includes('Obscura')) faccion = 'obscura';
            else if (value.includes('Lumen')) faccion = 'lumen';
            else if (value.includes('Prima')) faccion = 'prima';
            else if (value.includes('Terra')) faccion = 'terra';
            else if (value.includes('Azur')) faccion = 'azur';
            
            // Siempre usar "Bienvenido" sin importar si el usuario ya se registró antes
            if (faccion && nombre) {
                // Si es Prima, agregar el texto adicional
                if (faccion === 'prima') {
                    mensaje = `<span class='bienvenida'>Bienvenido</span><span class='nombre-usuario spaced'>${nombre.toUpperCase()}</span><br><br><span class='faccion-label-nombre slide-up-fade-in'>Tu facción es <span class='faccion-nombre ${faccion}'>${faccion.charAt(0).toUpperCase() + faccion.slice(1)}</span></span><br><br><span class='prima-texto-adicional slide-up-fade-in'>No sigues tendencias. Las inauguras.<br>Tu estilo es origen. Tu actitud, ley.</span>`;
                } else if (faccion === 'azur') {
                    mensaje = `<span class='bienvenida'>Bienvenido</span><span class='nombre-usuario spaced'>${nombre.toUpperCase()}</span><br><br><span class='faccion-label-nombre slide-up-fade-in'>Tu facción es <span class='faccion-nombre ${faccion}'>${faccion.charAt(0).toUpperCase() + faccion.slice(1)}</span></span><br><br><span class='azur-texto-adicional slide-up-fade-in'>Fría mente. Paso firme.<br>Estilo que fluye como el agua.<br>Donde hay calma, hay poder.</span>`;
                } else if (faccion === 'obscura') {
                    mensaje = `<span class='bienvenida'>Bienvenido</span><span class='nombre-usuario spaced'>${nombre.toUpperCase()}</span><br><br><span class='faccion-label-nombre slide-up-fade-in'>Tu facción es <span class='faccion-nombre ${faccion}'>${faccion.charAt(0).toUpperCase() + faccion.slice(1)}</span></span><br><br><span class='obscura-texto-adicional slide-up-fade-in'>Te mueves entre sombras.<br>Tu estilo no grita, susurra.<br>Eres la presencia que nadie olvida.</span>`;
                } else if (faccion === 'lumen') {
                    mensaje = `<span class='bienvenida'>Bienvenido</span><span class='nombre-usuario spaced'>${nombre.toUpperCase()}</span><br><br><span class='faccion-label-nombre slide-up-fade-in'>Tu facción es <span class='faccion-nombre ${faccion}'>${faccion.charAt(0).toUpperCase() + faccion.slice(1)}</span></span><br><br><span class='lumen-texto-adicional slide-up-fade-in'>Donde pisas, enciendes.<br>Tu estilo irradia.<br>No sigues el camino, lo iluminas.</span>`;
                } else if (faccion === 'terra') {
                    mensaje = `<span class='bienvenida'>Bienvenido</span><span class='nombre-usuario spaced'>${nombre.toUpperCase()}</span><br><br><span class='faccion-label-nombre slide-up-fade-in'>Tu facción es <span class='faccion-nombre ${faccion}'>${faccion.charAt(0).toUpperCase() + faccion.slice(1)}</span></span><br><br><span class='terra-texto-adicional slide-up-fade-in'>Auténtico. Orgánico. Irrepetible.<br>Tu estilo nace de la tierra<br>y vibra con el alma.</span>`;
                } else {
                    mensaje = `<span class='bienvenida'>Bienvenido</span><span class='nombre-usuario spaced'>${nombre.toUpperCase()}</span><br><br><span class='faccion-label-nombre slide-up-fade-in'>Tu facción es <span class='faccion-nombre ${faccion}'>${faccion.charAt(0).toUpperCase() + faccion.slice(1)}</span></span>`;
                }
            }
        }
        
        if (faccion) {
            qrPopup.classList.add(faccion);
        }
    }
    
    // Limpiar el contenido anterior y pausar/eliminar cualquier video existente
    const oldVideo = qrPopup.querySelector('video.bg-video-faccion');
    if (oldVideo) {
        try { oldVideo.pause(); } catch (e) {}
        oldVideo.remove();
    }
    qrPopup.innerHTML = '';
    // Mover el video precargado al popup si existe y no está ya ahí
    if (faccion && faccionVideos[faccion]) {
        const video = faccionVideos[faccion];
        if (video.parentNode !== qrPopup) {
            if (video.parentNode) video.parentNode.removeChild(video);
            video.className = 'bg-video-faccion';
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.style.display = '';
            qrPopup.appendChild(video);
        }
        // Intentar reproducir el video de facción de forma simple primero
        try {
            video.play().then(() => {
            }).catch(e => {
            });
        } catch (e) {
        }
        // Log extra tras un pequeño delay para ver si el video está visible
        setTimeout(() => {
        }, 500);
    }
    // Crear el bloque de texto del popup de forma segura
    const contentDiv = document.createElement('div');
    contentDiv.className = 'qr-popup-content fade-in';
    contentDiv.innerHTML = mensaje;
    qrPopup.appendChild(contentDiv);
    qrPopup.classList.remove('hidden');
    void qrPopup.offsetWidth;
    // Ocultar el popup después de un tiempo y limpiar
    setTimeout(() => {
        hideQrPopup();
    }, 5000);
}

function hideQrPopup() {
    const qrPopup = document.getElementById('qr-popup');
    qrPopup.classList.add('fade-out');
    setTimeout(() => {
        qrPopup.classList.add('hidden');
        // Mover cualquier video de fondo de vuelta al store oculto
        const v = qrPopup.querySelector('video.bg-video-faccion');
        if (v) {
            v.pause();
            v.style.display = 'none';
            videoPreloadStore.appendChild(v);
        }
        qrPopup.innerHTML = '';
        qrPopup.classList.remove('fade-out');
        mostrarPreviewCamaraVisible();
    }, 700);
} 