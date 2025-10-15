import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: October 15, 2025</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                <strong>Account Information:</strong> When you sign up, we collect your email address, name, and authentication data through Clerk (our authentication provider).
              </p>
              <p>
                <strong>Payment Information:</strong> Payment details are processed securely by Stripe. We never store your credit card information.
              </p>
              <p>
                <strong>Usage Data:</strong> We track feature usage, credit transactions, and subscription status to provide our service.
              </p>
              <p>
                <strong>Images:</strong> Images you upload are temporarily stored for processing. Non-exported images are deleted when you upload a new image.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <div className="space-y-2 text-gray-300">
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and improve our image editing services</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important account and service updates</li>
                <li>Respond to your support requests</li>
                <li>Prevent fraud and ensure security</li>
                <li>Analyze usage to improve features</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">3. Data Storage & Security</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                <strong>Image Storage:</strong> Images are stored on Vercel Blob (cloud storage) temporarily during your editing session. Non-exported images are automatically deleted when you upload a new image.
              </p>
              <p>
                <strong>Database:</strong> User data is securely stored in Neon PostgreSQL database with encryption at rest and in transit.
              </p>
              <p>
                <strong>Third-Party Services:</strong> We use trusted providers: Clerk (auth), Stripe (payments), Cloudinary (background removal), and SculptOK (depth maps).
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">4. Data Sharing</h2>
            <div className="space-y-4 text-gray-300">
              <p>We <strong>do not sell</strong> your personal information. We only share data with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> Clerk, Stripe, Cloudinary, SculptOK - only as needed to provide services</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">5. Your Rights</h2>
            <div className="space-y-2 text-gray-300">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your account and data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, use our <Link href="/contact" className="text-blue-400 hover:underline">contact form</Link>.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">6. Cookies & Tracking</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                We use essential cookies for authentication and session management. We use localStorage for auto-saving your work.
              </p>
              <p>
                Third-party cookies from Clerk, Stripe, and analytics services may be used. You can control cookies through your browser settings.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">7. Children's Privacy</h2>
            <div className="text-gray-300">
              <p>
                Our service is not intended for children under 13. We do not knowingly collect information from children.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">8. Changes to This Policy</h2>
            <div className="text-gray-300">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the service.
              </p>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 mt-8">
            <h3 className="text-xl font-bold mb-2">Questions?</h3>
            <p className="text-gray-300 mb-4">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <div className="text-center">
              <Link href="/contact">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

