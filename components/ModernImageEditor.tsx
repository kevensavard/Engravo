"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Download,
  Undo,
  Redo,
  Image as ImageIcon,
  Wand2,
  Layers,
  ArrowLeftRight,
  Sparkles,
  Eraser,
  Mountain,
  ZoomIn,
  FileCode,
  Palette,
  Star,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Crown,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import InteractiveTextTool from "./InteractiveTextTool";
import InteractiveMaskTool from "./InteractiveMaskTool";
import InteractiveCropTool from "./InteractiveCropTool";
import BasicToolsPanel from "./BasicToolsPanel";
import EffectsPanel from "./EffectsPanel";
import PuzzlePanel from "./PuzzlePanel";
import SlicePanel from "./SlicePanel";
import BottomToolbar from "./BottomToolbar";
import ExportOptions from "./ExportOptions";
import KeyboardLegend from "./KeyboardLegend";
import CreditConfirmationModal from "./CreditConfirmationModal";
import { CREDIT_COSTS, FeatureKey } from "@/lib/credit-costs";

interface ImageState {
  url: string;
  filename: string;
  width: number;
  height: number;
}

export default function ModernImageEditor() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [baseImageBeforeColorCorrection, setBaseImageBeforeColorCorrection] = useState<ImageState | null>(null);
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState<ImageState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showComparison, setShowComparison] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [activeTool, setActiveTool] = useState("basic");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showKeyboardLegend, setShowKeyboardLegend] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNewImageModal, setShowNewImageModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [pendingFeature, setPendingFeature] = useState<{ name: string; feature: FeatureKey; endpoint: string; options?: any } | null>(null);
  const [dontShowCreditModal, setDontShowCreditModal] = useState(false);
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user credits when component mounts
  useEffect(() => {
    if (isLoaded && user) {
      fetchUserCredits();
    }
  }, [isLoaded, user]);

  // Auto-save image state to localStorage
  useEffect(() => {
    if (image) {
      const saveData = {
        image,
        originalImage,
        baseImageBeforeColorCorrection,
        history,
        historyIndex,
        timestamp: Date.now()
      };
      localStorage.setItem('engravo-app-state', JSON.stringify(saveData));
    }
  }, [image, originalImage, baseImageBeforeColorCorrection, history, historyIndex]);

  // Restore state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('engravo-app-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Only restore if saved within last 24 hours
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setImage(parsed.image);
          setOriginalImage(parsed.originalImage);
          setBaseImageBeforeColorCorrection(parsed.baseImageBeforeColorCorrection);
          setHistory(parsed.history || []);
          setHistoryIndex(parsed.historyIndex || -1);
        }
      } catch (error) {
        console.error('Failed to restore saved state:', error);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showProfileDropdown]);

  const fetchUserCredits = async () => {
    try {
      const [creditsResponse, profileResponse] = await Promise.all([
        fetch('/api/user/credits'),
        fetch('/api/user/profile')
      ]);
      
      if (creditsResponse.ok) {
        const data = await creditsResponse.json();
        setUserCredits(data.credits);
      }
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setIsUserAdmin(profileData.isAdmin || false);
        setSubscriptionTier(profileData.subscriptionTier || 'free');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNewImage = () => {
    setShowNewImageModal(true);
  };

  const handleConfirmNewImage = () => {
    // Clear all state
    setImage(null);
    setOriginalImage(null);
    setBaseImageBeforeColorCorrection(null);
    setHistory([]);
    setHistoryIndex(-1);
    setShowComparison(false);
    setActiveTool("basic");
    setZoom(1);
    
    // Clear localStorage
    localStorage.removeItem('engravo-app-state');
    
    // Close modal
    setShowNewImageModal(false);
    
    // Trigger file input
    fileInputRef.current?.click();
  };

  const handleCancelNewImage = () => {
    setShowNewImageModal(false);
  };

  // Credit processing functions
  const processWithCredits = (featureName: string, feature: FeatureKey, endpoint: string, options: any = {}) => {
    const creditCost = CREDIT_COSTS[feature];
    
    // Check if user has enough credits
    if (userCredits === null || userCredits < creditCost) {
      setPendingFeature({ name: featureName, feature, endpoint, options });
      setShowCreditModal(true);
      return;
    }

    // If user has checked "don't show again", process directly
    if (dontShowCreditModal) {
      processImageWithCredits(endpoint, options, feature);
      return;
    }

    // Show confirmation modal
    setPendingFeature({ name: featureName, feature, endpoint, options });
    setShowCreditModal(true);
  };

  const processImageWithCredits = async (endpoint: string, options: any, feature: FeatureKey) => {
    if (!image) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...options, imageUrl: image.url, feature }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Processing failed");
      }

      const result = await response.json();
      
      // Update credits display
      if (result.creditsRemaining !== undefined) {
        setUserCredits(result.creditsRemaining);
      }

      // Update image state
      const newImageState: ImageState = {
        url: result.url,
        filename: result.filename,
        width: result.width,
        height: result.height,
      };

      setImage(newImageState);
      addToHistory(newImageState);
    } catch (error) {
      console.error("Processing error:", error);
      alert("Failed to process image: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreditConfirm = () => {
    if (pendingFeature) {
      processImageWithCredits(pendingFeature.endpoint, pendingFeature.options, pendingFeature.feature);
      setShowCreditModal(false);
      setPendingFeature(null);
    }
  };

  const handleCreditCancel = () => {
    setShowCreditModal(false);
    setPendingFeature(null);
  };

  const handleDontShowAgain = (checked: boolean) => {
    setDontShowCreditModal(checked);
    // Store in localStorage
    localStorage.setItem('dontShowCreditModal', checked.toString());
  };

  const addToHistory = (newImageState: ImageState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newImageState);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };

  // Load don't show again preference
  useEffect(() => {
    const saved = localStorage.getItem('dontShowCreditModal');
    if (saved === 'true') {
      setDontShowCreditModal(true);
    }
  }, []);

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
      setBaseImageBeforeColorCorrection(newImage);
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

        // Handle SVG download differently
        if (endpoint === "puzzle-svg") {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `puzzle-template-${options.pieces || 12}pieces.svg`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          return;
        }

        const data = await response.json();
        const newImage: ImageState = {
          url: `${data.url}?t=${Date.now()}`, // Add cache-busting parameter
          filename: data.filename,
          width: data.width || image.width,
          height: data.height || image.height,
        };

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newImage);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setImage(newImage);
        
        // When any non-color-correction operation is performed, update the base image
        // This allows color correction to work from this new state
        if (endpoint !== "color-correct") {
          setBaseImageBeforeColorCorrection(newImage);
        }
      } catch (error) {
        console.error(`Error processing image (${endpoint}):`, error);
        alert(`Failed to process image: ${endpoint}`);
      } finally {
        setProcessing(false);
      }
    },
    [image, history, historyIndex]
  );

  const processImageFromOriginal = useCallback(
    async (endpoint: string, options: Record<string, any> = {}) => {
      if (!originalImage) return;

      setProcessing(true);
      try {
        const response = await fetch(`/api/${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: originalImage.url,
            ...options,
          }),
        });

        if (!response.ok) throw new Error(`Processing failed: ${endpoint}`);

        const data = await response.json();
        const newImage: ImageState = {
          url: `${data.url}?t=${Date.now()}`, // Add cache-busting parameter
          filename: data.filename,
          width: data.width || originalImage.width,
          height: data.height || originalImage.height,
        };

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
    [originalImage, history, historyIndex]
  );

  const processColorCorrection = useCallback(
    async (options: Record<string, any> = {}) => {
      // Use baseImageBeforeColorCorrection if available, otherwise use current image
      const sourceImage = baseImageBeforeColorCorrection || image;
      if (!sourceImage) return;

      setProcessing(true);
      try {
        const response = await fetch(`/api/color-correct`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: sourceImage.url,
            ...options,
          }),
        });

        if (!response.ok) throw new Error(`Processing failed: color-correct`);

        const data = await response.json();
        const newImage: ImageState = {
          url: data.url,
          filename: data.filename,
          width: data.width || sourceImage.width,
          height: data.height || sourceImage.height,
        };

        // For color correction, we replace the current state instead of adding to history
        // This prevents stacking and allows real-time adjustment
        const newHistory = [...history];
        if (historyIndex < history.length - 1 && history[historyIndex + 1]) {
          // Replace the next item if it exists (previous color correction)
          newHistory[historyIndex + 1] = newImage;
        } else {
          // Add new item to history
          newHistory.push(newImage);
          setHistoryIndex(historyIndex + 1);
        }
        setHistory(newHistory);
        setImage(newImage);
      } catch (error) {
        console.error(`Error processing color correction:`, error);
        alert(`Failed to process color correction`);
      } finally {
        setProcessing(false);
      }
    },
    [baseImageBeforeColorCorrection, image, history, historyIndex]
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

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Handle keyboard shortcuts
      if (isCtrlOrCmd && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (isCtrlOrCmd && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (isCtrlOrCmd && e.key === 's') {
        e.preventDefault();
        downloadImage();
      } else if (isCtrlOrCmd && e.key === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if (isCtrlOrCmd && e.key === 'e') {
        e.preventDefault();
        setShowExportOptions(true);
      } else if (isCtrlOrCmd && e.key === 'd') {
        e.preventDefault();
        // Duplicate image functionality
        if (image) {
          const a = document.createElement("a");
          a.href = image.url;
          a.download = image.filename.replace(/(\.[^.]+)$/, '_copy$1');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else if (e.key === 'Escape') {
        setShowExportOptions(false);
        setShowKeyboardLegend(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        setShowComparison(!showComparison);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(Math.min(zoom * 1.1, 3));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom(Math.max(zoom / 1.1, 0.1));
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setZoom(1);
      } else if (e.key === '?' || e.key === '/') {
        e.preventDefault();
        setShowKeyboardLegend(!showKeyboardLegend);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, downloadImage, image, showComparison, zoom]);

  if (!image) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Top Navigation Bar */}
        <nav className="border-b border-gray-800/50 bg-[#1a1f2e]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left: Logo & Brand */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Engravo.app
                </span>
              </div>

              {/* Center: Navigation Links */}
              <div className="flex items-center gap-6">
                <a
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Home
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Library
                </a>
                <a
                  href="/subscription"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Subscription
                </a>
                {isUserAdmin && (
                  <a
                    href="/admin"
                    className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </a>
                )}
              <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-semibold">
                Img Editor
              </Button>
              </div>

              {/* Right: Credits & User Profile */}
              <div className="flex items-center gap-4">
                {/* Credits Display */}
                {isLoaded && userCredits !== null && (
                  <button
                    onClick={() => window.location.href = '/subscription'}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <Star className="w-4 h-4 text-white" />
                    <span className="text-white font-medium">{userCredits} Credits</span>
                  </button>
                )}

                {/* User Profile */}
                {isLoaded && user && (
                  <div className="relative profile-dropdown-container">
                    <button
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform cursor-pointer"
                    >
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={user.firstName || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </button>
                    
                    {/* Profile Dropdown */}
                    {showProfileDropdown && (
                      <div className="absolute right-0 top-10 bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                        <div className="px-4 py-2 border-b border-gray-700">
                          <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-gray-400 text-sm">{user.emailAddresses[0]?.emailAddress}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Upload Section */}
        <div className="flex items-center justify-center p-4 flex-1">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-block p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Engravo.app
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Professional image editing for perfect laser engraving results
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-12 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {processing ? "Uploading..." : "Drop your image here"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                or click to browse
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-sm text-gray-500">
                <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full">JPG</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full">PNG</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full">GIF</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full">WebP</span>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Modern Dark Top Navigation */}
      <div className="bg-[#1a1f2e] border-b border-gray-800/50 shadow-xl">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Engravo.app
              </span>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center gap-6">
              <button className="text-gray-300 hover:text-white font-medium transition-colors">
                Home
              </button>
              <button className="text-gray-300 hover:text-white font-medium transition-colors">
                Library
              </button>
              <a 
                href="/subscription"
                className="text-gray-300 hover:text-white font-medium transition-colors"
              >
                Subscription
              </a>
              {isUserAdmin && (
                <a
                  href="/admin"
                  className="text-red-400 hover:text-red-300 font-medium transition-colors flex items-center gap-1"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </a>
              )}
              <button 
                onClick={handleNewImage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload New Image
              </button>
              <button className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-full shadow-lg transition-all">
                Img Editor
              </button>
            </div>

            {/* Credits & Profile */}
            <div className="flex items-center gap-4">
              {/* Credits Display */}
              {isLoaded && userCredits !== null && (
                <button
                  onClick={() => window.location.href = '/subscription'}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Star className="w-4 h-4 text-white" />
                  <span className="text-white font-medium">{userCredits} Credits</span>
                </button>
              )}

              {/* User Profile */}
              {isLoaded && user && (
                <div className="relative profile-dropdown-container">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform cursor-pointer"
                  >
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.firstName || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </button>
                  
                  {/* Profile Dropdown */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 top-10 bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-gray-400 text-sm">{user.emailAddresses[0]?.emailAddress}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Bottom Toolbar */}
      <div className="container mx-auto px-6 py-4 flex flex-col gap-4" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 flex-1 overflow-hidden">
          {/* Left - Large Image Preview */}
          <div className="bg-[#1a1f2e] rounded-2xl shadow-2xl border border-gray-800/50 overflow-hidden flex flex-col">
            {/* Top Bar with Compare Toggle */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-3 border-b border-gray-800/50 flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Preview</h2>
              <Button
                onClick={() => setShowComparison(!showComparison)}
                disabled={processing || historyIndex === 0}
                size="sm"
                variant="outline"
                className="bg-gray-800/50 hover:bg-gray-700/50 text-white border-gray-700/50 text-xs h-8"
              >
                <ArrowLeftRight className="w-3 h-3 mr-1.5" />
                {showComparison ? 'Hide' : 'Show'} Compare
              </Button>
            </div>

            {/* Image Canvas */}
            <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
              <div className="bg-[#0d1117] rounded-xl w-full h-full flex items-center justify-center relative border border-gray-800/30">
                {/* Dark Checkerboard Pattern */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: `
                    linear-gradient(45deg, #161b22 25%, transparent 25%),
                    linear-gradient(-45deg, #161b22 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #161b22 75%),
                    linear-gradient(-45deg, transparent 75%, #161b22 75%)
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }} />
                
                {processing ? (
                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white font-semibold">Processing...</p>
                  </div>
                ) : showComparison && originalImage ? (
                  <div className="grid grid-cols-2 gap-4 w-full h-full relative z-10 p-4">
                    <div className="space-y-2 flex flex-col h-full">
                      <div className="text-xs font-medium text-gray-400 text-center">Original</div>
                      <div className="bg-[#1a1f2e] rounded-lg p-2 shadow-lg border border-gray-800/50 flex-1 flex items-center justify-center">
                        <img
                          src={originalImage.url}
                          alt="Original"
                          className="max-w-full max-h-full object-contain rounded"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 flex flex-col h-full">
                      <div className="text-xs font-medium text-blue-400 text-center">Edited</div>
                      <div className="bg-[#1a1f2e] rounded-lg p-2 shadow-lg ring-2 ring-blue-500/50 border border-gray-800/50 flex-1 flex items-center justify-center">
                        <img
                          src={image.url}
                          alt="Edited"
                          className="max-w-full max-h-full object-contain rounded transition-transform duration-200"
                          style={{ transform: `scale(${zoom})` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={image.url}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain relative z-10 p-4 transition-transform duration-200"
                    style={{ transform: `scale(${zoom})` }}
                  />
                )}
              </div>
            </div>

            {/* Info Bar */}
            <div className="p-3 border-t border-gray-800/50 flex items-center justify-between bg-gradient-to-r from-gray-900/30 to-gray-800/30">
              <div className="text-xs text-gray-400">
                <span className="font-medium">{image.width} × {image.height}px</span>
                <span className="mx-2">•</span>
                <span className="text-gray-500 text-[10px]">{image.filename}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={undo}
                  disabled={historyIndex <= 0 || processing}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800/50"
                >
                  <Undo className="w-3 h-3" />
                </Button>
                <Button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1 || processing}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800/50"
                >
                  <Redo className="w-3 h-3" />
                </Button>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-medium border border-blue-500/30">
                  {history.length} {history.length === 1 ? 'edit' : 'edits'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Tool Options Panel (changes based on selected tool) */}
          <div className="bg-[#1a1f2e] rounded-2xl shadow-2xl border border-gray-800/50 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-3 border-b border-gray-800/50">
              <h2 className="text-white font-semibold text-sm">
                {activeTool === 'color' ? 'Color Adjust' : 
                 activeTool === 'basic' ? 'Basic Tools' : 
                 activeTool === 'effects' ? 'Effects' :
                 activeTool === 'crop' ? 'Crop Tool' :
                 activeTool === 'text' ? 'Add Text' :
                 activeTool === 'remove-bg' ? 'Remove Background' :
                 activeTool === 'depth-map' ? 'Depth Map' :
                 activeTool === 'upscale' ? 'AI Upscale' :
                 activeTool === 'vectorize' ? 'Vectorize' :
               activeTool === 'split' ? 'Split Image' :
               'Tool Options'}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {/* Basic Tools */}
              {activeTool === 'basic' && (
                <div className="space-y-4">
                <BasicToolsPanel
                  image={image}
                  onProcess={processImage}
                  onProcessColorCorrection={processColorCorrection}
                  onProcessWithCredits={processWithCredits}
                  processing={processing}
                />
                </div>
              )}

              {/* Effects */}
              {activeTool === 'effects' && (
                <EffectsPanel
                  onProcess={processImage}
                  onProcessFromOriginal={processImageFromOriginal}
                  onProcessWithCredits={processWithCredits}
                  processing={processing}
                />
              )}

              {/* Crop */}
              {activeTool === 'crop' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">Click "Interactive Crop" to select the area you want to keep.</p>
                  <InteractiveCropTool
                    imageUrl={image.url}
                    onApply={(x, y, width, height) => {
                      processWithCredits("Interactive Crop", "interactiveCrop", "crop", { x, y, width, height });
                    }}
                    disabled={processing}
                  />
                </div>
              )}

              {/* Text */}
              {activeTool === 'text' && (
                <div className="space-y-4">
                  <InteractiveTextTool
                    imageUrl={image.url}
                    onApply={(text, x, y, fontSize, color) =>
                      processWithCredits("Add Text", "addText", "add-text", { text, x, y, fontSize, color })
                    }
                    disabled={processing}
                  />
                </div>
              )}

              {/* Remove Background */}
              {activeTool === 'remove-bg' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white">
                    <Eraser className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-sm">Remove Background</h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    Automatically remove the background from your image. Works best with solid backgrounds.
                  </p>
                  <Button
                    onClick={() => processWithCredits("Remove Background", "removeBackground", "remove-bg")}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Remove Background ({CREDIT_COSTS.removeBackground} credits)
                  </Button>
                </div>
              )}

              {/* Depth Map */}
              {activeTool === 'depth-map' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white">
                    <Mountain className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-sm">Depth Map</h3>
                    {subscriptionTier === 'free' && (
                      <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded-full font-semibold">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    AI-powered depth map for 3D laser engraving
                  </p>
                  {subscriptionTier === 'free' ? (
                    <div className="space-y-3">
                      <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
                        <p className="text-sm text-orange-300 mb-2">
                          🔒 <strong>Premium Feature</strong>
                        </p>
                        <p className="text-xs text-orange-200/80">
                          Depth Map generation is available on Starter plan and above. Upgrade to unlock professional 3D depth maps for laser engraving.
                        </p>
                      </div>
                      <Button
                        onClick={() => window.location.href = '/subscription'}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 flex items-center justify-center gap-2"
                      >
                        <Crown className="w-4 h-4" />
                        Upgrade to Unlock Depth Maps
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => processWithCredits("Depth Map", "depthMap", "depth-map")}
                      disabled={processing}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Generate Depth Map ({CREDIT_COSTS.depthMap} credits)
                    </Button>
                  )}
                </div>
              )}

              {/* Upscale */}
              {activeTool === 'upscale' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white">
                    <ZoomIn className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-sm">AI Upscale</h3>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Scale Factor</Label>
                    <Select defaultValue="2" onValueChange={(v) => processWithCredits("AI Upscale", "upscale", "upscale", { scale: Number(v) })}>
                      <SelectTrigger className="mt-2 bg-gray-800/50 border-gray-700/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="2">2x (Double Size)</SelectItem>
                        <SelectItem value="4">4x (Quadruple Size)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Cost: {CREDIT_COSTS.upscale} credits per upscale
                  </p>
                </div>
              )}

              {/* Vectorize */}
              {activeTool === 'vectorize' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white">
                    <FileCode className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-sm">Vectorize (SVG)</h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    Convert to vector format
                  </p>
                  <Button
                    onClick={() => processWithCredits("Vectorize", "vectorize", "vectorize")}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Convert to SVG ({CREDIT_COSTS.vectorize} credits)
                  </Button>
                </div>
              )}

              {/* Split Tools */}
              {activeTool === 'split' && (
                <div className="space-y-6">
                  <PuzzlePanel 
                    onProcess={processImageFromOriginal} 
                    onProcessWithCredits={processWithCredits}
                    processing={processing} 
                  />
                  <SlicePanel 
                    image={image}
                    onProcess={processImage}
                    onProcessWithCredits={processWithCredits}
                    processing={processing} 
                  />
                </div>
              )}
            </div>

            {/* Download Button at Bottom */}
            <div className="p-4 border-t border-gray-800/50 bg-gradient-to-r from-gray-900/30 to-gray-800/30">
              <Button
                onClick={() => setShowExportOptions(true)}
                disabled={processing}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Options
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom Toolbar */}
        <BottomToolbar 
          activeTool={activeTool} 
          onToolSelect={(tool) => {
            setActiveTool(tool);
          }} 
        />

        {/* Export Options Modal */}
        {showExportOptions && image && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1f2e] border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
              <ExportOptions
                imageUrl={image.url}
                filename={image.filename}
                onClose={() => setShowExportOptions(false)}
              />
            </div>
          </div>
        )}

        {/* Keyboard Legend */}
        <KeyboardLegend
          isVisible={showKeyboardLegend}
          onToggle={() => setShowKeyboardLegend(!showKeyboardLegend)}
          activeTool={activeTool}
        />

        {/* New Image Confirmation Modal */}
        {showNewImageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1f2e] border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-2 text-white mb-4">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-lg">Upload New Image</h3>
              </div>
              <p className="text-gray-300 mb-6">
                This will replace your current image and clear all edits. Any unsaved changes will be lost.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleConfirmNewImage}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                </Button>
                <Button
                  onClick={handleCancelNewImage}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Credit Confirmation Modal */}
        {showCreditModal && pendingFeature && (
          <CreditConfirmationModal
            isOpen={showCreditModal}
            onConfirm={handleCreditConfirm}
            onCancel={handleCreditCancel}
            featureName={pendingFeature.name}
            creditCost={CREDIT_COSTS[pendingFeature.feature]}
            currentCredits={userCredits || 0}
            onDontShowAgain={handleDontShowAgain}
          />
        )}
      </div>
    </div>
  );
}

