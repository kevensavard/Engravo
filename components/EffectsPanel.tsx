"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Paintbrush, Pencil, Camera, Sun, VolumeX, Star } from "lucide-react";
import { useState } from "react";
import { CREDIT_COSTS } from "@/lib/credit-costs";

interface EffectsPanelProps {
  onProcess: (endpoint: string, options?: any) => void;
  onProcessFromOriginal: (endpoint: string, options?: any) => void;
  onProcessWithCredits: (featureName: string, feature: any, endpoint: string, options?: any) => void;
  processing: boolean;
}

export default function EffectsPanel({
  onProcess,
  onProcessFromOriginal,
  onProcessWithCredits,
  processing,
}: EffectsPanelProps) {
  const [noiseStrength, setNoiseStrength] = useState(0.5);

  return (
    <div className="space-y-4">
      {/* Oil Painting */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white">
          <Paintbrush className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-sm">Oil Painting</h3>
        </div>
        <p className="text-xs text-gray-400">
          Textured painterly effect
        </p>
        <Button
          onClick={() => onProcessWithCredits("Oil Painting", "oilPainting", "oil-painting")}
          disabled={processing}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 flex items-center justify-center gap-2"
        >
          <Star className="w-4 h-4" />
          Apply Oil Painting ({CREDIT_COSTS.oilPainting} credits)
        </Button>
      </div>

      {/* Sketch */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white">
          <Pencil className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-sm">Sketch</h3>
        </div>
        <p className="text-xs text-gray-400">
          Pencil drawing effect
        </p>
        <Button
          onClick={() => onProcessWithCredits("Sketch", "sketch", "sketch")}
          disabled={processing}
          className="w-full bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 flex items-center justify-center gap-2"
        >
          <Star className="w-4 h-4" />
          Apply Sketch ({CREDIT_COSTS.sketch} credits)
        </Button>
      </div>

      {/* Vintage */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-sm">Vintage</h3>
        </div>
        <p className="text-xs text-gray-400">
          Retro film camera look
        </p>
        <Button
          onClick={() => onProcessWithCredits("Vintage", "vintage", "vintage")}
          disabled={processing}
          className="w-full bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-700 hover:to-amber-800 flex items-center justify-center gap-2"
        >
          <Star className="w-4 h-4" />
          Apply Vintage ({CREDIT_COSTS.vintage} credits)
        </Button>
      </div>

      {/* HDR */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white">
          <Sun className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-sm">HDR</h3>
        </div>
        <p className="text-xs text-gray-400">
          Dramatic high contrast
        </p>
        <Button
          onClick={() => onProcessWithCredits("HDR", "hdr", "hdr")}
          disabled={processing}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 flex items-center justify-center gap-2"
        >
          <Star className="w-4 h-4" />
          Apply HDR ({CREDIT_COSTS.hdr} credits)
        </Button>
      </div>

      {/* Noise Reduction */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white">
          <VolumeX className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-sm">Noise Reduction</h3>
        </div>
        <p className="text-xs text-gray-400">
          Reduce image noise and grain
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Strength: {Math.round(noiseStrength * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={noiseStrength}
            onChange={(e) => setNoiseStrength(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        <Button
          onClick={() => onProcess("noise-reduction", { strength: noiseStrength })}
          disabled={processing}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
        >
          Apply Noise Reduction
        </Button>
      </div>
    </div>
  );
}

