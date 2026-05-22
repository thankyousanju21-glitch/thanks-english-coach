import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function OnboardingModal({ isOpen, onComplete }: { isOpen: boolean; onComplete: (name: string, gender: string, language: string, apiKey: string) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [thinkingLanguage, setThinkingLanguage] = useState('Hindi');
  const [apiKey, setApiKey] = useState('');
  const languages = ['Hindi', 'Bengali', 'Punjabi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada'];

  const launchGoogleChromeIntent = () => {
    try {
      // Explict browser intent routing 
      const intentURI = "intent://aistudio.google.com/app/api-keys#Intent;action=android.intent.action.VIEW;scheme=https;package=com.android.chrome;end";
      window.location.href = intentURI;
      
      // Fallback
      setTimeout(() => {
        // Assume fallback needs to happen only if the page is still here in focus
        if (document.hasFocus()) {
          window.open("https://aistudio.google.com/app/api-keys", "_blank");
        }
      }, 1500);
    } catch (ActivityNotFoundException) {
      window.open("https://aistudio.google.com/app/api-keys", "_blank");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] flex flex-col bg-[#121212] items-center justify-center p-6 border-transparent overflow-y-auto"
        >
          <div className="w-full max-w-sm flex flex-col items-center py-10 my-auto">
             
             {step === 1 ? (
               <>
                 <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 border border-blue-500/30">
                   <span className="text-3xl">👋</span>
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2 text-center">Welcome to Thanks Tutor</h2>
                 <p className="text-white/50 text-sm mb-10 text-center">Let's personalize your speech training journey.</p>
                 
                 <div className="w-full space-y-6">
                    <div className="space-y-2 text-left">
                      <label className="text-[11px] text-gray-500 uppercase font-bold tracking-widest pl-1">What's your First Name?</label>
                      <input 
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-2xl px-4 py-4 text-white text-sm outline-none focus:border-[#00E5FF] transition-colors"
                        placeholder="e.g. Suraj"
                      />
                    </div>
      
                    <div className="space-y-2 text-left">
                      <label className="text-[11px] text-gray-500 uppercase font-bold tracking-widest pl-1">Gender</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['Male', 'Female', 'Prefer not to say'] as const).map(g => (
                          <button
                            key={g}
                            onClick={() => setGender(g)}
                            className={`px-4 py-3.5 rounded-2xl border text-xs font-semibold transition active:scale-95 ${g === 'Prefer not to say' ? 'col-span-2' : ''} ${
                              gender === g 
                                ? 'bg-[#00E5FF]/10 border-[#00E5FF]/50 text-[#00E5FF]' 
                                : 'bg-[#121212] border-white/5 text-white/60 hover:bg-white/5'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <label className="text-[11px] text-gray-500 uppercase font-bold tracking-widest pl-1">What language do you usually think or speak in at home?</label>
                      <select 
                        value={thinkingLanguage}
                        onChange={e => setThinkingLanguage(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-2xl px-4 py-4 text-white text-sm outline-none focus:border-[#00E5FF] transition-colors appearance-none"
                      >
                        {languages.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
      
                    <button 
                      disabled={!name.trim() || !gender || !thinkingLanguage}
                      onClick={() => setStep(2)}
                      className="w-full mt-8 py-4 bg-white text-black font-bold rounded-2xl text-sm shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      Next Step
                    </button>
                 </div>
               </>
             ) : (
               <>
                 <div className="w-16 h-16 bg-[#00E5FF]/20 rounded-full flex items-center justify-center mb-6 border border-[#00E5FF]/30">
                   <span className="text-3xl">🔑</span>
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2 text-center">Let's unlock your free Tutor!</h2>
                 
                 <div className="w-full space-y-6 mt-6">
                    <div className="bg-[#1e1e1e] border border-white/10 p-5 rounded-2xl shadow-xl space-y-4">
                      <p className="text-white/80 text-sm leading-relaxed">
                        To keep this app 100% free forever with no monthly fees, we need to plug in a free key from Google. It takes just 10 seconds:
                      </p>
                      
                      <ul className="text-white/70 text-sm space-y-3 pl-1">
                        <li>• <strong className="text-white">Step 1:</strong> Click the big blue button below. (It will open Google Chrome).</li>
                        <li>• <strong className="text-white">Step 2:</strong> Log in with your standard Google account (your normal Gmail).</li>
                        <li>• <strong className="text-white">Step 3:</strong> Click the blue button that says 'Create API Key', then click 'Copy'.</li>
                        <li>• <strong className="text-white">Step 4:</strong> Come back to this app, paste that code into the box, and you are ready to talk!</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <button 
                        onClick={launchGoogleChromeIntent}
                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl text-sm shadow-xl hover:bg-blue-500 transition-colors"
                      >
                        Get Your Free Google Key
                      </button>
                      <p className="text-[10px] text-gray-500 leading-tight text-center px-2">
                        यह लिंक सीधे आपके गूगल क्रोम में खुलेगा ताकि आप आसानी से लॉग-इन कर सकें / This link opens directly in Google Chrome for an instant, seamless login.
                      </p>
                    </div>

                    <div className="space-y-2 pt-4">
                      <label className="text-[11px] text-gray-500 uppercase font-bold tracking-widest pl-1">Paste your key here</label>
                      <input 
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-2xl px-4 py-4 text-white text-sm outline-none focus:border-[#00E5FF] transition-colors"
                        placeholder="AIzaSy..."
                      />
                    </div>
      
                    <button 
                      disabled={!apiKey.trim()}
                      onClick={() => onComplete(name.trim(), gender, thinkingLanguage, apiKey.trim())}
                      className="w-full mt-4 py-4 bg-white text-black font-bold rounded-2xl text-sm shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      Start Practicing
                    </button>
                 </div>
               </>
             )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
