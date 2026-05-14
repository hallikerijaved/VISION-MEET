import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = ({ user }) => {
  // If user is already logged in, redirect them to dashboard
  if (user) {
    return <Navigate to={user.email === 'admin@gd.com' ? "/admin" : "/dashboard"} />;
  }

  return (
    <div className="landing-page-v2">
      <nav className="stitch-nav">
        <div className="stitch-logo">Vision<span className="stitch-logo-highlight">Meet</span></div>
        <div className="stitch-nav-actions">
          <Link to="/login" className="stitch-btn-primary">Get Started</Link>
        </div>
      </nav>

      <main className="stitch-main">
        <section className="stitch-hero">
          <div className="stitch-hero-content">
            <h1 className="stitch-hero-title">
              Master the Art of <br />
              <span className="stitch-text-gradient">Group Discussion</span>
            </h1>
            <p className="stitch-hero-subtitle">
              Unlock professional communication skills with real-time AI feedback, immersive virtual rooms, and comprehensive post-session analytics.
            </p>
            <div className="stitch-hero-cta">
              <Link to="/login" className="stitch-btn-primary-large">Get Started Today</Link>
            </div>
            <p className="stitch-hero-proof">Trusted by students and professionals</p>
          </div>

          <div className="stitch-hero-visual">
            <div className="stitch-glass-card stitch-floating-1">
              <div className="stitch-card-header">
                <span className="stitch-dot bg-teal"></span>
                <span>AI Evaluation</span>
              </div>
              <div className="stitch-card-body">
                "Excellent vocabulary and strong confident tone detected."
              </div>
            </div>

            <div className="stitch-glass-card stitch-floating-2">
              <div className="stitch-card-header">
                <span className="stitch-dot bg-blue"></span>
                <span>Sentiment Match</span>
              </div>
              <div className="stitch-card-body">
                <div className="stitch-progress-bar">
                  <div className="stitch-progress-fill" style={{ width: '85%' }}></div>
                </div>
                <span>85% Positive</span>
              </div>
            </div>
          </div>
        </section>

        <section className="stitch-features">
          <h2 className="stitch-section-title">Experience Next-Gen Discussions</h2>

          <div className="stitch-grid">
            <div className="stitch-feature-card">
              <div className="stitch-feature-icon">🤖</div>
              <h3>AI Evaluation</h3>
              <p>Real-time feedback on your participation levels, vocal tone, and conversational impact as you speak.</p>
            </div>
            <div className="stitch-feature-card">
              <div className="stitch-feature-icon">🤝</div>
              <h3>Real-time Collaboration</h3>
              <p>Shared notes and interactive whiteboards designed to keep the group's creative energy flowing synchronously.</p>
            </div>
            <div className="stitch-feature-card">
              <div className="stitch-feature-icon">📊</div>
              <h3>Detailed Analytics</h3>
              <p>Post-session reports featuring sentiment heatmaps, engagement metrics, and individual performance summaries.</p>
            </div>
            <div className="stitch-feature-card">
              <div className="stitch-feature-icon">👔</div>
              <h3>AI Mock Interview</h3>
              <p>Practice with our realistic AI interviewer. Receive instant, recruiter-level feedback tailored to your target job role.</p>
            </div>
            <div className="stitch-feature-card">
              <div className="stitch-feature-icon">📄</div>
              <h3>AI Resume Builder</h3>
              <p>Craft a standout resume instantly. Our AI optimizes your bullet points and formatting to pass ATS systems with ease.</p>
            </div>
          </div>
        </section>

        <section className="stitch-cta-bottom">
          <h2>Ready to elevate your discussions?</h2>
          <p>Join thousands of users improving their communication skills every day. No credit card required.</p>
          <Link to="/login" className="stitch-btn-primary-large">Create Your Free Account</Link>
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
              <a href="#pricing">Pricing</a>
            </div>
            <div className="link-column">
              <h4>Company</h4>
              <a href="#about">About Us</a>
              <a href="#contact">Contact</a>
            </div>
          </div>
        </div>
        <div className="stitch-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Vision Meet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
