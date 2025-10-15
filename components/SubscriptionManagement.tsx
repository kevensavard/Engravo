"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import {
  Crown,
  Star,
  Zap,
  Check,
  ArrowLeft,
  CreditCard,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  Gift,
} from "lucide-react";
import Link from "next/link";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  credits: number;
  features: string[];
  popular: boolean;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  buttonText: string;
  priceId: string;
}

export default function SubscriptionManagement() {
  const { user, isLoaded } = useUser();
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch user data
  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData();
    }
  }, [isLoaded, user]);

  const fetchUserData = async () => {
    try {
      const [creditsResponse, userResponse] = await Promise.all([
        fetch('/api/user/credits'),
        fetch('/api/user/profile')
      ]);

      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        setUserCredits(creditsData.credits);
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setSubscriptionTier(userData.subscriptionTier || 'free');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          type: 'subscription',
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleBuyCredits = async (priceId: string) => {
    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          type: 'payment',
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$9.99',
      originalPrice: '$19.99',
      credits: 200,
      features: [
        '200 Credits per month',
        'All Basic Tools',
        'Effects & Filters',
        'Export in PNG/JPG',
        'Email Support'
      ],
      popular: false,
      icon: <Star className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      buttonText: 'Upgrade to Starter',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || 'price_1SIHp3Pv4WSX91ci85OgHwWq'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$24.99',
      originalPrice: '$49.99',
      credits: 500,
      features: [
        '500 Credits per month',
        'Everything in Starter',
        'Advanced Effects',
        'Vector Export',
        'Priority Support',
        'Custom Watermarks'
      ],
      popular: true,
      icon: <Crown className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      buttonText: 'Upgrade to Pro',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_1SIHq3Pv4WSX91cifOyHIUyk'
    },
    {
      id: 'master',
      name: 'Master',
      price: '$49.99',
      originalPrice: '$99.99',
      credits: 1200,
      features: [
        '1200 Credits per month',
        'Everything in Pro',
        'AI Background Removal',
        'Batch Processing',
        'API Access',
        '24/7 Support'
      ],
      popular: false,
      icon: <Zap className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-100',
      buttonText: 'Upgrade to Master',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MASTER || 'price_1SIHqnPv4WSX91ciNTUldv2L'
    }
  ];

  const creditPacks = [
    {
      name: 'Small Pack',
      credits: 100,
      price: '$5.00',
      bonus: 0,
      popular: false,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SMALL_PACK || 'price_1SIHrXPv4WSX91cirzy1cHtu'
    },
    {
      name: 'Medium Pack',
      credits: 300,
      price: '$15.00',
      bonus: 50,
      popular: true,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MEDIUM_PACK || 'price_1SIHsQPv4WSX91ci6FHKlJEs'
    },
    {
      name: 'Large Pack',
      credits: 600,
      price: '$25.00',
      bonus: 150,
      popular: false,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LARGE_PACK || 'price_1SIHt5Pv4WSX91ciqDGjyI4M'
    },
    {
      name: 'Mega Pack',
      credits: 1200,
      price: '$40.00',
      bonus: 400,
      popular: false,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MEGA_PACK || 'price_1SIHtfPv4WSX91ciGNBP6Zmj'
    }
  ];

  const animationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800/50 bg-[#1a1f2e]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Brand */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Engravo.app
              </span>
            </Link>

            {/* Right: Back to Dashboard */}
            <Link href="/dashboard">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Subscription & Credits
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Choose the perfect plan for your image editing needs
          </p>
          
          {/* Current Status */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="w-6 h-6 text-green-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {userCredits || 0} Credits
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 capitalize">
              Current Plan: {subscriptionTier}
            </p>
          </div>
        </motion.div>

        {/* Subscription Plans */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Monthly Subscription Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ scale: 1.05 }}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden ${
                  plan.popular ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className={`p-8 ${plan.popular ? 'pt-16' : ''}`}>
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center text-white`}>
                      {plan.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      {plan.originalPrice && (
                        <span className="text-lg text-gray-500 line-through">
                          {plan.originalPrice}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">/month</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handleSubscribe(plan.priceId)}
                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-semibold py-3`}
                    disabled={subscriptionTier === plan.id || checkoutLoading}
                  >
                    {checkoutLoading ? 'Loading...' : subscriptionTier === plan.id ? 'Current Plan' : plan.buttonText}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Credit Packs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Credit Top-Up Packs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creditPacks.map((pack, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${
                  pack.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Best Value
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {pack.name}
                  </h3>
                  <div className="mb-4">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {pack.credits}
                      </span>
                      {pack.bonus > 0 && (
                        <span className="text-green-500 font-semibold">
                          +{pack.bonus} bonus
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Credits</p>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {pack.price}
                  </div>
                  <Button 
                    onClick={() => handleBuyCredits(pack.priceId)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white font-semibold"
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? 'Loading...' : 'Purchase Credits'}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Comparison */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Why Choose Engravo.app?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Professional Quality
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Industry-leading tools for perfect laser engraving results every time.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Secure & Reliable
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your images are processed securely and never stored permanently.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Instant Processing
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get results in seconds with our optimized processing engine.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
