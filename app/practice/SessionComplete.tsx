"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { WordResult } from "./types";

type SessionCompleteProps = {
  results: WordResult[];
  currentLevel: number;
  onRestart: () => void;
};

export function SessionComplete({
  results,
  currentLevel,
  onRestart,
}: SessionCompleteProps) {
  const accuracy = Math.round(
    (results.filter((r) => r.correct).length / results.length) * 100,
  );
  const totalTime = Math.round(
    results.reduce((sum, r) => sum + r.timeSpent, 0),
  );
  const struggleWords = results.filter(
    (r) =>
      r.hesitationDetected ||
      r.backspaceCount > 3 ||
      !r.correct ||
      r.correctionsMade > 2,
  );
  const avgLetterAccuracy = Math.round(
    results.reduce((sum, r) => sum + r.letterAccuracy, 0) / results.length,
  );
  const totalCorrections = results.reduce(
    (sum, r) => sum + r.correctionsMade,
    0,
  );

  return (
    <>
      <Header />
      <main className="bg-gray-50 dark:bg-black min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
          <h1 className="text-3xl font-bold mb-6 text-center text-black dark:text-white">
            Session Complete!
          </h1>

          <div className="space-y-6">
            {/* Level Display */}
            <LevelDisplay
              currentLevel={currentLevel}
              accuracy={accuracy}
            />

            {/* Stats Grid */}
            <StatsGrid
              wordsCount={results.length}
              accuracy={accuracy}
              totalTime={totalTime}
              avgLetterAccuracy={avgLetterAccuracy}
            />

            {/* Corrections stat */}
            {totalCorrections > 0 && (
              <CorrectionsDisplay totalCorrections={totalCorrections} />
            )}

            {/* Struggle words */}
            {struggleWords.length > 0 && (
              <StruggleWordsDisplay struggleWords={struggleWords} />
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={onRestart}
                className="flex-1 py-4 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Practice Again
              </button>
              <Link
                href="/"
                className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-center text-xl font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function LevelDisplay({
  currentLevel,
  accuracy,
}: {
  currentLevel: number;
  accuracy: number;
}) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg border-2 border-purple-300 dark:border-purple-700">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Current Level
        </p>
        <p className="text-5xl font-bold text-purple-600 dark:text-purple-400">
          {currentLevel.toFixed(1)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {accuracy >= 85
            ? "Great job!"
            : accuracy >= 70
              ? "Keep practicing!"
              : "Take your time!"}
        </p>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${(currentLevel % 1) * 100}%` }}
        />
      </div>
      <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-2">
        Progress to Level {Math.ceil(currentLevel)}
      </p>
    </div>
  );
}

function StatsGrid({
  wordsCount,
  accuracy,
  totalTime,
  avgLetterAccuracy,
}: {
  wordsCount: number;
  accuracy: number;
  totalTime: number;
  avgLetterAccuracy: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        value={wordsCount}
        label="Words"
        colorClass="blue"
      />
      <StatCard
        value={`${accuracy}%`}
        label="Accuracy"
        colorClass="green"
      />
      <StatCard
        value={`${totalTime}s`}
        label="Time"
        colorClass="purple"
      />
      <StatCard
        value={`${avgLetterAccuracy}%`}
        label="First-Try"
        colorClass="yellow"
      />
    </div>
  );
}

function StatCard({
  value,
  label,
  colorClass,
}: {
  value: string | number;
  label: string;
  colorClass: "blue" | "green" | "purple" | "yellow";
}) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400",
    yellow:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400",
  };

  const [bgBorder, textColor] = colors[colorClass].split(" text-");

  return (
    <div className={`${bgBorder} p-4 rounded-lg border text-center`}>
      <p className={`text-2xl font-bold text-${textColor}`}>{value}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function CorrectionsDisplay({
  totalCorrections,
}: {
  totalCorrections: number;
}) {
  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800 text-center">
      <p className="text-lg">
        <span className="font-bold text-orange-600 dark:text-orange-400">
          {totalCorrections}
        </span>
        <span className="text-gray-600 dark:text-gray-400 ml-2">
          corrections made (backspaced to fix mistakes)
        </span>
      </p>
    </div>
  );
}

function StruggleWordsDisplay({
  struggleWords,
}: {
  struggleWords: WordResult[];
}) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <h2 className="text-xl font-bold mb-3 text-black dark:text-white">
        Words to Review
      </h2>
      <div className="flex flex-wrap gap-2">
        {struggleWords.map((r) => (
          <span
            key={r.wordId}
            className="px-3 py-1 bg-yellow-200 dark:bg-yellow-600/30 border border-yellow-300 dark:border-yellow-700 rounded-full text-sm font-mono text-yellow-900 dark:text-yellow-200"
          >
            {r.word}
            {r.correctionsMade > 0 && (
              <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">
                ({r.correctionsMade} fixes)
              </span>
            )}
          </span>
        ))}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
        These words will be added to your review bucket for extra practice
      </p>
    </div>
  );
}
