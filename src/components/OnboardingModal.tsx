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
          className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="xp-window w-full max-w-sm flex flex-col shadow-2xl">
            <div className="xp-titlebar">
              <div className="xp-titlebar-text">Setup Wizard</div>
              <div className="xp-controls">
                <button className="xp-control-btn xp-close-btn" disabled>X</button>
              </div>
            </div>
            
            <div className="xp-body bg-[#ece9d8]">
              <div className="flex bg-white p-4 border-b border-[#7f9db9] mb-4 gap-4 items-center">
                <div className="w-12 h-12 bg-[#0058e6] text-white flex justify-center items-center font-bold text-2xl border-2 border-white shadow-sm">
                  ?
                </div>
                <div>
                  <h2 className="font-bold text-[14px]">Welcome to Thanks Tutor Setup</h2>
                  <p className="text-[11px] mt-1">This wizard will guide you through the setup process.</p>
                </div>
              </div>

              <div className="xp-inner-container flex flex-col gap-3 min-h-[220px]">
                {step === 1 ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold">First Name:</label>
                      <input 
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="border border-[#7f9db9] px-2 py-1 text-[11px]"
                      />
                    </div>
      
                    <div className="flex flex-col gap-1 mt-2">
                      <label className="text-[11px] font-bold">Gender:</label>
                      <div className="flex flex-col gap-1">
                        {(['Male', 'Female', 'Prefer not to say'] as const).map(g => (
                          <label key={g} className="flex items-center gap-1 text-[11px]">
                            <input 
                              type="radio" 
                              name="gender_setup"
                              checked={gender === g}
                              onChange={() => setGender(g)}
                            />
                            {g}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-2">
                      <label className="text-[11px] font-bold">Primary Language:</label>
                      <select 
                        value={thinkingLanguage}
                        onChange={e => setThinkingLanguage(e.target.value)}
                        className="border border-[#7f9db9] px-2 py-1 text-[11px] bg-white"
                      >
                        {languages.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] mb-2 font-bold">Google API Key Required</p>
                    <p className="text-[11px] mb-2">
                      To keep this software free, you must provide your own API key.
                    </p>
                    <ol className="text-[11px] list-decimal pl-4 mb-4 space-y-1">
                      <li>Click the button below to open Google Chrome.</li>
                      <li>Log in with your Google account.</li>
                      <li>Click 'Create API Key', then 'Copy'.</li>
                      <li>Paste the key into the box below.</li>
                    </ol>

                    <div className="flex justify-center mb-4">
                      <button 
                        onClick={launchGoogleChromeIntent}
                        className="xp-button px-4 py-1"
                      >
                        Get Free Google Key...
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold">API Key:</label>
                      <input 
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="border border-[#7f9db9] px-2 py-1 text-[11px]"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-400" style={{background: '#ece9d8'}}>
                {step === 1 ? (
                  <>
                    <button className="xp-button w-20" disabled>&lt; Back</button>
                    <button 
                      className="xp-button w-20 font-bold" 
                      onClick={() => setStep(2)}
                      disabled={!name.trim() || !gender || !thinkingLanguage}
                    >
                      Next &gt;
                    </button>
                  </>
                ) : (
                  <>
                    <button className="xp-button w-20" onClick={() => setStep(1)}>&lt; Back</button>
                    <button 
                      className="xp-button w-20 font-bold" 
                      onClick={() => onComplete(name.trim(), gender, thinkingLanguage, apiKey.trim())}
                      disabled={!apiKey.trim()}
                    >
                      Finish
                    </button>
                  </>
                )}
                <button className="xp-button w-20 ml-2" disabled>Cancel</button>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
