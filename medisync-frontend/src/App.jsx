import React, { useState, useRef, useEffect } from 'react';
import { Heart, Send, User, Bot, Activity, Shield, Sparkles, History, X } from 'lucide-react';

const API_URL = 'https://healthcare-ai-q3yl.vercel.app';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello Kavitha! I'm your MediSync Advocate. How can I help with your health goals today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let botText = "";
      const lowerInput = input.toLowerCase();
      
      // Check for weight pattern (number followed by lb or lbs)
      const weightMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs)/i);
      // Check for height pattern
      let heightMatch = input.match(/[,\s]+(\d+(?:\.\d+)?)\s*(?:in|inches|ft|foot|feet)?['"]?/i);
      if (!heightMatch) {
        heightMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:in|inches|ft|foot|feet)/i);
      }
      // Also match patterns like "5.3'" or "5'3"" (feet and inches)
      const heightFeetInchesMatch = input.match(/(\d+)'\s*(\d+)/i);
      
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
          
          const response = await fetch(`${API_URL}/bmi?weight=${weight}&height=${height}`);
          const data = await response.json();
          botText = data.message;
        } else if (lowerInput.includes('bmi') || lowerInput.includes('calculate')) {
          botText = "I'll calculate your BMI. Please provide your weight in pounds (e.g., 143lb) and height (e.g., 5.3 or 63in).";
        } else {
          botText = "I need your weight in pounds (e.g., 143lb) and height in inches or feet (e.g., 5.3 or 63in).";
        }
      } else if (lowerInput.includes('diet')) {
        const response = await fetch(`${API_URL}/diet?condition=general`);
        const data = await response.json();
        botText = data.message;
      } else {
        const response = await fetch(`${API_URL}/advise?user_query=${encodeURIComponent(input)}`);
        const data = await response.json();
        botText = data.response || data.message;
      }
      
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
      setHistory(prev => [{ query: input, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), type }, ...prev]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Backend connection error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdff] relative overflow-hidden font-sans">
      {/* 1. Background Orbs from your "Earlier" vibe */}
      <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-blue-400/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}} />

      <div className="relative z-10 max-w-5xl mx-auto min-h-screen flex flex-col p-4 md:p-8">
        
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
          <div className={`flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar ${showHistory ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
            {messages.map((msg, i) => (
              <div key={i} className={`p-4 rounded-[24px] text-sm leading-relaxed relative max-w-[80%] ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-tr-none shadow-xl ml-auto' 
                  : 'bg-white border border-slate-50 text-slate-700 rounded-tl-none shadow-sm mr-auto'
              }`}>
                {/* --- POSITIVE REINFORCEMENT (Confetti for Normal) --- */}
                {msg.role === 'bot' && msg.text.toLowerCase().includes('normal') && (
                  <div className="confetti-container">
                    <Sparkles className="text-yellow-400 animate-confetti" size={16} />
                    <Sparkles className="text-blue-400 animate-confetti" size={12} style={{ animationDelay: '0.2s' }} />
                    <Sparkles className="text-purple-400 animate-confetti" size={14} style={{ animationDelay: '0.1s' }} />
                  </div>
                )}

                {/* --- SUPPORTIVE INSIGHT (Accent for Overweight) --- */}
                {msg.role === 'bot' && msg.text.toLowerCase().includes('overweight') && (
                  <div className="absolute -left-1 top-4 bottom-4 w-1 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                    {/* This adds a glowing amber "importance" bar to the side of the bubble */}
                  </div>
                )}
                {msg.text}
              </div>
            ))}
            {loading && (
               <div className="flex gap-2 p-5 bg-white/50 w-28 rounded-2xl animate-pulse ml-14">
                  <div className="w-2 h-2 bg-slate-300 rounded-full" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full" />
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
    </div>
  );
}

export default App;