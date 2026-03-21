import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Scanner({ onScan }) {
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  // Keep ID constant across re-renders in Strict Mode
  const [scannerId] = useState(() => 'qr-reader-' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      scannerId,
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      false // verbose
    );

    scanner.render(
      (decodedText) => {
        if (onScanRef.current) onScanRef.current(decodedText);
        scanner.clear().catch(e => console.error(e));
      },
      (error) => {
        // ignore scan errors (they happen every frame when no QR is found)
      }
    );

    return () => {
      scanner.clear().catch(e => console.error('Failed to clear scanner on unmount', e));
    };
  }, [scannerId]);

  return <div id={scannerId} style={{ width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}></div>;
}
