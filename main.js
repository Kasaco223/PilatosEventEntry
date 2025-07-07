/**
 * Escáner de Códigos de Barras y QR
 * Utiliza HTML5-QRCode para códigos QR y Quagga para códigos de barras 1D
 */

// Importar ZXing para escaneo universal
import { BrowserMultiFormatReader } from '@zxing/browser';

class CodeScanner {
    constructor() {
        // Elementos del DOM
        this.qrReader = document.getElementById('qr-reader');
        this.qrPopup = document.getElementById('qr-popup');
        // Estado
        this.isScanning = false;
        this.codeReader = new BrowserMultiFormatReader();
        this.lastResult = '';
        this.scanTimeout = null;
        this.stream = null;
        this.videoInputDeviceId = undefined;
        this.scanLoop = null;
        this.startScanning();
    }

    async startScanning() {
        if (this.isScanning) return;
        this.isScanning = true;
        try {
            // Obtener acceso a la cámara
            const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
            this.videoInputDeviceId = videoInputDevices[0]?.deviceId;
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: this.videoInputDeviceId } });
            this.qrReader.innerHTML = '';
            const video = document.createElement('video');
            video.setAttribute('autoplay', 'true');
            video.setAttribute('playsinline', 'true');
            video.style.width = '100%';
            video.style.height = '100%';
            this.qrReader.appendChild(video);
            video.srcObject = this.stream;
            video.onloadedmetadata = () => {
                video.play();
                this.scanLoop = requestAnimationFrame(() => this.scanFrame(video));
            };
        } catch (error) {
            this.isScanning = false;
            setTimeout(() => this.startScanning(), 2000);
        }
    }

    async scanFrame(video) {
        if (!this.isScanning) return;
        try {
            const result = await this.codeReader.decodeOnceFromVideoElement(video);
            if (result && result.text !== this.lastResult) {
                this.lastResult = result.text;
                this.handleScanResult(result.text);
                return;
            }
        } catch (e) {
            // No se detectó código, continuar
        }
        this.scanLoop = requestAnimationFrame(() => this.scanFrame(video));
    }

    async stopScanning() {
        this.isScanning = false;
        if (this.scanLoop) cancelAnimationFrame(this.scanLoop);
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.qrReader.innerHTML = '';
        this.lastResult = '';
    }

    async handleScanResult(value) {
        this.isScanning = false;
        if (this.scanLoop) cancelAnimationFrame(this.scanLoop);
        setTimeout(() => {
            // Lógica de validación QR
            let mensaje = '';
            let match = value.match(/^([OLPTA])-([\w\sÁÉÍÓÚáéíóúÑñ]+)$/);
            if (!match) {
                mensaje = 'QR INCORRECTO';
            } else {
                const inicial = match[1];
                const nombre = match[2].trim();
                const faccion = FACCIONES[inicial];
                if (!faccion) {
                    mensaje = 'QR INCORRECTO';
                } else {
                    // Buscar en mogData
                    let persona = mogData.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
                    if (persona) {
                        persona.ingreso = 'Yes';
                        mensaje = `Bienvenido ${persona.nombre}. Tu facción es ${persona.faccion}`;
                    } else {
                        // Añadir nuevo registro
                        mogData.push({ nombre, faccion, ingreso: 'Yes_New' });
                        mensaje = `Bienvenido ${nombre}. Tu facción es ${faccion}`;
                    }
                    guardarEnLocalStorage(); // Guardar cambios
                }
            }
            this.showQrPopup(mensaje);
            void this.qrPopup.offsetWidth;
            setTimeout(() => {
                this.stopScanning();
                clearTimeout(this.scanTimeout);
                this.scanTimeout = setTimeout(() => {
                    this.hideQrPopup();
                    this.startScanning();
                }, 5000);
            }, 250);
        }, 250);
    }

    showQrPopup(value) {
        // Quitar clases de facción previas
        this.qrPopup.classList.remove('obscura', 'lumen', 'prima', 'terra', 'azur');
        // Detectar facción en el mensaje y aplicar clase
        let faccion = null;
        if (typeof value === 'string') {
            if (value.includes('Obscura')) faccion = 'obscura';
            else if (value.includes('Lumen')) faccion = 'lumen';
            else if (value.includes('Prima')) faccion = 'prima';
            else if (value.includes('Terra')) faccion = 'terra';
            else if (value.includes('Azur')) faccion = 'azur';
        }
        if (faccion) {
            this.qrPopup.classList.add(faccion);
        }
        this.qrPopup.innerHTML = `<div class="qr-popup-content">${value}</div>`;
        this.qrPopup.classList.remove('hidden');
        void this.qrPopup.offsetWidth;
        console.log('showQrPopup ejecutado');
    }

    hideQrPopup() {
        this.qrPopup.classList.add('hidden');
        this.qrPopup.innerHTML = '';
        // Log para depuración
        console.log('hideQrPopup ejecutado');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const scanner = new CodeScanner();
    window.codeScanner = scanner;
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

// Base de datos en memoria
let mogData = [];

// --- Manejo de almacenamiento en LocalStorage ---
const LOCAL_KEY = 'mogdata_cache';

function guardarEnLocalStorage() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(mogData));
}

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