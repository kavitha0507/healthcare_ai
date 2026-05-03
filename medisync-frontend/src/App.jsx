import React, { useState, useRef, useEffect } from 'react';
import { Heart, Send, User, Bot, Activity, Shield, Sparkles, History, X, Bell, Clock, Sun } from 'lucide-react';

const API_URL = 'https://healthcare-ai-q3yl.vercel.app'; // Updated for deployment

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello Kavitha! I'm your MediSync Advocate. How can I help with your health goals today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [lastBMICategory, setLastBMICategory] = useState(null); // Store BMI category for personalized diet
  const [showWakeUpSettings, setShowWakeUpSettings] = useState(false);
  const [wakeUpTime, setWakeUpTime] = useState('07:00');
  const [wakeUpEnabled, setWakeUpEnabled] = useState(false);
  const [wakeUpMessage, setWakeUpMessage] = useState('Good morning! Time to start your healthy day! 🌅');
  const scrollRef = useRef(null);
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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

      // Play a sound (if you have an audio file)
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
    setLoading(true);

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
      const type = isBMIRequest ? 'BMI' : lowerInput.includes('diet') ? 'DIET' : 'GENERAL';
      
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
            const response = await fetch(`${API_URL}/bmi?weight=${weight}&height=${height}`, {
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
            
            // Extract BMI category from the response for personalized diet
            const lowerMessage = data.message.toLowerCase();
            if (lowerMessage.includes('normal')) setLastBMICategory('normal');
            else if (lowerMessage.includes('overweight')) setLastBMICategory('overweight');
            else if (lowerMessage.includes('obese')) setLastBMICategory('obese');
            else if (lowerMessage.includes('underweight')) setLastBMICategory('underweight');
            else setLastBMICategory(localCategory);
            
          } catch (apiError) {
            console.warn('API failed, using local calculation:', apiError);
            botText = `Your BMI is ${localBMI.toFixed(1)} (${localCategory}). This was calculated locally as the backend is temporarily unavailable.`;
            setLastBMICategory(localCategory);
          }
          
        } else if (lowerInput.includes('bmi') || lowerInput.includes('calculate')) {
          botText = "I'll calculate your BMI. Please provide your weight in pounds (e.g., 143lb) and height (e.g., 5.3 or 63in).";
        } else {
          botText = "I need your weight in pounds (e.g., 143lb) and height in inches or feet (e.g., 5.3 or 63in).";
        }
      } else if (lowerInput.includes('diet')) {
        // Use BMI category if available for personalized diet, otherwise use general
        const dietCondition = lastBMICategory || 'general';
        
        try {
          const response = await fetch(`${API_URL}/diet?condition=${dietCondition}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          botText = data.message;
        } catch (apiError) {
          console.warn('Diet API failed, using fallback:', apiError);
          const fallbackDiets = {
            normal: "Maintain your current weight with balanced meals. Include vegetables, lean proteins, and whole grains.",
            overweight: "Focus on portion control and low-calorie foods. Increase vegetables and reduce sugar intake.",
            obese: "Strict calorie control with medical supervision. Focus on nutrient-dense, low-calorie foods.",
            underweight: "Increase calorie intake with healthy fats and proteins. Eat frequent, balanced meals.",
            general: "Eat a balanced diet with vegetables, fruits, lean proteins, and whole grains. Stay hydrated!"
          };
          botText = fallbackDiets[dietCondition] || fallbackDiets.general;
        }
      } else {
        try {
          const response = await fetch(`${API_URL}/advise?user_query=${encodeURIComponent(currentInput)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          botText = data.response || data.message;
        } catch (apiError) {
          console.warn('Advise API failed, using fallback:', apiError);
          
          // Smart fallback responses based on input
          const lowerInput = currentInput.toLowerCase();
          
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
            botText = "I'm currently having some technical difficulties with my AI connection. However, I can still help you with BMI calculations and diet plans! Try asking me to 'Calculate BMI' or 'Diet Plan'.";
          }
        }
      }
      
      // Ensure we always have a response
      if (!botText || botText.trim() === '') {
        botText = "I received your message but I'm having trouble processing it. Please try again.";
      }
      
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
      setHistory(prev => [{ query: currentInput, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), type }, ...prev]);
      
    } catch (error) {
      console.error('Critical error in sendMessage:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: "I encountered an unexpected error. Please refresh the page and try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdff] relative overflow-hidden font-sans">
      {/* 1. Background Orbs from your "Earlier" vibe */}
      <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-blue-400/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}} />

      <div className="relative z-10 max-w-5xl mx-auto min-h-screen flex flex-col p-4 md:p-8 h-screen">
        
        {/* 2. THE TOP NAV (Restored to the original Logo & Polish) */}
        <header className="flex justify-between items-center bg-white/80 backdrop-blur-md p-5 rounded-[32px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-3.5 rounded-2xl shadow-lg">
                <Heart className="text-white" size={24} />
              </div>
              <div className="absolute -top-1 -right-1 bg-green-500 p-1.5 rounded-full border-2 border-white">
                <Sparkles className="text-white" size={12} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">MediSync AI</h1>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Shield size={12} className="text-green-500" /> Patient Advocate
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setShowWakeUpSettings(true)} className="p-2.5 hover:bg-slate-50 rounded-full transition-all text-slate-400 relative">
              <Bell size={20} />
              {wakeUpEnabled && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              )}
            </button>
            <button onClick={() => setShowHistory(true)} className="p-2.5 hover:bg-slate-50 rounded-full transition-all text-slate-400">
              <History size={20} />
            </button>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-1.5 rounded-full border border-green-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-bold text-green-700 tracking-wider">ONLINE</span>
            </div>
          </div>
        </header>

        {/* 3. THE CHAT BOX (This handles the 'No Blur' logic) */}
        <main className={`flex-1 ${showHistory ? 'bg-white' : 'bg-white/40 backdrop-blur-2xl'} transition-colors duration-300 rounded-[48px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-white/60 flex flex-col overflow-hidden relative`}>
          
          {/* THE VIBRANT HEADER IS BACK */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 p-6 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
                <Activity size={24} />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">Health Consultation</h2>
                <p className="text-white/70 text-xs font-medium">Llama 3.3 Powered Assistant</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* AI Logo for bot messages */}
                {msg.role === 'bot' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                    <Sparkles className="text-white" size={16} />
                  </div>
                )}
                
                <div className={`p-4 rounded-[24px] text-sm leading-relaxed relative max-w-[80%] ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-tr-none shadow-xl' 
                    : 'bg-white border border-slate-50 text-slate-700 rounded-tl-none shadow-sm'
                }`}>
                  {/* BMI Color Coding */}
                  {(() => {
                    const lowerText = msg.text.toLowerCase();
                    const isNormal = lowerText.includes('normal') && lowerText.includes('bmi');
                    const isOverweight = lowerText.includes('overweight') && lowerText.includes('bmi');
                    const isUnderweight = lowerText.includes('underweight') && lowerText.includes('bmi');
                    const isObese = lowerText.includes('obese') && lowerText.includes('bmi');
                    
                    if (isNormal) return <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"><span className="text-white text-[8px]">✓</span></div>;
                    if (isOverweight) return <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center"><span className="text-white text-[8px]">!</span></div>;
                    if (isUnderweight || isObese) return <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white text-[8px]">!</span></div>;
                    return null;
                  })()}

                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 p-5 bg-white/50 w-28 rounded-2xl ml-14">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-50 relative z-20">
            <div className="flex gap-3 mb-4 overflow-x-auto no-scrollbar">
              {['Diet Plan', 'Austin Specialists', 'Calculate BMI'].map(chip => (
                <button key={chip} onClick={() => setInput(chip)} className="whitespace-nowrap px-5 py-2.5 bg-white border border-slate-100 rounded-full text-xs font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 shadow-sm">
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about your diet, specialists, or health concerns..." 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 shadow-sm"
              />
              <button onClick={sendMessage} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all">
                <Send size={22} />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* 4. SIDEBAR LOGIC (RESTORED PREMIUM DESIGN) */}
      {showHistory && (
        <>
          {/* Backdrop with a lighter blur than before */}
          <div 
            className="fixed inset-0 bg-slate-900/10 z-40 transition-opacity" 
            onClick={() => setShowHistory(false)}
          ></div>
          
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-[-20px_0_50px_rgba(0,0,0,0.05)] p-8 border-l border-slate-100 transform transition-transform duration-300 ease-out">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                  <History size={22} className="text-blue-600" /> Activity History
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Your Health Logs</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-160px)] no-scrollbar">
              {history.length === 0 ? <p className="text-sm text-slate-400 text-center py-20">No recent activity</p> : 
                history.map((h, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-[20px] border border-slate-100 group hover:border-blue-100 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-black bg-white text-blue-600 px-2.5 py-1 rounded-md uppercase tracking-tighter shadow-inner">
                        {h.type || 'Log'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{h.timestamp}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-bold group-hover:text-blue-600 transition-colors">
                      {h.query}
                    </p>
                  </div>
                ))
              }
            </div>
            
            <div className="absolute bottom-8 left-8 right-8 text-center border-t border-slate-100 pt-4">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <Shield size={12} /> MediSync Secured
              </p>
            </div>
          </div>
        </>
      )}

      {/* 5. WAKE-UP SETTINGS PANEL */}
      {showWakeUpSettings && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/10 z-40 transition-opacity" 
            onClick={() => setShowWakeUpSettings(false)}
          ></div>
          
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-[-20px_0_50px_rgba(0,0,0,0.05)] p-8 border-l border-slate-100 transform transition-transform duration-300 ease-out">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                  <Bell size={22} className="text-blue-600" /> Wake-Up Settings
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Daily Health Reminder</p>
              </div>
              <button onClick={() => setShowWakeUpSettings(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>

            <div className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Sun className="text-yellow-500" size={20} />
                  <div>
                    <p className="font-semibold text-slate-800">Wake-Up Alarm</p>
                    <p className="text-xs text-slate-500">Daily health reminder</p>
                  </div>
                </div>
                <button
                  onClick={() => setWakeUpEnabled(!wakeUpEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${wakeUpEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${wakeUpEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Time Picker */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <label className="flex items-center gap-3 mb-3">
                  <Clock className="text-blue-500" size={20} />
                  <span className="font-semibold text-slate-800">Wake-Up Time</span>
                </label>
                <input
                  type="time"
                  value={wakeUpTime}
                  onChange={(e) => setWakeUpTime(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Custom Message */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <label className="flex items-center gap-3 mb-3">
                  <Sparkles className="text-purple-500" size={20} />
                  <span className="font-semibold text-slate-800">Wake-Up Message</span>
                </label>
                <textarea
                  value={wakeUpMessage}
                  onChange={(e) => setWakeUpMessage(e.target.value)}
                  placeholder="Good morning! Time to start your healthy day! 🌅"
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Status */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${wakeUpEnabled ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-sm font-semibold text-slate-800">
                    {wakeUpEnabled ? 'Alarm Active' : 'Alarm Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {wakeUpEnabled 
                    ? `Next alarm: ${wakeUpTime} tomorrow` 
                    : 'Enable alarm to receive daily wake-up notifications'
                  }
                </p>
              </div>

              {/* Quick Messages */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Messages</p>
                {[
                  'Good morning! Time to start your healthy day! 🌅',
                  'Rise and shine! Let\'s make today healthy! 💪',
                  'Wake up! Your health journey awaits! 🏃‍♀️',
                  'Morning! Time for your daily health check! 🌟'
                ].map((message, index) => (
                  <button
                    key={index}
                    onClick={() => setWakeUpMessage(message)}
                    className="w-full text-left p-3 bg-white border border-slate-200 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    {message}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="absolute bottom-8 left-8 right-8 text-center border-t border-slate-100 pt-4">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <Shield size={12} /> MediSync Wake-Up
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;