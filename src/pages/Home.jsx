import { Link } from 'react-router-dom';
import './Home.css';

const features = [
  { icon: '✅', title: 'Habit Tracking', desc: 'Track daily habits with simple check-ins. Mark done or log why you missed — build self-awareness.', bg: 'var(--success-bg)' },
  { icon: '💡', title: 'Smart Insights', desc: 'Discover patterns in your behavior. Learn when and why you break streaks.', bg: 'var(--accent-bg)' },
  { icon: '📈', title: 'Analytics & Reports', desc: 'Visualize your progress with charts, heatmaps, and weekly summaries.', bg: 'var(--info-bg)' },
  { icon: '🔥', title: 'Consistency Score', desc: 'Get a personalized score that measures your habit-building momentum.', bg: 'var(--primary-bg)' },
];

const testimonials = [
  { name: 'Sarah K.', role: 'Product Designer', text: "CONSISTIFY helped me understand why I kept breaking my exercise routine. The insights are game-changing!", initial: 'S' },
  { name: 'Marcus L.', role: 'Software Engineer', text: "I've tried many habit trackers, but none told me WHY I fail. This app does. My streak is now 45 days.", initial: 'M' },
  { name: 'Priya R.', role: 'Student', text: "The analytics dashboard is beautiful and actually useful. I improved my study consistency by 60%.", initial: 'P' },
];

export default function Home() {
  return (
    <div className="home-page">
      <nav className="home-nav">
        <div className="home-nav-logo">
          <div style={{ width: 28, height: 28, background: 'var(--primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800 }}>C</div>
          CONSISTIFY
        </div>
        <div className="home-nav-links">
          <a href="#features">Features</a>
          <a href="#testimonials">Testimonials</a>
          <Link to="/login">Login</Link>
        </div>
        <div className="home-nav-actions">
          <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      <section className="hero container">
        <div className="hero-badge">🚀 Build better habits, backed by data</div>
        <h1>Build Consistency.<br />Track Habits.<br /><span className="hero-gradient">Become Unstoppable.</span></h1>
        <p>CONSISTIFY doesn't just track whether you completed a habit — it helps you understand WHY you break them. Build lasting consistency with intelligent insights.</p>
        <div className="hero-actions">
          <Link to="/signup" className="btn btn-primary btn-lg">Get Started Free</Link>
          <Link to="/login" className="btn btn-outline btn-lg">Login</Link>
        </div>
        <div className="hero-mockup">
          <div className="hero-mockup-img">
            <div className="mockup-card">
              <div className="mockup-card-label">Current Streak</div>
              <div className="mockup-card-value" style={{ color: 'var(--primary)' }}>12 days 🔥</div>
            </div>
            <div className="mockup-card">
              <div className="mockup-card-label">Completion Rate</div>
              <div className="mockup-card-value" style={{ color: 'var(--success)' }}>87%</div>
              <div className="mockup-bar"><div className="mockup-bar-fill" style={{ width: '87%', background: 'var(--success)' }} /></div>
            </div>
            <div className="mockup-card">
              <div className="mockup-card-label">Consistency Score</div>
              <div className="mockup-card-value" style={{ color: 'var(--info)' }}>A+</div>
            </div>
          </div>
        </div>
      </section>

      <section className="features container" id="features">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything you need to build lasting habits</h2>
        <p className="section-subtitle">More than a habit tracker — CONSISTIFY is your personal habit coach that helps you understand and overcome the barriers to consistency.</p>
        <div className="features-grid">
          {features.map(f => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="testimonials" id="testimonials">
        <div className="container">
          <div className="section-label">Testimonials</div>
          <h2 className="section-title">Loved by habit builders</h2>
          <div className="testimonials-grid">
            {testimonials.map(t => (
              <div className="testimonial-card" key={t.name}>
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initial}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section container">
        <div className="cta-box">
          <h2>Ready to become unstoppable?</h2>
          <p>Join thousands of people building better habits with CONSISTIFY.</p>
          <Link to="/signup" className="btn btn-white btn-lg">Start Building Habits →</Link>
        </div>
      </section>

      <footer className="home-footer container">
        <div className="footer-content">
          <div className="footer-copy">© 2026 CONSISTIFY. All rights reserved.</div>
          <div className="footer-links">
            <a href="#">Home</a>
            <a href="#features">Features</a>
            <Link to="/login">Login</Link>
            <a href="#">About</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
