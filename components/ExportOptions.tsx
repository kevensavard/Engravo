"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, FileImage, FileCode, X } from "lucide-react";

interface ExportOptionsProps {
  imageUrl: string;
  filename: string;
  vectorizedSvgUrl?: string | null;
  onClose: () => void;
}

export default function ExportOptions({ imageUrl, filename, vectorizedSvgUrl, onClose }: ExportOptionsProps) {
  const [format, setFormat] = useState<"png" | "jpg" | "svg">("png");
  const [quality, setQuality] = useState(90);
  const [size, setSize] = useState<"original" | "custom">("original");
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(600);

  const downloadImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      let downloadUrl = URL.createObjectURL(blob);
      let downloadFilename = filename;
      
      // Handle different formats
      if (format === "jpg") {
        // Convert PNG to JPG using canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        
        img.onload = () => {
          // Set canvas size
          if (size === "custom") {
            canvas.width = customWidth;
            canvas.height = customHeight;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }
          
          // Draw white background for JPG
          ctx!.fillStyle = "#FFFFFF";
          ctx!.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw image
          ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convert to JPG
          canvas.toBlob((blob) => {
            if (blob) {
              downloadUrl = URL.createObjectURL(blob);
              downloadFilename = filename.replace(/\.(png|jpg|jpeg)$/i, `.jpg`);
              triggerDownload(downloadUrl, downloadFilename);
            }
          }, "image/jpeg", quality / 100);
        };
        
        img.src = imageUrl;
        return;
      } else if (format === "svg") {
        // If we have a vectorized SVG, use it directly
        if (vectorizedSvgUrl) {
          downloadUrl = vectorizedSvgUrl;
          downloadFilename = filename.replace(/\.(png|jpg|jpeg)$/i, `.svg`);
          triggerDownload(downloadUrl, downloadFilename);
          return;
        }
        
        // Otherwise, create a simple wrapper SVG (not recommended)
        alert("No vectorized version available. Please use the Vectorize tool first to create a proper SVG.");
        return;
      }
      
      // Default PNG download
      downloadFilename = filename.replace(/\.(jpg|jpeg)$/i, `.png`);
      triggerDownload(downloadUrl, downloadFilename);
      
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download image");
    }
  };

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="bg-[#1a1f2e] border border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold">Export Options</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Format Selection */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-300">Format</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={format === "png" ? "default" : "outline"}
            size="sm"
            onClick={() => setFormat("png")}
            className="flex items-center gap-2"
          >
            <FileImage className="w-4 h-4" />
            PNG
          </Button>
          <Button
            variant={format === "jpg" ? "default" : "outline"}
            size="sm"
            onClick={() => setFormat("jpg")}
            className="flex items-center gap-2"
          >
            <FileImage className="w-4 h-4" />
            JPG
          </Button>
          <Button
            variant={format === "svg" ? "default" : "outline"}
            size="sm"
            onClick={() => setFormat("svg")}
            disabled={!vectorizedSvgUrl}
            className="flex flex-col items-center gap-0.5 min-h-[2.5rem]"
            title={!vectorizedSvgUrl ? "Use Vectorize tool first to create SVG" : "Download vectorized SVG"}
          >
            <div className="flex items-center gap-1">
              <FileCode className="w-4 h-4" />
              <span>SVG</span>
            </div>
            {!vectorizedSvgUrl && <span className="text-[0.5rem] text-gray-400 leading-none">Vectorize first</span>}
          </Button>
        </div>
      </div>

      {/* Quality Setting (for JPG) */}
      {format === "jpg" && (
        <div className="space-y-2">
          <Label className="text-sm text-gray-300">Quality: {quality}%</Label>
          <input
            type="range"
            min="10"
            max="100"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* SVG Info */}
      {format === "svg" && !vectorizedSvgUrl && (
        <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-3">
          <p className="text-sm text-orange-300">
            <strong>SVG Export Not Available</strong>
          </p>
          <p className="text-xs text-orange-200/80 mt-1">
            Use the Vectorize tool first to create a proper vectorized version of your image. The SVG export will then be available here.
          </p>
        </div>
      )}

      {/* Size Options */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-300">Size</Label>
        <div className="flex gap-2">
          <Button
            variant={size === "original" ? "default" : "outline"}
            size="sm"
            onClick={() => setSize("original")}
            className="flex-1"
          >
            Original
          </Button>
          <Button
            variant={size === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setSize("custom")}
            className="flex-1"
          >
            Custom
          </Button>
        </div>
      </div>

      {/* Custom Size Inputs */}
      {size === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-400">Width</Label>
            <input
              type="number"
              value={customWidth}
              onChange={(e) => setCustomWidth(Number(e.target.value))}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white"
              min="1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400">Height</Label>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => setCustomHeight(Number(e.target.value))}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white"
              min="1"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={downloadImage}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Download {format.toUpperCase()}
        </Button>
      </div>
    </div>
  );
}
