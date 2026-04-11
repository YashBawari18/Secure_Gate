import React, { useState, useRef, useEffect } from 'react';
import { alertsAPI } from '../utils/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const LANG_MAP = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

// Convert a Blob to base64 data URL
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export default function VoiceAlert() {
  const { t, i18n } = useTranslation();
  const [listening,  setListening]  = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUrl,   setAudioUrl]   = useState(null); // local preview URL
  const [sending,    setSending]    = useState(false);
  const [showPanel,  setShowPanel]  = useState(false);

  const recogRef    = useRef(null);
  const mediaRecRef = useRef(null);
  const chunksRef   = useRef([]);
  const panelRef    = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    if (!showPanel) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        stopAll();
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPanel]);

  const startListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition not supported. Use Chrome.');
      return;
    }

    // ── 1. Request microphone ──────────────────────────────────────────
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error('Microphone access denied.');
      return;
    }

    // ── 2. Start MediaRecorder (actual audio capture) ─────────────────
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    const mediaRec = new MediaRecorder(stream, { mimeType });
    mediaRec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setAudioUrl(URL.createObjectURL(blob)); // local preview
      stream.getTracks().forEach(tr => tr.stop()); // release mic
    };
    mediaRec.start(100); // collect data every 100ms
    mediaRecRef.current = mediaRec;

    // ── 3. Start SpeechRecognition (transcription) ────────────────────
    const recog = new SpeechRecognition();
    recog.continuous     = true;
    recog.interimResults = true;
    recog.lang           = LANG_MAP[i18n.language] || 'hi-IN';
    recog.onresult = (e) => {
      let full = '';
      for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript;
      setTranscript(full);
    };
    recog.onerror = (e) => toast.error(`Mic error: ${e.error}`);
    recog.onend   = () => setListening(false);
    recog.start();
    recogRef.current = recog;

    setListening(true);
    setTranscript('');
    setAudioUrl(null);
  };

  const stopAll = () => {
    recogRef.current?.stop();
    if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop();
    setListening(false);
  };

  const toggleMic = () => {
    if (listening) stopAll();
    else           startListening();
  };

  const broadcastAlert = async () => {
    if (!transcript.trim()) return toast.error('No voice message recorded.');
    setSending(true);
    try {
      // Convert audio blob to base64 to store alongside the alert
      let audioData = null;
      if (chunksRef.current.length > 0) {
        const mimeType = mediaRecRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        audioData = await blobToBase64(blob);
      }

      await alertsAPI.create({
        title: '🎙️ Voice Emergency Alert',
        description: transcript.trim(),
        severity: 'high',
        type: 'voice_emergency',
        flatNumber: '',
        audioData,          // base64 audio included
      });

      toast.success('🚨 Emergency alert broadcasted!', { duration: 4000 });
      setTranscript('');
      setAudioUrl(null);
      chunksRef.current = [];
      setShowPanel(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to broadcast');
    } finally {
      setSending(false);
    }
  };

  const discard = () => {
    stopAll();
    setTranscript('');
    setAudioUrl(null);
    chunksRef.current = [];
    setShowPanel(false);
  };

  return (
    <div ref={panelRef} style={{ position: 'relative', zIndex: 1000 }}>

      {/* ── Mic trigger button ── */}
      <button
        onClick={() => setShowPanel(p => !p)}
        title="Voice Emergency Alert"
        style={{
          width: 38, height: 38, borderRadius: '50%',
          border: listening ? '2px solid var(--red)' : '2px solid transparent',
          background: listening ? 'var(--red)' : showPanel ? 'var(--red-lt)' : 'var(--bg3)',
          color: listening ? '#fff' : 'var(--red)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: listening ? '0 0 0 6px rgba(239,68,68,0.2)' : '0 2px 8px rgba(0,0,0,0.08)',
          animation: listening ? 'pulse 1.2s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3"/>
          <path d="M5 10a7 7 0 0014 0"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <line x1="8"  y1="22" x2="16" y2="22"/>
        </svg>
      </button>

      {/* ── Dropdown panel ── */}
      {showPanel && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 320, background: 'var(--bg2)',
          border: '1px solid var(--bdr)', borderRadius: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
          overflow: 'hidden', animation: 'fadeIn 0.15s ease',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 16px 12px',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>🚨 Voice Emergency Alert</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
              Speak in Hindi, Marathi or English — audio + text broadcasted
            </div>
          </div>

          <div style={{ padding: 16 }}>

            {/* Mic button + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <button
                onClick={toggleMic}
                style={{
                  width: 52, height: 52, borderRadius: '50%', border: 'none',
                  background: listening ? 'var(--red)' : '#fee2e2',
                  color: listening ? '#fff' : 'var(--red)',
                  cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: listening
                    ? '0 0 0 8px rgba(239,68,68,0.2), 0 4px 12px rgba(220,38,38,0.4)'
                    : '0 2px 8px rgba(0,0,0,0.08)',
                  animation: listening ? 'pulse 1.2s ease-in-out infinite' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="12" rx="3"/>
                  <path d="M5 10a7 7 0 0014 0"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                  <line x1="8"  y1="22" x2="16" y2="22"/>
                </svg>
              </button>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: listening ? 'var(--red)' : 'var(--tx)' }}>
                  {listening ? '● Recording...' : audioUrl ? '✓ Audio captured' : 'Press to start'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>
                  {listening
                    ? `Recording audio + text in ${LANG_MAP[i18n.language] || 'hi-IN'}`
                    : audioUrl ? 'Preview below · tap to re-record' : 'Tap mic and speak your emergency'}
                </div>
              </div>
            </div>

            {/* Transcript box */}
            <div style={{
              minHeight: 60, background: 'var(--bg3)',
              border: `1.5px solid ${listening ? 'var(--red)' : 'var(--bdr)'}`,
              borderRadius: 10, padding: 12, fontSize: 13,
              color: transcript ? 'var(--tx)' : 'var(--tx3)',
              lineHeight: 1.6, marginBottom: 10,
              fontStyle: transcript ? 'normal' : 'italic',
              wordBreak: 'break-word', transition: 'border-color 0.2s',
            }}>
              {transcript || 'Your message will appear here as you speak...'}
              {listening && (
                <span style={{
                  display: 'inline-block', width: 6, height: 14,
                  background: 'var(--red)', borderRadius: 2, marginLeft: 4,
                  verticalAlign: 'middle', animation: 'pulse 0.8s ease-in-out infinite',
                }}/>
              )}
            </div>

            {/* Audio preview player */}
            {audioUrl && !listening && (
              <div style={{
                marginBottom: 14, padding: '10px 12px',
                background: '#f0fdf4', border: '1px solid #86efac',
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
                  Audio captured — preview before sending:
                </div>
                <audio
                  src={audioUrl}
                  controls
                  style={{ width: '100%', height: 32, outline: 'none' }}
                />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={broadcastAlert}
                disabled={!transcript.trim() || sending || listening}
                className="btn btn-danger"
                style={{ flex: 1, justifyContent: 'center', padding: '9px 12px', fontSize: 13 }}
              >
                {sending
                  ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5, borderColor: '#fff3', borderTopColor: '#fff' }} /> Sending...</>
                  : '🚨 Broadcast Alert'}
              </button>
              <button onClick={discard} className="btn btn-ghost" style={{ padding: '9px 14px', fontSize: 13 }}>
                Discard
              </button>
            </div>

            {/* Tip */}
            <div style={{
              marginTop: 12, fontSize: 11, color: 'var(--tx3)',
              background: 'var(--bg3)', borderRadius: 8, padding: '8px 10px',
              display: 'flex', gap: 6,
            }}>
              <span>💡</span>
              <span>Say things like <em>"Gate ke andar chor ghus gaya"</em> or <em>"Fire in Block B"</em>. Stop recording before broadcasting.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
