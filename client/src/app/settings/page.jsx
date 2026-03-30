'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Bell,
  Lock,
  CreditCard,
  Globe,
  Moon,
  Sun,
  Mail,
  Save,
  AlertTriangle,
  Upload
} from 'lucide-react';
import { api } from '@/lib/api/api';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    // Profile Settings
    profile: {
      name: '',
      email: '',
      phone: '',
      location: '',
      bio: '',
      website: ''
    },
    // Notification Settings
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      eventReminders: true,
      marketingEmails: false,
      newsletter: true,
      bookingConfirmations: true
    },
    // Privacy Settings
    privacy: {
      profileVisibility: 'public', // public, friends, private
      showEmail: false,
      showPhone: false,
      allowMessaging: true,
      showActivity: true
    },
    // Security Settings
    security: {
      twoFactorEnabled: false,
      sessionTimeout: '24h',
      loginAlerts: true
    },
    // Appearance Settings
    appearance: {
      theme: 'system', // light, dark, system
      language: 'en',
      timezone: 'UTC+3'
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [showAddEmail, setShowAddEmail] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      await api.delete('/auth/me');
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });
      // Logout and redirect to login
      logout();
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCard = () => {
    toast({
      title: 'Add Payment Method',
      description: 'Payment method integration would open here.',
    });
  };

  const handleConnectMpesa = () => {
    toast({
      title: 'Connect M-Pesa',
      description: 'M-Pesa integration would open here.',
    });
  };

  const handleLearnMore = () => {
    toast({
      title: 'Eventra Plus',
      description: 'Learn more about Eventra Plus features and pricing.',
    });
  };

  const handleGetApp = () => {
    window.open('https://apps.apple.com/app/eventra', '_blank');
  };

  const handleSetPassword = () => {
    toast({
      title: 'Set Password',
      description: 'Password setup flow would start here.',
    });
  };

  const handleAddPasskey = () => {
    toast({
      title: 'Add Passkey',
      description: 'Passkey creation would start here.',
    });
  };

  const handleAddCalendarSync = () => {
    toast({
      title: 'Calendar Sync',
      description: 'Calendar integration setup would open here.',
    });
  };

  const handleEnableContactSync = () => {
    toast({
      title: 'Contact Sync',
      description: 'Google contacts sync would be enabled.',
    });
  };

  const handleAddEmail = async () => {
    // Add email logic here
  };

  const handleSaveSettings = async (section) => {
    // Save settings logic here
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Mock data - replace with actual API call
        setSettings(prev => ({
          ...prev,
          profile: {
            name: user?.name || 'John Doe',
            email: user?.email || 'john@example.com',
            phone: '+254 712 345 678',
            location: 'Nairobi, Kenya',
            bio: 'Event enthusiast passionate about technology and community gatherings.',
            website: 'https://johndoe.dev'
          }
        }));
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <div className="min-h-screen bg-slate-950">
            <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </main>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="min-h-screen bg-slate-950">
          <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your account settings and preferences
              </p>
            </div>

            {/* Settings Tabs */}
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
              </TabsList>

              {/* Account Settings */}
              <TabsContent value="account" className="space-y-8">
                {/* Your Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Choose how you are displayed as a host or guest.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Picture */}
                    <div className="space-y-2">
                      <Label>Profile Picture</Label>
                      <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400 mb-2">No file chosen</p>
                        <input type="file" accept="image/*" className="hidden" id="profile-pic" />
                        <label htmlFor="profile-pic" className="cursor-pointer text-blue-400 hover:text-blue-300">
                          Choose file
                        </label>
                      </div>
                    </div>

                    {/* Name Fields */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="Jeremy" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Doe" />
                      </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 border border-r-0 border-input rounded-l-md bg-muted text-muted-foreground">
                          @
                        </span>
                        <Input id="username" className="rounded-l-none" />
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md bg-background text-sm"
                        placeholder="Share a little about your background and interests."
                        rows={3}
                      />
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                      <Label>Social Links</Label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">instagram.com/</span>
                          <Input placeholder="username" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">x.com/</span>
                          <Input placeholder="username" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">youtube.com/@</span>
                          <Input placeholder="username" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">tiktok.com/@</span>
                          <Input placeholder="username" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">linkedin.com</span>
                          <Input placeholder="/in/handle" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Your website</Label>
                          <Input id="website" placeholder="https://" />
                        </div>
                      </div>
                    </div>

                    <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleSaveSettings('Profile')}>
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>

                {/* Emails */}
                <Card>
                  <CardHeader>
                    <CardTitle>Emails</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Add additional emails to receive event invites sent to those addresses.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" onClick={() => setShowAddEmail(true)}>
                      Add Email
                    </Button>

                    {showAddEmail && (
                      <div className="space-y-3 mt-4 p-4 border border-slate-600 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="newEmail">New Email Address</Label>
                          <Input
                            id="newEmail"
                            type="email"
                            placeholder="Enter email address"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddEmail} disabled={saving}>
                            {saving ? 'Adding...' : 'Add Email'}
                          </Button>
                          <Button variant="outline" onClick={() => setShowAddEmail(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Phone Number */}
                <Card>
                  <CardHeader>
                    <CardTitle>Phone Number</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Manage the phone number you use to sign in to Eventra and receive SMS updates.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" defaultValue="+254 714 569590" />
                    </div>
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" onClick={() => handleSaveSettings('Phone')}>
                      Update
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      For your security, we will send you a code to verify any change to your phone number.
                    </p>
                  </CardContent>
                </Card>

                {/* Password & Security */}
                <Card>
                  <CardHeader>
                    <CardTitle>Password & Security</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Secure your account with password and two-factor authentication.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Account Password</Label>
                      <p className="text-sm text-muted-foreground">
                        Please follow the instructions in the email to finish setting your password.
                      </p>
                      <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" onClick={handleSetPassword}>
                        Set Password
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Please set a password before enabling two-factor authentication.
                      </p>
                      <Button variant="outline" disabled className="border-slate-600 text-slate-500">
                        Enable 2FA
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Passkeys</Label>
                      <p className="text-sm text-muted-foreground">
                        Passkeys are a secure and convenient way to sign in.
                      </p>
                      <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" onClick={handleAddPasskey}>
                        Add Passkey
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Third Party Accounts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Third Party Accounts</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Link your accounts to sign in to Eventra and automate your workflows.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: 'Google', status: 'Not Linked' },
                      { name: 'Apple', status: 'Not Linked' },
                      { name: 'Zoom', status: 'Not Linked' },
                      { name: 'Solana', status: 'Not Linked' },
                      { name: 'Ethereum', status: 'Not Linked' }
                    ].map((account) => (
                      <div key={account.name} className="flex items-center justify-between p-4 border border-slate-600 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold">
                            {account.name[0]}
                          </div>
                          <span className="font-medium">{account.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{account.status}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Account Syncing */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Syncing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Calendar Syncing</Label>
                      <p className="text-sm text-muted-foreground">
                        Sync your Eventra events with your Google, Outlook, or Apple calendar.
                      </p>
                      <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" onClick={handleAddCalendarSync}>
                        Add iCal Subscription
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Sync Contacts with Google</Label>
                      <p className="text-sm text-muted-foreground">
                        Sync your Gmail contacts to easily invite them to your events.
                      </p>
                      <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" onClick={handleEnableContactSync}>
                        Enable Syncing
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Devices */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Devices</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      See the list of devices you are currently signed into Eventra from.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-slate-600 rounded-lg">
                      <div>
                        <p className="font-medium">Chrome on Windows</p>
                        <p className="text-sm text-muted-foreground">This Device</p>
                        <p className="text-xs text-muted-foreground">Nairobi, KE</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delete Account */}
                <Card className="border-red-600">
                  <CardHeader>
                    <CardTitle className="text-red-400">Delete Account</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      If you no longer wish to use Eventra, you can permanently delete your account.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={handleDeleteAccount}>
                      Delete My Account
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Settings */}
              <TabsContent value="preferences" className="space-y-8">
                {/* Display */}
                <Card>
                  <CardHeader>
                    <CardTitle>Display</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Choose your desired Eventra interface.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => updateSetting('appearance', 'theme', 'system')}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          settings.appearance.theme === 'system'
                            ? 'border-orange-500 bg-orange-500/10 text-white'
                            : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${
                            settings.appearance.theme === 'system' ? 'bg-orange-500' : 'bg-slate-600'
                          }`} />
                          <div>
                            <div className="font-medium">System</div>
                            <div className="text-sm opacity-70">Automatically switch between light and dark themes</div>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateSetting('appearance', 'theme', 'light')}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          settings.appearance.theme === 'light'
                            ? 'border-orange-500 bg-orange-500/10 text-white'
                            : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${
                            settings.appearance.theme === 'light' ? 'bg-orange-500' : 'bg-slate-600'
                          }`} />
                          <div>
                            <div className="font-medium">Light</div>
                            <div className="text-sm opacity-70">Always use the light theme</div>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateSetting('appearance', 'theme', 'dark')}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          settings.appearance.theme === 'dark'
                            ? 'border-orange-500 bg-orange-500/10 text-white'
                            : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${
                            settings.appearance.theme === 'dark' ? 'bg-orange-500' : 'bg-slate-600'
                          }`} />
                          <div>
                            <div className="font-medium">Dark</div>
                            <div className="text-sm opacity-70">Always use the dark theme</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Language */}
                <Card>
                  <CardHeader>
                    <CardTitle>Language</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                        <option>English</option>
                        <option>Español</option>
                        <option>Français</option>
                        <option>Deutsch</option>
                        <option>Kiswahili</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Choose how you would like to be notified about updates, invites and subscriptions.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Get Eventra for iOS */}
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <h3 className="font-medium mb-2">Get Eventra for iOS</h3>
                      <p className="text-sm text-slate-400 mb-4">
                        Stay in the know and receive notifications through the Eventra app.
                      </p>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleGetApp}>
                        Get the App
                      </Button>
                    </div>

                    <div className="p-4 bg-slate-800 rounded-lg">
                      <h3 className="font-medium mb-2">Eventra Plus</h3>
                      <p className="text-sm text-slate-400 mb-4">
                        Unlock exclusive features and perks.
                      </p>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white w-fit" onClick={handleLearnMore}>
                        Learn More
                      </Button>
                    </div>

                    {/* Events You Attend */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Events You Attend</h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Event Invites</Label>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-sm text-slate-400">Email, WhatsApp</span>
                            <Switch defaultChecked />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Event Reminders</Label>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-sm text-slate-400">Email, WhatsApp</span>
                            <Switch defaultChecked />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Event Blasts</Label>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-sm text-slate-400">Email, WhatsApp</span>
                            <Switch defaultChecked />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Event Updates</Label>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-sm text-slate-400">Email</span>
                            <Switch defaultChecked />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Feedback Requests</Label>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-sm text-slate-400">Email</span>
                            <Switch />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Events You Host */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Events You Host</h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Guest Registrations</Label>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-sm text-slate-400">Email</span>
                            <Switch defaultChecked />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Feedback Responses</Label>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-sm text-slate-400">Email</span>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calendars You Manage */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Calendars You Manage</h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">New Members</Label>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-sm text-slate-400">Email</span>
                            <Switch defaultChecked />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Event Submissions</Label>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-sm text-slate-400">Email</span>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Eventra */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Eventra</h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Product Updates</Label>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-sm text-slate-400">Email</span>
                            <Switch />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Your Subscriptions */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Your Subscriptions</h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Eventra Discovery Pages</Label>
                            <p className="text-sm text-slate-400">0 Pages</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </div>

                    {/* Calendars */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Calendars</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage notification preferences for calendars you follow.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment Settings */}
              <TabsContent value="payment" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Methods
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Your saved payment methods are encrypted and stored securely by Stripe.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Connected Payment Methods</Label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 border border-slate-600 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                S
                              </div>
                              <div>
                                <p className="font-medium">•••• •••• •••• 4242</p>
                                <p className="text-sm text-muted-foreground">Expires 12/26</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" onClick={handleAddCard}>
                          Add Card
                        </Button>
                        <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" onClick={handleConnectMpesa}>
                          Connect M-Pesa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </main>
    </div>
  );
}
