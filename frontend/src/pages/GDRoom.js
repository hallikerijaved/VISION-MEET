import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { API_URL, SOCKET_URL } from '../utils/api';
import './GDRoom.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const mediaRequiresSecureOrigin = !window.isSecureContext && !isLocalhost;
const secureMediaMessage = `Camera and microphone need a secure browser origin. Open this app at http://localhost:3000 on this computer, or use an HTTPS deployment/tunnel for other devices. Current URL: ${window.location.origin}`;

/* ── tiny helper: attach stream to <video> ── */
const RemoteVideo = ({ stream, name }) => {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="video-tile">
      <video ref={ref} autoPlay playsInline className="video-element" />
      <span className="video-label">{name}</span>
    </div>
  );
};

export default function GDRoom({ user }) {
  const { roomId }  = useParams();
  const navigate    = useNavigate();

  /* ── UI state ── */
  const [messages,       setMessages]       = useState([]);
  const [newMessage,     setNewMessage]     = useState('');
  const [peers,          setPeers]          = useState({});   // { id: {stream,name} }
  const [isVideoOn,      setIsVideoOn]      = useState(true);
  const [isAudioOn,      setIsAudioOn]      = useState(true);
  const [isScreenShare,  setIsScreenShare]  = useState(false);
  const [isVoiceMode,    setIsVoiceMode]    = useState(false);
  const [isListening,    setIsListening]    = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [contributions,  setContributions]  = useState([]);
  const contributionsRef = useRef([]);
  const [evaluation,     setEvaluation]     = useState(null);
  const [showEval,       setShowEval]       = useState(false);
  const [evaluating,     setEvaluating]     = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [isChatOpen,     setIsChatOpen]     = useState(false);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [isModerator,    setIsModerator]    = useState(false);
  const [gdIdMongo,      setGdIdMongo]      = useState(null);
  const [gdTopic,        setGdTopic]        = useState(`GD Room ${roomId}`);

  /* ── stable refs (never cause re-renders) ── */
  const socketRef       = useRef(null);
  const localVideoRef   = useRef(null);
  const localStreamRef  = useRef(null);
  const screenStreamRef = useRef(null);
  const pcsRef          = useRef({});          // { socketId: RTCPeerConnection }
  const silenceRef      = useRef(null);
  const messagesEndRef  = useRef(null);
  const isChatOpenRef   = useRef(false);
  const speechTranscriptRef = useRef('');

  const { transcript: speechTranscript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    speechTranscriptRef.current = speechTranscript;
  }, [speechTranscript]);

  const addContribution = useCallback((text) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    const current = contributionsRef.current;
    if (current[current.length - 1] === cleaned) return;
    const newContribs = [...current, cleaned];
    setContributions(newContribs);
    contributionsRef.current = newContribs;
  }, []);

  const flushSpeechContribution = useCallback(() => {
    const pendingSpeech = speechTranscriptRef.current.trim();
    if (!pendingSpeech) return;
    addContribution(pendingSpeech);
    speechTranscriptRef.current = '';
    resetTranscript();
  }, [addContribution, resetTranscript]);

  /* scroll chat to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, speechTranscript]);

  /* ════════════════════════════════════════════
     createPC — always reads localStreamRef.current
     at call-time so tracks are never stale
  ════════════════════════════════════════════ */
  function createPC(socketId, remoteName) {
    if (pcsRef.current[socketId]) return pcsRef.current[socketId];

    const pc = new RTCPeerConnection(ICE_SERVERS);

    /* add local tracks NOW (stream is ready by this point) */
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    pc.ontrack = ({ streams: [remote] }) => {
      setPeers(prev => ({ ...prev, [socketId]: { stream: remote, name: remoteName } }));
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketRef.current.emit('ice-candidate', { to: socketId, candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        pc.close();
        delete pcsRef.current[socketId];
        setPeers(prev => { const n = { ...prev }; delete n[socketId]; return n; });
      }
    };

    pcsRef.current[socketId] = pc;
    return pc;
  }

  /* ════════════════════════════════════════════
     Main effect — runs once
  ════════════════════════════════════════════ */
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'], upgrade: false });
    socketRef.current = socket;

    /* 1. get media FIRST, then join room */
    if (mediaRequiresSecureOrigin || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn(secureMediaMessage);
      alert(`${secureMediaMessage}\n\nYou will join without video/audio.`);
      socket.emit('join-room', { roomId, userName: user.name });
    } else {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          if (browserSupportsSpeechRecognition) {
            startVoiceMode();
          }
        })
        .catch(err => console.warn('Camera/mic denied:', err))
        .finally(() => {
          socket.emit('join-room', { roomId, userName: user.name });
        });
    }

    /* ── signalling ── */

    /* existing user → new joiner sends offer */
    socket.on('user-joined', async ({ socketId, userName }) => {
      const pc = createPC(socketId, userName);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { to: socketId, offer, userName: user.name });
    });

    socket.on('offer', async ({ from, offer, userName: rName }) => {
      const pc = createPC(from, rName);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { to: from, answer });
    });

    socket.on('answer', async ({ from, answer }) => {
      const pc = pcsRef.current[from];
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      const pc = pcsRef.current[from];
      if (pc) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (_) {}
      }
    });

    socket.on('user-left', ({ socketId }) => {
      pcsRef.current[socketId]?.close();
      delete pcsRef.current[socketId];
      setPeers(prev => { const n = { ...prev }; delete n[socketId]; return n; });
    });

    /* ── chat ── */
    socket.on('receive-message', data => {
      setMessages(prev => [...prev, data]);
      if (!isChatOpenRef.current) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socket.on('session-closed', async () => {
      alert('The moderator has ended the session.');
      SpeechRecognition.stopListening();
      flushSpeechContribution();
      if (contributionsRef.current.length > 0) {
        try {
          setEvaluating(true);
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/evaluation/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ 
              gdId: roomId, 
              gdTitle: gdTopic, 
              messageCount: contributionsRef.current.length, 
              speakingTime: 0, 
              contributions: contributionsRef.current 
            }),
          });
          const data = await res.json();
          if (data.success) { 
            setEvaluation(data.evaluation); 
            setShowEval(true); 
          } else {
            navigate('/dashboard');
          }
        } catch (_) {
          navigate('/dashboard');
        } finally {
          setEvaluating(false);
        }
      } else {
        navigate('/dashboard');
      }
    });

    /* fetch gd details to check moderator */
    import('../utils/api').then(({ gd }) => {
      gd.getAll().then(res => {
        const cur = res.data.find(g => g.roomId === roomId);
        if (cur) {
          setGdIdMongo(cur._id);
          setGdTopic(cur.title || `GD Room ${roomId}`);
          if (cur.moderator._id === user.id || cur.moderator === user.id) {
            setIsModerator(true);
          }
        }
      }).catch(() => {});
    });

    return () => {
      Object.values(pcsRef.current).forEach(pc => pc.close());
      pcsRef.current = {};
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      clearTimeout(silenceRef.current);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── chat send ── */
  const sendMessage = e => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg = { roomId, message: newMessage, sender: user.name, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    socketRef.current.emit('send-message', msg);
    addContribution(newMessage);
    setNewMessage('');
  };

  const sendVoiceMsg = text => {
    if (!text.trim()) return;
    addContribution(text);
  };

  const toggleChat = () => {
    const newState = !isChatOpen;
    setIsChatOpen(newState);
    isChatOpenRef.current = newState;
    if (newState) {
      setUnreadCount(0);
    }
  };

  /* ── media controls ── */
  const toggleVideo = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsVideoOn(t.enabled); }
  };
  const toggleAudio = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { 
      t.enabled = !t.enabled; 
      setIsAudioOn(t.enabled); 
      if (t.enabled && browserSupportsSpeechRecognition) {
        startVoiceMode();
      } else {
        stopVoiceMode();
      }
    }
  };

  const startScreenShare = async () => {
    if (mediaRequiresSecureOrigin || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert(`Screen sharing is blocked. ${secureMediaMessage}`);
      return;
    }
    try {
      const ss = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = ss;
      if (localVideoRef.current) localVideoRef.current.srcObject = ss;
      const vt = ss.getVideoTracks()[0];
      Object.values(pcsRef.current).forEach(pc => {
        const s = pc.getSenders().find(s => s.track?.kind === 'video');
        if (s) s.replaceTrack(vt);
      });
      setIsScreenShare(true);
      vt.onended = stopScreenShare;
    } catch (_) {}
  };

  const stopScreenShare = async () => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    setIsScreenShare(false);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    
    try {
      const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = cam;
      if (localVideoRef.current) localVideoRef.current.srcObject = cam;
      const vt = cam.getVideoTracks()[0];
      Object.values(pcsRef.current).forEach(pc => {
        const s = pc.getSenders().find(s => s.track?.kind === 'video');
        if (s) s.replaceTrack(vt);
      });
    } catch (_) {}
  };

  /* ── voice mode (react-speech-recognition) ── */
  const startVoiceMode = () => {
    if (!browserSupportsSpeechRecognition) return;
    setIsVoiceMode(true);
    setIsListening(true);
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  };

  const stopVoiceMode = () => {
    SpeechRecognition.stopListening();
    setIsVoiceMode(false);
    setIsListening(false);
    flushSpeechContribution();
  };

  useEffect(() => {
    if (isVoiceMode && speechTranscript) {
      clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => {
        if (speechTranscript.trim()) {
          sendVoiceMsg(speechTranscript.trim());
          speechTranscriptRef.current = '';
          resetTranscript();
        }
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechTranscript, isVoiceMode, resetTranscript]);

  /* ── evaluation ── */
  const generateEvaluation = async () => {
    flushSpeechContribution();
    if (!contributionsRef.current.length) return false;
    setEvaluating(true);
    let success = false;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/evaluation/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gdId: roomId, gdTitle: gdTopic, messageCount: contributionsRef.current.length, speakingTime: 0, contributions: contributionsRef.current }),
      });
      const data = await res.json();
      if (data.success) { 
        setEvaluation(data.evaluation); 
        setShowEval(true); 
        success = true;
      }
    } catch (_) {}
    setEvaluating(false);
    return success;
  };

  const leaveRoom = async () => {
    stopVoiceMode();
    socketRef.current?.emit('leave-room', roomId);
    let evalSuccess = false;
    if (contributionsRef.current.length) {
      evalSuccess = await generateEvaluation();
    }
    try {
      const { gd } = await import('../utils/api');
      const res = await gd.getAll();
      const cur = res.data.find(g => g.roomId === roomId);
      if (cur) await gd.leave(cur._id);
    } catch (_) {}
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (!evalSuccess) {
      navigate('/dashboard');
    }
  };

  const endSession = async () => {
    if (!window.confirm('Are you sure you want to end this session for everyone?')) return;
    try {
      const { gd } = await import('../utils/api');
      if (gdIdMongo) {
        await gd.end(gdIdMongo);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to end session.');
    }
  };

  const sc = s => s >= 75 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
  const peerList = Object.entries(peers);
  const total = peerList.length + 1;
  const cols = total === 1 ? '1' : total === 2 ? '2' : total <= 4 ? '2' : '3';

  return (
    <div className="gd-room-container">

      {/* ── Evaluation modal ── */}
      {showEval && evaluation && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', width: '90%', padding: '2.5rem', background: 'linear-gradient(145deg, #ffffff, #f8fafc)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '2.2rem', color: '#0f172a', margin: '0 0 0.5rem 0', fontWeight: '800', letterSpacing: '-0.5px' }}>Performance Evaluation</h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: '1.1rem' }}>AI-generated insights based on your spoken communication</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
              <div style={{ position: 'relative', width: '180px', height: '180px', borderRadius: '50%', background: `conic-gradient(${sc(evaluation.scores.finalScore)} ${evaluation.scores.finalScore}%, #e2e8f0 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: '900', color: sc(evaluation.scores.finalScore), lineHeight: '1', letterSpacing: '-1px' }}>{Math.round(evaluation.scores.finalScore)}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '1px' }}>Overall</span>
                </div>
              </div>
            </div>

            {evaluation.matchedKeywords && evaluation.matchedKeywords.length > 0 && (
              <div style={{ marginBottom: '3rem', textAlign: 'center', background: '#f1f5f9', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  Keywords Matched
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center' }}>
                  {evaluation.matchedKeywords.map((kw, i) => (
                    <span key={i} style={{ background: '#fff', color: '#4f46e5', padding: '0.5rem 1rem', borderRadius: '30px', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #c7d2fe', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.05)', transition: 'all 0.2s', cursor: 'default' }} onMouseOver={e => {e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(79, 70, 229, 0.1)'}} onMouseOut={e => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(79, 70, 229, 0.05)'}}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              {[
                ['Topic Relevance', evaluation.scores.topicRelevance, '🎯'], 
                ['Semantic Match', evaluation.scores.semanticSimilarity, '🧠'], 
                ['Keyword Usage', evaluation.scores.keywordMatching, '🔑'], 
                ['Sentiment Score', evaluation.scores.sentimentScore, '😊'],
                ['Grammar Quality', evaluation.scores.grammarQuality, '📝'],
                ['Communication', evaluation.scores.communicationQuality, '🗣️']
              ].map(([l, v, icon]) => (
                <div key={l} style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>{icon} {l}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: sc(v) }}>{Math.round(v)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${v}%`, height: '100%', background: sc(v), borderRadius: '4px', transition: 'width 1.5s cubic-bezier(0.22, 1, 0.36, 1)' }}></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ background: 'linear-gradient(to bottom right, #f0fdf4, #ecfdf5)', border: '1px solid #a7f3d0', padding: '1.8rem', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.05)' }}>
                <h4 style={{ margin: '0 0 1.2rem 0', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><span>🌟</span> Strengths</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.95rem', color: '#065f46', display: 'flex', flexDirection: 'column', gap: '0.8rem', lineHeight: '1.5' }}>
                  {evaluation.strengths?.length > 0 ? evaluation.strengths.map((s, i) => <li key={i}>{s}</li>) : <li>No significant strengths detected.</li>}
                </ul>
              </div>
              <div style={{ background: 'linear-gradient(to bottom right, #fef2f2, #fff1f2)', border: '1px solid #fecaca', padding: '1.8rem', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.05)' }}>
                <h4 style={{ margin: '0 0 1.2rem 0', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><span>📈</span> Areas to Improve</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.95rem', color: '#991b1b', display: 'flex', flexDirection: 'column', gap: '0.8rem', lineHeight: '1.5' }}>
                  {evaluation.weaknesses?.length > 0 ? evaluation.weaknesses.map((w, i) => <li key={i}>{w}</li>) : <li>No significant weaknesses detected.</li>}
                </ul>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1.8rem', borderRadius: '20px', marginBottom: '2.5rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><span>💡</span> Actionable Feedback</h4>
              <p style={{ margin: '0 0 1.2rem 0', color: '#334155', fontSize: '1rem', lineHeight: '1.6' }}>{evaluation.feedback}</p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.95rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {evaluation.improvements?.map((imp, i) => <li key={i}>{imp}</li>)}
              </ul>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={() => { setShowEval(false); navigate('/dashboard'); }}
                style={{ padding: '1.2rem 3rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)', transition: 'all 0.2s', letterSpacing: '0.5px' }}
                onMouseOver={e => {e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(37, 99, 235, 0.5)'}}
                onMouseOut={e => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(37, 99, 235, 0.4)'}}
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="gd-header">
        <div style={{display: 'flex', alignItems: 'center'}}>
          <span className="room-title">GD Room: {roomId}</span>
          <span className="participant-count">{total} participant{total > 1 ? 's' : ''}</span>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          {isModerator && (
            <button className="btn-danger-outline" onClick={endSession} disabled={evaluating} style={{ background: '#ef4444', color: 'white', border: 'none' }}>
              End Session
            </button>
          )}
          <button className="btn-danger-outline" onClick={leaveRoom} disabled={evaluating}>
            {evaluating ? 'Evaluating…' : 'Leave Room'}
          </button>
        </div>
      </header>

      <div className="gd-main">

        {/* ── Video grid ── */}
        <div className="video-area">
          <div className="share-link-wrapper">
            <button 
              className="btn-copy" 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? '✅ Copied!' : '🔗 Copy Share Link'}
            </button>
          </div>

          <div className={`video-grid cols-${cols}`}>
            {/* local */}
            <div className="video-tile">
              <video ref={localVideoRef} autoPlay muted playsInline className="video-element local-mirror" />
              <span className="video-label">{user.name} (You)</span>
            </div>

            {/* remote peers */}
            {peerList.map(([id, { stream, name }]) => (
              <RemoteVideo key={id} stream={stream} name={name} />
            ))}
          </div>

          {/* controls */}
          <div className="controls-bar">
            {[
              [toggleVideo,  isVideoOn  ? '📹 Video On'    : '📹 Video Off',   isVideoOn  ? 'btn-active' : 'btn-danger'],
              [toggleAudio,  isAudioOn  ? '🎤 Mic On'      : '🎤 Mic Off',     isAudioOn  ? 'btn-active' : 'btn-danger'],
              [isScreenShare ? stopScreenShare : startScreenShare, isScreenShare ? '🖥️ Stop Share' : '🖥️ Share Screen', isScreenShare ? 'btn-danger' : 'btn-info'],
            ].map(([fn, label, btnClass]) => (
              <button key={label} onClick={fn} className={`control-btn ${btnClass}`}>
                {label}
              </button>
            ))}
          </div>

          <button 
            className={`chat-floating-btn ${isChatOpen ? 'active' : ''} ${!isChatOpen && unreadCount > 0 ? 'has-unread' : ''}`}
            onClick={toggleChat}
          >
            💬 Chat {unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
        </div>

        {/* ── Chat ── */}
        {isChatOpen && (
          <div className="chat-sidebar">
            <div className="chat-header">
            <span>💬 Live Chat</span>
            {isVoiceMode && (
              <span className={`voice-status ${isListening ? 'listening' : 'paused'}`}>
                {isListening ? '● Listening' : '⏸ Paused'}
              </span>
            )}
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="empty-chat">Say hello to the group! 👋</div>
            )}
            
            {isVoiceMode && speechTranscript && (
              <div className="transcript-preview">
                <div className="transcript-label">🎙️ Speaking...</div>
                <div className="transcript-text">{speechTranscript}</div>
              </div>
            )}
            
            {messages.map((msg, i) => {
              const isMe = msg.sender === user.name;
              return (
                <div key={i} className={`message-wrapper ${isMe ? 'me' : 'them'}`}>
                  {!isMe && <div className="message-sender">{msg.sender}</div>}
                  <div className="message-bubble">{msg.message}</div>
                  <div className="message-time">{msg.timestamp}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <form className="chat-form" onSubmit={sendMessage}>
              <input 
                type="text" 
                className="chat-input"
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)}
                placeholder={isVoiceMode ? 'Listening to voice...' : 'Type a message...'}
              />
              <button type="submit" className="btn-send" disabled={!newMessage.trim()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
