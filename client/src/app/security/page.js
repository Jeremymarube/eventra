'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Lock } from 'lucide-react';

export default function SecurityPage() {
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
              <Lock className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Security Policy</h1>
            <p className="mt-4 text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Introduction */}
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-lg leading-relaxed">
                  Security is paramount at Eventra. We are committed to protecting your data and ensuring the integrity of our platform. This Security Policy outlines our security measures, practices, and commitments to safeguard your information.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Measures */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">1. Security Measures</h2>
              <h3 className="text-xl font-medium mb-3">Infrastructure Security</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Multi-layered firewall protection</li>
                <li>24/7 network monitoring and intrusion detection</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>DDoS protection and traffic filtering</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">Data Encryption</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>End-to-end encryption for data in transit (TLS 1.3)</li>
                <li>AES-256 encryption for data at rest</li>
                <li>Secure key management and rotation</li>
                <li>Encrypted backups and disaster recovery</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">Application Security</h3>
              <p className="leading-relaxed">
                Our application undergoes rigorous security testing including code reviews, penetration testing, and automated security scanning. We follow secure development practices and regularly update dependencies to address known vulnerabilities.
              </p>
            </CardContent>
          </Card>

          {/* Access Controls */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">2. Access Controls</h2>
              <ul className="list-disc pl-6">
                <li>Multi-factor authentication (MFA) for all user accounts</li>
                <li>Role-based access control (RBAC) for administrative functions</li>
                <li>Least privilege principle applied to all system access</li>
                <li>Regular access reviews and automated account deactivation</li>
                <li>Secure password policies and credential management</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">3. Data Protection</h2>
              <h3 className="text-xl font-medium mb-3">Payment Security</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>PCI DSS compliance for payment processing</li>
                <li>Tokenization of sensitive payment data</li>
                <li>Secure payment gateway integration</li>
                <li>Regular security assessments by third-party auditors</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">User Data Protection</h3>
              <p className="leading-relaxed">
                We implement comprehensive data protection measures including data classification, retention policies, and secure deletion procedures. All user data is handled according to our Privacy Policy and applicable data protection regulations.
              </p>
            </CardContent>
          </Card>

          {/* Incident Response */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">4. Incident Response</h2>
              <p className="leading-relaxed mb-4">
                We maintain a comprehensive incident response plan that includes:
              </p>
              <ul className="list-disc pl-6">
                <li>Dedicated security incident response team</li>
                <li>24/7 monitoring for security events</li>
                <li>Automated alerts and escalation procedures</li>
                <li>Coordinated response with law enforcement when appropriate</li>
                <li>Transparent communication with affected users</li>
                <li>Post-incident analysis and improvement measures</li>
              </ul>
            </CardContent>
          </Card>

          {/* Compliance and Certifications */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">5. Compliance and Certifications</h2>
              <ul className="list-disc pl-6">
                <li>SOC 2 Type II compliance</li>
                <li>ISO 27001 information security management</li>
                <li>GDPR compliance for EU users</li>
                <li>CCPA compliance for California residents</li>
                <li>Regular third-party security audits</li>
                <li>Industry-standard security frameworks implementation</li>
              </ul>
            </CardContent>
          </Card>

          {/* Employee Security Training */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">6. Employee Security Training</h2>
              <p className="leading-relaxed">
                All Eventra employees undergo comprehensive security training including phishing awareness, secure coding practices, and incident response procedures. We conduct regular security awareness programs and maintain strict background checks for all personnel with access to sensitive systems.
              </p>
            </CardContent>
          </Card>

          {/* Third-Party Security */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">7. Third-Party Security</h2>
              <p className="leading-relaxed">
                We carefully vet all third-party vendors and service providers for security practices. Contracts include security requirements, and we conduct regular assessments of vendor security controls. Any third-party access to user data is strictly controlled and monitored.
              </p>
            </CardContent>
          </Card>

          {/* Reporting Security Issues */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">8. Reporting Security Issues</h2>
              <p className="leading-relaxed mb-4">
                We encourage responsible disclosure of security vulnerabilities. If you discover a security issue, please report it to:
              </p>
              <div className="bg-slate-800 p-4 rounded-lg">
                <p className="text-foreground"><strong>Email:</strong> security@eventra.com</p>
                <p className="text-foreground"><strong>Phone:</strong> (555) 123-4567</p>
                <p className="text-foreground"><strong>Response Time:</strong> Within 24 hours</p>
              </div>
              <p className="leading-relaxed mt-4">
                We appreciate your help in keeping Eventra secure and will acknowledge your report within 24 hours.
              </p>
            </CardContent>
          </Card>

          {/* Security Updates */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">9. Security Updates</h2>
              <p className="leading-relaxed">
                This Security Policy is reviewed and updated regularly to reflect changes in our security practices and emerging threats. We will notify users of significant security updates through our platform and email communications.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
              <p className="leading-relaxed mb-4">
                For security-related questions or concerns, please contact our security team:
              </p>
              <div className="bg-slate-800 p-4 rounded-lg">
                <p className="text-foreground"><strong>Email:</strong> security@eventra.com</p>
                <p className="text-foreground"><strong>Phone:</strong> (555) 123-4567</p>
                <p className="text-foreground"><strong>Address:</strong> 123 Event Street, Event City, EC 12345</p>
              </div>
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/privacy">
              <Button variant="outline" className="w-full sm:w-auto">
                Privacy Policy
              </Button>
            </Link>
            <Link href="/terms">
              <Button variant="outline" className="w-full sm:w-auto">
                Terms of Service
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="w-full sm:w-auto">
                Contact Support
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
