"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, AlertTriangle, Check } from "lucide-react";

interface CreditConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  featureName: string;
  creditCost: number;
  currentCredits: number;
  onDontShowAgain: (checked: boolean) => void;
}

export default function CreditConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  featureName,
  creditCost,
  currentCredits,
  onDontShowAgain,
}: CreditConfirmationModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onDontShowAgain(dontShowAgain);
    onConfirm();
  };

  const handleDontShowAgainChange = (checked: boolean) => {
    setDontShowAgain(checked);
  };

  const hasEnoughCredits = currentCredits >= creditCost;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1f2e] border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-2 text-white mb-4">
          {hasEnoughCredits ? (
            <Star className="w-5 h-5 text-blue-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
          <h3 className="font-semibold text-lg">
            {hasEnoughCredits ? "Use Credits?" : "Insufficient Credits"}
          </h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            {hasEnoughCredits ? (
              <>
                This will use <span className="font-semibold text-blue-400">{creditCost} credit{creditCost > 1 ? 's' : ''}</span> to apply <span className="font-semibold text-white">{featureName}</span>.
              </>
            ) : (
              <>
                You need <span className="font-semibold text-red-400">{creditCost - currentCredits} more credit{creditCost - currentCredits > 1 ? 's' : ''}</span> to use <span className="font-semibold text-white">{featureName}</span>.
              </>
            )}
          </p>

          <div className="bg-gray-800 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Current Credits:</span>
              <span className="font-semibold text-white">{currentCredits}</span>
            </div>
            {hasEnoughCredits && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-400">After Use:</span>
                <span className="font-semibold text-blue-400">{currentCredits - creditCost}</span>
              </div>
            )}
          </div>

          {hasEnoughCredits && (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => handleDontShowAgainChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="dontShowAgain" className="text-sm text-gray-300 cursor-pointer">
                Don't show this confirmation again
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {hasEnoughCredits ? (
            <>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Use {creditCost} Credit{creditCost > 1 ? 's' : ''}
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => window.location.href = '/subscription'}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Get More Credits
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
