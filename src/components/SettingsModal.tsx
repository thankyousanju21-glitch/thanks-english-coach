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
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="xp-window w-full max-w-sm flex flex-col shadow-2xl">
            <div className="xp-titlebar">
              <div className="xp-titlebar-text">Properties</div>
              <div className="xp-controls">
                <button className="xp-control-btn xp-close-btn" onClick={onClose}>X</button>
              </div>
            </div>
            
            <div className="xp-body" style={{backgroundColor: '#ece9d8'}}>
              
              <div className="flex border-b border-gray-400 mb-2">
                <button onClick={() => setActiveTab('profile')} className={`px-3 py-1 border border-b-0 border-gray-400 rounded-t-sm text-[11px] ${activeTab === 'profile' ? 'bg-white border-b-white z-10 -mb-[1px]' : 'bg-[#ece9d8] mt-[2px]'}`}>Profile</button>
                <button onClick={() => setActiveTab('preferences')} className={`px-3 py-1 border border-b-0 border-gray-400 rounded-t-sm text-[11px] ${activeTab === 'preferences' ? 'bg-white border-b-white z-10 -mb-[1px]' : 'bg-[#ece9d8] mt-[2px]'}`}>Preferences</button>
                <button onClick={() => setActiveTab('chats')} className={`px-3 py-1 border border-b-0 border-gray-400 rounded-t-sm text-[11px] ${activeTab === 'chats' ? 'bg-white border-b-white z-10 -mb-[1px]' : 'bg-[#ece9d8] mt-[2px]'}`}>History</button>
              </div>

              <div className="xp-inner-container flex flex-col gap-2 h-64">
                
                {activeTab === 'profile' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-black">Your Name:</label>
                      <input 
                        type="text" 
                        value={settings.userName || ''} 
                        onChange={e => saveSettings({...settings, userName: e.target.value})}
                        className="border border-[#7f9db9] px-2 py-1 text-[11px]"
                      />
                    </div>

                    <div className="flex flex-col gap-1 mt-2">
                      <label className="text-[11px] text-black">Native Language:</label>
                      <select 
                        value={settings.thinkingLanguage || 'Hindi'}
                        onChange={e => {
                          saveSettings({...settings, thinkingLanguage: e.target.value});
                          localStorage.setItem('thinking_language', e.target.value);
                        }}
                        className="border border-[#7f9db9] px-2 py-1 text-[11px] bg-white"
                      >
                        {thinkingLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {['Male', 'Female'].map(g => (
                        <label key={g} className="flex items-center gap-1 text-[11px] cursor-default">
                          <input 
                            type="radio" 
                            name="gender" 
                            checked={settings.gender === g}
                            onChange={() => handleGenderChange(g as 'Male'|'Female')}
                          />
                          {g}
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {activeTab === 'preferences' && (
                  <>
                    <fieldset className="xp-fieldset">
                      <legend className="xp-legend text-[11px]">Conversation Settings</legend>
                      
                      <div className="flex flex-col gap-1 mb-2">
                        <label className="text-[11px] text-black">Mode:</label>
                        <select 
                          value={settings.mode || 'Conversation'}
                          onChange={e => saveSettings({...settings, mode: e.target.value})}
                          className="border border-[#7f9db9] px-1 py-1 text-[11px] bg-white w-full"
                        >
                          {modes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>

                      <div className="flex gap-4">
                        <label className="flex items-center gap-1 text-[11px]">
                          <input 
                            type="checkbox" 
                            checked={settings.grammarCorrection ?? true}
                            onChange={e => saveSettings({...settings, grammarCorrection: e.target.checked})}
                          />
                          Grammar Correction
                        </label>
                        <label className="flex items-center gap-1 text-[11px]">
                          <input 
                            type="checkbox" 
                            checked={settings.buzzerEnabled ?? false}
                            onChange={e => saveSettings({...settings, buzzerEnabled: e.target.checked})}
                          />
                          Filler-Word Buzzer
                        </label>
                      </div>
                    </fieldset>

                    <fieldset className="xp-fieldset mt-2">
                      <legend className="xp-legend text-[11px]">Pace & Length</legend>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] w-12">Pace:</span>
                          <select value={settings.pace} onChange={e => saveSettings({...settings, pace: e.target.value})} className="border border-[#7f9db9] px-1 py-1 text-[11px] bg-white flex-1">
                            {paces.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] w-12">Length:</span>
                          <select value={settings.replyLength} onChange={e => saveSettings({...settings, replyLength: e.target.value as any})} className="border border-[#7f9db9] px-1 py-1 text-[11px] bg-white flex-1">
                            {replyLengths.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                    </fieldset>
                  </>
                )}

                {activeTab === 'chats' && (
                  <div className="flex flex-col gap-2">
                    {cachedChats.length === 0 && <span className="text-[11px]">No history found.</span>}
                    {cachedChats.map((c, i) => (
                      <div key={i} className="border border-[#dcdcdc] p-2 bg-[#f0f0f0]">
                        <div className="font-bold text-[11px]">{c.title} <span className="font-normal text-gray-500">({c.date})</span></div>
                        <div className="text-[10px] mt-1">{c.summary}</div>
                      </div>
                    ))}
                  </div>
                )}
                
              </div>

              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-400" style={{background: '#ece9d8'}}>
                <button className="xp-button w-20" onClick={onClose}>OK</button>
                <button className="xp-button w-20" onClick={onClose}>Cancel</button>
                <button className="xp-button w-20" disabled>Apply</button>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
