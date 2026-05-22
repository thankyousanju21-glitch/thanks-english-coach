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
  const [error, setError] = useState<string | null>(null);
  
  const [hasUpdate, setHasUpdate] = useState(false);
  const [apkUrl, setApkUrl] = useState("");
  const currentVersionCode = 1;
  
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
    fetch('https://yourdomain.com/version.json')
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
      const res = await fetch('http://192.168.1.7:3000/api/generate-report', {
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
    <div className="min-h-screen bg-black flex justify-center font-sans selection:bg-[#00E5FF]/30">
      
      {/* Mobile Scaffold / Constraint Wrapper */}
      <div className="w-full max-w-md bg-gradient-to-br from-[#2563eb] via-[#f97316] to-[#dc2626] min-h-[100dvh] h-full shadow-2xl relative flex flex-col overflow-hidden sm:border-x sm:border-white/10">
         
         {/* Update Available Overlay */}
         <AnimatePresence>
           {hasUpdate && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
             >
               <div className="bg-[#1e1e1e] border border-white/10 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
                 <div className="w-16 h-16 bg-[#00E5FF]/20 rounded-full flex items-center justify-center mb-4 border border-[#00E5FF]/30">
                   <span className="text-3xl">⬆️</span>
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">Update Available</h2>
                 <p className="text-white/60 text-sm mb-6 leading-relaxed">
                   A new version of Thanks English Tutor is available. Please update to keep practicing with your tutor.
                 </p>
                 <button 
                   onClick={() => { if(apkUrl) window.location.href = apkUrl; }}
                   className="w-full py-4 bg-[#00E5FF] text-black font-bold rounded-2xl shadow-lg hover:bg-cyan-400 transition-colors"
                 >
                   Download Update Now
                 </button>
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

         {/* Screen Header */}
         <header className="flex justify-between items-center p-6 mt-[env(safe-area-inset-top)] z-10">
           <button className="p-2 text-white/90 hover:text-white transition-colors">
             <Menu size={24} className="stroke-[2.5]" />
           </button>
           <h1 className="text-lg font-medium text-white/90 tracking-wide">Thanks English Coach</h1>
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="p-2 text-white/90 hover:text-white transition-colors"
           >
             <Settings size={22} className="stroke-[2.5]" />
           </button>
         </header>

         {/* Main Interface Area */}
         <main className="flex-1 flex flex-col items-center justify-center -mt-8 p-8 relative z-0">
           
           <div className="relative flex items-center justify-center w-full h-48 mb-8">
             {/* Dynamic Audio Visualizer */}
             <div className="flex items-center justify-center space-x-1 h-32 w-full">
               {[...Array(40)].map((_, i) => {
                 // Create a bell curve shape for the default visualizer
                 const centerDist = Math.abs(20 - i);
                 const baseHeight = Math.max(10, 100 - centerDist * 5);
                 
                 return (
                   <motion.div
                     key={i}
                     initial={{ height: baseHeight }}
                     animate={isRecording ? { 
                       height: [baseHeight, baseHeight * (1.2 + Math.random()), baseHeight * (0.8 + Math.random()), baseHeight]
                     } : { height: baseHeight }}
                     transition={isRecording ? { 
                       duration: 0.5 + Math.random() * 0.5, 
                       repeat: Infinity, 
                       ease: "easeInOut" 
                     } : { duration: 0.3 }}
                     className="w-1.5 rounded-full"
                     style={{
                       backgroundColor: `hsl(${i * 8}, 80%, 65%)`,
                       opacity: 0.8 + (Math.random() * 0.2)
                     }}
                   />
                 );
               })}
             </div>
           </div>

           {/* Permission Errror Handling */}
           {error && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
               className="mb-8 px-5 py-3 bg-red-500/20 backdrop-blur-md border border-red-500/30 text-white text-sm font-medium rounded-2xl max-w-xs text-center"
             >
               {error}
             </motion.div>
           )}

           {/* Bottom Action Pill */}
           <motion.div 
             className="absolute bottom-10 w-full max-w-[85%] mx-auto left-0 right-0"
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
           >
             <div className="bg-[#2a1b1b]/80 backdrop-blur-xl border border-white/10 rounded-full py-2 pl-6 pr-2 flex items-center justify-between shadow-2xl">
               <span className="text-white/60 text-sm font-medium flex-1 truncate pr-4">
                 {isRecording ? "Listening & Speaking..." : "Talk to Coach..."}
               </span>
               
               <div className="flex items-center space-x-2">
                 <button 
                   onClick={toggleRecording}
                   className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
                     isRecording ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                   }`}
                 >
                   {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
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
                   className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                 >
                   {isGeneratingReport ? (
                     <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full" />
                   ) : (
                     <Download size={20} />
                   )}
                 </button>
               </div>
             </div>
           </motion.div>
           
           {dailyLimitReached && !isRecording && (
              <div className="absolute bottom-2 text-[10px] text-white/40 uppercase tracking-widest text-center w-full">
                 Daily Limit Reached ({reportsUsed}/5)
              </div>
           )}
           {!dailyLimitReached && reportsUsed > 0 && !isRecording && (
              <div className="absolute bottom-2 text-[10px] text-white/40 uppercase tracking-widest text-center w-full">
                 {reportsUsed} of 5 notes used today
              </div>
           )}
         </main>

         {/* Bottom Footer Area */}
         <div className="mt-auto px-4 pb-4 space-y-4 w-full relative z-20">
            {/* Banner Ad Placement */}
            <BannerAd />
            
            {/* Attribution Link */}
            <div className="text-center">
              <span className="text-gray-500 text-[11px] font-medium tracking-tight hover:text-white transition-colors">
                Developed By{' '}
                <a 
                  href="https://www.linkedin.com/in/thankyousanju/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Thank You Sanju
                </a>
              </span>
            </div>
            <div className="h-1.5 w-32 bg-gray-800 rounded-full mx-auto mt-2"></div>
         </div>

         {/* Modal Overlays */}
         <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </div>
  );
}
