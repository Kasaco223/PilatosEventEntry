import { BrowserMultiFormatReader } from '@zxing/browser';

export class LectorQR {
    constructor({ onDetect, cooldown = 5000 }) {
        this.onDetect = onDetect;
        this.cooldown = cooldown;
        this.isActive = false;
        this.codeReader = new BrowserMultiFormatReader();
        this.stream = null;
        this.videoElement = null;
        console.log('LectorQR inicializado');
    }

    async start() {
        if (this.isActive) return;
        this.isActive = true;
        console.log('LectorQR: start() llamado');
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: videoInputDevices[0]?.deviceId } });
        // Crear un elemento video oculto
        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('playsinline', 'true');
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
        this.scanLoop();
    }

    async scanLoop() {
        if (!this.isActive) return;
        console.log('LectorQR: Intentando escanear...');
        try {
            const result = await this.codeReader.decodeOnceFromVideoElement(this.videoElement);
            if (!this.isActive) return;
            if (result && result.text) {
                console.log('LectorQR: QR detectado:', result.text);
                this.isActive = false;
                if (this.onDetect) this.onDetect(result.text);
                setTimeout(() => {
                    this.isActive = true;
                    this.scanLoop();
                }, this.cooldown);
            } else {
                this.scanLoop();
            }
        } catch (e) {
            console.error('LectorQR: Error en scanLoop:', e);
            setTimeout(() => this.scanLoop(), 500);
        }
    }

    stop() {
        this.isActive = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.srcObject = null;
            document.body.removeChild(this.videoElement);
            this.videoElement = null;
        }
        console.log('LectorQR detenido');
    }
} 