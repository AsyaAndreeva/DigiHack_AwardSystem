"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

export type TourStep = {
    selector: string;
    content: string;
    title?: string;
};

export default function Tour({ steps, isOpen, onClose }: { steps: TourStep[], isOpen: boolean, onClose: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setCurrentStep(0);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        
        const updateRect = () => {
            const el = document.querySelector(steps[currentStep].selector);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setTargetRect(null);
            }
        };

        updateRect();
        window.addEventListener('resize', updateRect);
        
        const timeout = setTimeout(updateRect, 300);
        return () => {
            window.removeEventListener('resize', updateRect);
            clearTimeout(timeout);
        };
    }, [isOpen, currentStep, steps]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            <div className="absolute inset-0 bg-black/60 transition-all duration-300">
                {targetRect && (
                    <div 
                        className="absolute bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] rounded-lg transition-all duration-300 outline outline-4 outline-brand-yellow"
                        style={{
                            top: targetRect.top - 8,
                            left: targetRect.left - 8,
                            width: targetRect.width + 16,
                            height: targetRect.height + 16,
                        }}
                    />
                )}
            </div>

            {targetRect && (
                <div 
                    className="absolute bg-bg-main border-2 border-brand-yellow p-5 rounded-md shadow-2xl w-80 pointer-events-auto transition-all duration-300 flex flex-col gap-3 animate-in fade-in"
                    style={{
                        top: targetRect.bottom + 24 > window.innerHeight - 200 ? targetRect.top - 180 : targetRect.bottom + 24,
                        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 340)),
                    }}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-brand-yellow tracking-widest">{steps[currentStep].title || "Информация"}</span>
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <p className="text-sm text-white font-sans">{steps[currentStep].content}</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500 font-bold">{currentStep + 1} / {steps.length}</span>
                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <button onClick={() => setCurrentStep(prev => prev - 1)} className="p-2 bg-white/5 hover:bg-white/10 rounded text-white">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            )}
                            {currentStep < steps.length - 1 ? (
                                <button onClick={() => setCurrentStep(prev => prev + 1)} className="px-4 py-2 bg-brand-yellow text-brand-dark font-bold text-xs uppercase rounded flex items-center gap-1 hover:brightness-110 transition-colors">
                                    Напред <ChevronRight className="w-3 h-3" />
                                </button>
                            ) : (
                                <button onClick={onClose} className="px-5 py-2 bg-brand-orange text-brand-dark font-bold text-xs uppercase rounded hover:bg-[#e68d00] transition-colors">
                                    Готово
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
