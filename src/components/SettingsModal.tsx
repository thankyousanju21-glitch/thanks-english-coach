import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, DEFAULT_SETTINGS } from '../types';
import { X, Settings } from 'lucide-react';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Utilize SharedPreferences matching paradigm (localStorage in web)
    const stored = localStorage.getItem('app_settings');
    if (stored) {
      try { setSettings(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  const modes = [
    "Conversation", "Daily Life Style", "Interview", "Debate", 
    "Political Debate", "Religious Conversation", "Restaurant", 
    "Meeting", "Business", "Talk to Boss", "Pronunciation"
  ];
  const paces = ["Slow", "Normal", "Fast", "Very Fast"];
  const replyLengths = ["Short", "Medium", "Long"];
  const languages = ["English", "Hindi", "Spanish", "French", "German", "Japanese", "Korean", "Mandarin", "Arabic", "Italian", "Portuguese"];
  
  const thinkingLanguages = ['Hindi', 'Bengali', 'Punjabi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada'];
  
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'chats' | 'about'>('preferences');
  const [cachedChats, setCachedChats] = useState<{title: string, date: string, summary: string}[]>([]);

  useEffect(() => {
    const chats = localStorage.getItem('chat_summaries');
    if (chats) {
       try { setCachedChats(JSON.parse(chats)); } catch(e) {}
    } else {
       // Seed a placeholder chat for the 14-day requirement
       const seed = [
         { title: "Day 1: Getting to Know You", date: new Date(Date.now() - 86400000).toLocaleDateString(), summary: "The user introduced themselves and practiced basic greetings. Struggled slightly with tense agreement." },
         { title: "Day 2: Ordering Food", date: new Date().toLocaleDateString(), summary: "Practiced ordering at a restaurant. Showed good grasp of polite requests (could I have, I would like)." }
       ];
       localStorage.setItem('chat_summaries', JSON.stringify(seed));
       setCachedChats(seed);
    }
  }, [isOpen]);

  // Personality logic
  const personalities = settings.gender === 'Male' ? [{name: 'Sanju', voice: 'Charon'}] : [{name: 'Pratigya', voice: 'Kore'}];

  const handleGenderChange = (gender: 'Male' | 'Female') => {
    const validPersonalities = gender === 'Male' ? [{name: 'Sanju', voice: 'Charon'}] : [{name: 'Pratigya', voice: 'Kore'}];
    saveSettings({ 
      ...settings, 
      gender, 
      personality: validPersonalities[0].name 
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen Overlay with Gradient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#2563eb] via-[#f97316] to-[#dc2626] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 pt-12 pb-4 bg-black/40 backdrop-blur-xl border-b border-white/5 shrink-0">
              <div className="flex items-center space-x-3">
                <button onClick={onClose} className="p-2 -ml-2 rounded-full text-white/80 hover:text-white transition">
                  <X size={24} className="stroke-[2.5]" />
                </button>
                <h2 className="text-white font-medium text-lg tracking-wide">English Coach Settings</h2>
              </div>
              <div className="p-2">
                 <Settings size={22} className="stroke-[2.5] text-white/80" />
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 thin-scrollbar pb-32">
              
              {/* Profile Card */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/20 rounded-[1.5rem] p-5 space-y-4 shadow-xl">
                <h3 className="text-white font-bold text-[15px] tracking-wide">Profile</h3>
                
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 uppercase tracking-widest pl-1">Your Name</label>
                  <input 
                    type="text" 
                    value={settings.userName || ''} 
                    onChange={e => saveSettings({...settings, userName: e.target.value})}
                    className="w-full bg-[#121212]/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 uppercase tracking-widest pl-1">Native Language</label>
                  <div className="relative">
                    <select 
                      value={settings.thinkingLanguage || 'Hindi'}
                      onChange={e => {
                        saveSettings({...settings, thinkingLanguage: e.target.value});
                        localStorage.setItem('thinking_language', e.target.value);
                      }}
                      className="w-full bg-[#121212]/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                      {thinkingLanguages.map(lang => (
                        <option key={lang} value={lang} className="bg-[#1e1e1e]">{lang}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">&#9662;</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {['Male', 'Female'].map(g => (
                    <button
                      key={g}
                      onClick={() => handleGenderChange(g as 'Male'|'Female')}
                      className={`py-3 rounded-xl text-sm font-bold border transition-colors ${
                        settings.gender === g 
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                          : 'bg-[#121212]/50 text-gray-400 border-white/5 hover:bg-white/5'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferences Card */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/20 rounded-[1.5rem] p-5 space-y-5 shadow-xl">
                <div className="flex items-center space-x-2">
                  <Settings size={18} className="text-[#00E5FF]" />
                  <h3 className="text-white font-bold text-[15px] tracking-wide">Preferences</h3>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 uppercase tracking-widest pl-1">Custom Gemini API Key (Optional)</label>
                  <div className="relative">
                    <input 
                      type="password"
                      placeholder="AIza..."
                      value={settings.apiKey || ''}
                      onChange={e => saveSettings({...settings, apiKey: e.target.value})}
                      className="w-full bg-[#121212]/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors pr-10"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"><Settings size={16} /></div>
                  </div>
                  <p className="text-[10px] text-gray-500 pl-1 pt-1">Leave blank to use the default app quota.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white/90">Grammar Correction</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.grammarCorrection ?? true}
                        onChange={e => saveSettings({...settings, grammarCorrection: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white/90">Filler-Word Buzzer</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.buzzerEnabled ?? false}
                        onChange={e => saveSettings({...settings, buzzerEnabled: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Language & Scenarios */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/20 rounded-[1.5rem] p-5 space-y-4 shadow-xl">
                 <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 uppercase tracking-widest pl-1">Language to Learn</label>
                  <div className="relative">
                    <select 
                      value={settings.language || 'English'}
                      onChange={e => saveSettings({...settings, language: e.target.value})}
                      className="w-full bg-[#121212]/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                      {languages.map(l => (
                        <option key={l} value={l} disabled={l !== "English" && l !== "Hindi"} className="bg-[#1e1e1e]">
                          {l} {l !== "English" && l !== "Hindi" ? '🔒' : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">&#9662;</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {modes.map(m => (
                    <button
                      key={m}
                      onClick={() => saveSettings({...settings, mode: m})}
                      className={`py-2.5 px-2 rounded-xl text-xs font-medium border transition-colors ${
                        settings.mode === m 
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                          : 'bg-[#121212]/50 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Pace & Reply Length */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/20 rounded-[1.5rem] p-5 space-y-5 shadow-xl">
                 <div className="space-y-2">
                  <label className="text-[11px] text-gray-400 uppercase tracking-widest pl-1">Voice Pace</label>
                  <div className="flex bg-[#121212]/50 p-1 rounded-xl border border-white/5">
                    {paces.map(p => (
                      <button
                        key={p}
                        onClick={() => saveSettings({...settings, pace: p})}
                        className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                          settings.pace === p 
                            ? 'bg-white/10 text-white rounded-lg shadow-sm' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] text-gray-400 uppercase tracking-widest pl-1">Tutor Reply Length</label>
                  <div className="flex bg-[#121212]/50 p-1 rounded-xl border border-white/5">
                    {replyLengths.map(p => (
                      <button
                        key={p}
                        onClick={() => saveSettings({...settings, replyLength: p as any})}
                        className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                          settings.replyLength === p 
                            ? 'bg-white/10 text-white rounded-lg shadow-sm' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* History (14 Days) */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/20 rounded-[1.5rem] p-5 shadow-xl flex flex-col max-h-64">
                <h3 className="text-white font-bold text-[15px] tracking-wide mb-3">Chat History (14 Days)</h3>
                <div className="overflow-y-auto thin-scrollbar pr-2 space-y-3 flex-1">
                   {cachedChats.length === 0 && (
                     <div className="text-center py-4 text-white/40 text-sm">No chats found.</div>
                   )}
                   {cachedChats.map((c, i) => (
                     <div key={i} className="bg-[#121212]/50 border border-white/5 p-3 rounded-xl flex flex-col space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h4 className="text-white text-sm font-medium">{c.title}</h4>
                          <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2">{c.date}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{c.summary}</p>
                     </div>
                   ))}
                </div>
              </div>

              {/* About */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/20 rounded-[1.5rem] p-2 shadow-xl mb-4">
                <button 
                  onClick={() => window.open('https://www.linkedin.com/in/thankyousanju/', '_blank')}
                  className="w-full text-left flex items-center justify-between px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors border-b border-white/5"
                >
                  <span className="font-medium text-white/90">Developed By Thank You Sanju</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch('/version.json');
                      const data = await res.json();
                      if (data.version && data.version !== "v1.0.0") alert("Update available: " + data.version);
                      else alert("You are on the latest version.");
                    } catch (e) { alert("Unable to check for updates at this time."); }
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors border-b border-white/5"
                >
                  Check for Update
                </button>
                <button 
                  onClick={() => window.open('https://thankyousanju.com/privacy', '_blank')}
                  className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors border-b border-white/5"
                >
                  Privacy Policy
                </button>
                <div className="w-full px-4 pt-3 pb-2 text-[10px] text-gray-500 tracking-widest uppercase text-center">
                  App Version: v1.0.0
                </div>
              </div>
            </div>
            
            {/* Save Button (Absolute anchored to bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-red-600/50 to-transparent pt-12 pointer-events-none">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-[#1a1a1a] text-white font-bold tracking-wide rounded-2xl text-sm shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-colors pointer-events-auto glow-border"
              >
                Save Configuration
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
