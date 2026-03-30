'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Shield, Users, CreditCard, Mail } from 'lucide-react';

export default function TermsPage() {
  const lastUpdated = 'February 24, 2026';

  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      <Header />

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex flex-col gap-8">
          {/* Back Navigation */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-6">
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
            <p className="mt-4 text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Introduction */}
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-lg leading-relaxed">
                  Welcome to Eventra! These Terms of Service ("Terms") govern your use of our event management platform.
                  By accessing or using Eventra, you agree to be bound by these Terms. If you disagree with any part of these terms,
                  then you may not access the service.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms Sections */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  1. User Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ul className="space-y-2">
                    <li>You must be at least 18 years old to create an account</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You must provide accurate and complete information when creating your account</li>
                    <li>You are solely responsible for all activities that occur under your account</li>
                    <li>Eventra reserves the right to suspend or terminate accounts that violate these terms</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  2. Acceptable Use
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p>You agree not to use Eventra to:</p>
                  <ul className="space-y-2">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on the rights of others</li>
                    <li>Distribute harmful, offensive, or inappropriate content</li>
                    <li>Spam other users or send unsolicited communications</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Create events that promote violence, discrimination, or illegal activities</li>
                    <li>Use automated tools to access our service without permission</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  3. Payment and Billing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ul className="space-y-2">
                    <li>All fees are non-refundable unless otherwise stated in our refund policy</li>
                    <li>You authorize us to charge your payment method for recurring subscriptions</li>
                    <li>Prices are subject to change with 30 days notice</li>
                    <li>Late payments may result in service suspension</li>
                    <li>All taxes are your responsibility</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  4. Event Creation and Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ul className="space-y-2">
                    <li>You are responsible for the accuracy and legality of your event information</li>
                    <li>You must have the right to host and promote the events you create</li>
                    <li>Eventra reserves the right to remove events that violate our policies</li>
                    <li>You are responsible for managing refunds and cancellations for your events</li>
                    <li>All ticket sales are final unless otherwise specified by the event organizer</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  5. Intellectual Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ul className="space-y-2">
                    <li>Eventra retains all rights to our platform, software, and branding</li>
                    <li>You retain rights to your event content and materials</li>
                    <li>You grant Eventra a license to display and promote your events</li>
                    <li>You may not copy, modify, or reverse engineer our software</li>
                    <li>All user-generated content must respect intellectual property rights</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  6. Privacy and Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ul className="space-y-2">
                    <li>Your privacy is important to us. Please review our Privacy Policy</li>
                    <li>We collect and process data as described in our Privacy Policy</li>
                    <li>You consent to our data processing practices by using our service</li>
                    <li>We implement reasonable security measures to protect your data</li>
                    <li>You are responsible for the personal data you collect from event attendees</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Termination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ul className="space-y-2">
                    <li>Either party may terminate this agreement at any time</li>
                    <li>Eventra may suspend or terminate your account for violations of these terms</li>
                    <li>Upon termination, your right to use the service ceases immediately</li>
                    <li>We may retain your data as required by law or for legitimate business purposes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Disclaimers and Limitations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ul className="space-y-2">
                    <li>Eventra is provided "as is" without warranties of any kind</li>
                    <li>We do not guarantee uninterrupted or error-free service</li>
                    <li>We are not liable for indirect, incidental, or consequential damages</li>
                    <li>Our total liability is limited to the amount you paid us in the past 12 months</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ul className="space-y-2">
                    <li>We may update these terms at any time</li>
                    <li>Material changes will be communicated via email or platform notification</li>
                    <li>Continued use of our service constitutes acceptance of updated terms</li>
                    <li>You should review these terms periodically</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p>
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <ul className="space-y-2">
                    <li>Email: legal@eventra.com</li>
                    <li>Address: [Your Business Address]</li>
                    <li>Phone: [Your Phone Number]</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-border">
            <Button variant="outline" asChild>
              <Link href="/privacy">View Privacy Policy</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button asChild>
              <Link href="/">Back to Eventra</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
