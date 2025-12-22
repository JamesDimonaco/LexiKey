"use client";

type RevealButtonProps = {
  isRevealed: boolean;
  isPermanent: boolean;
  progress: number; // 0-100
  nextDuration: number | null; // ms, null = permanent
  onToggle: () => void;
};

export function RevealButton({
  isRevealed,
  isPermanent,
  progress,
  nextDuration,
  onToggle,
}: RevealButtonProps) {
  const getButtonText = () => {
    if (isRevealed) return "Hide";
    if (nextDuration === null) return "Reveal";
    return `Reveal (${nextDuration / 1000}s)`;
  };

  const isTimed = isRevealed && !isPermanent;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`
        relative overflow-hidden px-4 py-2 rounded-lg font-medium transition-colors
        ${isRevealed
          ? "bg-yellow-200 dark:bg-yellow-600/40 text-yellow-800 dark:text-yellow-200"
          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
        }
      `}
    >
      {/* Progress bar - shrinks from right to left */}
      {(isTimed || isPermanent) && (
        <div
          className="absolute inset-0 bg-yellow-300 dark:bg-yellow-500/50 transition-all duration-50 ease-linear"
          style={{ width: `${progress}%` }}
        />
      )}

      <span className="relative z-10">{getButtonText()}</span>
    </button>
  );
}
