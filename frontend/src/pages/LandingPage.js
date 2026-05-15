import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import './LandingPage.css';

// Import new 3D assets
import hero3d from '../assets/hero-3d.png';
import aiIcon from '../assets/ai-icon.png';
import analyticsIcon from '../assets/analytics-icon.png';

const LandingPage = ({ user }) => {
  // If user is already logged in, redirect them to dashboard
  if (user) {
    return <Navigate to={user.email === 'admin@gd.com' ? "/admin" : "/dashboard"} />;
  }

  return (
    <div className="landing-page-v2">
      <nav className="stitch-nav">
        <div className="stitch-logo">
          Vision<span className="stitch-logo-highlight">Meet</span>
        </div>
        <div className="stitch-nav-actions">
          <Link to="/login" className="stitch-btn-primary">Get Started</Link>
        </div>
      </nav>

      <main className="stitch-main">
        <section className="stitch-hero">
          <div className="stitch-hero-content">
            <h1 className="stitch-hero-title">
              The Future of <br />
              <span className="stitch-text-gradient">Professional Communication</span>
            </h1>
            <p className="stitch-hero-subtitle">
              Unlock professional communication skills with real-time AI feedback, immersive virtual rooms, and comprehensive post-session analytics.
            </p>
            <div className="stitch-hero-cta">
              <Link to="/login" className="stitch-btn-primary-large">Start Free Experience</Link>
            </div>
          </div>

          <div className="stitch-hero-visual">
            <img src={hero3d} alt="VisionMeet 3D Experience" className="hero-3d-image" />

            {/* Floating Glassmorphic Cards */}
            <div className="stitch-glass-card floating-analytics">
              <img src={analyticsIcon} alt="Analytics" className="card-icon" />
              <div className="stitch-card-body">
                <strong>Real-time Stats</strong>
                <p>85% Engagement Rate</p>
              </div>
            </div>

            <div className="stitch-glass-card floating-ai">
              <img src={aiIcon} alt="AI Brain" className="card-icon" />
              <div className="stitch-card-body">
                <strong>AI Feedback</strong>
                <p>"Excellent tone detected"</p>
              </div>
            </div>
          </div>
        </section>

        <section className="stitch-features" id="features">
          <h2 className="stitch-section-title">Intelligent Features for Modern Teams</h2>

          <div className="stitch-grid">
            <div className="stitch-feature-card">
              <img src={aiIcon} alt="AI Evaluation" className="feature-3d-icon" />
              <h3>AI-Powered Evaluation</h3>
              <p>Receive instant, industrial-grade feedback on your participation levels, vocal tone, and conversational impact as you speak.</p>
            </div>

            <div className="stitch-feature-card">
              <img src={analyticsIcon} alt="Detailed Analytics" className="feature-3d-icon" />
              <h3>Precision Analytics</h3>
              <p>Post-session reports featuring sentiment heatmaps, engagement metrics, and individual performance summaries for every participant.</p>
            </div>

            <div className="stitch-feature-card">
              <div style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>👔</div>
              <h3>AI Mock Interviews</h3>
              <p>Practice with our realistic AI interviewer. Receive instant, recruiter-level feedback tailored to your target job role and industry.</p>
            </div>

            <div className="stitch-feature-card">
              <div style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>📄</div>
              <h3>AI Resume Builder</h3>
              <p>Craft a standout resume instantly. Our AI optimizes your bullet points and formatting to pass ATS systems with ease.</p>
            </div>

            <div className="stitch-feature-card">
              <div style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>🤝</div>
              <h3>Real-time Collaboration</h3>
              <p>Shared notes and interactive whiteboards designed to keep the group's creative energy flowing synchronously across the globe.</p>
            </div>
          </div>
        </section>

        <section className="stitch-cta-bottom">
          <h2>Elevate Your Career Today</h2>
          <p>Join thousands of professionals using <strong style={{ fontWeight: '700' }}>VisionMeet</strong> to sharpen their communication and land their dream roles.</p>
          <Link to="/login" className="stitch-btn-white">Create Free Account</Link>
        </section>
      </main>

      <footer className="stitch-footer">
        <div className="stitch-footer-content">
          <div className="stitch-footer-brand">
            <h3>Vision<span className="stitch-logo-highlight">Meet</span></h3>
            <p>Enhancing digital collaboration with intelligent group discussion tools and real-time analytics.</p>
          </div>
          <div className="stitch-footer-links">
            <div className="link-column">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="/login">Login</a>
              <a href="/login">Sign Up</a>
            </div>
            <div className="link-column">
              <h4>Resources</h4>
              <a href="#!">Documentation</a>
              <a href="#!">Privacy Policy</a>
              <a href="#!">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="stitch-footer-bottom">
          <p>&copy; {new Date().getFullYear()} <strong style={{ fontWeight: '700' }}>VisionMeet</strong> AI Platform. Built for Excellence.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
