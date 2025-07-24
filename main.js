/**
 * Escáner de Códigos de Barras y QR
 * Utiliza HTML5-QRCode para códigos QR y Quagga para códigos de barras 1D
 */

// Importar ZXing para escaneo universal
import { BrowserMultiFormatReader } from '@zxing/browser';
// Eliminar importaciones y configuración de Firebase
import { LectorQR } from './lector.js';

// Eliminar la clase CodeScanner y toda la lógica de escaneo QR

document.addEventListener('DOMContentLoaded', () => {
    cargarQrCounter();
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
            console.log('Base de datos cargada desde LocalStorage.');
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
const QR_COUNTER_KEY = 'qr_counter_V8';
let qrCounter = 0;

function cargarQrCounter() {
    const val = localStorage.getItem(QR_COUNTER_KEY);
    qrCounter = val ? parseInt(val, 10) : 0;
    actualizarQrCounterUI();
}

function incrementarQrCounter() {
    qrCounter++;
    localStorage.setItem(QR_COUNTER_KEY, qrCounter);
    actualizarQrCounterUI();
}

function actualizarQrCounterUI() {
    let counterDiv = document.getElementById('qr-counter');
    if (!counterDiv) {
        counterDiv = document.createElement('div');
        counterDiv.id = 'qr-counter';
        document.body.appendChild(counterDiv);
    }
    counterDiv.textContent = qrCounter;
}

// --- Procesamiento de QR detectado ---
async function handleScanResult(value) {
    // Evitar escaneo repetido en menos de 5 segundos
    if (handleScanResult.lastQrText === value && (Date.now() - handleScanResult.lastQrTime < 5000)) {
        const elapsed = Date.now() - handleScanResult.lastQrTime;
        console.log(`Intento de escanear repetido: '${value}', tiempo transcurrido: ${elapsed} ms, lastQrText: '${handleScanResult.lastQrText}'`);
        return;
    }
    handleScanResult.lastQrText = value;
    handleScanResult.lastQrTime = Date.now();
    console.log('Nuevo QR procesado:', value, 'Hora:', handleScanResult.lastQrTime);
    let mensaje = '';
    let match = value.match(/^([OLPTA])-([\w\sÁÉÍÓÚáéíóúÑñ]+)$/);
    let nombre = '';
    if (!match) {
        mensaje = 'QR INCORRECTO';
    } else {
        const inicial = match[1];
        nombre = match[2].trim();
        const faccion = FACCIONES[inicial];
        if (!faccion) {
            mensaje = 'QR INCORRECTO';
        } else {
            let persona = mogData.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
            if (persona) {
                if (persona.ingreso !== 'Yes') {
                    // Registrar ingreso localmente
                    persona.ingreso = 'Yes';
                    guardarEnLocalStorage();
                    mensaje = `Bienvenido ${persona.nombre}. Tu facción es ${persona.faccion}`;
                } else {
                    mensaje = `Bienvenido de nuevo ${persona.nombre}. Tu facción es ${persona.faccion}`;
                }
                showQrPopup(mensaje, nombre);
            } else {
                mensaje = 'No estás en la lista';
                showQrPopup(mensaje, nombre);
            }
        }
    }
    if (mensaje === 'QR INCORRECTO' || mensaje === 'No estás en la lista') {
        showQrPopup(mensaje, nombre);
    }
}
handleScanResult.lastQrText = '';
handleScanResult.lastQrTime = 0; 

// Crear el mensaje de escaneo si no existe
function mostrarMensajeEscaneo() {
    let msg = document.getElementById('mensaje-escaneo');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'mensaje-escaneo';
        msg.innerHTML = 'Escanea tu QR<br/>descubre tu facción';
        document.body.appendChild(msg);
    }
    msg.style.display = '';
}
function ocultarMensajeEscaneo() {
    let msg = document.getElementById('mensaje-escaneo');
    if (msg) msg.style.display = 'none';
}
// Mostrar mensaje al inicio
mostrarMensajeEscaneo();

// Mostrar preview de cámara en blanco y negro
function mostrarPreviewCamara(stream) {
    console.log('[Preview] Creando/mostrando preview de cámara', stream);
    let preview = document.getElementById('preview-camara');
    if (!preview) {
        preview = document.createElement('video');
        preview.id = 'preview-camara';
        preview.autoplay = true;
        preview.playsInline = true;
        preview.muted = true;
        preview.style.position = 'fixed';
        preview.style.top = '0';
        preview.style.left = '0';
        preview.style.width = '100vw';
        preview.style.height = '100vh';
        preview.style.zIndex = 8000; // Debajo del mensaje y contador
        preview.style.objectFit = 'cover';
        preview.style.filter = 'grayscale(1)';
        preview.style.pointerEvents = 'none';
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
// Hacer funciones globales para el lector
window.mostrarPreviewCamara = mostrarPreviewCamara;
window.ocultarPreviewCamara = ocultarPreviewCamara;
window.mostrarPreviewCamaraVisible = mostrarPreviewCamaraVisible;

function showQrPopup(value, nombreParam) {
    ocultarMensajeEscaneo();
    ocultarPreviewCamara();
    const qrPopup = document.getElementById('qr-popup');
    qrPopup.classList.remove('obscura', 'lumen', 'prima', 'terra', 'azur');
    let faccion = null;
    let nombre = nombreParam || '';
    let fac = '';
    let mensaje = value;
    // Detectar facción y nombre si el mensaje es del tipo esperado
    if (typeof value === 'string') {
        if (value.includes('Obscura')) faccion = 'obscura';
        else if (value.includes('Lumen')) faccion = 'lumen';
        else if (value.includes('Prima')) faccion = 'prima';
        else if (value.includes('Terra')) faccion = 'terra';
        else if (value.includes('Azur')) faccion = 'azur';
        // Separar nombre y facción si el mensaje es del tipo "Bienvenido de vuelta NOMBRE. Tu facción es FACCION"
        const match = value.match(/^Bienvenido de vuelta ([^.,]+)[.,]?\s*Tu facci[oó]n es ([A-Za-zÁÉÍÓÚáéíóúÑñ]+)\.?$/i);
        if (match) {
            nombre = match[1].trim();
            fac = match[2].trim();
            let facClass = faccion ? faccion : '';
            mensaje = `<span class='bienvenida'>Bienvenido de vuelta</span><span class='nombre-usuario spaced'>${nombre.toUpperCase()}</span><br><br><span class='faccion-label-nombre slide-up-fade-in'>Tu facción es <span class='faccion-nombre ${facClass}'>${fac.toUpperCase()}</span></span>`;
        } else if (faccion && nombre) {
            // Usuario nuevo, pero con facción válida y nombre definido
            mensaje = `<span class='bienvenida'>Bienvenido</span><span class='nombre-usuario spaced'>${nombre.toUpperCase()}</span><br><br><span class='faccion-label-nombre slide-up-fade-in'>Tu facción es <span class='faccion-nombre ${faccion}'>${faccion.charAt(0).toUpperCase() + faccion.slice(1)}</span></span>`;
        }
    }
    // Incrementar el contador solo si es un mensaje de bienvenida
    if (typeof value === 'string' && value.trim().toLowerCase().startsWith('bienvenido')) {
        incrementarQrCounter();
    }
    if (faccion) {
        qrPopup.classList.add(faccion);
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
        console.log('[Popup] Preparando video de facción:', faccion, 'readyState:', video.readyState, 'display:', video.style.display, 'parent:', video.parentNode === qrPopup);
        if (video.parentNode !== qrPopup) {
            if (video.parentNode) video.parentNode.removeChild(video);
            video.className = 'bg-video-faccion';
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.style.display = '';
            qrPopup.appendChild(video);
            console.log('[Popup] Video de facción movido al popup.');
        }
        // Intentar reproducir el video de facción de forma simple primero
        try {
            console.log('[Popup] Intentando reproducir video de facción...');
            video.play().then(() => {
                console.log('[Popup] Video de facción está reproduciéndose.');
            }).catch(e => {
                console.warn('[Popup] No se pudo reproducir el video de facción:', e);
            });
        } catch (e) {
            console.warn('[Popup] Error al intentar reproducir el video de facción:', e);
        }
        // Log extra tras un pequeño delay para ver si el video está visible
        setTimeout(() => {
            console.log('[Popup] Estado tras 500ms: readyState:', video.readyState, 'paused:', video.paused, 'currentTime:', video.currentTime, 'display:', video.style.display, 'parent:', video.parentNode === qrPopup);
        }, 500);
    }
    // Crear el bloque de texto del popup de forma segura
    const contentDiv = document.createElement('div');
    contentDiv.className = 'qr-popup-content fade-in';
    contentDiv.innerHTML = mensaje;
    qrPopup.appendChild(contentDiv);
    qrPopup.classList.remove('hidden');
    void qrPopup.offsetWidth;
    console.log('showQrPopup ejecutado');
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
        mostrarMensajeEscaneo();
        mostrarPreviewCamaraVisible();
        console.log('hideQrPopup ejecutado');
    }, 700);
} 