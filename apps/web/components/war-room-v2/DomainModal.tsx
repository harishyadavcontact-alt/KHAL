import React from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AppData, Domain } from './types';

interface DomainModalProps {
  selectedDomain: Domain | null;
  data: AppData;
  onClose: () => void;
  onOpenAffair: (id: string) => void;
}

export function DomainModal({ selectedDomain, data, onClose, onOpenAffair }: DomainModalProps) {
  return (
    <AnimatePresence>
      {selectedDomain && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl relative z-10 flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h2 className="text-2xl font-bold">{selectedDomain.name}</h2>
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">{selectedDomain.volatilitySource}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full">
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="space-y-6">
                  <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                    <div className="text-[10px] text-zinc-500 mb-1 uppercase">Volatility Source</div>
                    <div className="text-sm font-medium text-zinc-200">{selectedDomain.volatilitySource}</div>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="text-[10px] text-blue-400 mb-1 uppercase">Associated Law</div>
                    <div className="text-sm font-medium text-blue-400">{data.laws.find((l) => l.id === selectedDomain.lawId)?.name}</div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <h4 className="text-xs font-mono uppercase text-zinc-500 mb-4 tracking-widest">Active Affairs in this Domain</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {data.affairs
                      .filter((a) => a.context.associatedDomains.includes(selectedDomain.id))
                      .map((a) => (
                        <div key={a.id} className="p-4 bg-zinc-800/50 rounded-xl border border-white/5 flex justify-between items-center">
                          <div>
                            <div className="font-bold">{a.title}</div>
                            <div className="text-xs text-zinc-500 uppercase">{a.status}</div>
                          </div>
                          <button onClick={() => onOpenAffair(a.id)} className="text-xs font-bold text-blue-400 hover:text-blue-300">
                            OPEN CHAMBER
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
