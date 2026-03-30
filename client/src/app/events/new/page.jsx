'use client'

// This is the **event creator/organizer interface**. It provides a
// multi‑step form for defining a new event. It does _not_ render any of
// the booking/checkout components that attendees see; those live under
// `/events/[id]` and `/checkout`. Keeping the two views completely
// separate avoids confusion during development.

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext.jsx'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { CalendarIcon, MapPinIcon, UsersIcon, CreditCardIcon, SparklesIcon, ImageIcon, MinusCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner';
import { api } from '@/lib/api/api'
import eventService from '@/lib/api/events'
import { categories as defaultCategories } from '@/data/mockData'

export default function CreateEventPage() {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [categories, setCategories] = useState(defaultCategories)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    image: null,
    imageFile: null,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isPublic: true,
    capacityType: 'unlimited',
    capacity: '',
    paymentMethod: 'free',
    requiresApproval: false,
    category: '',
    tags: ''
  })

  // tickets array used in tickets tab
  const [ticketTypes, setTicketTypes] = useState([
    { name: 'Regular', price: '', quantity: '' }
  ])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // validation flags
  const isDetailsValid = useMemo(() => {
    return (
      formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.startDate &&
      formData.startTime &&
      formData.location.trim() !== '' &&
      formData.category !== ''
    )
  }, [formData]);

  const isTicketsValid = useMemo(() => {
    // free events don't require ticket types; paid events do
    if (formData.paymentMethod === 'free') {
      return true;
    }
    return ticketTypes.some(t => t.name.trim() && t.price !== '' && t.quantity !== '');
  }, [ticketTypes, formData.paymentMethod]);

  // fetch category list from server
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories')
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data)
        } else {
          setCategories(defaultCategories)
        }
      } catch (err) {
        console.error('Failed to load categories', err)
        setCategories(defaultCategories)
      }
    }
    fetchCategories()
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: URL.createObjectURL(file),
        imageFile: file
      }))
    }
  }

  const generateAISuggestions = async () => {
    if (!formData.title) return
    setIsGeneratingAI(true)
    
    setTimeout(() => {
      const suggestion = `Join us for ${formData.title}! 🎉\n\nWe're bringing together amazing people for an unforgettable experience. Whether you're a seasoned professional or just getting started, this event offers something for everyone.\n\nWhat to expect:\n• Inspiring conversations\n• Networking opportunities\n• Hands-on activities\n• Great food and vibes\n\nDon't miss out – save your spot today! ✨`
      
      setFormData(prev => ({
        ...prev,
        description: suggestion
      }))
      setIsGeneratingAI(false)
    }, 1500)
  }

  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // construct payload
      const startDateTime = formData.startDate && formData.startTime
        ? new Date(`${formData.startDate}T${formData.startTime}`)
        : null
      const endDateTime = formData.endDate && formData.endTime
        ? new Date(`${formData.endDate}T${formData.endTime}`)
        : null

      const totalSeats = formData.capacityType === 'limited'
        ? parseInt(formData.capacity || '0', 10)
        : 0
      // compute a sensible default price for the event.  the backend
      // uses the `price` field when reserving individual seats, so when
      // the organizer has defined one or more ticket tiers we take the
      // price of the first tier. for simple general‑admission events the
      // frontend also sends a `tickets` array; the backend ignores it if
      // the event has reserved seating (total_seats > 0).
      let price = 0
      if (formData.paymentMethod !== 'free' && ticketTypes.length > 0) {
        price = Number(ticketTypes[0].price) || 0
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        date: startDateTime ? startDateTime.toISOString() : undefined,
        venue: formData.location,
        price,
        total_seats: totalSeats,
        category_id: formData.category ? parseInt(formData.category, 10) : undefined,
        // additional optional fields the backend ignores
        is_public: formData.isPublic,
        requires_approval: formData.requiresApproval,
        created_by: user?.id || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
        tickets: formData.paymentMethod === 'free'
          ? []
          : ticketTypes.map(t => ({
              name: t.name,
              price: Number(t.price) || 0,
              quantity: Number(t.quantity) || 0
            }))
      }

      // basic validation
      if (!payload.title || !payload.description || !payload.date || !payload.venue || !payload.category_id) {
        alert('Please fill in all required fields (title, description, date, location, category)')
        setIsSubmitting(false)
        return
      }

      // if image file present attach separately; eventService handles FormData
      if (formData.imageFile) {
        payload.image = formData.imageFile
      }

      const created = await eventService.createEvent(payload)
      // after publishing send the organizer back to the dashboard/home
      // page where they typically land when signing in. the event will
      // still show up under the events listing if needed.
      toast.success('Event published successfully!');
      router.push('/home');
    } catch (error) {
      console.error('Failed to create event:', error);
      // build a helpful message
      let msg = 'Failed to create event. Please try again.';
      if (error.response) {
        // server responded with non-2xx
        msg = error.response.data?.message || `Server returned ${error.response.status}`;
      } else if (error.request) {
        // request was made but no response
        msg = 'Network error: unable to reach the server. Please try again.';
      } else if (error.message) {
        msg = error.message;
      }
      alert(msg);
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Create New Event
              </h1>
              <p className="text-sm text-blue-200 mt-1">
                Fill in the details and publish your event
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full border-slate-700 text-slate-300 hover:text-white">
                Save draft
              </Button>
              <Button 
                type="submit" 
                form="event-form"
                disabled={isSubmitting}
                className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isSubmitting ? 'Publishing...' : 'Publish event'}
              </Button>
            </div>
          </div>
          
          {/* Progress tabs */}
          <div className="flex gap-8 mt-6">
            {['details', 'tickets', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-sm font-medium capitalize transition-all relative ${
                  activeTab === tab 
                    ? 'text-white' 
                    : 'text-blue-300 hover:text-white'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          <form id="event-form" onSubmit={handleSubmit}>
            {/* DETAILS TAB */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                {/* Cover Image */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
                      <ImageIcon className="w-4 h-4" />
                      Event Cover Image
                    </label>
                    <div 
                      className="relative group cursor-pointer border-2 border-dashed border-slate-700 rounded-2xl p-8 transition-all hover:border-blue-400"
                      onClick={() => document.getElementById('cover-image')?.click()}
                    >
                      <input
                        id="cover-image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {formData.image ? (
                        <div className="relative aspect-video rounded-xl overflow-hidden">
                          <img 
                            src={formData.image} 
                            alt="Cover preview" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Badge variant="secondary" className="bg-white text-gray-900">
                              Click to change
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-400 mb-1">
                            Drag and drop or <span className="text-blue-400">browse</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            Recommended: 1200x630px (JPG, PNG, GIF)
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Info */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-sm font-medium text-slate-300">
                          Event Title
                        </label>
                        <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">Required</Badge>
                      </div>
                      <Input
                        name="title"
                        placeholder="e.g., Product Launch 2024, Design Workshop, etc."
                        value={formData.title}
                        onChange={handleChange}
                        className="text-lg border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-400 rounded-xl"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-sm font-medium text-slate-300">
                          Category
                        </label>
                      </div>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData(prev => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger className="rounded-xl border-slate-700 bg-slate-800 text-white">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Date & Time */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarIcon className="w-5 h-5 text-slate-400" />
                      <h3 className="font-medium text-white">Date & Time</h3>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Start</label>
                        <Input
                          type="date"
                          name="startDate"
                          onChange={handleChange}
                          className="rounded-xl border-slate-700 bg-slate-800 text-white"
                        />
                        <Input
                          type="time"
                          name="startTime"
                          onChange={handleChange}
                          className="rounded-xl border-slate-700 bg-slate-800 text-white"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">End</label>
                        <Input
                          type="date"
                          name="endDate"
                          onChange={handleChange}
                          className="rounded-xl border-slate-700 bg-slate-800 text-white"
                        />
                        <Input
                          type="time"
                          name="endTime"
                          onChange={handleChange}
                          className="rounded-xl border-slate-700 bg-slate-800 text-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPinIcon className="w-5 h-5 text-slate-400" />
                      <h3 className="font-medium text-white">Location</h3>
                    </div>
                    
                    <Input
                      name="location"
                      placeholder="Enter venue address or virtual meeting link"
                      value={formData.location}
                      onChange={handleChange}
                      className="rounded-xl border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      You can add a physical address or a video call link
                    </p>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-white">Description</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generateAISuggestions}
                        disabled={isGeneratingAI}
                        className="text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                      >
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
                      </Button>
                    </div>
                    
                    <Textarea
                      name="description"
                      placeholder="Tell people about your event. What makes it special? What will they learn or experience?"
                      rows={8}
                      value={formData.description}
                      onChange={handleChange}
                      className="rounded-xl border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 resize-none"
                    />
                    
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">Markdown supported</Badge>
                      <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">Max 5000 characters</Badge>
                    </div>
                  </CardContent>
                </Card>
                </div>

              {/* navigation for details */}
              <div className="flex justify-between mt-6">
                <div />
                <Button
                  type="button"
                  onClick={() => setActiveTab('tickets')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

            {/* TICKETS TAB */}
{activeTab === 'tickets' && (
  <div className="space-y-6">
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-medium text-white">Ticket Types & Pricing</h3>
        <p className="text-slate-400 text-sm">
          Define ticket categories like Regular, VIP, VVIP and set prices for each tier.
        </p>

        {formData.paymentMethod === 'free' ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h4 className="font-semibold text-white mb-2">Free event</h4>
            <p className="text-slate-400">
              This event is free and does not require ticket purchases.
              Attendees can register without payment.
            </p>
          </div>
        ) : (
          <>
            {ticketTypes.map((ticket, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2 items-end">
                <Input
                  placeholder="Regular, VIP, VVIP"
                  value={ticket.name}
                  onChange={(e) => {
                    const newTickets = [...ticketTypes];
                    newTickets[idx].name = e.target.value;
                    setTicketTypes(newTickets);
                  }}
                  className="rounded-xl border-slate-700 bg-slate-800 text-white"
                />
                <Input
                  placeholder="Price"
                  type="number"
                  value={ticket.price}
                  onChange={(e) => {
                    const newTickets = [...ticketTypes];
                    newTickets[idx].price = e.target.value;
                    setTicketTypes(newTickets);
                  }}
                  className="rounded-xl border-slate-700 bg-slate-800 text-white"
                />
                <Input
                  placeholder="Quantity"
                  type="number"
                  value={ticket.quantity}
                  onChange={(e) => {
                    const newTickets = [...ticketTypes];
                    newTickets[idx].quantity = e.target.value;
                    setTicketTypes(newTickets);
                  }}
                  className="rounded-xl border-slate-700 bg-slate-800 text-white"
                />
                {ticketTypes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => {
                      const newTickets = ticketTypes.filter((_, index) => index !== idx);
                      setTicketTypes(newTickets);
                    }}
                  >
                    <MinusCircle className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ))}

            {formData.paymentMethod !== 'free' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTicketTypes(prev => [...prev, { name: '', price: '', quantity: '' }])}
                className="text-blue-400 hover:text-blue-300"
              >
                + Add ticket type
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>

    {/* navigation for tickets */}
    <div className="flex justify-between mt-6">
      <Button
        type="button"
        onClick={() => setActiveTab('details')}
        className="bg-slate-600 hover:bg-slate-700 text-white"
      >
        Back
      </Button>
      <Button
        type="button"
        onClick={() => setActiveTab('settings')}
        disabled={!isTicketsValid}
        className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </Button>
    </div>
  </div>
)}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Visibility */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <h3 className="font-medium text-white mb-4">Event Visibility</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                        <div>
                          <p className="font-medium text-sm text-white">Public event</p>
                          <p className="text-xs text-slate-400">Anyone can find and join</p>
                        </div>
                        <Switch
                          checked={formData.isPublic}
                          onCheckedChange={(checked) =>
                            setFormData(prev => ({ ...prev, isPublic: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                        <div>
                          <p className="font-medium text-sm text-white">Require approval</p>
                          <p className="text-xs text-slate-400">Manually approve attendees</p>
                        </div>
                        <Switch
                          checked={formData.requiresApproval}
                          onCheckedChange={(checked) =>
                            setFormData(prev => ({ ...prev, requiresApproval: checked }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Capacity */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <UsersIcon className="w-5 h-5 text-slate-400" />
                      <h3 className="font-medium text-white">Capacity</h3>
                    </div>
                    <Select
                      value={formData.capacityType}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, capacityType: value }))
                      }
                    >
                      <SelectTrigger className="rounded-xl border-slate-700 bg-slate-800 text-white mb-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="unlimited">Unlimited</SelectItem>
                        <SelectItem value="limited">Limited capacity</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.capacityType === 'limited' && (
                      <Input
                        name="capacity"
                        type="number"
                        placeholder="Maximum number of attendees"
                        onChange={handleChange}
                        className="rounded-xl border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Payment method notice */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCardIcon className="w-5 h-5 text-slate-400" />
                      <h3 className="font-medium text-white">Payment</h3>
                    </div>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, paymentMethod: value }))
                      }
                    >
                      <SelectTrigger className="rounded-xl border-slate-700 bg-slate-800 text-white">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="free">Free event</SelectItem>
                        <SelectItem value="stripe">Paid (Stripe)</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.paymentMethod !== 'free' && (
                      <div className="mt-4 p-4 bg-blue-900/50 rounded-xl">
                        <p className="text-sm text-blue-300">
                          You'll set up ticket types and pricing in the previous step.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <h3 className="font-medium text-white mb-4">Tags</h3>
                    <Input
                      name="tags"
                      placeholder="e.g., tech, music, art (comma separated)"
                      value={formData.tags}
                      onChange={handleChange}
                      className="rounded-xl border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                    />
                  </CardContent>
                </Card>

                {/* Preview & Publish */}
                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('tickets')}
                    className="bg-slate-600 hover:bg-slate-700 text-white"
                  >
                    Back
                  </Button>
                </div>
                <Card className="border-0 bg-gradient-to-br from-blue-600 to-indigo-600">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-white mb-2">Ready to publish?</h3>
                    <p className="text-sm text-blue-100 mb-4">
                      Your event will be visible to thousands of people looking for amazing experiences.
                    </p>
                    <Button 
                      variant="secondary" 
                      className="w-full bg-white text-blue-600 hover:bg-blue-50 rounded-xl"
                    >
                      Preview event page
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}