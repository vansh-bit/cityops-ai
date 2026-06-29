import { useState, useEffect } from 'react';
import { VerticalSliceDemo } from './pages/demo/VerticalSliceDemo';
import './App.css';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app-container">
      {/* Global System Header Bar */}
      <header className="system-header">
        <div className="sys-left">CITYOPS AI AUTOMATION SYSTEM</div>
        <div className="sys-right">{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}</div>
      </header>
      
      {/* Main app content wrapper */}
      <div className="app-content">
        <VerticalSliceDemo />
      </div>
    </div>
  );
}

export default App;
