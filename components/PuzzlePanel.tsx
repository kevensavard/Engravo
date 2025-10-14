"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Puzzle, Star } from "lucide-react";
import { CREDIT_COSTS } from "@/lib/credit-costs";

interface PuzzlePanelProps {
  onProcess: (endpoint: string, options?: any) => void;
  onProcessWithCredits: (featureName: string, feature: any, endpoint: string, options?: any) => void;
  processing: boolean;
}

export default function PuzzlePanel({
  onProcess,
  onProcessWithCredits,
  processing,
}: PuzzlePanelProps) {
  const [pieces, setPieces] = useState(12);
  const [showNumbers, setShowNumbers] = useState(true);

  // Preset puzzle configurations (like the GitHub repo)
  const puzzlePresets = [
    { name: "Easy (12 pieces)", pieces: 12 },
    { name: "Medium (24 pieces)", pieces: 24 },
    { name: "Hard (48 pieces)", pieces: 48 },
    { name: "Expert (96 pieces)", pieces: 96 },
    { name: "Master (150 pieces)", pieces: 150 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
        <Puzzle className="w-5 h-5" />
        <h3 className="font-semibold">Jigsaw Puzzle Generator</h3>
      </div>

      {/* Preset Difficulty Levels */}
      <div>
        <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">
          Select Puzzle Size
        </Label>
        <div className="grid grid-cols-1 gap-2">
          {puzzlePresets.map((preset) => (
            <Button
              key={preset.name}
              variant={pieces === preset.pieces ? "default" : "outline"}
              size="sm"
              onClick={() => setPieces(preset.pieces)}
              className="justify-start text-xs"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Show Numbers Toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showNumbers"
          checked={showNumbers}
          onChange={(e) => setShowNumbers(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="showNumbers" className="text-sm text-gray-700 dark:text-gray-300">
          Show piece numbers
        </Label>
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => onProcessWithCredits("Jigsaw Puzzle", "jigsawPuzzle", "puzzle", { pieces, showNumbers })}
          disabled={processing}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 flex items-center justify-center gap-2"
        >
          <Star className="w-4 h-4" />
          Generate Jigsaw Puzzle ({CREDIT_COSTS.jigsawPuzzle} credits)
        </Button>
        
        <Button
          onClick={() => onProcess("puzzle-svg", { pieces, showNumbers })}
          disabled={processing}
          variant="outline"
          className="w-full border-blue-500 text-blue-500 hover:bg-blue-50 hover:border-blue-600 dark:hover:bg-gray-800"
        >
          Download SVG Template (Free)
        </Button>
      </div>
    </div>
  );
}

