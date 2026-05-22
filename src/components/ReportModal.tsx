import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileText, Image as ImageIcon } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export function ReportModal({ isOpen, onClose, reportText }: { isOpen: boolean; onClose: () => void; reportText: string }) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Parse text into categories
  const parseReport = (text: string) => {
    const categories = text.split(/(?=\[.*?\])/g).filter(Boolean);
    return categories.map(cat => {
      const parts = cat.split(']');
      if (parts.length > 1) {
        return {
          title: parts[0].replace('[', '').trim(),
          content: parts[1].trim()
        };
      }
      return { title: 'NOTES', content: cat.trim() };
    });
  };

  const sections = parseReport(reportText);

  const exportAsPng = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const el = reportRef.current;
      const width = el.scrollWidth;
      const height = el.scrollHeight;
      const imgData = await htmlToImage.toPng(el, { 
        pixelRatio: 2, 
        backgroundColor: '#1e1e1e',
        width: width,
        height: height,
        style: { margin: '0', padding: '24px', maxHeight: 'none', transform: 'none' }
      });
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) || !!(window as any).Capacitor;
      
      if (isMobile) {
        const base64Data = imgData.split(',')[1];
        const fileName = `ThanksTutor_Report_${Date.now()}.png`;
        
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents
        });
        
        alert("Image saved to Documents folder!");
      } else {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `ThanksTutor_Report_${Date.now()}.png`;
        link.click();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to export PNG");
    }
    setIsExporting(false);
  };

  const exportAsPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const el = reportRef.current;
      const width = el.scrollWidth;
      const height = el.scrollHeight;
      const imgData = await htmlToImage.toPng(el, { 
        pixelRatio: 2, 
        backgroundColor: '#1e1e1e',
        width: width,
        height: height,
        style: { margin: '0', padding: '24px', maxHeight: 'none', transform: 'none' }
      });
      
      const pdfWidth = width * 2;
      const pdfHeight = height * 2;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) || !!(window as any).Capacitor;
      
      if (isMobile) {
        const pdfDataUri = pdf.output('datauristring');
        const pdfBase64 = pdfDataUri.split(',')[1];
        const fileName = `ThanksTutor_Report_${Date.now()}.pdf`;
        
        await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents
        });
        
        alert("PDF saved to Documents folder!");
      } else {
        pdf.save(`ThanksTutor_Report_${Date.now()}.pdf`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to export PDF");
    }
    setIsExporting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[150] flex flex-col bg-black/90 backdrop-blur-sm p-4 sm:p-6"
        >
          <div className="flex-1 w-full flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex justify-end mb-4">
               <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition">
                 <X size={20} className="stroke-[2]" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar pb-6 flex justify-center items-start">
              {/* Report Canvas Area */}
              <div ref={reportRef} className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl shrink-0 h-fit">
                <div className="border-b border-white/5 pb-4 mb-4 text-center">
                  <h1 className="text-xl font-bold tracking-tight text-white/90 uppercase font-sans">Thanks English Tutor</h1>
                  <p className="text-xs text-[#00E5FF] mt-1 tracking-widest font-mono font-bold">PROGRESS REPORT</p>
                  <p className="text-[10px] text-gray-500 mt-2 font-mono">{new Date().toLocaleDateString()}</p>
                </div>
                
                <div className="space-y-6">
                  {sections.map((section, idx) => (
                    <div key={idx} className="space-y-2">
                       <h3 className="text-[11px] text-gray-400 uppercase font-bold tracking-widest border-l-2 border-[#00E5FF] pl-2">{section.title}</h3>
                       <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap pl-2 opacity-90">
                          {section.content}
                       </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-4 border-t border-white/5 text-center">
                   <p className="text-[9px] text-gray-600 uppercase tracking-widest">Generated by Thanks English Tutor AI</p>
                </div>
              </div>
            </div>
            
            {/* Export Action Bar */}
            <div className="mt-4 flex flex-col w-full max-w-sm mx-auto space-y-3 bg-[#121212]/80 backdrop-blur pb-8 p-4 rounded-3xl border border-white/5 shrink-0">
               <div className="flex items-center justify-center mb-2">
                 <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Export Report</p>
               </div>
               <div className="flex space-x-3">
                 <button 
                   onClick={exportAsPdf}
                   disabled={isExporting}
                   className="flex-1 flex items-center justify-center space-x-2 py-3 bg-[#2a2a2a] hover:bg-[#333] text-white rounded-xl shadow-lg border border-white/5 disabled:opacity-50 transition"
                 >
                   <FileText size={16} className="text-[#00E5FF]" />
                   <span className="text-sm font-bold">Save as PDF</span>
                 </button>
                 <button 
                   onClick={exportAsPng}
                   disabled={isExporting}
                   className="flex-1 flex items-center justify-center space-x-2 py-3 bg-[#2a2a2a] hover:bg-[#333] text-white rounded-xl shadow-lg border border-white/5 disabled:opacity-50 transition"
                 >
                   <ImageIcon size={16} className="text-[#00E5FF]" />
                   <span className="text-sm font-bold">Save as Image (PNG/JPEG)</span>
                 </button>
               </div>
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
