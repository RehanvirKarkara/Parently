import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ShieldAlert, X } from "lucide-react";

interface MedicalDisclaimerBannerProps {
  compact?: boolean;
  dismissible?: boolean;
  className?: string;
}

export function MedicalDisclaimerBanner({
  compact = false,
  dismissible = false,
  className = "",
}: MedicalDisclaimerBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 rounded-lg backdrop-blur-sm ${className}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="truncate">
            AI advice & health summaries are for reference only, not medical diagnosis.
          </span>
        </div>
        <Link
          to="/medical-disclaimer"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 underline font-medium hover:text-amber-900 dark:hover:text-amber-200 ml-1"
        >
          Disclaimer
        </Link>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="p-0.5 hover:bg-amber-500/20 rounded"
            aria-label="Dismiss banner"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden p-3.5 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-md shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
          <span className="font-semibold text-amber-800 dark:text-amber-300">
            Important Medical Notice:
          </span>{" "}
          Parently is a care-management platform designed for routine coordination and health tracking. It is{" "}
          <strong>not an emergency service</strong> and does not provide formal medical advice, diagnosis, or treatment. Always consult licensed healthcare providers for clinical decisions.
          <span className="block mt-1">
            <Link
              to="/medical-disclaimer"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline hover:text-amber-950 dark:hover:text-amber-100"
            >
              Read Full Medical Disclaimer & Clinical Safeguards &rarr;
            </Link>
          </span>
        </div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-amber-500/20 rounded-md text-amber-700 dark:text-amber-400"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
