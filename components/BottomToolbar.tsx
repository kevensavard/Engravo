"use client";

import {
  ImageIcon,
  Layers,
  Sparkles,
  Crop,
  Type,
  Eraser,
  Mountain,
  ZoomIn,
  FileCode,
} from "lucide-react";

interface BottomToolbarProps {
  onToolSelect: (tool: string) => void;
  activeTool: string;
}

export default function BottomToolbar({ onToolSelect, activeTool }: BottomToolbarProps) {
  const tools = [
    { id: "basic", icon: ImageIcon, label: "Basic" },
    { id: "effects", icon: Sparkles, label: "Effects" },
    { id: "crop", icon: Crop, label: "Crop" },
    { id: "text", icon: Type, label: "Text" },
    { id: "remove-bg", icon: Eraser, label: "Remove BG" },
    { id: "depth-map", icon: Mountain, label: "Depth Map" },
    { id: "upscale", icon: ZoomIn, label: "Upscale" },
    { id: "vectorize", icon: FileCode, label: "Vectorize" },
    { id: "split", icon: Layers, label: "Split" },
  ];

  return (
    <div className="bg-[#1a1f2e] border-t border-gray-800/50 shadow-2xl">
      <div className="container mx-auto px-6 py-2">
        <div className="flex items-center justify-center gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => onToolSelect(tool.id)}
                className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

