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

    handleScanResult(value) {
        this.showQrPopup(value);
        this.stopScanning();
        clearTimeout(this.scanTimeout);
        this.scanTimeout = setTimeout(() => {
            this.hideQrPopup();
            this.startScanning();
        }, 2000);
    }

    showQrPopup(value) {
        this.qrPopup.innerHTML = `<div class="qr-popup-content">${value}</div>`;
        this.qrPopup.classList.remove('hidden');
    }

    hideQrPopup() {
        this.qrPopup.classList.add('hidden');
        this.qrPopup.innerHTML = '';
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