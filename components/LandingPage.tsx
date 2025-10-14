"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Wand2,
  Zap,
  Image as ImageIcon,
  Scissors,
  Paintbrush,
  Layers,
  Download,
  Puzzle,
  Type,
  Eraser,
  Mountain,
  ZoomIn,
  FileCode,
  Camera,
  Pencil,
  Sun,
  VolumeX,
  Keyboard,
  Check,
  Crown,
  Star,
  ChevronRight,
  Play,
} from "lucide-react";

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState("Pro");

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const features = [
    {
      category: "Basic Tools",
      icon: ImageIcon,
      color: "from-blue-500 to-cyan-500",
      items: ["Grayscale", "Resize", "Crop", "Sharpen", "Color Correction"],
      credits: "Free",
    },
    {
      category: "Effects",
      icon: Paintbrush,
      color: "from-purple-500 to-pink-500",
      items: ["Oil Painting", "Sketch", "Vintage", "HDR", "Noise Reduction"],
      credits: "Free",
    },
    {
      category: "Advanced Tools",
      icon: Wand2,
      color: "from-orange-500 to-red-500",
      items: ["Add Text", "Remove BG", "Depth Map", "AI Upscale", "Vectorize"],
      credits: "10-20 per use",
    },
    {
      category: "Split Tools",
      icon: Scissors,
      color: "from-green-500 to-emerald-500",
      items: ["Jigsaw Puzzle Generator", "Slice Images", "Grid Split"],
      credits: "5-10 per use",
    },
    {
      category: "Export Options",
      icon: Download,
      color: "from-indigo-500 to-purple-500",
      items: ["PNG, JPG, SVG", "Quality Control", "Batch Export"],
      credits: "Free",
    },
    {
      category: "Productivity",
      icon: Keyboard,
      color: "from-yellow-500 to-amber-500",
      items: ["Keyboard Shortcuts", "Undo/Redo", "Comparison Mode", "Zoom"],
      credits: "Free",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      credits: 60,
      depthMaps: 6,
      description: "Test the platform",
      features: [
        "60 credits/month",
        "~6 depth maps",
        "Basic tools",
        "All effects",
        "Export options",
      ],
      popular: false,
    },
    {
      name: "Starter",
      price: "$14.99",
      credits: 200,
      depthMaps: 20,
      description: "For hobbyists",
      features: [
        "200 credits/month",
        "~20 depth maps",
        "All basic features",
        "Priority support",
        "HD exports",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "$29.99",
      credits: 500,
      depthMaps: 50,
      description: "Active creators",
      features: [
        "500 credits/month",
        "~50 depth maps",
        "All features",
        "Priority support",
        "Commercial license",
      ],
      popular: true,
    },
    {
      name: "Master",
      price: "$59.99",
      credits: 1200,
      depthMaps: 120,
      description: "Small studios",
      features: [
        "1,200 credits/month",
        "~120 depth maps",
        "All features",
        "Premium support",
        "Team collaboration",
      ],
      popular: false,
    },
    {
      name: "Studio",
      price: "$99.99",
      credits: 2400,
      depthMaps: 240,
      description: "Heavy users",
      features: [
        "2,400 credits/month",
        "~240 depth maps",
        "Unlimited basic tools",
        "Premium support",
        "API access",
      ],
      popular: false,
    },
  ];

  const creditPacks = [
    { name: "Mini", credits: 80, price: "$9", popular: false },
    { name: "Standard", credits: 200, price: "$19", popular: false },
    { name: "Pro", credits: 500, price: "$39", popular: true },
    { name: "Bulk", credits: 1200, price: "$79", popular: false },
    { name: "Mega", credits: 2500, price: "$149", popular: false },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419] text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-gray-800/50 bg-[#1a1f2e]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Engravo.app
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <a
                href="#features"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Pricing
              </a>
              <a href="/dashboard">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500">
                  Start Free
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div variants={fadeInUp} className="inline-block mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                <Zap className="w-4 h-4" />
                New: AI-Powered Depth Maps
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight"
            >
              Perfect Your Laser
              <br />
              Designs with Engravo
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto"
            >
              All-in-one image prep studio — resize, vectorize, stylize, and
              engrave-ready your designs in minutes.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a href="/dashboard">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-lg px-8 py-6 shadow-lg shadow-blue-500/25"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Editing Free
                </Button>
              </a>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-700 hover:border-gray-600 text-lg px-8 py-6"
              >
                <Play className="w-5 h-5 mr-2" />
                See How It Works
              </Button>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-16 relative max-w-5xl mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl" />
              <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-2 shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">Editor Preview</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Powerful Tools for Every Project
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-400 max-w-2xl mx-auto"
            >
              From basic edits to advanced AI features, everything you need to
              prepare perfect engravings.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 hover:border-gray-600/50 transition-all duration-300"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}
                  />
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.category}</h3>
                  <ul className="space-y-2 mb-4">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-400">
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r ${feature.color} bg-opacity-10 text-sm font-medium`}
                  >
                    <Zap className="w-3 h-3" />
                    {feature.credits}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Choose Your Plan
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-400 max-w-3xl mx-auto"
            >
              Every feature uses credits. Basic edits are free — advanced tools
              like depth maps cost 10 credits each.
            </motion.p>
          </motion.div>

          {/* Monthly Plans */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -10 }}
                className={`relative bg-gradient-to-br ${
                  plan.popular
                    ? "from-blue-900/50 to-purple-900/50 border-blue-500/50"
                    : "from-gray-900/50 to-gray-800/50 border-gray-700/50"
                } backdrop-blur-xl rounded-2xl border p-6 transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-xs font-bold">
                      <Crown className="w-3 h-3" />
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-2">{plan.price}</div>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
                <a href={plan.price === "$0" ? "/dashboard" : "#"}>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    {plan.price === "$0" ? "Start Free" : "Upgrade Now"}
                  </Button>
                </a>
              </motion.div>
            ))}
          </motion.div>

          {/* Credit Top-Up Packs */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h3
              variants={fadeInUp}
              className="text-3xl font-bold text-center mb-8"
            >
              Credit Top-Up Packs
            </motion.h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {creditPacks.map((pack, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                  className={`relative bg-gradient-to-br ${
                    pack.popular
                      ? "from-blue-900/30 to-purple-900/30 border-blue-500/30"
                      : "from-gray-900/30 to-gray-800/30 border-gray-700/30"
                  } backdrop-blur-xl rounded-xl border p-4 text-center transition-all duration-300`}
                >
                  {pack.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </div>
                  )}
                  <div className="text-sm text-gray-400 mb-1">{pack.name}</div>
                  <div className="text-2xl font-bold mb-1">{pack.credits}</div>
                  <div className="text-sm text-gray-500 mb-2">credits</div>
                  <div className="text-xl font-bold text-blue-400 mb-3">
                    {pack.price}
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    Buy Credits
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent"
            >
              Start Editing Free
              <br />
              No Signup Needed
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto"
            >
              Jump right in and start creating. Upgrade anytime to unlock
              premium features.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a href="/dashboard">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-lg px-8 py-6"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Free
                </Button>
              </a>
              <a href="#pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-700 hover:border-gray-600 text-lg px-8 py-6"
                >
                  View Pricing
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Engravo.app
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <a href="#pricing" className="hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Docs
              </a>
              <a href="#" className="hover:text-white transition-colors">
                About
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Support
              </a>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 Engravo.app. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
