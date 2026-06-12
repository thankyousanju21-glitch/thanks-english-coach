import { useState, useEffect, useRef } from 'react';
import { Settings, Mic, Square, Menu, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppOpenAd } from './components/AppOpenAd';
import { BannerAd } from './components/BannerAd';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ReportModal } from './components/ReportModal';
import { audioInterface } from './audio';
import { AppSettings, DEFAULT_SETTINGS } from './types';
import { NotificationManager } from './NotificationManager';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showAppOpenAd, setShowAppOpenAd] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setIsSpeaking(audioInterface.isSpeaking);
      }, 100);
    } else {
      setIsSpeaking(false);
    }
    return () => clearInterval(interval);
  }, [isRecording]);
  
  const [hasUpdate, setHasUpdate] = useState(false);
  const [apkUrl, setApkUrl] = useState("");
  const currentVersionCode = 4;
  
  const [lastSessionLogs, setLastSessionLogs] = useState<string[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [reportsUsed, setReportsUsed] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let parsedSettings = DEFAULT_SETTINGS;
    const stored = localStorage.getItem('app_settings');
    if (stored) {
      try { parsedSettings = JSON.parse(stored); setSettings(parsedSettings); } catch (e) {}
    }
    
    if (parsedSettings.isOnboarded) {
      NotificationManager.getInstance().startScheduler(parsedSettings.thinkingLanguage || localStorage.getItem('thinking_language') || 'Hindi');
    }
    
        // Check report limits
    const checkReportLimit = () => {
      const reportsData = JSON.parse(localStorage.getItem('reports_usage') || '{"date": "", "count": 0}');
      const today = new Date().toDateString();
      let used = 0;
      if (reportsData.date === today) {
        used = reportsData.count || 0;
      }
      setReportsUsed(used);
      if (used >= 5) {
        setDailyLimitReached(true);
      } else {
        setDailyLimitReached(false);
      }
    };
    checkReportLimit();
    
    setHasLoaded(true);

    // Auto-update check
    fetch('https://thanks-english-coach.onrender.com/api/version')
      .then(res => res.json())
      .then(data => {
        if (data && data.latest_version_code > currentVersionCode) {
          setHasUpdate(true);
          setApkUrl(data.apk_url || '');
        }
      })
      .catch(() => {}); // Fail silently
  }, []);

  useEffect(() => {
    const handleNotificationClick = () => {
      setIsSettingsOpen(false);
      setReport(null);
      if (!isRecording) {
        toggleRecording();
      }
    };
    window.addEventListener('notification-clicked', handleNotificationClick);
    return () => {
      window.removeEventListener('notification-clicked', handleNotificationClick);
    };
  }, [isRecording]);

  const handleOnboardingComplete = async (name: string, gender: string, language: string, apiKey: string) => {
    const newSettings = { ...settings, userName: name, userGender: gender as any, thinkingLanguage: language, isOnboarded: true, apiKey: apiKey || settings.apiKey };
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
    localStorage.setItem('thinking_language', language);
    await NotificationManager.getInstance().requestPermission();
    NotificationManager.getInstance().startScheduler(language);
  };
  
  const handleGenerateReport = async () => {
    try {
      const reportsData = JSON.parse(localStorage.getItem('reports_usage') || '{"date": "", "count": 0}');
      const today = new Date().toDateString();
      if (reportsData.date !== today) {
        reportsData.date = today;
        reportsData.count = 0;
      }
      
      if (reportsData.count >= 5) {
        setDailyLimitReached(true);
        setError("Daily limit reached. Come back tomorrow!");
        setIsGeneratingReport(false);
        return;
      }
      
      setIsGeneratingReport(true);
      const res = await fetch('https://thanks-english-coach.onrender.com/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: lastSessionLogs,
          settings: settings
        })
      });
      
      if (!res.ok) throw new Error("Failed to generate report");
      
      const data = await res.json();
      setReport(data.report);
      
      // Increment limit
      reportsData.count += 1;
      localStorage.setItem('reports_usage', JSON.stringify(reportsData));
      setReportsUsed(reportsData.count);
      if (reportsData.count >= 5) {
        setDailyLimitReached(true);
      }
      
    } catch (e) {
      setError("Failed to generate report.");
      console.error(e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      audioInterface.stop(setIsRecording);
      setLastSessionLogs([...audioInterface.sessionLogs]);
    } else {
      setError(null);
      setReport(null);
      setLastSessionLogs([]);
      // Retrieve settings from local storage
      let currentSettings = { personality: 'Kore' };
      const stored = localStorage.getItem('app_settings');
      if (stored) {
        try { currentSettings = JSON.parse(stored); } catch (e) {}
      }
      await audioInterface.start(currentSettings, setIsRecording, setError);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans p-4">
      
      {/* Windows XP Window Frame */}
      <div className="xp-window w-full max-w-md h-[90vh] shadow-2xl relative flex flex-col">
         
         {/* Title bar */}
         <div className="xp-titlebar">
            <div className="xp-titlebar-text">
              <span className="text-[14px]">Thanks English Coach</span>
            </div>
            <div className="xp-controls">
              <button className="xp-control-btn xp-min-btn">_</button>
              <button className="xp-control-btn xp-max-btn">□</button>
              <button className="xp-control-btn xp-close-btn" onClick={() => {}}>X</button>
            </div>
         </div>
         
         <div className="xp-titlebar bg-[#ece9d8] border-b border-white/40 flex items-center p-1" style={{background: '#ece9d8'}}>
            <span className="text-[11px] px-2 text-black cursor-default hover:bg-[#316ac5] hover:text-white">File</span>
            <span className="text-[11px] px-2 text-black cursor-default hover:bg-[#316ac5] hover:text-white" onClick={() => setIsSettingsOpen(true)}>Edit Settings</span>
            <span className="text-[11px] px-2 text-black cursor-default hover:bg-[#316ac5] hover:text-white">View</span>
            <span className="text-[11px] px-2 text-black cursor-default hover:bg-[#316ac5] hover:text-white">Help</span>
         </div>

         {/* Update Available Overlay */}
         <AnimatePresence>
           {hasUpdate && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               className="absolute inset-0 z-[200] flex items-center justify-center bg-black/40 p-6"
             >
               <div className="xp-window w-full max-w-sm flex flex-col shadow-2xl">
                 <div className="xp-titlebar">
                    <div className="xp-titlebar-text">Software Update</div>
                    <div className="xp-controls"><button className="xp-control-btn xp-close-btn">X</button></div>
                 </div>
                 <div className="xp-body" style={{backgroundColor: '#ece9d8'}}>
                   <div className="flex items-center gap-4 mb-4">
                     <span className="text-3xl">⚠️</span>
                     <p className="text-black text-[11px]">A new version of Thanks English Tutor is available. Please update to keep practicing with your tutor.</p>
                   </div>
                   <div className="flex justify-end gap-2 mt-2">
                     <button className="xp-button" onClick={() => { if(apkUrl) window.location.href = apkUrl; }}>Download</button>
                   </div>
                 </div>
               </div>
             </motion.div>
           )}
         </AnimatePresence>

         {/* Onboarding Overlay */}
         {hasLoaded && !settings.isOnboarded && (
           <OnboardingModal isOpen={true} onComplete={handleOnboardingComplete} />
         )}

         {/* Report Overlay */}
         {report && (
           <ReportModal isOpen={true} onClose={() => setReport(null)} reportText={report} />
         )}

         {/* App Open Interstitial Ad */}
         {showAppOpenAd && (
            <AppOpenAd onClose={() => setShowAppOpenAd(false)} />
         )}

         {/* Main Interface Area */}
         <div className="xp-body relative z-0 flex-col">
            <div className="xp-inner-container flex flex-col items-center justify-center relative">
               
               <h2 className="text-lg font-bold text-black mb-8" style={{fontFamily: "Comic Sans MS, Tahoma, sans-serif"}}>Speak with your Coach!</h2>

               <div className="relative flex items-center justify-center w-full h-32 mb-8 border border-gray-300 p-2" style={{background: '#ffffff'}}>
                 {/* Retro Audio Visualizer */}
                 <div className="flex items-center justify-center space-x-1 h-24 w-full bg-black p-2 border-inset">
                   {[...Array(40)].map((_, i) => {
                     const centerDist = Math.abs(20 - i);
                     const baseHeight = Math.max(10, 100 - centerDist * 5);
                     
                     let animateObj: any = { height: [baseHeight * 0.9, baseHeight * 1.1, baseHeight * 0.9] };
                     let transObj: any = { duration: 2 + Math.random(), repeat: Infinity, ease: "easeInOut" };
                     
                     if (isRecording && !isSpeaking) {
                        animateObj = { height: [baseHeight * 0.8, baseHeight * 1.5, baseHeight * 0.8] };
                        transObj = { duration: 1.5, repeat: Infinity, delay: i * 0.04, ease: "easeInOut" };
                     } else if (isRecording && isSpeaking) {
                        animateObj = { height: [baseHeight, baseHeight * (1.3 + Math.random() * 0.4), baseHeight * (0.7 + Math.random() * 0.3), baseHeight] };
                        transObj = { duration: 0.2 + Math.random() * 0.3, repeat: Infinity, ease: "easeInOut" };
                     }
                     
                     return (
                       <motion.div
                         key={i}
                         animate={animateObj}
                         transition={transObj}
                         className="w-1.5"
                         style={{
                           backgroundColor: isRecording ? '#00ff00' : '#006600',
                           boxShadow: isRecording ? '0 0 5px #00ff00' : 'none'
                         }}
                       />
                     );
                   })}
                 </div>
               </div>

               {/* Permission Errror Handling */}
               {error && (
                 <div className="mb-4 px-4 py-2 bg-[#ffcccc] border border-[#ff0000] text-[#cc0000] text-[11px] w-full text-center">
                   {error}
                 </div>
               )}

               {/* Bottom Action Pill */}
               <div className="w-full flex flex-col items-center gap-4 mt-auto">
                 <div className="text-[11px] text-gray-700">
                   Status: {isRecording ? "Listening & Speaking..." : "Idle..."}
                 </div>
                 
                 <div className="flex items-center space-x-4">
                   <button 
                     onClick={toggleRecording}
                     className="xp-button font-bold px-6 py-2"
                   >
                     {isRecording ? <><Square size={14} fill="currentColor" className="mr-1 text-red-600"/> Stop</> : <><Mic size={14} className="mr-1 text-blue-800"/> Start Talking</>}
                   </button>
                   
                   <button 
                     disabled={isGeneratingReport || dailyLimitReached || isRecording}
                     onClick={() => {
                       if (dailyLimitReached) {
                         setError("Daily limit reached. Come back tomorrow!");
                       } else {
                         handleGenerateReport();
                       }
                     }}
                     className="xp-button px-4 py-2"
                   >
                     {isGeneratingReport ? "Generating..." : <><Download size={14} className="mr-1"/> Save Report</>}
                   </button>
                 </div>
               </div>
               
               <div className="mt-4 text-center">
                 {dailyLimitReached && !isRecording && (
                    <div className="text-[10px] text-gray-500">
                       Daily Limit Reached ({reportsUsed}/5)
                    </div>
                 )}
                 {!dailyLimitReached && reportsUsed > 0 && !isRecording && (
                    <div className="text-[10px] text-gray-500">
                       {reportsUsed} of 5 notes used today
                    </div>
                 )}
               </div>
            </div>
         </div>

         {/* Bottom Footer Area */}
         <div className="w-full bg-[#ece9d8] border-t border-[#848284]">
            {/* Banner Ad Placement */}
            <BannerAd />
         </div>

         {/* Modal Overlays */}
         <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </div>
  );
}
