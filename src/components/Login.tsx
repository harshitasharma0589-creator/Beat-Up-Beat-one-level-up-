import React, { useState } from "react";
import { motion } from "motion/react";
import { Disc, Sparkles, ShieldCheck } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (email: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const targetEmail = "harshitasharma0589@gmail.com";

  const handleGoogleLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess(targetEmail);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="bg-white border-2 border-pink-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
      id="login-panel"
    >
      {/* Decorative Waving Gradients in Pink, Orange, White */}
      <div className="absolute -right-16 -top-16 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute -left-16 -bottom-16 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl -z-10" />

      {/* Main Logo & Title */}
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex relative p-4 bg-gradient-to-tr from-pink-500 to-orange-500 text-white rounded-2xl shadow-lg shadow-pink-200">
          <Disc className="w-8 h-8 animate-spin" style={{ animationDuration: "5s" }} />
          <div className="absolute -bottom-1 -right-1 bg-white text-pink-600 rounded-full p-1 border border-pink-100 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>
        
        <div className="space-y-1">
          <h1 className="text-2xl font-black bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent tracking-tight">
            BEAT UP
          </h1>
          <p className="text-[11px] font-bold text-pink-600 tracking-widest uppercase font-mono">
            Beat one level up
          </p>
        </div>

        <p className="text-xs text-stone-500 max-w-xs mx-auto">
          The ultimate dynamic voice-remix task engine. Connect your account to personalize your timeline, optimize critical paths, and block out distractions.
        </p>
      </div>

      <div className="space-y-4">
        {/* Pre-filled Account Card */}
        <div className="p-4 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Mock Google colored Avatar */}
            <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 font-bold flex items-center justify-center text-xs border border-pink-200 uppercase">
              HS
            </div>
            <div className="text-left">
              <span className="text-[9px] font-mono font-black text-stone-400 block uppercase leading-none">Pre-authorized Account</span>
              <span className="text-xs font-black text-stone-900 mt-0.5 block">{targetEmail}</span>
            </div>
          </div>
          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase">
            Ready
          </span>
        </div>

        {/* Continue with Google button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleGoogleLogin}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-pink-100 transition cursor-pointer flex items-center justify-center gap-2.5 border-b-4 border-black/10 active:border-b-0 active:translate-y-[4px]"
          id="google-login-button"
        >
          {isSubmitting ? (
            <>
              <Disc className="w-4 h-4 animate-spin" />
              <span>Connecting to Google Account...</span>
            </>
          ) : (
            <>
              {/* Custom flat Google colored icon */}
              <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.7L19.1 3.3C17.2 1.6 14.8.6 12.24.6c-5.7 0-10.4 4.7-10.4 10.4s4.7 10.4 10.4 10.4c6 0 9.9-4.2 9.9-10.1 0-.7-.1-1.3-.2-1.9H12.24z"/>
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-6 text-center">
        <span className="text-[9px] font-mono text-stone-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          Secure SSO connection active
        </span>
      </div>
    </motion.div>
  );
}
