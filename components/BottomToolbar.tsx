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
      <div className="w-full px-1 sm:px-2 md:px-4 lg:px-6 py-0.5 sm:py-1 md:py-2">
        <div className="flex items-center justify-center gap-0.5 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            
            const isVectorize = tool.id === "vectorize";
            
            return (
              <button
                key={tool.id}
                onClick={() => !isVectorize && onToolSelect(tool.id)}
                disabled={isVectorize}
                className={`flex flex-col items-center justify-center px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 lg:py-2.5 rounded-lg transition-all flex-shrink-0 min-w-[50px] sm:min-w-[60px] md:min-w-[70px] lg:min-w-[80px] ${
                  isVectorize
                    ? "opacity-50 cursor-not-allowed text-gray-500"
                    : isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`}
              >
                <Icon className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 mb-0.5" />
                <span className="text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-medium leading-tight text-center">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

