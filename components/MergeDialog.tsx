"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type MergeDialogProps = {
  anonymousData: {
    totalWords: number;
    currentLevel: number;
    struggleWordsCount: number;
  };
  accountData: {
    totalWords: number;
    currentLevel: number;
  };
  onMerge: (useHigherLevel: boolean) => void;
  onDiscard: () => void;
};

export function MergeDialog({
  anonymousData,
  accountData,
  onMerge,
  onDiscard,
}: MergeDialogProps) {
  const [useAccountLevel, setUseAccountLevel] = useState(true);

  const mergedWords = anonymousData.totalWords + accountData.totalWords;

  return (
    <div className="max-w-lg w-full mx-auto bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        We found practice data on this device
      </h2>

      {/* Side by side comparison */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            This Device
          </h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Level {anonymousData.currentLevel.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {anonymousData.totalWords} words practiced
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {anonymousData.struggleWordsCount} struggle words
          </p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">
            Your Account
          </h3>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            Level {accountData.currentLevel.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {accountData.totalWords} words practiced
          </p>
        </div>
      </div>

      {/* What happens when you merge */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          What happens when you merge:
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>
            <span className="font-medium">Words:</span> {anonymousData.totalWords} + {accountData.totalWords} = {mergedWords} total
          </li>
          <li>
            <span className="font-medium">Level:</span> Your choice below
          </li>
          <li>
            <span className="font-medium">Struggle words:</span> Combined from both
          </li>
        </ul>
      </div>

      {/* Level choice */}
      <div className="mb-6 space-y-2">
        <Label
          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          onClick={() => setUseAccountLevel(true)}
        >
          <input
            type="radio"
            name="levelChoice"
            checked={useAccountLevel}
            onChange={() => setUseAccountLevel(true)}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-gray-700 dark:text-gray-300">
            Use account level ({accountData.currentLevel.toFixed(1)})
          </span>
        </Label>
        <Label
          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          onClick={() => setUseAccountLevel(false)}
        >
          <input
            type="radio"
            name="levelChoice"
            checked={!useAccountLevel}
            onChange={() => setUseAccountLevel(false)}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-gray-700 dark:text-gray-300">
            Use device level ({anonymousData.currentLevel.toFixed(1)})
          </span>
        </Label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => onMerge(useAccountLevel)}
          className="flex-1"
          size="lg"
        >
          Merge Data
        </Button>
        <Button
          onClick={onDiscard}
          variant="secondary"
          className="flex-1"
          size="lg"
        >
          Discard & Keep Account
        </Button>
      </div>
    </div>
  );
}
