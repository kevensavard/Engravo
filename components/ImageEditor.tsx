"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  Download,
  Image as ImageIcon,
  Crop,
  Type,
  Puzzle,
  Shapes,
  Grid3X3,
  Eraser,
  Sparkles,
  ZoomIn,
  FileCode,
  Palette,
  Zap,
  Mountain,
  ArrowLeftRight,
} from "lucide-react";
import InteractiveCropTool from "./InteractiveCropTool";

interface ImageState {
  url: string;
  filename: string;
  width: number;
  height: number;
}

export default function ImageEditor() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState<ImageState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showComparison, setShowComparison] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setProcessing(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const newImage: ImageState = {
        url: data.url,
        filename: data.filename,
        width: data.width,
        height: data.height,
      };

      setImage(newImage);
      setOriginalImage(newImage);
      setHistory([newImage]);
      setHistoryIndex(0);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setProcessing(false);
    }
  }, []);

  const processImage = useCallback(
    async (endpoint: string, options: Record<string, any> = {}) => {
      if (!image) return;

      setProcessing(true);
      try {
        const response = await fetch(`/api/${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: image.url,
            ...options,
          }),
        });

        if (!response.ok) throw new Error(`Processing failed: ${endpoint}`);

        const data = await response.json();
        const newImage: ImageState = {
          url: data.url,
          filename: data.filename,
          width: data.width || image.width,
          height: data.height || image.height,
        };

        // Add to history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newImage);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setImage(newImage);
      } catch (error) {
        console.error(`Error processing image (${endpoint}):`, error);
        alert(`Failed to process image: ${endpoint}`);
      } finally {
        setProcessing(false);
      }
    },
    [image, history, historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setImage(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setImage(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const downloadImage = useCallback(() => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image.url;
    a.download = image.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [image]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      {/* Upload Section */}
      {!image ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Upload className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Upload an Image</h2>
          <p className="text-gray-500 mb-4">
            Support for JPG, PNG, and other common formats
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            {processing ? "Uploading..." : "Choose Image"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Toolbar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0 || processing}
              >
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1 || processing}
              >
                Redo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                disabled={processing || historyIndex === 0}
              >
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                {showComparison ? "Hide" : "Compare"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadImage}
                disabled={processing}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="effects">Effects</TabsTrigger>
              </TabsList>

              {/* Basic Tools */}
              <TabsContent value="basic" className="space-y-4">
                <ToolSection
                  title="Grayscale"
                  icon={<ImageIcon className="w-4 h-4" />}
                  onApply={() => processImage("grayscale")}
                  disabled={processing}
                />

                <ResizeTool onApply={(width, height) => processImage("resize", { width, height })} disabled={processing} />

                {image && (
                  <InteractiveCropTool 
                    imageUrl={image.url}
                    onApply={(x, y, width, height) => processImage("crop", { x, y, width, height })} 
                    disabled={processing} 
                  />
                )}

                <ColorCorrectionTool onApply={(params) => processImage("color-correct", params)} disabled={processing} />

                <ToolSection
                  title="Sharpen"
                  icon={<Zap className="w-4 h-4" />}
                  onApply={() => processImage("sharpen")}
                  disabled={processing}
                />
              </TabsContent>

              {/* Advanced Tools */}
              <TabsContent value="advanced" className="space-y-4">
                <TextTool onApply={(params) => processImage("add-text", params)} disabled={processing} />

                <MaskShapeTool onApply={(params) => processImage("mask-shape", params)} disabled={processing} />

                <SliceTool onApply={(rows, cols) => processImage("slice", { rows, cols })} disabled={processing} />

                <PuzzleTool onApply={(params) => processImage("puzzle", params)} disabled={processing} />
              </TabsContent>

              {/* Effects Tools */}
              <TabsContent value="effects" className="space-y-4">
                <ToolSection
                  title="Remove Background"
                  icon={<Eraser className="w-4 h-4" />}
                  onApply={() => processImage("remove-bg")}
                  disabled={processing}
                />

                <ToolSection
                  title="Cartoonize"
                  icon={<Sparkles className="w-4 h-4" />}
                  onApply={() => processImage("cartoonize")}
                  disabled={processing}
                />

                <UpscaleTool onApply={(scale) => processImage("upscale", { scale })} disabled={processing} />

                <ToolSection
                  title="Vectorize (SVG)"
                  icon={<FileCode className="w-4 h-4" />}
                  onApply={() => processImage("vectorize")}
                  disabled={processing}
                />

                <DepthMapTool onApply={(detail) => processImage("depth-map", { detail })} disabled={processing} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-center min-h-[500px]">
              {processing ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Processing...</p>
                </div>
              ) : showComparison && originalImage ? (
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="flex flex-col items-center">
                    <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Original</div>
                    <img
                      src={originalImage.url}
                      alt="Original"
                      className="max-w-full max-h-[500px] object-contain border-2 border-gray-300 dark:border-gray-600 rounded"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Edited</div>
                    <img
                      src={image.url}
                      alt="Edited"
                      className="max-w-full max-h-[500px] object-contain border-2 border-blue-500 rounded"
                    />
                  </div>
                </div>
              ) : (
                <img
                  src={image.url}
                  alt="Preview"
                  className="max-w-full max-h-[600px] object-contain"
                />
              )}
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {showComparison ? (
                <div className="flex justify-between">
                  <span>Original: {originalImage?.width} x {originalImage?.height}px</span>
                  <span>Current: {image.width} x {image.height}px</span>
                </div>
              ) : (
                <span>Dimensions: {image.width} x {image.height}px</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components

function ToolSection({
  title,
  icon,
  onApply,
  disabled,
}: {
  title: string;
  icon: React.ReactNode;
  onApply: () => void;
  disabled: boolean;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-medium">{title}</h3>
        </div>
        <Button onClick={onApply} disabled={disabled} size="sm">
          Apply
        </Button>
      </div>
    </div>
  );
}

function ResizeTool({ onApply, disabled }: { onApply: (width: number, height: number) => void; disabled: boolean }) {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <ZoomIn className="w-4 h-4" />
        <h3 className="font-medium">Resize</h3>
      </div>
      <div className="space-y-2">
        <div>
          <Label htmlFor="width">Width (px)</Label>
          <Input
            id="width"
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="height">Height (px)</Label>
          <Input
            id="height"
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </div>
        <Button onClick={() => onApply(width, height)} disabled={disabled} className="w-full">
          Apply
        </Button>
      </div>
    </div>
  );
}


function ColorCorrectionTool({ onApply, disabled }: { onApply: (params: any) => void; disabled: boolean }) {
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-4 h-4" />
        <h3 className="font-medium">Color Correction</h3>
      </div>
      <div className="space-y-3">
        <div>
          <Label>Brightness: {brightness.toFixed(2)}</Label>
          <Slider
            value={[brightness]}
            onValueChange={(v) => setBrightness(v[0])}
            min={0.5}
            max={2}
            step={0.1}
          />
        </div>
        <div>
          <Label>Contrast: {contrast.toFixed(2)}</Label>
          <Slider
            value={[contrast]}
            onValueChange={(v) => setContrast(v[0])}
            min={0.5}
            max={2}
            step={0.1}
          />
        </div>
        <div>
          <Label>Saturation: {saturation.toFixed(2)}</Label>
          <Slider
            value={[saturation]}
            onValueChange={(v) => setSaturation(v[0])}
            min={0}
            max={2}
            step={0.1}
          />
        </div>
        <Button onClick={() => onApply({ brightness, contrast, saturation })} disabled={disabled} className="w-full">
          Apply
        </Button>
      </div>
    </div>
  );
}

function TextTool({ onApply, disabled }: { onApply: (params: any) => void; disabled: boolean }) {
  const [text, setText] = useState("Your Text");
  const [fontSize, setFontSize] = useState(48);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [color, setColor] = useState("#000000");

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Type className="w-4 h-4" />
        <h3 className="font-medium">Add Text</h3>
      </div>
      <div className="space-y-2">
        <div>
          <Label htmlFor="text">Text</Label>
          <Input id="text" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="fontSize">Font Size</Label>
          <Input id="fontSize" type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="text-x">X Position</Label>
            <Input id="text-x" type="number" value={x} onChange={(e) => setX(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="text-y">Y Position</Label>
            <Input id="text-y" type="number" value={y} onChange={(e) => setY(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <Label htmlFor="color">Color</Label>
          <Input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <Button onClick={() => onApply({ text, fontSize, x, y, color })} disabled={disabled} className="w-full">
          Apply
        </Button>
      </div>
    </div>
  );
}

function MaskShapeTool({ onApply, disabled }: { onApply: (params: any) => void; disabled: boolean }) {
  const [shape, setShape] = useState("circle");
  const [x, setX] = useState(200);
  const [y, setY] = useState(200);
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(200);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shapes className="w-4 h-4" />
        <h3 className="font-medium">Mask Shape</h3>
      </div>
      <div className="space-y-2">
        <div>
          <Label htmlFor="shape">Shape</Label>
          <Select value={shape} onValueChange={setShape}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="circle">Circle</SelectItem>
              <SelectItem value="rectangle">Rectangle</SelectItem>
              <SelectItem value="ellipse">Ellipse</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>X</Label>
            <Input type="number" value={x} onChange={(e) => setX(Number(e.target.value))} />
          </div>
          <div>
            <Label>Y</Label>
            <Input type="number" value={y} onChange={(e) => setY(Number(e.target.value))} />
          </div>
          <div>
            <Label>Width</Label>
            <Input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
          </div>
          <div>
            <Label>Height</Label>
            <Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
          </div>
        </div>
        <Button onClick={() => onApply({ shape, x, y, width, height })} disabled={disabled} className="w-full">
          Apply
        </Button>
      </div>
    </div>
  );
}

function SliceTool({ onApply, disabled }: { onApply: (rows: number, cols: number) => void; disabled: boolean }) {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Grid3X3 className="w-4 h-4" />
        <h3 className="font-medium">Slice Image</h3>
      </div>
      <div className="space-y-2">
        <div>
          <Label htmlFor="rows">Rows</Label>
          <Input id="rows" type="number" min="1" value={rows} onChange={(e) => setRows(Number(e.target.value))} />
        </div>
        <div>
          <Label htmlFor="cols">Columns</Label>
          <Input id="cols" type="number" min="1" value={cols} onChange={(e) => setCols(Number(e.target.value))} />
        </div>
        <Button onClick={() => onApply(rows, cols)} disabled={disabled} className="w-full">
          Apply
        </Button>
      </div>
    </div>
  );
}

function PuzzleTool({ onApply, disabled }: { onApply: (params: any) => void; disabled: boolean }) {
  const [pieces, setPieces] = useState(12);
  const [cornerRadius, setCornerRadius] = useState(5);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Puzzle className="w-4 h-4" />
        <h3 className="font-medium">Puzzle Generator</h3>
      </div>
      <div className="space-y-2">
        <div>
          <Label htmlFor="pieces">Number of Pieces</Label>
          <Input id="pieces" type="number" min="4" value={pieces} onChange={(e) => setPieces(Number(e.target.value))} />
        </div>
        <div>
          <Label>Corner Radius: {cornerRadius}px</Label>
          <Slider
            value={[cornerRadius]}
            onValueChange={(v) => setCornerRadius(v[0])}
            min={0}
            max={20}
            step={1}
          />
        </div>
        <Button onClick={() => onApply({ pieces, cornerRadius })} disabled={disabled} className="w-full">
          Generate Puzzle
        </Button>
      </div>
    </div>
  );
}

function UpscaleTool({ onApply, disabled }: { onApply: (scale: number) => void; disabled: boolean }) {
  const [scale, setScale] = useState(2);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <ZoomIn className="w-4 h-4" />
        <h3 className="font-medium">AI Upscale</h3>
      </div>
      <div className="space-y-2">
        <div>
          <Label htmlFor="scale">Scale Factor</Label>
          <Select value={scale.toString()} onValueChange={(v) => setScale(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2x</SelectItem>
              <SelectItem value="4">4x</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => onApply(scale)} disabled={disabled} className="w-full">
          Upscale
        </Button>
      </div>
    </div>
  );
}

function DepthMapTool({ onApply, disabled }: { onApply: (detail: number) => void; disabled: boolean }) {
  const [detail, setDetail] = useState(50);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Mountain className="w-4 h-4" />
        <h3 className="font-medium">Depth Map</h3>
      </div>
      <div className="space-y-2">
        <div>
          <Label>Detail Level: {detail}%</Label>
          <Slider
            value={[detail]}
            onValueChange={(v) => setDetail(v[0])}
            min={0}
            max={100}
            step={5}
          />
        </div>
        <Button onClick={() => onApply(detail)} disabled={disabled} className="w-full">
          Generate Depth Map
        </Button>
      </div>
    </div>
  );
}

