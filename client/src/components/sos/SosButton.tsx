import React, { useState, useCallback } from "react";
import { Siren, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SosButtonProps {
  onActivate: () => void | Promise<void>;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  className?: string;
}

export function SosButton({
  onActivate,
  size = "lg",
  disabled = false,
  loading = false,
  success = false,
  className,
}: SosButtonProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const sizeClasses = {
    sm: "w-20 h-20 text-lg",
    md: "w-28 h-28 text-xl",
    lg: "w-40 h-40 text-2xl",
  };

  const startHover = useCallback(() => {
    if (disabled || loading || success) return;
    setHeld(true);
    setCountdown(3);

    let count = 3;
    timerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setCountdown(null);
        setHeld(false);
        onActivate();
      }
    }, 1000);
  }, [disabled, loading, success, onActivate]);

  const cancelHover = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHeld(false);
    setCountdown(null);
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="sos-button-container">
        {/* Ripple rings */}
        {!success && !loading && (
          <>
            <div className="sos-button-ring-2" />
            <div className="sos-button-ring" />
          </>
        )}

        <button
          onMouseEnter={startHover}
          onMouseLeave={cancelHover}
          onTouchStart={startHover}
          onTouchEnd={cancelHover}
          disabled={disabled || loading}
          className={cn(
            "relative rounded-full font-black tracking-wider flex flex-col items-center justify-center gap-1 transition-all duration-200 select-none",
            "border-4 shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-500/50",
            sizeClasses[size],
            success
              ? "bg-green-500 border-green-400 text-white scale-95"
              : held
              ? "bg-red-700 border-red-500 text-white scale-95 shadow-red-500/50"
              : "gradient-sos border-red-400 text-white sos-pulse hover:scale-105",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ boxShadow: held ? "0 0 0 8px rgba(239,68,68,0.3), 0 20px 60px rgba(239,68,68,0.4)" : undefined }}
        >
          {loading ? (
            <Loader2 className="w-10 h-10 animate-spin" />
          ) : success ? (
            <>
              <CheckCircle className="w-10 h-10" />
              <span className="text-xs font-bold">SENT!</span>
            </>
          ) : countdown !== null ? (
            <>
              <span className="text-5xl font-black">{countdown}</span>
              <span className="text-xs">SENDING…</span>
            </>
          ) : (
            <>
              <Siren className="w-10 h-10" />
              <span className="text-sm font-black">SOS</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center">
        {success ? (
          <p className="text-green-600 font-semibold text-sm flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Emergency request sent!
          </p>
        ) : held ? (
          <p className="text-red-500 font-semibold text-sm animate-pulse">
            Hovering… activating in {countdown}s
          </p>
        ) : (
          <p className="text-muted-foreground text-xs font-semibold">
            Hover mouse for 3 seconds to trigger SOS
          </p>
        )}
      </div>

      {!success && !held && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>Only for real emergencies. Location will be shared.</span>
        </div>
      )}
    </div>
  );
}
