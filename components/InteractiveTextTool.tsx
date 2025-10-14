"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Type } from "lucide-react";

interface InteractiveTextToolProps {
  imageUrl: string;
  onApply: (text: string, x: number, y: number, fontSize: number, color: string) => void;
  disabled: boolean;
}

export default function InteractiveTextTool({
  imageUrl,
  onApply,
  disabled,
}: InteractiveTextToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("Your Text");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#000000");
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!showCanvas) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const maxWidth = 350;
      const maxHeight = 350;
      const imgAspect = img.width / img.height;
      
      let canvasWidth = maxWidth;
      let canvasHeight = maxWidth / imgAspect;
      
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * imgAspect;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      const scaleX = img.width / canvasWidth;
      const scaleY = img.height / canvasHeight;
      setScale(Math.max(scaleX, scaleY));
      
      imageRef.current = img;
      drawCanvas();
    };
  }, [imageUrl, showCanvas]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !imageRef.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.font = `${fontSize / scale}px Arial`;
    ctx.fillStyle = color;
    ctx.fillText(text, textPosition.x, textPosition.y);

    // Draw handle
    const textWidth = ctx.measureText(text).width;
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      textPosition.x - 5,
      textPosition.y - fontSize / scale,
      textWidth + 10,
      fontSize / scale + 10
    );
  };

  useEffect(() => {
    if (showCanvas) {
      drawCanvas();
    }
  }, [text, fontSize, color, textPosition, showCanvas]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setTextPosition({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTextPosition({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApply = () => {
    const actualX = Math.round(textPosition.x * scale);
    const actualY = Math.round(textPosition.y * scale);
    onApply(text, actualX, actualY, fontSize, color);
    setShowCanvas(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
        <Type className="w-5 h-5" />
        <h3 className="font-semibold">Add Text</h3>
      </div>

      {!showCanvas ? (
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-gray-700 dark:text-gray-300">Text</Label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1"
              placeholder="Enter your text"
            />
          </div>

          <div>
            <Label className="text-sm text-gray-700 dark:text-gray-300">
              Size: {fontSize}px
            </Label>
            <Slider
              value={[fontSize]}
              onValueChange={(v) => setFontSize(v[0])}
              min={12}
              max={120}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm text-gray-700 dark:text-gray-300">Color</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <Button
            onClick={() => setShowCanvas(true)}
            disabled={disabled || !text}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            Place Text on Image
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            Click where you want the text, then drag to reposition
          </div>

          <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="cursor-move mx-auto bg-gray-50 dark:bg-slate-900"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleApply}
              disabled={disabled}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              Apply Text
            </Button>
            <Button
              onClick={() => setShowCanvas(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

