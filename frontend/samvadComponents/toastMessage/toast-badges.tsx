import React from "react";

/**
 * 12-point scalloped emerald badge with white checkmark matching reference Image 1
 */
export function SuccessBadge({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-sm">
        {/* Scalloped / rosette badge shape */}
        <path
          d="M12 2l1.6 1.7 2.3-.2 1 2.1 2.3.8.4 2.3 1.9 1.4-.5 2.3 1.3 2-1.2 2 .4 2.3-2.1 1.1-.6 2.2-2.3.3-1.5 1.8-2.2-.9-2.2.9-1.5-1.8-2.3-.3-.6-2.2-2.1-1.1.4-2.3-1.2-2 1.3-2-.5-2.3 1.9-1.4.4-2.3 2.3-.8 1-2.1 2.3.2L12 2z"
          fill="#10B981"
        />
        {/* Inner checkmark */}
        <path
          d="M8.5 12l2.3 2.3 4.7-4.7"
          stroke="white"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Rounded triangular badge with crisp exclamation mark matching reference Image 1 & 2
 */
export function ErrorBadge({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-sm">
        {/* Rounded triangle badge */}
        <path
          d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          fill="#EF4444"
        />
        {/* Exclamation mark */}
        <path
          d="M12 9v4m0 3.2h.01"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Orange circular badge with exclamation mark matching reference Image 2
 */
export function WarningBadge({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-sm">
        <circle cx="12" cy="12" r="10" fill="#F97316" />
        <path
          d="M12 7.5v5.5m0 3.2h.01"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Gray circular info badge with "i" matching reference Image 2
 */
export function InfoBadge({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-sm">
        <circle cx="12" cy="12" r="10" fill="#4B5563" />
        <path
          d="M12 11v5.5m0-7.7h.01"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
