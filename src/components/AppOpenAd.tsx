import { useEffect, useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AppOpenAd({ onClose }: { onClose: () => void }) {
  const [canClose, setCanClose] = useState(false);
  const isOnline = navigator.onLine;

  useEffect(() => {
    // Fail semi-gracefully if no internet, per requirements
    if (!isOnline) {
      onClose();
      return;
    }
    const timer = setTimeout(() => {
      setCanClose(true);
    }, 1500); // Wait 1.5s before showing skip button
    return () => clearTimeout(timer);
  }, [isOnline, onClose]);

  if (!isOnline) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: -20, opacity: 0 }}
        className="absolute inset-0 z-50 flex flex-col bg-[#121212] border-x border-white/5"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/5 mt-[env(safe-area-inset-top)]">
          <div className="bg-[#F4B400] text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            App Open Test Ad
          </div>
          {canClose ? (
            <button 
              onClick={onClose}
              className="w-10 h-10 flex flex-col items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent text-white/30 text-xs">
              wait... 
            </div>
          )}
        </div>
        
        {/* Ad Body Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
           <div className="w-24 h-24 bg-blue-500/20 text-blue-400 flex flex-col items-center justify-center rounded-[2rem] border border-blue-500/30">
             <ShieldAlert size={36} className="mb-1" />
           </div>
           
           <div>
             <h2 className="text-xl font-bold text-white mb-2 tracking-tight">App Open Advertisement</h2>
             <p className="text-sm text-white/50 max-w-[250px] leading-relaxed mx-auto">
               This is a simulated AdMob App Open layout displaying on application launch.
             </p>
             <p className="font-mono text-[10px] text-white/30 mt-4 break-all bg-[#1E1E1E] p-2 rounded-lg border border-white/5">
                ca-app-pub-3940256099942544/AppOpenTest
             </p>
           </div>

           {canClose && (
             <motion.button 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               onClick={onClose}
               className="mt-8 px-10 py-3.5 bg-white/10 text-white rounded-full font-medium tracking-wide hover:bg-white/20 transition-all border border-white/10 active:scale-95"
             >
               Continue to App
             </motion.button>
           )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
