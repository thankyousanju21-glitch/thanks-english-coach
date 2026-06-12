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
          className="absolute inset-0 z-[150] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="xp-window w-full max-w-md flex flex-col shadow-2xl">
            <div className="xp-titlebar">
              <div className="xp-titlebar-text">Session Report - Notepad</div>
              <div className="xp-controls">
                <button className="xp-control-btn xp-close-btn" onClick={onClose}>X</button>
              </div>
            </div>

            <div className="xp-titlebar bg-[#ece9d8] border-b border-white/40 flex items-center p-1" style={{background: '#ece9d8'}}>
               <span className="text-[11px] px-2 text-black cursor-default hover:bg-[#316ac5] hover:text-white" onClick={exportAsPdf}>Save As PDF</span>
               <span className="text-[11px] px-2 text-black cursor-default hover:bg-[#316ac5] hover:text-white" onClick={exportAsPng}>Save As PNG</span>
            </div>
            
            <div className="xp-body bg-white p-0">
              <div className="xp-inner-container h-64 border-none p-4" ref={reportRef}>
                <div className="border-b border-gray-300 pb-2 mb-2 text-left">
                  <h1 className="text-[14px] font-bold text-black uppercase font-mono">Thanks English Tutor</h1>
                  <p className="text-[11px] font-mono text-gray-700">PROGRESS REPORT - {new Date().toLocaleDateString()}</p>
                </div>
                
                <div className="space-y-4 text-black">
                  {sections.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                       <h3 className="text-[11px] uppercase font-bold tracking-widest">{section.title}</h3>
                       <div className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap pl-2">
                          {section.content}
                       </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-2 border-t border-gray-300 text-left">
                   <p className="text-[10px] text-gray-500 uppercase font-mono">Generated by Thanks English Tutor AI</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#ece9d8] p-2 flex justify-between items-center border-t border-[#7f9db9]">
               <span className="text-[11px] px-2">{isExporting ? "Exporting..." : "Ready."}</span>
               <button className="xp-button w-20" onClick={onClose}>Close</button>
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
