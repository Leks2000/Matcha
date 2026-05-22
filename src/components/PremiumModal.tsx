import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Star, X, Check } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isPremium: boolean) => void;
}

const PLANS = [
  { id: 'week', name: '1 Week Trial', stars: 50, desc: 'unlimited swipes, 3 extra daily recommended matches' },
  { id: 'month', name: '1 Month Gold', stars: 150, desc: 'unlimited swipes, deep chemistry reports, profile badge', isPopular: true },
  { id: 'life', name: 'Lifetime Access', stars: 400, desc: 'all features forever, direct star priority matching' }
];

export default function PremiumModal({ isOpen, onClose, onSuccess }: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('month');
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPurchased(true);
      setTimeout(() => {
        onSuccess(true);
        onClose();
        setPurchased(false);
      }, 1500);
    }, 1100);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-[#F5F5F0]/85 backdrop-blur-md flex items-center justify-center p-4 select-none" id="premium-modal-root">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="bg-white border border-black/[0.04] rounded-[32px] max-w-sm w-full p-6 relative overflow-hidden text-[#1A1A1A] shadow-xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-[#6B7280] hover:text-[#1A1A1A] transition cursor-pointer"
            id="close-premium-btn"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          {!purchased ? (
            <div className="space-y-5">
              {/* Premium Logo Header */}
              <div className="text-center space-y-1.5 pt-2">
                <div className="mx-auto w-10 h-10 rounded-xl bg-[#E8F5EE] flex items-center justify-center text-[#1A7A55]">
                  <Crown className="h-5 w-5 fill-current" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#1A1A1A]">Upgrade with Pro Stars</h3>
                <p className="text-xs text-[#6B7280] font-semibold leading-relaxed">Elevate your energy signature on the network.</p>
              </div>

              {/* Benefit Tiers List */}
              <div className="space-y-2 bg-[#F5F5F0] border border-black/[0.02] p-4 rounded-2xl">
                {[
                  'Infinite swiping deck profiles',
                  'Vibe Compatibility Deep reports',
                  'Founder priority matching boosts (4x)',
                  'Custom verified profile badge'
                ].map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-[#1A1A1A]">
                    <Check className="h-4 w-4 text-[#1A7A55] stroke-[3px] shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Subscription Selector Plans */}
              <div className="space-y-2">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border flex items-center justify-between transition relative cursor-pointer ${
                      selectedPlan === p.id
                        ? 'bg-[#E8F5EE]/70 border-[#00C896]'
                        : 'bg-white border-black/[0.04] hover:bg-black/[0.01]'
                    }`}
                  >
                    {p.isPopular && (
                      <span className="absolute -top-2 right-4 bg-[#1A1A1A] text-white text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded uppercase">
                        Most Popular
                      </span>
                    )}
                    <div className="space-y-0.5">
                      <p className="font-bold text-[13px] text-[#1A1A1A]">{p.name}</p>
                      <p className="text-[11px] text-[#6B7280] max-w-[180px] leading-tight font-medium">{p.desc}</p>
                    </div>
                    {/* Stars visual representation */}
                    <div className="flex items-center gap-1 bg-white border border-black/[0.06] text-[#1D7E5A] font-bold text-xs px-2.5 py-1.5 rounded-xl shadow-sm">
                      <Star className="h-3 w-3 fill-current text-[#00C896]" />
                      <span>{p.stars}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Action purchase */}
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full py-4 bg-[#1A1A1A] text-white font-bold text-xs uppercase tracking-wider rounded-3xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md hover:bg-[#2A2A2A] active:scale-[0.98]"
                id="stars-checkout-btn"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Connecting Stars...</span>
                  </div>
                ) : (
                  <>
                    <span>ACQUIRE WITH TELEGRAM STARS</span>
                    <Star className="h-3.5 w-3.5 fill-current" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Celebration state */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-[#E8F5EE] text-[#1A7A55] flex items-center justify-center mx-auto shadow-sm">
                <Star className="h-7 w-7 fill-current" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#1A1A1A] text-base leading-tight">Stars Verified!</h4>
                <p className="text-xs text-[#6B7280] font-semibold">Pro features successfully unlocked on your Telegram profile.</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
