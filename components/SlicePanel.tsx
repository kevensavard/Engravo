"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Grid3X3, Download, Star } from "lucide-react";
import { CREDIT_COSTS } from "@/lib/credit-costs";

interface SlicePanelProps {
  image: { url: string } | null;
  onProcess: (endpoint: string, options?: any) => Promise<void>;
  onProcessWithCredits: (featureName: string, feature: any, endpoint: string, options?: any) => void;
  processing: boolean;
}

export default function SlicePanel({
  image,
  onProcess,
  onProcessWithCredits,
  processing,
}: SlicePanelProps) {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [slices, setSlices] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);

  const handleSlice = async () => {
    if (!image) return;

    try {
      const response = await fetch("/api/slice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: image.url,
          rows,
          cols,
        }),
      });

      if (!response.ok) throw new Error("Slice failed");

      const data = await response.json();
      setSlices(data.slices || []);
      setShowDialog(true);
    } catch (error) {
      console.error("Error slicing image:", error);
      alert("Failed to slice image");
    }
  };

  const downloadSlice = (url: string, index: number) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `slice-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    slices.forEach((url, index) => {
      setTimeout(() => {
        downloadSlice(url, index);
      }, index * 200);
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Grid3X3 className="w-5 h-5" />
          <h3 className="font-semibold">Slice Image</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm text-gray-700 dark:text-gray-300">Rows</Label>
            <Input
              type="number"
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              min={1}
              max={10}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-700 dark:text-gray-300">Columns</Label>
            <Input
              type="number"
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              min={1}
              max={10}
              className="mt-1"
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          Will create {rows * cols} pieces
        </div>

        <Button
          onClick={() => onProcessWithCredits("Slice Images", "sliceImages", "slice", { rows, cols })}
          disabled={processing}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 flex items-center justify-center gap-2"
        >
          <Star className="w-4 h-4" />
          Slice Image ({CREDIT_COSTS.sliceImages} credits)
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Sliced Images ({slices.length} pieces)</span>
              <Button
                onClick={downloadAll}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {slices.map((url, index) => (
              <div
                key={index}
                className="group relative bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden"
              >
                <img
                  src={url}
                  alt={`Slice ${index + 1}`}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    onClick={() => downloadSlice(url, index)}
                    size="sm"
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
                <div className="absolute top-2 left-2 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded text-xs font-semibold">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

