'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  BookOpen,
  Search,
  Users,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Lightbulb,
  Calendar,
  Ticket,
  Plus,
  ArrowLeft
} from 'lucide-react';

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState('getting-started');

  const helpCategories = [
    { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
    { id: 'account', title: 'Account & Profile', icon: Users },
    { id: 'events', title: 'Creating Events', icon: Calendar },
    { id: 'booking', title: 'Booking & Tickets', icon: Ticket },
    { id: 'technical', title: 'Technical Issues', icon: AlertTriangle },
    { id: 'contact', title: 'Contact Support', icon: MessageSquare },
  ];

  const faqs = {
    'getting-started': [
      {
        question: 'How do I create an account?',
        answer: 'Click the "Sign In" button in the top right corner and select "Create Account". Fill in your details and verify your email to get started.'
      },
      {
        question: 'What is Eventra?',
        answer: 'Eventra is a comprehensive event management platform that allows you to discover, create, and manage events. Whether you\'re organizing a small meetup or a large conference, Eventra has the tools you need.'
      },
      {
        question: 'How do I navigate the platform?',
        answer: 'Use the shortcuts dropdown (search icon) to quickly access key features, or use the main navigation menu. The header also shows your current location and provides quick access to create events and view notifications.'
      }
    ],
    'account': [
      {
        question: 'How do I update my profile?',
        answer: 'Go to your profile page using the dropdown menu in the header. You can update your name, email, phone, and upload a profile picture. All changes are saved automatically.'
      },
      {
        question: 'How do I change my password?',
        answer: 'Visit the Settings page from the profile dropdown menu. You can update your password and other account preferences there.'
      },
      {
        question: 'Can I delete my account?',
        answer: 'Account deletion requests can be made through our support team. Please contact us using the methods below, and we\'ll assist you with the process.'
      }
    ],
    'events': [
      {
        question: 'How do I create an event?',
        answer: 'Click the "Create Event" button in the header or use the shortcuts dropdown. Fill in event details including title, description, date/time, location, and upload an image. You can also set pricing and capacity limits.'
      },
      {
        question: 'What types of events can I create?',
        answer: 'You can create any type of event - from small meetups and workshops to large conferences and concerts. Choose appropriate categories and add detailed descriptions to attract attendees.'
      },
      {
        question: 'How do I promote my event?',
        answer: 'Use compelling descriptions, high-quality images, and clear event details. Share your event link on social media and encourage word-of-mouth promotion. Eventra\'s search and discovery features help attendees find your events.'
      }
    ],
    'booking': [
      {
        question: 'How do I book tickets?',
        answer: 'Browse events on the Discover page, click on an event you\'re interested in, and follow the booking process. You can pay using various methods including Stripe and M-Pesa.'
      },
      {
        question: 'Can I cancel my booking?',
        answer: 'Booking cancellation depends on the event organizer\'s policy. Check the event details or contact the organizer directly. Refunds are processed according to their refund policy.'
      },
      {
        question: 'How do I view my bookings?',
        answer: 'Access your bookings from the Profile page under the "My Bookings" tab. You can view booking details, download tickets, and track event updates.'
      }
    ],
    'technical': [
      {
        question: 'The website is not loading properly',
        answer: 'Try refreshing the page (Ctrl+F5 or Cmd+R). Clear your browser cache and cookies, or try a different browser. If the issue persists, contact our technical support.'
      },
      {
        question: 'I\'m having trouble uploading images',
        answer: 'Ensure your image file is under 5MB and in JPG, PNG, or GIF format. Check your internet connection and try again. If issues continue, our support team can help.'
      },
      {
        question: 'Notifications are not working',
        answer: 'Check your browser settings to ensure notifications are enabled for Eventra. You can also view all notifications from the bell icon in the header.'
      }
    ],
    'contact': [
      {
        question: 'How do I contact customer support?',
        answer: 'You can reach us through multiple channels: email support@eventra.com, use the contact form below, or call our support line during business hours.'
      },
      {
        question: 'What are your support hours?',
        answer: 'Our customer support team is available Monday-Friday, 9 AM - 6 PM EAT (East Africa Time). For urgent technical issues, we provide 24/7 emergency support.'
      },
      {
        question: 'How quickly will I get a response?',
        answer: 'Email inquiries are typically responded to within 24 hours. Urgent issues through our contact form receive priority handling, often within 2-4 hours during business hours.'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Navigation */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle className="h-8 w-8 text-blue-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Help Center
              </h1>
            </div>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Find answers to common questions and get the help you need to make the most of Eventra.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">Help Topics</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    {helpCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            selectedCategory === category.id
                              ? 'bg-slate-800 text-blue-400 border-r-2 border-blue-400'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{category.title}</span>
                          <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${
                            selectedCategory === category.id ? 'rotate-90' : ''
                          }`} />
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-slate-900 border-slate-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-400" />
                    Quick Help
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start">
                    <Link href="/discover">
                      <Search className="h-4 w-4 mr-2" />
                      Browse Events
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800">
                    <Link href="/events/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800">
                    <Link href="/profile">
                      <Users className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {helpCategories.find(cat => cat.id === selectedCategory)?.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" className="w-full">
                    {faqs[selectedCategory]?.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={`item-${index}`}
                        className="border-slate-700"
                      >
                        <AccordionTrigger className="text-left hover:text-blue-400">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-300">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {(!faqs[selectedCategory] || faqs[selectedCategory].length === 0) && (
                    <div className="text-center py-12 text-slate-400">
                      <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Content coming soon</p>
                      <p>We're working on adding more help content for this topic.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Support Section */}
              <Card className="bg-slate-900 border-slate-700 mt-8">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-green-400" />
                    Still Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-slate-300">
                    Can't find what you're looking for? Our support team is here to help you succeed with Eventra.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors">
                      <Mail className="h-8 w-8 mx-auto mb-3 text-blue-400" />
                      <h3 className="font-semibold mb-2">Email Support</h3>
                      <p className="text-sm text-slate-400 mb-3">
                        Get detailed help via email
                      </p>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Mail className="h-4 w-4 mr-2" />
                        support@eventra.com
                      </Button>
                    </div>

                    <div className="text-center p-4 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors">
                      <Phone className="h-8 w-8 mx-auto mb-3 text-green-400" />
                      <h3 className="font-semibold mb-2">Phone Support</h3>
                      <p className="text-sm text-slate-400 mb-3">
                        Speak directly with our team
                      </p>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Phone className="h-4 w-4 mr-2" />
                        +254 714 569 590
                      </Button>
                    </div>

                    <div className="text-center p-4 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors">
                      <MessageSquare className="h-8 w-8 mx-auto mb-3 text-purple-400" />
                      <h3 className="font-semibold mb-2">Live Chat</h3>
                      <p className="text-sm text-slate-400 mb-3">
                        Instant help via chat
                      </p>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Start Chat
                      </Button>
                    </div>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      Support Hours
                    </h3>
                    <p className="text-sm text-slate-300">
                      <strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM EAT<br />
                      <strong>Saturday:</strong> Closed (Emergency support available)
                      <strong>Sunday:</strong> Closed (Emergency support available)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
