"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Keyboard, 
  X, 
  Undo, 
  Redo, 
  Download, 
  Upload, 
  Copy, 
  ZoomIn, 
  ZoomOut,
  Eye,
  Maximize2
} from "lucide-react";

interface KeyboardLegendProps {
  isVisible: boolean;
  onToggle: () => void;
  activeTool: string;
}

export default function KeyboardLegend({ isVisible, onToggle, activeTool }: KeyboardLegendProps) {
  const [showLegend, setShowLegend] = useState(isVisible);

  useEffect(() => {
    setShowLegend(isVisible);
  }, [isVisible]);

  const shortcuts = [
    // General shortcuts
    { key: "Ctrl + Z", action: "Undo", icon: Undo, category: "general" },
    { key: "Ctrl + Y", action: "Redo", icon: Redo, category: "general" },
    { key: "Ctrl + S", action: "Download", icon: Download, category: "general" },
    { key: "Ctrl + O", action: "Upload", icon: Upload, category: "general" },
    { key: "Ctrl + E", action: "Export", icon: Download, category: "general" },
    { key: "Ctrl + D", action: "Duplicate", icon: Copy, category: "general" },
    { key: "Esc", action: "Close", icon: X, category: "general" },
    
    // View shortcuts
    { key: "Space", action: "Toggle Compare", icon: Eye, category: "view" },
    { key: "+", action: "Zoom In", icon: ZoomIn, category: "view" },
    { key: "-", action: "Zoom Out", icon: ZoomOut, category: "view" },
    { key: "F", action: "Fit to Screen", icon: Maximize2, category: "view" },
  ];

  const getShortcutsForCategory = (category: string) => {
    return shortcuts.filter(shortcut => shortcut.category === category);
  };

  if (!showLegend) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 bg-[#1a1f2e] border-gray-600 text-gray-300 hover:bg-gray-800 z-50"
        title="Show keyboard shortcuts"
      >
        <Keyboard className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-[#1a1f2e] border border-gray-600 rounded-lg shadow-2xl z-50 max-w-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white text-sm">Keyboard Shortcuts</h3>
          </div>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* General Shortcuts */}
          <div>
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              General
            </h4>
            <div className="space-y-1">
              {getShortcutsForCategory("general").map((shortcut, index) => {
                const Icon = shortcut.icon;
                return (
                  <div key={index} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-300">{shortcut.action}</span>
                    </div>
                    <kbd className="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                );
              })}
            </div>
          </div>

          {/* View Shortcuts */}
          <div>
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              View
            </h4>
            <div className="space-y-1">
              {getShortcutsForCategory("view").map((shortcut, index) => {
                const Icon = shortcut.icon;
                return (
                  <div key={index} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-300">{shortcut.action}</span>
                    </div>
                    <kbd className="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tool-specific shortcuts */}
          {activeTool && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Tool
              </h4>
              <div className="text-xs text-gray-400 italic">
                {activeTool === "crop" && "Click and drag to select area"}
                {activeTool === "text" && "Click to place text"}
                {activeTool === "basic" && "Use sliders to adjust settings"}
                {activeTool === "effects" && "Click buttons to apply effects"}
                {activeTool === "split" && "Select puzzle size and options"}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs">?</kbd> to toggle this legend
          </p>
        </div>
      </div>
    </div>
  );
}
