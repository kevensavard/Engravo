"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shapes } from "lucide-react";

interface InteractiveMaskToolProps {
  imageUrl: string;
  onApply: (shape: string, x: number, y: number, width: number, height: number) => void;
  disabled: boolean;
}

export default function InteractiveMaskTool({
  imageUrl,
  onApply,
  disabled,
}: InteractiveMaskToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shape, setShape] = useState("circle");
  const [showCanvas, setShowCanvas] = useState(false);
  const [maskRect, setMaskRect] = useState({ x: 100, y: 100, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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
      
      // Center the mask
      setMaskRect({
        x: canvasWidth / 2 - 100,
        y: canvasHeight / 2 - 100,
        width: 200,
        height: 200,
      });
      
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

    // Draw semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear mask area
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#ffffff";

    if (shape === "circle") {
      const radius = Math.min(maskRect.width, maskRect.height) / 2;
      ctx.beginPath();
      ctx.arc(
        maskRect.x + maskRect.width / 2,
        maskRect.y + maskRect.height / 2,
        radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else if (shape === "rectangle") {
      ctx.fillRect(maskRect.x, maskRect.y, maskRect.width, maskRect.height);
    } else if (shape === "ellipse") {
      ctx.beginPath();
      ctx.ellipse(
        maskRect.x + maskRect.width / 2,
        maskRect.y + maskRect.height / 2,
        maskRect.width / 2,
        maskRect.height / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";

    // Draw border
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(maskRect.x, maskRect.y, maskRect.width, maskRect.height);

    // Draw handles
    const handleSize = 8;
    ctx.fillStyle = "#3b82f6";
    // Corners
    ctx.fillRect(maskRect.x - handleSize / 2, maskRect.y - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(maskRect.x + maskRect.width - handleSize / 2, maskRect.y - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(maskRect.x - handleSize / 2, maskRect.y + maskRect.height - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(maskRect.x + maskRect.width - handleSize / 2, maskRect.y + maskRect.height - handleSize / 2, handleSize, handleSize);
  };

  useEffect(() => {
    if (showCanvas) {
      drawCanvas();
    }
  }, [maskRect, shape, showCanvas]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on resize handle (bottom-right corner)
    const handleSize = 10;
    if (
      x >= maskRect.x + maskRect.width - handleSize &&
      x <= maskRect.x + maskRect.width + handleSize &&
      y >= maskRect.y + maskRect.height - handleSize &&
      y <= maskRect.y + maskRect.height + handleSize
    ) {
      setIsResizing(true);
      setDragStart({ x, y });
    }
    // Check if clicking inside mask
    else if (
      x >= maskRect.x &&
      x <= maskRect.x + maskRect.width &&
      y >= maskRect.y &&
      y <= maskRect.y + maskRect.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - maskRect.x, y: y - maskRect.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      setMaskRect({
        ...maskRect,
        x: x - dragStart.x,
        y: y - dragStart.y,
      });
    } else if (isResizing) {
      const newWidth = Math.max(50, x - maskRect.x);
      const newHeight = Math.max(50, y - maskRect.y);
      setMaskRect({
        ...maskRect,
        width: newWidth,
        height: newHeight,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleApply = () => {
    const actualX = Math.round(maskRect.x * scale);
    const actualY = Math.round(maskRect.y * scale);
    const actualWidth = Math.round(maskRect.width * scale);
    const actualHeight = Math.round(maskRect.height * scale);
    onApply(shape, actualX, actualY, actualWidth, actualHeight);
    setShowCanvas(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
        <Shapes className="w-5 h-5" />
        <h3 className="font-semibold">Shape Mask</h3>
      </div>

      {!showCanvas ? (
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-gray-700 dark:text-gray-300">Shape</Label>
            <Select value={shape} onValueChange={setShape}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="rectangle">Rectangle</SelectItem>
                <SelectItem value="ellipse">Ellipse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => setShowCanvas(true)}
            disabled={disabled}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            Position Mask on Image
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            Drag to move • Drag corner to resize
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
              Apply Mask
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

