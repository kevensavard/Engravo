"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Crop } from "lucide-react";

interface InteractiveCropToolProps {
  imageUrl: string;
  onApply: (x: number, y: number, width: number, height: number) => void;
  disabled: boolean;
}

export default function InteractiveCropTool({
  imageUrl,
  onApply,
  disabled,
}: InteractiveCropToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [endPos, setEndPos] = useState({ x: 0, y: 0 });
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to fit container while maintaining aspect ratio
      const maxWidth = 400;
      const maxHeight = 400;
      const imgAspect = img.width / img.height;
      
      let canvasWidth = maxWidth;
      let canvasHeight = maxWidth / imgAspect;
      
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * imgAspect;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Calculate scale for converting canvas coordinates to actual image coordinates
      const scaleX = img.width / canvasWidth;
      const scaleY = img.height / canvasHeight;
      setScale(Math.max(scaleX, scaleY));
      
      setImageDimensions({ width: img.width, height: img.height });
      imageRef.current = img;
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      setImageLoaded(true);
    };
  }, [imageUrl]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !imageRef.current) return;

    // Clear and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Draw semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate crop rectangle
    const x = Math.min(startPos.x, endPos.x);
    const y = Math.min(startPos.y, endPos.y);
    const width = Math.abs(endPos.x - startPos.x);
    const height = Math.abs(endPos.y - startPos.y);

    // Clear the crop area (show original image)
    if (width > 0 && height > 0) {
      ctx.clearRect(x, y, width, height);
      ctx.drawImage(
        imageRef.current,
        (x / canvas.width) * imageRef.current.width,
        (y / canvas.height) * imageRef.current.height,
        (width / canvas.width) * imageRef.current.width,
        (height / canvas.height) * imageRef.current.height,
        x,
        y,
        width,
        height
      );

      // Draw crop rectangle border
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw corner handles
      const handleSize = 8;
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(x + width - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(x - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(x + width - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking inside existing crop area
    const cropX = Math.min(startPos.x, endPos.x);
    const cropY = Math.min(startPos.y, endPos.y);
    const cropWidth = Math.abs(endPos.x - startPos.x);
    const cropHeight = Math.abs(endPos.y - startPos.y);

    if (
      cropWidth > 0 &&
      x >= cropX &&
      x <= cropX + cropWidth &&
      y >= cropY &&
      y <= cropY + cropHeight
    ) {
      // Start dragging existing crop
      setIsDragging(true);
      setDragOffset({ x: x - cropX, y: y - cropY });
    } else {
      // Start drawing new crop
      setIsDrawing(true);
      setStartPos({ x, y });
      setEndPos({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing) {
      setEndPos({ x, y });
      drawCanvas();
    } else if (isDragging) {
      const cropWidth = Math.abs(endPos.x - startPos.x);
      const cropHeight = Math.abs(endPos.y - startPos.y);
      
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;
      
      setStartPos({ x: newX, y: newY });
      setEndPos({ x: newX + cropWidth, y: newY + cropHeight });
      drawCanvas();
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing && !isDragging) return;
    setIsDrawing(false);
    setIsDragging(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate actual crop coordinates in image space
    const x = Math.min(startPos.x, endPos.x);
    const y = Math.min(startPos.y, endPos.y);
    const width = Math.abs(endPos.x - startPos.x);
    const height = Math.abs(endPos.y - startPos.y);

    if (width > 10 && height > 10) {
      // Convert canvas coordinates to actual image coordinates
      const actualX = Math.round((x / canvas.width) * imageDimensions.width);
      const actualY = Math.round((y / canvas.height) * imageDimensions.height);
      const actualWidth = Math.round((width / canvas.width) * imageDimensions.width);
      const actualHeight = Math.round((height / canvas.height) * imageDimensions.height);

      setCropRect({
        x: actualX,
        y: actualY,
        width: actualWidth,
        height: actualHeight,
      });
    }
  };

  const handleApply = () => {
    if (cropRect.width > 0 && cropRect.height > 0) {
      onApply(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
    }
  };

  const handleReset = () => {
    setStartPos({ x: 0, y: 0 });
    setEndPos({ x: 0, y: 0 });
    setCropRect({ x: 0, y: 0, width: 0, height: 0 });
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas && imageRef.current) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Crop className="w-4 h-4" />
        <h3 className="font-medium">Interactive Crop</h3>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          🎯 Drag to draw crop area • Click inside to move it
        </div>

        <div className="border rounded overflow-hidden bg-gray-100 dark:bg-gray-900">
          <canvas
            ref={canvasRef}
            className="cursor-crosshair mx-auto"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {cropRect.width > 0 && (
          <div className="text-xs text-gray-500 space-y-1">
            <div>Position: ({cropRect.x}, {cropRect.y})</div>
            <div>Size: {cropRect.width} × {cropRect.height}px</div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleApply}
            disabled={disabled || cropRect.width === 0}
            className="flex-1"
          >
            Apply Crop
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={disabled}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

