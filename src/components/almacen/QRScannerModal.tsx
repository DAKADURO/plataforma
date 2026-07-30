'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

type QRScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (sku: string) => void;
};

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }: QRScannerModalProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Al escanear exitosamente, pausamos y llamamos al callback
        scanner.pause(true);
        onScanSuccess(decodedText.trim());
        onClose();
      },
      (err) => {
        // Ignoramos errores de "no detectado" porque pasan en cada frame
        // console.error(err);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, onClose, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md rounded-2xl border shadow-xl relative overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Camera className="w-5 h-5" /> Escanear Etiqueta
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm mb-4 text-center" style={{ color: 'var(--text-muted)' }}>
            Apunta la cámara de tu dispositivo hacia el código QR o código de barras del producto.
          </p>

          <div id="qr-reader" className="w-full overflow-hidden rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--border)' }}></div>
          
          {error && (
            <p className="mt-4 text-sm text-red-500 text-center font-medium bg-red-500/10 p-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          /* Personalizar la interfaz de html5-qrcode */
          #qr-reader { border: none !important; }
          #qr-reader__scan_region { background: black; }
          #qr-reader__dashboard_section_csr button {
            background-color: var(--accent);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: bold;
            margin: 8px;
            cursor: pointer;
          }
          #qr-reader__dashboard_section_swaplink {
            text-decoration: none;
            color: var(--accent);
            font-weight: bold;
          }
        `}} />
      </div>
    </div>
  );
}
