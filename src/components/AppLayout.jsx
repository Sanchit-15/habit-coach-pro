import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
          <span /><span /><span />
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>CONSISTIFY</span>
      </div>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-content">
        {children}
      </main>
    </div>
  );
}
