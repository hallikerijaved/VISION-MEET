import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import api from '../utils/api';

function RealTimeInterview({ user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('setup');
  const [mode, setMode] = useState('chat');
  const [role, setRole] = useState('Java Developer');
  const [difficulty, setDifficulty] = useState('Easy');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [results, setResults] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [statusText, setStatusText] = useState('Ready');
  const [jobDescription, setJobDescription] = useState('');
  const [interimText, setInterimText] = useState('');

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef('');
  const isSpeakingRef = useRef(false);
  const voiceModeActiveRef = useRef(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sessionActiveRef = useRef(false);
  const responseDelayRef = useRef(null);
  const resultsDelayRef = useRef(null);
  const speechFallbackRef = useRef(null);

  const startRecognition = React.useCallback(() => {
    if (!sessionActiveRef.current || !recognitionRef.current) {
      return false;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setStatusText('Listening');
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const stopCamera = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const cleanupInterviewSession = React.useCallback(() => {
    sessionActiveRef.current = false;
    voiceModeActiveRef.current = false;
    isSpeakingRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (responseDelayRef.current) {
      clearTimeout(responseDelayRef.current);
      responseDelayRef.current = null;
    }
    if (resultsDelayRef.current) {
      clearTimeout(resultsDelayRef.current);
      resultsDelayRef.current = null;
    }
    if (speechFallbackRef.current) {
      clearTimeout(speechFallbackRef.current);
      speechFallbackRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // Recognition may already be stopped.
      }
    }

    synthRef.current.cancel();
    setIsListening(false);
    setIsSpeaking(false);
    stopCamera();
  }, [stopCamera]);

  const processVoiceResponse = async () => {
    const capturedAnswer = transcriptRef.current.trim();
    if (!sessionActiveRef.current || !capturedAnswer || isSpeakingRef.current) {
      return;
    }

    setMessages((previous) => [...previous, { type: 'user', text: capturedAnswer }]);
    setTranscript('');
    setInterimText('');
    transcriptRef.current = '';
    setStatusText('Thinking');
    await sendMessage(capturedAnswer);
  };

  const resetSilenceTimer = React.useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    silenceTimerRef.current = setTimeout(() => {
      if (sessionActiveRef.current && mode === 'voice' && transcriptRef.current.trim() && !isSpeakingRef.current) {
        processVoiceResponse();
      }
    }, 3000); // Increased to 3 seconds for more natural pauses
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (step !== 'interview') {
      stopCamera();
      return undefined;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return undefined;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error('Camera access denied:', err));

    return stopCamera;
  }, [step, stopCamera]);

  useEffect(() => {
    voiceModeActiveRef.current = mode === 'voice' && step === 'interview';
  }, [mode, step]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return undefined;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = mode === 'voice';
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      if (mode === 'chat') {
        const text = event.results[0][0].transcript;
        setUserInput(text);
        setIsListening(false);
        setStatusText('Voice captured');
        return;
      }

      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          finalTranscript += `${event.results[i][0].transcript} `;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimText(interim);

      if (finalTranscript) {
        setTranscript((previous) => previous + finalTranscript);
        resetSilenceTimer();
      }
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
      setStatusText('Microphone error');
    };

    recognitionRef.current.onend = () => {
      const shouldResume = sessionActiveRef.current && voiceModeActiveRef.current && !isSpeakingRef.current;
      if (!shouldResume) {
        setIsListening(false);
        return;
      }

      setTimeout(() => {
        if (!startRecognition()) {
          setIsListening(false);
        }
      }, 250);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [mode, resetSilenceTimer, startRecognition]);

  useEffect(() => cleanupInterviewSession, [cleanupInterviewSession]);

  const speakText = (text) => new Promise((resolve) => {
    if (!sessionActiveRef.current || mode !== 'voice' || !text) {
      resolve();
      return;
    }

    if (synthRef.current.paused) {
      synthRef.current.resume();
    }

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Select premium voice if available (Google/Microsoft)
    const voices = synthRef.current.getVoices();
    const premiumVoice = voices.find(v => v.lang.startsWith('en-US') && (v.name.includes('Google') || v.name.includes('Zira'))) 
      || voices.find(v => v.lang.startsWith('en-US')) 
      || voices[0];
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => {
      if (!sessionActiveRef.current) {
        synthRef.current.cancel();
        resolve();
        return;
      }

      isSpeakingRef.current = true;
      setIsSpeaking(true);
      setStatusText('AI speaking');

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Recognition may already be stopped.
        }
      }
    };
    utterance.onerror = (e) => {
      console.error('SpeechSynthesis Error:', e);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (sessionActiveRef.current && voiceModeActiveRef.current) setStatusText('Listening');
      resolve();
    };
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (sessionActiveRef.current && voiceModeActiveRef.current) {
        setStatusText('Listening');
      }
      resolve();
    };

    // Chrome bug fallback for long strings without onend firing
    const fallbackDuration = Math.max(text.length * 100, 3000);
    speechFallbackRef.current = setTimeout(() => {
      if (sessionActiveRef.current && isSpeakingRef.current) {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        if (voiceModeActiveRef.current) setStatusText('Listening');
        resolve();
      }
    }, fallbackDuration);

    const originalOnEnd = utterance.onend;
    utterance.onend = () => {
      if (speechFallbackRef.current) {
        clearTimeout(speechFallbackRef.current);
        speechFallbackRef.current = null;
      }
      originalOnEnd();
    };

    if (!sessionActiveRef.current) {
      resolve();
      return;
    }

    synthRef.current.speak(utterance);
  });

  const startInterview = async () => {
    try {
      cleanupInterviewSession();
      sessionActiveRef.current = true;
      const response = await api.post('/realtime-interview/start', { role, difficulty, jobDescription });

      if (!sessionActiveRef.current) {
        return;
      }

      setSessionId(response.data.sessionId);
      setMessages([
        { type: 'ai', text: response.data.greeting },
        { type: 'ai', text: response.data.firstQuestion }
      ]);
      setCurrentQuestion(response.data.firstQuestion);
      setQuestionCount(1);
      setStep('interview');
      setStatusText(mode === 'voice' ? 'AI speaking' : 'Interview started');

      if (mode === 'voice') {
        await speakText(response.data.greeting);
        if (!sessionActiveRef.current) return;
        await speakText(response.data.firstQuestion);
        if (!sessionActiveRef.current) return;
        startRecognition();
      }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Error starting interview';
      alert(message);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported');
      return;
    }

    startRecognition();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setStatusText('Paused');
  };

  const endInterview = () => {
    const endedSessionId = sessionId;
    cleanupInterviewSession();

    if (endedSessionId) {
      api.patch(`/realtime-interview/${endedSessionId}/end`).catch((error) => {
        console.error('Failed to mark interview as ended:', error);
      });
    }

    navigate('/dashboard');
  };

  const sendMessage = async (messageText) => {
    const textToSend = messageText || userInput.trim();
    if (!sessionActiveRef.current || !textToSend || isAITyping) {
      return;
    }

    if (!messageText) {
      setMessages((previous) => [...previous, { type: 'user', text: textToSend }]);
    }

    setUserInput('');
    setIsAITyping(true);
    setStatusText('Thinking');

    try {
      const response = await api.post('/realtime-interview/respond', { sessionId, userAnswer: textToSend, currentQuestion });

      if (!sessionActiveRef.current) {
        return;
      }

      responseDelayRef.current = setTimeout(async () => {
        responseDelayRef.current = null;
        if (!sessionActiveRef.current) {
          return;
        }

        if (response.data.completed) {
          setMessages((previous) => [
            ...previous,
            { type: 'ai', text: response.data.feedback },
            { type: 'ai', text: response.data.closingMessage }
          ]);

          if (mode === 'voice') {
            await speakText(response.data.feedback);
            if (!sessionActiveRef.current) return;
            await speakText(response.data.closingMessage);
            if (!sessionActiveRef.current) return;
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          }

          setCurrentQuestion('');
          setResults(response.data.results);
          setStatusText('Interview complete');
          resultsDelayRef.current = setTimeout(() => {
            resultsDelayRef.current = null;
            if (sessionActiveRef.current) {
              setStep('results');
            }
          }, 1800);
        } else {
          setMessages((previous) => [
            ...previous,
            { type: 'ai', text: response.data.feedback },
            { type: 'ai', text: response.data.nextQuestion }
          ]);

          setCurrentQuestion(response.data.nextQuestion);
          if (mode === 'voice') {
            await speakText(response.data.feedback);
            if (!sessionActiveRef.current) return;
            await speakText(response.data.nextQuestion);
            if (!sessionActiveRef.current) return;
          }

          setQuestionCount((previous) => previous + 1);
          setStatusText(mode === 'voice' ? 'Listening' : 'Waiting for your answer');
        }

        setIsAITyping(false);
      }, 1000);
    } catch (error) {
      setIsAITyping(false);
      setStatusText('Error');
      const message = error.response?.data?.error || error.response?.data?.message || 'Error sending message';
      alert(message);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const renderCameraTile = () => (
    <div className="interview-camera-card">
      <div className="camera-header">
        <span>Camera Preview</span>
        <span className="camera-live-dot">Live</span>
      </div>
      <div className="camera-frame">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
        />
      </div>
      <div className="camera-meta">
        <strong>{user?.name || 'Candidate'}</strong>
        <span>{role}</span>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#eef2ff' }}>
      <Navigation user={user} />
      <div
        style={{
          width: '100%',
          maxWidth: step === 'interview' && mode === 'voice' ? 'none' : step === 'interview' ? '1180px' : '900px',
          margin: '0 auto',
          padding: step === 'interview' && mode === 'voice' ? '16px' : '32px 20px',
          boxSizing: 'border-box'
        }}
      >
        {step === 'setup' && (
          <div style={{ background: 'white', borderRadius: '15px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '30px', color: '#333' }}>AI Mock Interview</h1>

            <div style={{ marginBottom: '30px', display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setMode('chat')}
                style={{
                  flex: 1,
                  padding: '20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: mode === 'chat' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f0f0',
                  color: mode === 'chat' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                Chat Mode
                <br />
                <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Type or tap the mic</span>
              </button>
              <button
                onClick={() => setMode('voice')}
                style={{
                  flex: 1,
                  padding: '20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: mode === 'voice' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f0f0',
                  color: mode === 'voice' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                Voice Call
                <br />
                <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Continuous conversation flow</span>
              </button>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>Select Role:</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '2px solid #ddd' }}
              >
                <option>Java Developer</option>
                <option>Full Stack</option>
                <option>HR</option>
                <option>Custom Role</option>
              </select>
            </div>

            {role === 'Custom Role' && (
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>Job Description (Optional):</label>
                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Paste the job requirements here so the AI can tailor the questions..."
                  style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '2px solid #ddd', minHeight: '100px', resize: 'vertical' }}
                />
              </div>
            )}

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>Select Difficulty:</label>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '2px solid #ddd' }}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            {mode === 'voice' && (
              <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '30px', border: '2px solid #ffc107' }}>
                <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
                  <strong>Voice mode:</strong> speak naturally, pause when done, and the interviewer will respond automatically.
                </p>
              </div>
            )}

            <button
              onClick={startInterview}
              style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
            >
              {mode === 'chat' ? 'Start Chat Interview' : 'Start Voice Interview'}
            </button>
          </div>
        )}

        {step === 'interview' && mode === 'chat' && (
          <div className="interview-room">
            <main className="conversation-panel">
              <div className="room-header">
                <div>
                  <h2 style={{ margin: 0, color: '#1f2937', fontSize: '24px' }}>AI Interviewer</h2>
                  <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>{role} - {difficulty}</p>
                </div>
                <div className="status-row">
                  <div style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                    Question {questionCount}/5
                  </div>
                  <div style={{ background: '#111827', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                    {statusText}
                  </div>
                </div>
              </div>

              <div className="message-list">
                {messages.map((message, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start', marginBottom: '15px' }}>
                    <div
                      style={{
                        maxWidth: '78%',
                        padding: '12px 18px',
                        borderRadius: message.type === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                        background: message.type === 'user' ? '#4f46e5' : '#f3f4f6',
                        color: message.type === 'user' ? 'white' : '#1f2937',
                        fontSize: '15px',
                        lineHeight: '1.5'
                      }}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isAITyping && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                    <div style={{ padding: '12px 18px', borderRadius: '18px 18px 18px 0', background: '#f3f4f6', color: '#6b7280' }}>
                      AI is thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-row">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isAITyping}
                  style={{
                    padding: '12px 20px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: isListening ? '#dc3545' : '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: isAITyping ? 'not-allowed' : 'pointer',
                    opacity: isAITyping ? 0.5 : 1
                  }}
                >
                  {isListening ? 'Stop' : 'Speak'}
                </button>
                <textarea
                  value={userInput}
                  onChange={(event) => setUserInput(event.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type or speak your answer..."
                  disabled={isAITyping || isListening}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '15px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    resize: 'none',
                    minHeight: '60px',
                    fontFamily: 'inherit',
                    opacity: isListening ? 0.5 : 1
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!userInput.trim() || isAITyping || isListening}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: userInput.trim() && !isAITyping && !isListening ? '#4f46e5' : '#cbd5e1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: userInput.trim() && !isAITyping && !isListening ? 'pointer' : 'not-allowed'
                  }}
                >
                  Send
                </button>
              </div>
            </main>

            <aside className="side-panel">
              {renderCameraTile()}
              <div className="interview-info-card">
                <h3>Session</h3>
                <div className="info-line">
                  <span>Mode</span>
                  <strong>Chat</strong>
                </div>
                <div className="info-line">
                  <span>Difficulty</span>
                  <strong>{difficulty}</strong>
                </div>
                <div className="info-line">
                  <span>Status</span>
                  <strong>{statusText}</strong>
                </div>
              </div>
            </aside>
          </div>
        )}

        {step === 'interview' && mode === 'voice' && (
          <div className="voice-fullscreen-card">
            {/* Webcam Tile */}
            <div className="voice-camera-wide">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
            </div>

            <div className="voice-main-area">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '128px',
                  height: '128px',
                  margin: '0 auto 20px',
                  borderRadius: '50%',
                  background: isSpeaking ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '60px',
                  animation: isSpeaking ? 'pulse 1s infinite' : 'none'
                }}
              >
                AI
              </div>
              
              {isSpeaking && (
                <button 
                  onClick={() => { synthRef.current.cancel(); isSpeakingRef.current = false; setIsSpeaking(false); setStatusText('Listening'); startRecognition(); }}
                  style={{ background: '#ff4757', color: 'white', border: 'none', borderRadius: '20px', padding: '5px 15px', fontSize: '12px', cursor: 'pointer', marginBottom: '10px' }}
                >
                  Interrupt AI
                </button>
              )}
              <h2 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '28px' }}>AI Interviewer</h2>
              <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>{role} - {difficulty}</p>
              <div style={{ marginTop: '15px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    background: isSpeaking ? '#667eea' : '#28a745',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {isSpeaking ? 'AI speaking' : 'Your turn'}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    marginLeft: '10px',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    background: '#10b981',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  Question {questionCount}/5
                </span>
              </div>
              <p style={{ marginTop: '12px', color: '#4b5563', fontWeight: 'bold' }}>Status: {statusText}</p>
            </div>

            {(transcript || interimText) && (
              <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '2px solid #667eea' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ margin: 0, color: '#667eea', fontWeight: 'bold' }}>You are saying:</p>
                  <button 
                    onClick={() => { if(silenceTimerRef.current) clearTimeout(silenceTimerRef.current); processVoiceResponse(); }}
                    style={{ background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    Send Now 🚀
                  </button>
                </div>
                <p style={{ margin: 0, color: '#333', fontSize: '16px' }}>
                  {transcript} <span style={{ color: '#999', fontStyle: 'italic' }}>{interimText}</span>
                </p>
              </div>
            )}

            <div className="voice-fullscreen-log">
              <h3 style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>Conversation Log:</h3>
              {messages.map((message, index) => (
                <div key={index} style={{ marginBottom: '10px', padding: '10px', borderRadius: '8px', background: message.type === 'ai' ? '#e3f2fd' : '#f1f8e9', borderLeft: `4px solid ${message.type === 'ai' ? '#667eea' : '#28a745'}` }}>
                  <strong style={{ color: message.type === 'ai' ? '#667eea' : '#28a745' }}>
                    {message.type === 'ai' ? 'AI:' : 'You:'}
                  </strong>
                  <p style={{ margin: '5px 0 0 0', color: '#333' }}>{message.text}</p>
                </div>
              ))}
            </div>
            </div>

            <button
              onClick={endInterview}
              style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', background: '#dc3545', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
            >
              End Interview
            </button>
          </div>
        )}

        {step === 'results' && results && (
          <div style={{ background: 'white', borderRadius: '15px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '30px', color: '#333', textAlign: 'center' }}>Interview Complete</h1>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '30px 50px', borderRadius: '15px' }}>
                <h2 style={{ fontSize: '48px', margin: '0' }}>{results.overallScore}/10</h2>
                <p style={{ margin: '10px 0 0 0', fontSize: '18px' }}>Overall Score</p>
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#10b981', marginBottom: '10px' }}>Strengths</h3>
              {results.strengths.map((strength, index) => (
                <p key={index} style={{ marginLeft: '20px', color: '#555' }}> {strength}</p>
              ))}
            </div>

            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>Areas to Improve</h3>
              {results.weaknesses.map((weakness, index) => (
                <p key={index} style={{ marginLeft: '20px', color: '#555' }}> {weakness}</p>
              ))}
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#667eea', marginBottom: '10px' }}>Improvement Tips</h3>
              {results.improvements.map((tip, index) => (
                <p key={index} style={{ marginLeft: '20px', color: '#555' }}> {tip}</p>
              ))}
            </div>

            <button
              onClick={() => {
                cleanupInterviewSession();
                navigate('/dashboard');
              }}
              style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      <style>{`
        .interview-room {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 20px;
          align-items: stretch;
        }

        .conversation-panel,
        .voice-panel,
        .side-panel {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
        }

        .conversation-panel {
          min-height: 72vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .voice-panel {
          padding: 34px;
        }

        .side-panel {
          padding: 18px;
          align-self: start;
          position: sticky;
          top: 18px;
        }

        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 22px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .status-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .message-list {
          flex: 1;
          overflow-y: auto;
          padding: 22px 24px;
          background: #f8fafc;
        }

        .chat-input-row {
          display: flex;
          gap: 10px;
          padding: 18px;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .interview-camera-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          overflow: hidden;
        }

        .camera-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          font-size: 13px;
          font-weight: 700;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }

        .camera-live-dot {
          color: #16a34a;
          font-size: 12px;
        }

        .camera-frame {
          width: 100%;
          aspect-ratio: 16 / 11;
          background: #020617;
        }

        .camera-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 12px 14px;
          color: #111827;
        }

        .camera-meta span {
          color: #6b7280;
          font-size: 13px;
        }

        .interview-info-card {
          margin-top: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          background: #f8fafc;
        }

        .interview-info-card h3 {
          margin: 0 0 14px;
          color: #111827;
          font-size: 16px;
        }

        .info-line {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }

        .info-line strong {
          color: #111827;
          text-align: right;
        }

        .voice-status-row {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 15px;
        }

        .voice-log {
          max-height: 300px;
          overflow-y: auto;
          background: #f8fafc;
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .voice-fullscreen-card {
          width: 100%;
          min-height: calc(100vh - 92px);
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
          box-sizing: border-box;
          display: grid;
          grid-template-columns: minmax(360px, 42vw) minmax(0, 1fr);
          grid-template-rows: 1fr auto;
          gap: 18px;
        }

        .voice-camera-wide {
          min-height: calc(100vh - 148px);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.18);
          border: 1px solid #e5e7eb;
          background: #020617;
        }

        .voice-main-area {
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .voice-fullscreen-log {
          flex: 1;
          min-height: 160px;
          overflow-y: auto;
          background: #f8fafc;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .voice-fullscreen-card > button {
          grid-column: 1 / -1;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @media (max-width: 920px) {
          .interview-room {
            grid-template-columns: 1fr;
          }

          .voice-fullscreen-card {
            min-height: auto;
            grid-template-columns: 1fr;
          }

          .voice-camera-wide {
            min-height: 320px;
            aspect-ratio: 16 / 10;
          }

          .side-panel {
            position: static;
            order: -1;
          }

          .conversation-panel {
            min-height: 68vh;
          }
        }

        @media (max-width: 640px) {
          .room-header,
          .chat-input-row {
            flex-direction: column;
            align-items: stretch;
          }

          .status-row {
            justify-content: flex-start;
          }

          .voice-panel {
            padding: 22px;
          }

          .voice-fullscreen-card {
            padding: 12px;
            border-radius: 12px;
          }

          .voice-camera-wide {
            min-height: 240px;
          }
        }
      `}</style>
    </div>
  );
}

export default RealTimeInterview;
