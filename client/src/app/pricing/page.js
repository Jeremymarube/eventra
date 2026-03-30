'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, Users, ArrowLeft } from 'lucide-react';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for getting started',
      features: [
        'Create up to 3 events per month',
        'Basic event customization',
        'Email notifications',
        'Community support',
        'Standard ticketing'
      ],
      limitations: [
        'Limited to 100 attendees per event',
        'Basic analytics only'
      ],
      popular: false,
      cta: 'Get Started Free'
    },
    {
      name: 'Pro',
      price: { monthly: 29, yearly: 290 },
      description: 'For growing event organizers',
      features: [
        'Unlimited events',
        'Advanced customization',
        'Real-time analytics',
        'Priority support',
        'Custom branding',
        'Mobile app access',
        'Advanced ticketing features',
        'Email marketing tools'
      ],
      limitations: [],
      popular: true,
      cta: 'Start Pro Trial'
    },
    {
      name: 'Enterprise',
      price: { monthly: 99, yearly: 990 },
      description: 'For large-scale event management',
      features: [
        'Everything in Pro',
        'Unlimited team members',
        'API access',
        'White-label solution',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced security features',
        '24/7 phone support',
        'Custom reporting'
      ],
      limitations: [],
      popular: false,
      cta: 'Contact Sales'
    }
  ];

  const faqs = [
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! We offer a 14-day free trial for Pro plans with full access to all features.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and M-Pesa payments.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Absolutely! You can cancel your subscription at any time with no cancellation fees.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-16">
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

          {/* Hero Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your event management needs. No hidden fees, no surprises.
            </p>

            {/* Billing Toggle */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  billingPeriod === 'yearly' ? 'bg-orange-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${billingPeriod === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Yearly
              </span>
              <Badge variant="secondary" className="ml-2">
                Save 20%
              </Badge>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan, index) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-border'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white px-3 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      ${plan.price[billingPeriod]}
                    </span>
                    {plan.price[billingPeriod] > 0 && (
                      <span className="text-muted-foreground ml-2">
                        /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, limitationIndex) => (
                      <li key={limitationIndex} className="flex items-center gap-3 text-muted-foreground">
                        <span className="text-xs">•</span>
                        <span className="text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${plan.popular ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    asChild={plan.name !== 'Enterprise'}
                  >
                    {plan.name === 'Enterprise' ? (
                      <Link href="/contact">
                        {plan.cta}
                      </Link>
                    ) : plan.name === 'Free' ? (
                      <Link href="/register">
                        {plan.cta}
                      </Link>
                    ) : (
                      <Link href="/register?plan=pro">
                        {plan.cta}
                      </Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Comparison */}
          <div className="rounded-lg border border-border p-8">
            <h2 className="text-2xl font-bold text-center mb-8">Compare Plans</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Event Creation
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Free</span>
                    <span>3/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pro</span>
                    <span>Unlimited</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enterprise</span>
                    <span>Unlimited</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Features
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Free</span>
                    <span>Basic</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pro</span>
                    <span>Advanced</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enterprise</span>
                    <span>All Features</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Support
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Free</span>
                    <span>Community</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pro</span>
                    <span>Priority</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enterprise</span>
                    <span>24/7 Dedicated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="rounded-lg border border-border p-6">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Join thousands of event organizers who trust Eventra to manage their events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/register">Start Free Trial</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
