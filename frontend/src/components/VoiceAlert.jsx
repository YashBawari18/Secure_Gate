import React, { useState, useRef, useEffect } from 'react';
import { alertsAPI } from '../utils/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

// Map i18n language codes → SpeechRecognition lang codes
const LANG_MAP = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

export default function VoiceAlert() {
  const { t, i18n } = useTranslation();
  const [listening, setListening]   = useState(false);
  const [transcript, setTranscript] = useState('');
  const [sending, setSending]       = useState(false);
  const [showPanel, setShowPanel]   = useState(false);
  const recogRef = useRef(null);
  const panelRef = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    if (!showPanel) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        stopListening();
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPanel]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition not supported in this browser. Use Chrome.');
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous      = true;
    recog.interimResults  = true;
    recog.lang            = LANG_MAP[i18n.language] || 'hi-IN';

    recog.onresult = (e) => {
      let full = '';
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript;
      }
      setTranscript(full);
    };
    recog.onerror = (e) => {
      toast.error(`Mic error: ${e.error}`);
      setListening(false);
    };
    recog.onend = () => setListening(false);

    recog.start();
    recogRef.current = recog;
    setListening(true);
    setTranscript('');
  };

  const stopListening = () => {
    recogRef.current?.stop();
    setListening(false);
  };

  const toggleMic = () => {
    if (listening) stopListening();
    else           startListening();
  };

  const broadcastAlert = async () => {
    if (!transcript.trim()) return toast.error('No voice message recorded.');
    setSending(true);
    try {
      await alertsAPI.create({
        title: '🎙️ Voice Emergency Alert',
        description: transcript.trim(),
        severity: 'high',
        type: 'voice_emergency',
        flatNumber: '',
      });
      toast.success('🚨 Emergency alert broadcasted!', { duration: 4000 });
      setTranscript('');
      setShowPanel(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to broadcast');
    } finally {
      setSending(false);
    }
  };

  const discard = () => {
    stopListening();
    setTranscript('');
    setShowPanel(false);
  };

  return (
    <div ref={panelRef} style={{ position: 'relative', zIndex: 1000 }}>

      {/* Mic trigger button */}
      <button
        onClick={() => setShowPanel(p => !p)}
        title="Voice Emergency Alert"
        style={{
          width: 38, height: 38,
          borderRadius: '50%',
          border: listening ? '2px solid var(--red)' : '2px solid transparent',
          background: listening
            ? 'var(--red)'
            : showPanel ? 'var(--red-lt)' : 'var(--bg3)',
          color: listening ? '#fff' : 'var(--red)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: listening
            ? '0 0 0 6px rgba(239,68,68,0.2)'
            : '0 2px 8px rgba(0,0,0,0.08)',
          animation: listening ? 'pulse 1.2s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }}
      >
        {/* Mic SVG */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3"/>
          <path d="M5 10a7 7 0 0014 0"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <line x1="8"  y1="22" x2="16" y2="22"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {showPanel && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 320,
          background: 'var(--bg2)',
          border: '1px solid var(--bdr)',
          borderRadius: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 16px 12px',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
              🚨 Voice Emergency Alert
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
              Speak in Hindi, Marathi or English — auto-broadcast to all stations
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
                  {listening ? '● Recording...' : transcript ? 'Recording stopped' : 'Press to start'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>
                  {listening
                    ? `Listening in ${LANG_MAP[i18n.language] || 'hi-IN'}`
                    : 'Tap mic and speak your emergency'}
                </div>
              </div>
            </div>

            {/* Transcript box */}
            <div style={{
              minHeight: 72,
              background: 'var(--bg3)',
              border: `1.5px solid ${listening ? 'var(--red)' : 'var(--bdr)'}`,
              borderRadius: 10,
              padding: 12,
              fontSize: 13,
              color: transcript ? 'var(--tx)' : 'var(--tx3)',
              lineHeight: 1.6,
              marginBottom: 14,
              transition: 'border-color 0.2s',
              fontStyle: transcript ? 'normal' : 'italic',
              wordBreak: 'break-word',
              position: 'relative',
            }}>
              {transcript || 'Your message will appear here as you speak...'}
              {listening && (
                <span style={{
                  display: 'inline-block', width: 6, height: 14,
                  background: 'var(--red)', borderRadius: 2, marginLeft: 4,
                  verticalAlign: 'middle',
                  animation: 'pulse 0.8s ease-in-out infinite',
                }}/>
              )}
            </div>

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
              <button
                onClick={discard}
                className="btn btn-ghost"
                style={{ padding: '9px 14px', fontSize: 13 }}
              >
                Discard
              </button>
            </div>

            {/* Info tip */}
            <div style={{
              marginTop: 12, fontSize: 11, color: 'var(--tx3)',
              background: 'var(--bg3)', borderRadius: 8, padding: '8px 10px',
              display: 'flex', gap: 6, alignItems: 'flex-start',
            }}>
              <span>💡</span>
              <span>Say things like <em>"Gate ke andar chor ghus gaya"</em> or
              <em> "Fire in Block B"</em>. Stop recording before broadcasting.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
