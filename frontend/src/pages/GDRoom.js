import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './GDRoom.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
const API_URL   = process.env.REACT_APP_API_URL    || 'http://localhost:5001/api';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

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
  const [transcript,     setTranscript]     = useState('');
  const [contributions,  setContributions]  = useState([]);
  const [evaluation,     setEvaluation]     = useState(null);
  const [showEval,       setShowEval]       = useState(false);
  const [evaluating,     setEvaluating]     = useState(false);

  /* ── stable refs (never cause re-renders) ── */
  const socketRef       = useRef(null);
  const localVideoRef   = useRef(null);
  const localStreamRef  = useRef(null);
  const screenStreamRef = useRef(null);
  const pcsRef          = useRef({});          // { socketId: RTCPeerConnection }
  const recognitionRef  = useRef(null);
  const silenceRef      = useRef(null);
  const transcriptRef   = useRef('');

  /* keep transcriptRef in sync */
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

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
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch(err => console.warn('Camera/mic denied:', err))
      .finally(() => {
        socket.emit('join-room', { roomId, userName: user.name });
      });

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
    });

    socket.on('session-closed', () => {
      alert('Session has been closed.');
      navigate('/dashboard');
    });

    return () => {
      Object.values(pcsRef.current).forEach(pc => pc.close());
      pcsRef.current = {};
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      recognitionRef.current?.stop();
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
    setContributions(p => [...p, newMessage]);
    setNewMessage('');
  };

  const sendVoiceMsg = text => {
    if (!text.trim()) return;
    const msg = { roomId, message: text, sender: user.name, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    socketRef.current.emit('send-message', msg);
    setContributions(p => [...p, text]);
  };

  /* ── media controls ── */
  const toggleVideo = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsVideoOn(t.enabled); }
  };
  const toggleAudio = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsAudioOn(t.enabled); }
  };

  const startScreenShare = async () => {
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

  /* ── voice mode ── */
  const startVoiceMode = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Use Chrome or Edge for voice mode.'); return; }
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = 'en-US';
    recognitionRef.current = r;
    r.onstart = () => { setIsVoiceMode(true); setIsListening(true); };
    r.onresult = event => {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + ' '; else interim += t;
      }
      if (final) {
        setTranscript(p => p + final);
        clearTimeout(silenceRef.current);
        silenceRef.current = setTimeout(() => {
          const txt = transcriptRef.current.trim();
          if (txt) { sendVoiceMsg(txt); setTranscript(''); }
        }, 2000);
      } else { setTranscript(interim); }
    };
    r.onerror = e => { if (e.error !== 'no-speech') console.error(e.error); };
    r.onend = () => { if (recognitionRef.current) r.start(); };
    r.start();
  };

  const stopVoiceMode = () => {
    recognitionRef.current?.stop(); recognitionRef.current = null;
    clearTimeout(silenceRef.current);
    setIsVoiceMode(false); setIsListening(false); setTranscript('');
  };

  /* ── evaluation ── */
  const generateEvaluation = async () => {
    if (!contributions.length) return;
    setEvaluating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/evaluation/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gdId: roomId, gdTitle: `GD Room ${roomId}`, messageCount: contributions.length, speakingTime: 0, contributions }),
      });
      const data = await res.json();
      if (data.success) { setEvaluation(data.evaluation); setShowEval(true); }
    } catch (_) {}
    setEvaluating(false);
  };

  const leaveRoom = async () => {
    stopVoiceMode();
    socketRef.current?.emit('leave-room', roomId);
    if (contributions.length) await generateEvaluation();
    try {
      const { gd } = await import('../utils/api');
      const res = await gd.getAll();
      const cur = res.data.find(g => g.roomId === roomId);
      if (cur) await gd.leave(cur._id);
    } catch (_) {}
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (!showEval) navigate('/dashboard');
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
          <div className="modal-content">
            <h2>🎯 Communication Score</h2>
            <div className="score-display">
              <span className="score-value" style={{ color: sc(evaluation.scores.totalScore) }}>{evaluation.scores.totalScore}</span>
              <span className="score-max">/100</span>
            </div>
            <div className="score-grid">
              {[
                ['Clarity', evaluation.scores.clarity, 'clarity'], 
                ['Relevance', evaluation.scores.relevance, 'relevance'], 
                ['Engagement', evaluation.scores.engagement, 'engagement'], 
                ['Professionalism', evaluation.scores.professionalism, 'professionalism']
              ].map(([l, v, className]) => (
                <div key={l} className={`score-card ${className}`}>
                  <div className="score-card-label">{l}</div>
                  <div className="score-card-value">{v}/25</div>
                </div>
              ))}
            </div>
            <div className="feedback-text">
              {evaluation.feedback}
            </div>
            {evaluation.blockchainCertificate && (
              <div className="certificate-box">
                <strong>🏆 Certificate Issued!</strong>
                <div className="certificate-id">ID: {evaluation.blockchainCertificate.certificateId}</div>
              </div>
            )}
            <button className="btn-modal-close" onClick={() => { setShowEval(false); navigate('/dashboard'); }}>
              Close & Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="gd-header">
        <div style={{display: 'flex', alignItems: 'center'}}>
          <span className="room-title">GD Room: {roomId}</span>
          <span className="participant-count">{total} participant{total > 1 ? 's' : ''}</span>
        </div>
        <button className="btn-danger-outline" onClick={leaveRoom} disabled={evaluating}>
          {evaluating ? 'Evaluating…' : 'Leave Room'}
        </button>
      </header>

      <div className="gd-main">

        {/* ── Video grid ── */}
        <div className="video-area">
          <div className="share-link-wrapper">
            <span>🔗 Share Link:</span>
            <span className="share-url">{window.location.origin}/join/{roomId}</span>
            <button className="btn-copy" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`)}>
              Copy
            </button>
          </div>

          <div className={`video-grid cols-${cols}`}>
            {/* local */}
            <div className="video-tile">
              <video ref={localVideoRef} autoPlay muted playsInline className="video-element" />
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
              [isVoiceMode   ? stopVoiceMode   : startVoiceMode,   isVoiceMode   ? '🔴 Stop Voice'  : '🎙️ Voice Mode',  isVoiceMode   ? 'btn-danger' : 'btn-primary'],
            ].map(([fn, label, btnClass]) => (
              <button key={label} onClick={fn} className={`control-btn ${btnClass}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat ── */}
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
            
            {isVoiceMode && transcript && (
              <div className="transcript-preview">
                <div className="transcript-label">🎙️ Speaking...</div>
                <div className="transcript-text">{transcript}</div>
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
          </div>

          <div className="chat-input-area">
            <form className="chat-form" onSubmit={sendMessage}>
              <input 
                type="text" 
                className="chat-input"
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)}
                placeholder={isVoiceMode ? 'Voice mode on...' : 'Type a message...'}
                disabled={isVoiceMode}
              />
              <button type="submit" className="btn-send" disabled={isVoiceMode || !newMessage.trim()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
