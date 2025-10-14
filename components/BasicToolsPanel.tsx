"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ImageIcon,
  Maximize2,
  Crop,
  Zap,
  Palette,
} from "lucide-react";
import InteractiveCropTool from "./InteractiveCropTool";
import { CREDIT_COSTS } from "@/lib/credit-costs";
import { Star } from "lucide-react";

interface BasicToolsPanelProps {
  image: { url: string; width: number; height: number } | null;
  onProcess: (endpoint: string, options?: any) => void;
  onProcessColorCorrection: (options?: any) => void;
  onProcessWithCredits: (featureName: string, feature: any, endpoint: string, options?: any) => void;
  processing: boolean;
}

export default function BasicToolsPanel({
  image,
  onProcess,
  onProcessColorCorrection,
  onProcessWithCredits,
  processing,
}: BasicToolsPanelProps) {
  const [showCrop, setShowCrop] = useState(false);
  const [resizeWidth, setResizeWidth] = useState(image?.width || 800);
  const [resizeHeight, setResizeHeight] = useState(image?.height || 600);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);

  // Update resize dimensions when image changes
  useEffect(() => {
    if (image) {
      setResizeWidth(image.width);
      setResizeHeight(image.height);
    }
  }, [image]);

  // Calculate aspect ratio from original image
  const aspectRatio = image ? image.width / image.height : 1;

  // Update dimensions when keeping aspect ratio
  const handleWidthChange = (newWidth: number) => {
    setResizeWidth(newWidth);
    if (keepAspectRatio && image) {
      setResizeHeight(Math.round(newWidth / aspectRatio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setResizeHeight(newHeight);
    if (keepAspectRatio && image) {
      setResizeWidth(Math.round(newHeight * aspectRatio));
    }
  };

  return (
    <div className="space-y-6">
      {/* Grayscale */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
          <ImageIcon className="w-5 h-5" />
          <h3 className="font-semibold">Grayscale</h3>
        </div>
        <Button
          onClick={() => onProcess("grayscale")}
          disabled={processing}
          className="w-full bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800"
        >
          Convert to Grayscale
        </Button>
      </div>

      {/* Resize */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Maximize2 className="w-5 h-5" />
          <h3 className="font-semibold">Resize</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-400">Width</Label>
            <Input
              type="number"
              value={resizeWidth}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-400">Height</Label>
            <Input
              type="number"
              value={resizeHeight}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>
        <Button
          onClick={() => setKeepAspectRatio(!keepAspectRatio)}
          variant={keepAspectRatio ? "default" : "outline"}
          className="w-full"
        >
          {keepAspectRatio ? "🔒 Keep Aspect Ratio" : "🔓 Free Resize"}
        </Button>
        <Button
          onClick={() => onProcess("resize", { width: resizeWidth, height: resizeHeight })}
          disabled={processing}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          Apply Resize
        </Button>
      </div>

      {/* Crop */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Crop className="w-5 h-5" />
          <h3 className="font-semibold">Crop</h3>
        </div>
        {image && !showCrop && (
          <Button
            onClick={() => setShowCrop(true)}
            disabled={processing}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" />
            Interactive Crop ({CREDIT_COSTS.interactiveCrop} credit)
          </Button>
        )}
        {showCrop && image && (
          <div>
            <InteractiveCropTool
              imageUrl={image.url}
              onApply={(x, y, width, height) => {
                onProcessWithCredits("Interactive Crop", "interactiveCrop", "crop", { x, y, width, height });
                setShowCrop(false);
              }}
              disabled={processing}
            />
            <Button
              onClick={() => setShowCrop(false)}
              variant="outline"
              className="w-full mt-2"
            >
              Cancel Crop
            </Button>
          </div>
        )}
      </div>

      {/* Color Correction - Dark Modern Sliders */}
      <div className="space-y-4 p-4 rounded-xl bg-[#0d1117] border border-gray-800/50">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-sm">Color Adjust</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Star className="w-3 h-3" />
            <span>{CREDIT_COSTS.colorCorrection} credit</span>
          </div>
        </div>
        <div className="space-y-5">
          {/* Brightness */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-400">
                Brightness
              </Label>
              <span className="text-xs font-medium text-gray-300 bg-gray-800/70 px-2 py-0.5 rounded min-w-[45px] text-center">
                {brightness.toFixed(1)}
              </span>
            </div>
            <div className="relative">
              <Slider
                value={[brightness]}
                onValueChange={(v) => {
                  setBrightness(v[0]);
                  onProcessColorCorrection({ brightness: v[0], contrast, saturation });
                }}
                min={0.5}
                max={2}
                step={0.05}
                className="cursor-pointer [&_[role=slider]]:bg-gray-300 [&_[role=slider]]:border-gray-600 [&_.bg-primary]:bg-gray-600"
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Dark</span>
              <span>Light</span>
            </div>
          </div>

          {/* Contrast */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-400">
                Contrast
              </Label>
              <span className="text-xs font-medium text-gray-300 bg-gray-800/70 px-2 py-0.5 rounded min-w-[45px] text-center">
                {contrast.toFixed(1)}
              </span>
            </div>
            <div className="relative">
              <Slider
                value={[contrast]}
                onValueChange={(v) => {
                  setContrast(v[0]);
                  onProcessColorCorrection({ brightness, contrast: v[0], saturation });
                }}
                min={0.5}
                max={2}
                step={0.05}
                className="cursor-pointer [&_[role=slider]]:bg-gray-300 [&_[role=slider]]:border-gray-600 [&_.bg-primary]:bg-gray-600"
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Saturation */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-400">
                Saturation
              </Label>
              <span className="text-xs font-medium text-gray-300 bg-gray-800/70 px-2 py-0.5 rounded min-w-[45px] text-center">
                {saturation.toFixed(1)}
              </span>
            </div>
            <div className="relative">
              <Slider
                value={[saturation]}
                onValueChange={(v) => {
                  setSaturation(v[0]);
                  onProcessColorCorrection({ brightness, contrast, saturation: v[0] });
                }}
                min={0}
                max={2}
                step={0.05}
                className="cursor-pointer [&_[role=slider]]:bg-gray-300 [&_[role=slider]]:border-gray-600 [&_.bg-primary]:bg-gray-600"
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Grayscale</span>
              <span>Vibrant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sharpen */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Zap className="w-5 h-5" />
          <h3 className="font-semibold">Sharpen</h3>
        </div>
        <Button
          onClick={() => onProcessWithCredits("Sharpen", "sharpen", "sharpen")}
          disabled={processing}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 flex items-center justify-center gap-2"
        >
          <Star className="w-4 h-4" />
          Sharpen Image ({CREDIT_COSTS.sharpen} credit)
        </Button>
      </div>
    </div>
  );
}

