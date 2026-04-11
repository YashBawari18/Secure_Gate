import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { useTranslation } from 'react-i18next';

export default function FaceVerify() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [step, setStep] = useState(1); // 1: ID, 2: Live, 3: Result
  const [idPhoto, setIdPhoto] = useState(null);
  const [livePhoto, setLivePhoto] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load models", err);
      }
    };
    loadModels();
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, []);

  // Real-time face detection on the live video feed
  const startFaceDetection = useCallback(() => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    setFaceDetected(false);

    detectionIntervalRef.current = setInterval(async () => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4) return;

      try {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 });
        const detection = await faceapi.detectSingleFace(video, options);
        setFaceDetected(!!detection);
      } catch (e) {
        // Silently ignore detection errors during real-time scanning
      }
    }, 500);
  }, []);

  const stopFaceDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setFaceDetected(false);
  }, []);

  // Start detection when entering step 2 (live face capture)
  useEffect(() => {
    if (step === 2 && modelsLoaded) {
      // Small delay to allow webcam to initialize
      const timer = setTimeout(() => startFaceDetection(), 800);
      return () => { clearTimeout(timer); stopFaceDetection(); };
    } else {
      stopFaceDetection();
    }
  }, [step, modelsLoaded, startFaceDetection, stopFaceDetection]);

  // Capture a high-quality frame directly from the video element via canvas
  const captureHighQuality = () => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  };

  const capture = (type) => {
    const imageSrc = captureHighQuality();
    if (!imageSrc) return;
    if (type === 'id') {
      setIdPhoto(imageSrc);
      setStep(2);
    } else {
      stopFaceDetection();
      setLivePhoto(imageSrc);
      setStep(3);
      compareFaces(idPhoto, imageSrc);
    }
  };

  const fetchImage = async (base64) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = base64;
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });
  };

  const compareFaces = async (idSrc, liveSrc) => {
    setProcessing(true);
    try {
      const idImg = await fetchImage(idSrc);
      const liveImg = await fetchImage(liveSrc);

      const ssdOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 });
      const tinyOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 });

      // Try SSD first, fallback to TinyFaceDetector
      let idDetection = await faceapi.detectSingleFace(idImg, ssdOptions).withFaceLandmarks().withFaceDescriptor();
      if (!idDetection) {
        idDetection = await faceapi.detectSingleFace(idImg, tinyOptions).withFaceLandmarks().withFaceDescriptor();
      }

      let liveDetection = await faceapi.detectSingleFace(liveImg, ssdOptions).withFaceLandmarks().withFaceDescriptor();
      if (!liveDetection) {
        liveDetection = await faceapi.detectSingleFace(liveImg, tinyOptions).withFaceLandmarks().withFaceDescriptor();
      }

      if (!idDetection) {
        setMatchScore({ error: t('faceVerify.noFaceId', 'No face detected in the ID card. Please hold it closer to the camera and ensure good lighting.') });
        setProcessing(false);
        return;
      }
      if (!liveDetection) {
        setMatchScore({ error: t('faceVerify.noFaceLive', 'No face detected in the Live photo. Please ensure your face is well-lit and fully visible.') });
        setProcessing(false);
        return;
      }

      const distance = faceapi.euclideanDistance(idDetection.descriptor, liveDetection.descriptor);
      const isMatch = distance < 0.55;
      
      let pct;
      if (isMatch) {
         pct = Math.round((1 - (distance / 0.55) * 0.2) * 100);
      } else {
         pct = Math.max(0, Math.round((1 - distance) * 100) - 20);
      }

      setMatchScore({ percent: pct, distance: distance.toFixed(2), isMatch });
    } catch (err) {
      console.error(err);
      setMatchScore({ error: t('faceVerify.compError', 'Computational error during face verification.') });
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setStep(1);
    setIdPhoto(null);
    setLivePhoto(null);
    setMatchScore(null);
    setFaceDetected(false);
  };

  return (
    <div className="fade-in">
      <div className="info-box" style={{ marginBottom: 18 }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#2563eb" strokeWidth="1.3">
          <circle cx="6.5" cy="6.5" r="5.5"/><line x1="6.5" y1="4.5" x2="6.5" y2="6.5"/><circle cx="6.5" cy="8.5" r=".5" fill="#2563eb"/>
        </svg>
        {t('faceVerify.info', "AI Face Verification: First, capture the visitor's physical ID card. Then, capture their live face.")}
      </div>

      {!modelsLoaded ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--tx2)', fontSize: 14 }}>{t('faceVerify.loadingModels', 'Loading AI Models... (this may take a moment)')}</div>
        </div>
      ) : (
        <div className="grid2" style={{ gap: 24, alignItems: 'start' }}>
          {/* Main camera/results area */}
          <div className="card" style={{ padding: 24 }}>
            {step === 1 && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{t('faceVerify.step1', 'Step 1: Capture ID Card')}</div>
                <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, border: '2px solid var(--bdr)' }}>
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/png" videoConstraints={{ facingMode: 'environment', width: 1280, height: 720 }} style={{ width: '100%', display: 'block' }} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} onClick={() => capture('id')}>
                  {t('faceVerify.captureIdBtn', 'Capture ID Photo')}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="fade-in">
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{t('faceVerify.step2', 'Step 2: Capture Live Face')}</div>
                <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, border: `2px solid ${faceDetected ? 'var(--grn)' : 'var(--red)'}`, position: 'relative', transition: 'border-color 0.3s' }}>
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/png" videoConstraints={{ facingMode: 'user', width: 1280, height: 720 }} style={{ width: '100%', display: 'block' }} />
                  <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
                  {/* Live face detection indicator */}
                  <div style={{
                    position: 'absolute', top: 10, left: 10, padding: '4px 12px',
                    borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: faceDetected ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
                    color: '#fff', transition: 'background 0.3s',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: faceDetected ? 'none' : 'pulse 1s infinite' }} />
                    {faceDetected ? t('faceVerify.faceFound', 'Face Detected') : t('faceVerify.noFace', 'No Face — Look at Camera')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: 12 }} onClick={reset}>{t('faceVerify.goBack', 'Go Back')}</button>
                  <button className="btn btn-success" style={{ flex: 2, justifyContent: 'center', padding: 12, opacity: faceDetected ? 1 : 0.5 }} onClick={() => capture('live')} disabled={!faceDetected}>
                    {faceDetected ? t('faceVerify.captureLiveBtn', 'Capture Live & Verify') : t('faceVerify.waitingForFace', 'Waiting for face...')}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="fade-in" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>{t('faceVerify.resultsTitle', 'Verification Results')}</div>
                {processing ? (
                  <div style={{ padding: '40px 0' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <div style={{ color: 'var(--tx2)' }}>{t('faceVerify.analyzing', 'Analyzing 128-point facial geometry...')}</div>
                  </div>
                ) : matchScore?.error ? (
                  <div style={{ background: 'var(--red-lt)', color: '#b91c1c', padding: 16, borderRadius: 12, border: '1px solid #fca5a5' }}>
                    <strong>{t('faceVerify.verifFailed', 'Verification Failed')}</strong>
                    <div style={{ marginTop: 8, fontSize: 13 }}>{matchScore.error}</div>
                    <button className="btn btn-danger" style={{ marginTop: 16, padding: '8px 24px', margin: '16px auto 0' }} onClick={reset}>{t('faceVerify.tryAgain', 'Try Again')}</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 20px' }}>
                      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg3)" strokeWidth="12" />
                        <circle cx="60" cy="60" r="54" fill="none" stroke={matchScore.isMatch ? 'var(--grn)' : 'var(--red)'} strokeWidth="12"
                          strokeDasharray="339" strokeDashoffset={339 - (339 * matchScore.percent) / 100} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)', color: matchScore.isMatch ? 'var(--grn)' : 'var(--red)' }}>
                        {matchScore.percent}%
                      </div>
                    </div>
                    
                    {matchScore.isMatch ? (
                      <div style={{ color: 'var(--grn)', fontWeight: 600, fontSize: 18 }}>{t('faceVerify.verified', 'Identity Verified')}</div>
                    ) : (
                      <div style={{ color: 'var(--red)', fontWeight: 600, fontSize: 18 }}>{t('faceVerify.mismatch', 'Mismatch Alert')}</div>
                    )}
                    <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 4, marginBottom: 24 }}>{t('faceVerify.confidence', 'System confidence (Euclidean dist: ')}{matchScore.distance})</div>

                    <button className="btn btn-primary" style={{ padding: '10px 32px' }} onClick={reset}>{t('faceVerify.verifyAnother', 'Verify Another Person')}</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reference Photos sidebar */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, color: 'var(--tx2)' }}>{t('faceVerify.reference', 'Captured Reference')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 6 }}>{t('faceVerify.idBaseline', '1. ID Card / Baseline')}</div>
                {idPhoto ? (
                  <img src={idPhoto} alt="ID Reference" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--bdr)', opacity: step===1?0.5:1 }} />
                ) : (
                  <div style={{ height: 120, background: 'var(--bg3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontSize: 12 }}>{t('faceVerify.waiting', 'Waiting for capture...')}</div>
                )}
              </div>
              
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 6 }}>{t('faceVerify.liveFaceObj', '2. Live Face')}</div>
                {livePhoto ? (
                  <img src={livePhoto} alt="Live Face" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--bdr)' }} />
                ) : (
                  <div style={{ height: 120, background: 'var(--bg3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontSize: 12 }}>{t('faceVerify.waiting', 'Waiting for capture...')}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
