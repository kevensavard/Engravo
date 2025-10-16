"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";

export function DevCreditsHelper() {
  const [amount, setAmount] = useState("1000");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleAddCredits = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const response = await fetch('/api/dev/add-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseInt(amount) }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Added ${data.creditsAdded} credits! Refresh the page to see them.`);
        // Refresh the page to update credits display
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-yellow-600 font-semibold mb-2">
          <Zap className="w-5 h-5" />
          Development Helper
        </h3>
        <p className="text-gray-600 text-sm">
          Add credits for testing features locally
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="credits-amount">Credits to add</Label>
          <Input
            id="credits-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            min="1"
            max="10000"
          />
        </div>
        
        <Button 
          onClick={handleAddCredits}
          disabled={loading || !amount}
          className="w-full bg-yellow-600 hover:bg-yellow-700"
        >
          {loading ? "Adding Credits..." : `Add ${amount} Credits`}
        </Button>
        
        {message && (
          <p className={`text-sm ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
