"use client";

type RevealButtonProps = {
  wordRevealed: boolean;
  revealTimeRemaining: number | null; // ms remaining, -1 for permanent, null for hidden
  revealCount: number;
  onReveal: () => void;
  onRefocus: () => void;
};

export function RevealButton({
  wordRevealed,
  revealTimeRemaining,
  revealCount,
  onReveal,
  onRefocus,
}: RevealButtonProps) {
  // Calculate progress percentage for the shrinking bar
  const getProgress = () => {
    if (revealTimeRemaining === null) return 0;
    if (revealTimeRemaining === -1) return 100; // Permanent
    // Calculate based on current reveal duration (1s or 2s)
    const totalDuration = revealCount * 1000;
    return (revealTimeRemaining / totalDuration) * 100;
  };

  // Get button text
  const getButtonText = () => {
    if (wordRevealed) {
      return "Hide";
    }
    // Show next duration hint
    if (revealCount === 0) return "Reveal (1s)";
    if (revealCount === 1) return "Reveal (2s)";
    return "Reveal";
  };

  const progress = getProgress();
  const isPermanent = revealTimeRemaining === -1;
  const isTimed = wordRevealed && !isPermanent;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onReveal();
        onRefocus();
      }}
      className={`
        relative overflow-hidden px-4 py-2 rounded-lg font-medium transition-colors
        ${wordRevealed
          ? "bg-yellow-200 dark:bg-yellow-600/40 text-yellow-800 dark:text-yellow-200"
          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
        }
      `}
    >
      {/* Progress bar background - shrinks from right to left */}
      {isTimed && (
        <div
          className="absolute inset-0 bg-yellow-300 dark:bg-yellow-500/50 transition-all duration-50 ease-linear"
          style={{
            width: `${progress}%`,
            right: 0,
            left: "auto",
          }}
        />
      )}

      {/* Permanent indicator */}
      {isPermanent && (
        <div className="absolute inset-0 bg-yellow-300 dark:bg-yellow-500/50" />
      )}

      {/* Button text */}
      <span className="relative z-10">{getButtonText()}</span>
    </button>
  );
}
