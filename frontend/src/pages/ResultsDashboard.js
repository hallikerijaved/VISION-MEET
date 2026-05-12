import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import GDTranscript from '../components/GDTranscript';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export default function ResultsDashboard({ user }) {
  const { gdId } = useParams();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/evaluation/session/${gdId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        // Data is already sorted by finalScore descending from backend, but sort again to be safe
        const sorted = Array.isArray(data) ? data.sort((a,b) => b.scores.finalScore - a.scores.finalScore) : [];
        setEvaluations(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user, navigate, gdId]);

  if (loading) return <div><Navigation user={user} /><div style={{ padding: '2rem', textAlign: 'center' }}>Loading NLP Analytics...</div></div>;

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Emerald
    if (score >= 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const calculateAverage = (field) => {
    if (!evaluations.length) return 0;
    const sum = evaluations.reduce((acc, curr) => acc + (curr.scores[field] || 0), 0);
    return Math.round(sum / evaluations.length);
  };

  const avgFinal = calculateAverage('finalScore');
  const avgEngagement = evaluations.length ? Math.round(evaluations.reduce((acc, curr) => acc + (curr.engagementScore || 0), 0) / evaluations.length) : 0;

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', paddingBottom: '3rem' }}>
      <Navigation user={user} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>📊 Session NLP Analytics</h1>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '1.1rem' }}>Room ID: {gdId} • {evaluations.length} Participants</p>
          </div>
          <button onClick={() => navigate('/my-gds')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.5rem', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            Back to Sessions
          </button>
        </div>

        {/* Analytics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ color: '#6b7280', fontSize: '1rem', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>Avg Final Score</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: getScoreColor(avgFinal) }}>{avgFinal}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ color: '#6b7280', fontSize: '1rem', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>Top Performer</h3>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginTop: '0.5rem' }}>
              {evaluations.length > 0 ? evaluations[0].userName : 'N/A'}
            </div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ color: '#6b7280', fontSize: '1rem', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>Avg Engagement</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{avgEngagement}</div>
          </div>
        </div>

        {/* Leaderboard UI */}
        <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#111827', margin: '0 0 1.5rem 0', borderBottom: '2px solid #f3f4f6', paddingBottom: '1rem' }}>🏆 Leaderboard & Diagnostics</h2>
          
          {evaluations.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No evaluation data available for this session.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {evaluations.map((ev, index) => (
                <div key={ev._id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem', backgroundColor: index === 0 ? '#fffbeb' : 'white' }}>
                  
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '2rem' }}>{getRankEmoji(index)}</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>{ev.userName}</h3>
                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Engagement Score: {ev.engagementScore?.toFixed(1) || 0}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Final Score</span>
                      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: getScoreColor(ev.scores.finalScore) }}>{ev.scores.finalScore}</div>
                    </div>
                  </div>

                  {/* Progress Bars for Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {[
                      { label: 'Topic Relevance', value: ev.scores.topicRelevance, color: '#3b82f6' },
                      { label: 'Semantic Similarity', value: ev.scores.semanticSimilarity, color: '#8b5cf6' },
                      { label: 'Keyword Score', value: ev.scores.keywordMatching, color: '#10b981' },
                      { label: 'Grammar Score', value: ev.scores.grammarQuality, color: '#f59e0b' },
                      { label: 'Sentiment Score', value: ev.scores.sentimentScore, color: '#ec4899' },
                    ].map(metric => (
                      <div key={metric.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                          <span style={{ color: '#4b5563' }}>{metric.label}</span>
                          <span style={{ color: metric.color }}>{metric.value}/100</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${metric.value}%`, backgroundColor: metric.color, borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Feedback Section */}
                  <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', color: '#1f2937', fontSize: '1.1rem' }}>🤖 AI Feedback</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5' }}>
                      {Array.isArray(ev.feedback) ? ev.feedback.map((f, i) => <li key={i}>{f}</li>) : <li>{ev.feedback}</li>}
                    </ul>
                  </div>

                  <GDTranscript transcript={ev.transcript} />

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
