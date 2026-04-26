// ===========================================================================
// Onboarding.jsx — A 4-step wizard shown right after signup/login.
// Step 1: welcome
// Step 2: pick goal categories
// Step 3: pick preferred time of day
// Step 4: confetti + finish
// ===========================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Onboarding.css';

// Available goal options shown on step 2.
const goals = [
  { id: 'health', icon: '🏥', label: 'Health' },
  { id: 'study', icon: '📚', label: 'Study' },
  { id: 'productivity', icon: '⚡', label: 'Productivity' },
  { id: 'mindfulness', icon: '🧘', label: 'Mindfulness' },
  { id: 'fitness', icon: '💪', label: 'Fitness' },
  { id: 'creativity', icon: '🎨', label: 'Creativity' },
];

// Available time-of-day options shown on step 3.
const times = [
  { id: 'morning', icon: '🌅', label: 'Morning' },
  { id: 'afternoon', icon: '☀️', label: 'Afternoon' },
  { id: 'evening', icon: '🌙', label: 'Evening' },
  { id: 'flexible', icon: '🔄', label: 'Flexible' },
];

// Colors for the small celebration confetti on step 4.
const confettiColors = ['#E8553A', '#F5A623', '#27AE60', '#2F80ED', '#9B59B6', '#1ABC9C'];

export default function Onboarding() {
  // Which step (1..4) is currently visible.
  const [step, setStep] = useState(1);
  // Array of selected goal IDs (multi-select).
  const [selectedGoals, setSelectedGoals] = useState([]);
  // Single chosen time-of-day ID.
  const [selectedTime, setSelectedTime] = useState('');
  // completeOnboarding() flips the auth flag so the user can reach /dashboard.
  const { completeOnboarding } = useAuth();
  // For redirecting at the end of the wizard.
  const navigate = useNavigate();

  // Add or remove an id from the selectedGoals array.
  const toggleGoal = (id) => {
    setSelectedGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  // Final step button: mark onboarding done + go to /habits.
  const handleFinish = () => {
    completeOnboarding();
    navigate('/habits');
  };

  // Labels shown above the progress bar.
  const stepLabels = ['Intro', 'Goals', 'Time', 'Done'];

  return (
    <div className="onboarding-page">
      {/* Top progress bar showing current step number. */}
      <div className="onboarding-progress">
        <div className="progress-bar">
          {/* Width of the fill is calculated from the current step. */}
          <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
        <div className="progress-steps">
          {/* Render labels with conditional CSS classes for active/done. */}
          {stepLabels.map((label, i) => (
            <span key={label} className={`progress-step ${i + 1 === step ? 'active' : ''} ${i + 1 < step ? 'done' : ''}`}>
              {i + 1 < step ? '✓' : ''} {label}
            </span>
          ))}
        </div>
      </div>

      {/* In JSX, `condition && <jsx/>` renders the JSX only if the condition is true. */}
      {step === 1 && (
        <div className="onboarding-card" key="step1">
          <div className="onboarding-icon">🚀</div>
          <h2>Welcome to CONSISTIFY</h2>
          <p>We're more than a habit tracker. We help you understand WHY you break habits and build strategies to overcome them. Let's set you up in just a few steps.</p>
          <div className="onboarding-actions">
            {/* Move to step 2 when clicked. */}
            <button className="btn btn-primary" onClick={() => setStep(2)}>Let's Go →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="onboarding-card" key="step2">
          <div className="onboarding-icon">🎯</div>
          <h2>What are your goals?</h2>
          <p>Select the areas you'd like to build habits in. You can always change these later.</p>
          <div className="onboarding-options">
            {/* One button per available goal — toggles selection on click. */}
            {goals.map(g => (
              <button key={g.id} className={`option-card ${selectedGoals.includes(g.id) ? 'selected' : ''}`} onClick={() => toggleGoal(g.id)}>
                <div className="option-card-icon">{g.icon}</div>
                {g.label}
              </button>
            ))}
          </div>
          <div className="onboarding-actions">
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            {/* Disabled until at least one goal is selected. */}
            <button className="btn btn-primary" onClick={() => setStep(3)} disabled={selectedGoals.length === 0}>Continue →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="onboarding-card" key="step3">
          <div className="onboarding-icon">⏰</div>
          <h2>When do you prefer to build habits?</h2>
          <p>This helps us optimize your check-in reminders and insights.</p>
          <div className="onboarding-options">
            {/* Single-select: clicking sets selectedTime to that id. */}
            {times.map(t => (
              <button key={t.id} className={`option-card ${selectedTime === t.id ? 'selected' : ''}`} onClick={() => setSelectedTime(t.id)}>
                <div className="option-card-icon">{t.icon}</div>
                {t.label}
              </button>
            ))}
          </div>
          <div className="onboarding-actions">
            <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(4)} disabled={!selectedTime}>Continue →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="onboarding-card celebration" key="step4">
          {/* Mini confetti pieces just for this final step. */}
          <div className="confetti-container">
            {confettiColors.map((color, i) => (
              <div key={i} className="confetti-piece" style={{
                background: color,
                left: `${(i - 3) * 30}px`,
                animationDelay: `${i * 0.1}s`,
                transform: `rotate(${i * 60}deg)`,
              }} />
            ))}
          </div>
          <div className="celebration-check">🎉</div>
          <h2>You're ready to start building consistency!</h2>
          <p>Your personalized habit dashboard is waiting. Let's create your first habit and begin your journey.</p>
          <div className="onboarding-actions">
            <button className="btn btn-primary btn-lg" onClick={handleFinish}>Create First Habit →</button>
          </div>
        </div>
      )}
    </div>
  );
}
