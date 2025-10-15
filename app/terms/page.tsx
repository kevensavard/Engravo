import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Engravo.app
            </Link>
            <Link href="/">
              <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-full mb-4">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-400">Last updated: October 15, 2025</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                By accessing and using Engravo.app ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                Engravo.app is an AI-powered image editing platform designed for laser engraving, CNC preparation, and digital art. The Service provides image processing tools, depth map generation, background removal, and other editing features.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
            <div className="text-gray-300 space-y-2">
              <ul className="list-disc pl-6 space-y-2">
                <li>You must create an account to use most features</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must provide accurate information</li>
                <li>One account per person</li>
                <li>You must be at least 13 years old</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">4. Credits & Subscriptions</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                <strong>Credits:</strong> Our Service uses a credit-based system. Different features cost different amounts of credits. Credits can be purchased as one-time packs or through monthly subscriptions.
              </p>
              <p>
                <strong>Subscriptions:</strong> Monthly subscriptions auto-renew until canceled. You can cancel anytime from your subscription settings. Refunds are subject to our refund policy.
              </p>
              <p>
                <strong>Free Credits:</strong> New users receive 60 free credits. Free credits expire when new ones are purchased.
              </p>
              <p>
                <strong>Non-Transferable:</strong> Credits cannot be transferred, sold, or exchanged for cash.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">5. Acceptable Use</h2>
            <div className="text-gray-300 space-y-2">
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload illegal, harmful, or copyrighted content you don't own</li>
                <li>Attempt to reverse engineer or exploit the Service</li>
                <li>Use automated systems to access the Service</li>
                <li>Resell or redistribute our Service</li>
                <li>Upload malicious files or viruses</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                <strong>Your Content:</strong> You retain all rights to images you upload. By using our Service, you grant us permission to process your images to provide the Service.
              </p>
              <p>
                <strong>Our Service:</strong> All Service features, software, and branding are owned by Engravo.app and protected by copyright and intellectual property laws.
              </p>
              <p>
                <strong>Processed Images:</strong> Images you process and export are yours to use commercially or personally, subject to the terms of your subscription plan.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">7. Image Storage & Deletion</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                <strong>Temporary Storage:</strong> Uploaded images are stored temporarily for processing. Images are automatically deleted when you upload a new image.
              </p>
              <p>
                <strong>No Permanent Storage:</strong> We do not permanently store your images unless explicitly requested. It's your responsibility to download and save processed images.
              </p>
              <p>
                <strong>Data Loss:</strong> We are not responsible for lost or deleted images. Always download your final work.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">8. Payments & Refunds</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                <strong>Billing:</strong> Subscriptions are billed monthly in advance. Credit packs are one-time purchases.
              </p>
              <p>
                <strong>Cancellation:</strong> You can cancel subscriptions anytime. No refunds for partial months.
              </p>
              <p>
                <strong>Refunds:</strong> Credit packs and unused credits are generally non-refundable. Refunds may be issued at our discretion for technical issues or errors.
              </p>
              <p>
                <strong>Payment Processing:</strong> All payments are processed securely through Stripe.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">9. Service Availability</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                We strive for 99.9% uptime but do not guarantee uninterrupted service. We may perform maintenance, updates, or experience technical issues.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue any feature at any time with or without notice.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                The Service is provided "AS IS" without warranties. We are not liable for any damages arising from use of the Service, including but not limited to lost data, lost profits, or service interruptions.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">11. Termination</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                We may terminate or suspend your account immediately for violations of these Terms. Upon termination, your right to use the Service ceases immediately.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">12. Changes to Terms</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 mt-8">
            <h3 className="text-xl font-bold mb-2">Contact Us</h3>
            <p className="text-gray-300 mb-4">
              Questions about these Terms? Contact us:
            </p>
            <div className="space-y-2 text-gray-300">
              <p><strong>Email:</strong> <a href="mailto:legal@engravo.app" className="text-blue-400 hover:underline">legal@engravo.app</a></p>
              <p><strong>Contact Form:</strong> <Link href="/contact" className="text-blue-400 hover:underline">engravo.app/contact</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

