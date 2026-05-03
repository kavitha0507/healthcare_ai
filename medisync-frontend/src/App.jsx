import React, { useState, useEffect, useRef } from 'react';
import { Heart, Send, Bell, X, Sun, Clock } from 'lucide-react';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello! I'm your MediSync AI health assistant. How can I help you today?" }
  ]);
  const [showWakeUpSettings, setShowWakeUpSettings] = useState(false);
  const [wakeUpTime, setWakeUpTime] = useState('07:00');
  const [wakeUpEnabled, setWakeUpEnabled] = useState(false);
  const [wakeUpMessage, setWakeUpMessage] = useState('Good morning! Time to start your healthy day! 🌅');
  const wakeUpIntervalRef = useRef(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Load saved wake-up settings
    const savedSettings = localStorage.getItem('wakeUpSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setWakeUpTime(settings.time || '07:00');
      setWakeUpEnabled(settings.enabled || false);
      setWakeUpMessage(settings.message || 'Good morning! Time to start your healthy day! 🌅');
    }
  }, []);

  // Check and set wake-up alarm
  useEffect(() => {
    if (wakeUpEnabled) {
      checkAndSetWakeUpAlarm();
    } else {
      clearWakeUpAlarm();
    }
    
    return () => clearWakeUpAlarm();
  }, [wakeUpEnabled, wakeUpTime]);

  const checkAndSetWakeUpAlarm = () => {
    clearWakeUpAlarm();
    
    const now = new Date();
    const [hours, minutes] = wakeUpTime.split(':').map(Number);
    const wakeUpDate = new Date();
    wakeUpDate.setHours(hours, minutes, 0, 0);
    
    // If wake-up time has passed today, set for tomorrow
    if (wakeUpDate <= now) {
      wakeUpDate.setDate(wakeUpDate.getDate() + 1);
    }
    
    const timeUntilWakeUp = wakeUpDate.getTime() - now.getTime();
    
    wakeUpIntervalRef.current = setTimeout(() => {
      triggerWakeUpNotification();
      // Set next day's alarm
      checkAndSetWakeUpAlarm();
    }, timeUntilWakeUp);
  };

  const clearWakeUpAlarm = () => {
    if (wakeUpIntervalRef.current) {
      clearTimeout(wakeUpIntervalRef.current);
      wakeUpIntervalRef.current = null;
    }
  };

  const triggerWakeUpNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('MediSync AI - Wake Up! 🌅', {
        body: wakeUpMessage,
        icon: '/favicon.ico',
        tag: 'wake-up',
        requireInteraction: true,
        actions: [
          {
            action: 'open-app',
            title: 'Open MediSync AI'
          },
          {
            action: 'snooze',
            title: 'Snooze 5 min'
          }
        ]
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Play a sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const saveWakeUpSettings = () => {
    const settings = {
      time: wakeUpTime,
      enabled: wakeUpEnabled,
      message: wakeUpMessage
    };
    localStorage.setItem('wakeUpSettings', JSON.stringify(settings));
  };

  useEffect(() => {
    saveWakeUpSettings();
  }, [wakeUpTime, wakeUpEnabled, wakeUpMessage]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
      let botText = "";
      const lowerInput = currentInput.toLowerCase();
      
      // Check for weight pattern (number followed by lb or lbs)
      const weightMatch = currentInput.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs)/i);
      // Check for height pattern
      let heightMatch = currentInput.match(/[,\s]+(\d+(?:\.\d+)?)\s*(?:in|inches|ft|foot|feet)?['"]?/i);
      if (!heightMatch) {
        heightMatch = currentInput.match(/(\d+(?:\.\d+)?)\s*(?:in|inches|ft|foot|feet)/i);
      }
      // Also match patterns like "5.3'" or "5'3"" (feet and inches)
      const heightFeetInchesMatch = currentInput.match(/(\d+)'\s*(\d+)/i);
      
      const isBMIRequest = lowerInput.includes('bmi') || lowerInput.includes('calculate') || 
                          (weightMatch && heightMatch) || (weightMatch && heightFeetInchesMatch);
      
      if (isBMIRequest) {
        if (weightMatch && (heightMatch || heightFeetInchesMatch)) {
          const weight = parseFloat(weightMatch[1]);
          let height;
          
          if (heightFeetInchesMatch) {
            // Format: 5'3" - convert to inches
            const feet = parseFloat(heightFeetInchesMatch[1]);
            const inches = parseFloat(heightFeetInchesMatch[2]);
            height = (feet * 12) + inches;
          } else {
            height = parseFloat(heightMatch[1]);
            // If height is less than 10, assume it's in feet (convert to inches)
            if (height < 10) {
              height = height * 12;
            }
          }
          
          // Local BMI calculation as fallback
          const localBMI = (weight / (height * height)) * 703;
          let localCategory = '';
          if (localBMI < 18.5) localCategory = 'underweight';
          else if (localBMI < 25) localCategory = 'normal';
          else if (localBMI < 30) localCategory = 'overweight';
          else localCategory = 'obese';
          
          try {
            const response = await fetch(`https://healthcare-ai-q3yl.vercel.app/bmi?weight=${weight}&height=${height}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            botText = data.message || `Your BMI is ${localBMI.toFixed(1)} (${localCategory})`;
            
          } catch (apiError) {
            console.warn('API failed, using local calculation:', apiError);
            botText = `Your BMI is ${localBMI.toFixed(1)} (${localCategory}). This was calculated locally as the backend is temporarily unavailable.`;
          }
          
        } else if (lowerInput.includes('bmi') || lowerInput.includes('calculate')) {
          botText = "I'll calculate your BMI. Please provide your weight in pounds (e.g., 143lb) and height (e.g., 5.3 or 63in).";
        } else {
          botText = "I need your weight in pounds (e.g., 143lb) and height in inches or feet (e.g., 5.3 or 63in).";
        }
      } else if (lowerInput.includes('diet')) {
        botText = "I can create personalized diet plans for you! First, let me calculate your BMI, or I can give you general healthy eating advice.";
      } else {
        // Smart fallback responses based on input
        if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
          botText = "Hello! I'm your MediSync AI health assistant. I can help you calculate BMI, create diet plans, or answer health questions. What would you like to know?";
        } else if (lowerInput.includes('how are you')) {
          botText = "I'm doing great and ready to help with your health goals! I can assist with BMI calculations, diet recommendations, and general health advice.";
        } else if (lowerInput.includes('bmi')) {
          botText = "I can calculate your BMI! Just tell me your weight (like 150lb) and height (like 5.8 or 70in).";
        } else if (lowerInput.includes('diet') || lowerInput.includes('food')) {
          botText = "I can create personalized diet plans for you! First, let me know your BMI category, or I can give you general healthy eating advice.";
        } else if (lowerInput.includes('help')) {
          botText = "I can help with: 🏃 BMI calculation, 🥗 Diet plans, 💊 General health advice, 🏥 Finding specialists. Just ask me anything health-related!";
        } else if (lowerInput.includes('thank')) {
          botText = "You're welcome! I'm here to help you on your health journey. Feel free to ask anything else!";
        } else if (lowerInput.includes('bye') || lowerInput.includes('goodbye')) {
          botText = "Goodbye! Remember to take care of your health. I'm here whenever you need me!";
        } else {
          botText = "I can help you with BMI calculations, diet plans, and general health advice! Try asking me to 'Calculate BMI' or 'Diet Plan'.";
        }
      }
      
      // Ensure we always have a response
      if (!botText || botText.trim() === '') {
        botText = "I received your message but I'm having trouble processing it. Please try again.";
      }
      
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
      
    } catch (error) {
      console.error('Critical error in sendMessage:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: "I encountered an unexpected error. Please refresh the page and try again." 
      }]);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcfdff', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '16px', 
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              background: 'linear-gradient(to right, #3b82f6, #a855f7)', 
              padding: '14px', 
              borderRadius: '12px',
              color: 'white'
            }}>
              <Heart size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>MediSync AI</h1>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Patient Advocate</p>
            </div>
          </div>
          <button 
            onClick={() => setShowWakeUpSettings(true)}
            style={{ 
              padding: '10px', 
              borderRadius: '50%', 
              border: 'none', 
              background: '#f1f5f9',
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            <Bell size={20} />
            {wakeUpEnabled && (
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '12px',
                height: '12px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
            )}
          </button>
        </div>

        {/* Chat Area */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '24px', 
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          height: '500px'
        }}>
          <div style={{ 
            background: 'linear-gradient(to right, #2563eb, #7c3aed)', 
            color: 'white', 
            padding: '20px', 
            borderRadius: '16px 16px 0 0',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Health Consultation</h2>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>AI Powered Assistant</p>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '12px',
                  borderRadius: '16px',
                  backgroundColor: msg.role === 'user' ? '#3b82f6' : '#f8fafc',
                  color: msg.role === 'user' ? 'white' : 'black'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your health..."
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                background: 'linear-gradient(to right, #3b82f6, #a855f7)',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Wake-Up Settings Panel */}
      {showWakeUpSettings && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              zIndex: 40
            }}
            onClick={() => setShowWakeUpSettings(false)}
          ></div>
          
          <div style={{
            position: 'fixed',
            right: 0,
            top: 0,
            height: '100%',
            width: '100%',
            maxWidth: '400px',
            backgroundColor: 'white',
            zIndex: 50,
            boxShadow: '-20px 0 50px rgba(0,0,0,0.05)',
            padding: '32px',
            borderLeft: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Bell size={22} style={{ color: '#3b82f6' }} /> Wake-Up Settings
                </h2>
                <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Daily Health Reminder</p>
              </div>
              <button 
                onClick={() => setShowWakeUpSettings(false)} 
                style={{ padding: '8px', borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}
              >
                <X size={24} style={{ color: '#94a3b8' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Enable/Disable Toggle */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '12px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Sun size={20} style={{ color: '#eab308' }} />
                  <div>
                    <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>Wake-Up Alarm</p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Daily health reminder</p>
                  </div>
                </div>
                <button
                  onClick={() => setWakeUpEnabled(!wakeUpEnabled)}
                  style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: wakeUpEnabled ? '#3b82f6' : '#cbd5e1',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: wakeUpEnabled ? '26px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </button>
              </div>

              {/* Time Picker */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Clock size={20} style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>Wake-Up Time</span>
                </label>
                <input
                  type="time"
                  value={wakeUpTime}
                  onChange={(e) => setWakeUpTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* Custom Message */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>Wake-Up Message</span>
                </label>
                <textarea
                  value={wakeUpMessage}
                  onChange={(e) => setWakeUpMessage(e.target.value)}
                  placeholder="Good morning! Time to start your healthy day! 🌅"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    resize: 'none',
                    minHeight: '80px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Status */}
              <div style={{ 
                padding: '16px', 
                background: 'linear-gradient(to right, #eff6ff, #f3e8ff)', 
                borderRadius: '12px', 
                border: '1px solid #ddd6fe' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: wakeUpEnabled ? '#22c55e' : '#cbd5e1',
                    animation: wakeUpEnabled ? 'pulse 2s infinite' : 'none'
                  }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    {wakeUpEnabled ? 'Alarm Active' : 'Alarm Disabled'}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  {wakeUpEnabled 
                    ? `Next alarm: ${wakeUpTime} tomorrow` 
                    : 'Enable alarm to receive daily wake-up notifications'
                  }
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
