import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Calendar, MapPin, Clock, Users, Ticket, CreditCard, Loader2, CheckCircle, Star, Music, Wine, Phone, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from '../hooks/use-toast';
import { 
  getEventPackages, 
  createStripeEventCheckout, 
  createFreeEventReservation,
  getStripeCheckoutStatus,
  pollStripePaymentStatus,
  getPublicEvents,
  getPageContent
} from '../services/api';

const API_URL = window.location.origin;

// Fallback events if API returns empty
const FALLBACK_EVENTS = [
  {
    id: 'friday-night-live',
    name: 'Friday Night Live',
    description: 'Live DJ, dancing, and signature cocktails every Friday night! Experience the best nightlife in Atlanta.',
    date: 'Every Friday',
    time: '9PM - 2AM',
    location: 'Edgewood (Atlanta)',
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6657.jpg',
    featured: true,
    packages: ['general', 'vip', 'table']
  },
  {
    id: 'brunch-beats',
    name: 'Brunch & Beats',
    description: 'Sunday brunch with a twist! Live DJ spinning feel-good music while you enjoy our famous chicken & waffles.',
    date: 'Every Sunday',
    time: '11AM - 4PM',
    location: 'All Locations',
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/a3e08521f140462cbedf10dedd32f879.jpeg',
    featured: false,
    packages: ['general', 'vip']
  },
  {
    id: 'wine-wednesday',
    name: 'Wine Down Wednesday',
    description: 'Half-price bottles of wine paired with live acoustic performances. The perfect midweek escape.',
    date: 'Every Wednesday',
    time: '6PM - 10PM',
    location: 'Midtown (Atlanta)',
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6656.jpg',
    featured: false,
    packages: ['general']
  }
];

const EventsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState({});
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState('general');
  const [quantity, setQuantity] = useState(1);
  const [customerEmail, setCustomerEmail] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [pageContent, setPageContent] = useState({});
  const heroHtml = pageContent.hero || 'From live music to exclusive tastings, discover unforgettable experiences at Fin & Feathers.';

  useEffect(() => {
    fetchData();
    checkPaymentReturn();
  }, []);

  const fetchData = async () => {
    try {
      const [packagesData, eventsData, contentData, locsData] = await Promise.all([
        getEventPackages(),
        getPublicEvents(),
        getPageContent('events'),
        fetch(`${API_URL}/api/locations`).then(r => r.json()).catch(() => [])
      ]);
      setPackages(packagesData);
      setEvents(eventsData.length > 0 ? eventsData : FALLBACK_EVENTS);
      setLocations(locsData);
      const map = {};
      (contentData || []).forEach((entry) => {
        map[entry.section_key] = entry.html || '';
      });
      setPageContent(map);
    } catch (error) {
      console.error('Error fetching data:', error);
      setEvents(FALLBACK_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentReturn = async () => {
    const sessionId = searchParams.get('session_id');
    const paymentStatus = searchParams.get('payment');
    const type = searchParams.get('type');

    if (sessionId && paymentStatus === 'success' && type === 'event') {
      try {
        const result = await pollStripePaymentStatus(sessionId, 10, 2000);
        if (result.success) {
          setPurchaseSuccess(true);
          toast({ 
            title: 'Tickets Purchased!', 
            description: 'Check your email for confirmation and ticket details.' 
          });
        }
      } catch (error) {
        console.error('Error checking payment:', error);
      }
      window.history.replaceState({}, '', '/events');
    }
  };

  const handlePurchaseTickets = async () => {
    if (!selectedEvent) {
      toast({ title: 'Error', description: 'Please select an event', variant: 'destructive' });
      return;
    }

    const totalAmount = getTotalPrice();
    setIsPurchasing(true);
    try {
      if (totalAmount <= 0) {
        const result = await createFreeEventReservation({
          event_id: selectedEvent.id,
          package_id: selectedPackage,
          quantity,
          email: customerEmail || null
        });
        toast({ title: 'Reservation Confirmed', description: 'Opening reservation SMS...' });
        setPurchaseSuccess(true);
        setSelectedEvent(null);
        window.location.href = result?.reservation_link || '/locations';
        return;
      }

      const userProfile = localStorage.getItem('userProfile');
      const userId = userProfile ? JSON.parse(userProfile).id : null;
      
      const result = await createStripeEventCheckout(selectedPackage, quantity, userId, selectedEvent.id, customerEmail || null);
      window.location.href = result.checkout_url;
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsPurchasing(false);
    }
  };

  const getPackagePrice = (event, packageId) => {
    if (!event) return packages[packageId]?.amount || 0;
    const eventPrices = event.package_prices || {};
    const eventPrice = eventPrices[packageId];
    if (eventPrice !== undefined && eventPrice !== null) {
      return parseFloat(eventPrice) || 0;
    }
    return packages[packageId]?.amount || 0;
  };

  const getEventStartingPrice = (event) => {
    if (!event || !event.packages || event.packages.length === 0) return 0;
    const prices = event.packages.map(pkgId => getPackagePrice(event, pkgId));
    return Math.min(...prices);
  };

  const formatPrice = (value) => {
    if (value <= 0) return 'Free';
    return `$${value.toFixed(2)}`;
  };

  const getTotalPrice = () => {
    if (!selectedEvent) return 0;
    return getPackagePrice(selectedEvent, selectedPackage) * quantity;
  };

  const totalPrice = getTotalPrice();

  const getReservationPhone = (event) => {
    if (!event) return null;
    const slug = event.location_slug;
    if (!slug || slug === 'all-locations') return null;
    const loc = locations.find(l => l.slug === slug);
    return loc?.reservation_phone || loc?.phone || null;
  };

  const getReservationSmsLink = (event) => {
    const phone = getReservationPhone(event);
    if (!phone) return null;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Hi, I'd like to reserve for ${event.name} (${event.date}, ${event.time}).`);
    return `sms:${cleanPhone}?body=${msg}`;
  };

  const isFreeEntry = (event) => {
    if (!event) return false;
    if (event.free_entry) return true;
    const startingPrice = getEventStartingPrice(event);
    return startingPrice <= 0;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/95 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="border-red-600 text-red-500 hover:bg-red-600/10"
            data-testid="home-btn"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/locations')}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              data-testid="locations-btn"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Locations
            </Button>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {purchaseSuccess && (
        <div className="bg-green-600/20 border-b border-green-600 py-4">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-400">Your tickets have been purchased! Check your email for details.</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative py-16 px-4 text-center bg-gradient-to-b from-red-900/20 to-black">
        <img 
          src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
          alt="Fin & Feathers"
          className="max-h-32 md:max-h-40 w-auto mx-auto mb-6 object-contain cursor-pointer"
          onClick={() => navigate('/')}
          data-testid="events-logo"
        />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          <Calendar className="inline w-10 h-10 mr-3 text-red-500" />
          Events & Experiences
        </h1>
        <div
          className="text-slate-300 text-lg max-w-2xl mx-auto"
          data-testid="page-content-events-hero"
          dangerouslySetInnerHTML={{ __html: heroHtml }}
        />
      </div>

      {/* Featured Event */}
      {events.filter(e => e.featured).map(event => (
        <div key={event.id} className="max-w-7xl mx-auto px-4 mb-12">
          <Card className="overflow-hidden bg-gradient-to-r from-red-900/30 to-slate-900 border-red-600/30">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img 
                  src={event.image} 
                  alt={event.name}
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
              <CardContent className="md:w-1/2 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-yellow-500 text-sm font-semibold uppercase tracking-wide">Featured Event</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">{event.name}</h2>
                <p className="text-slate-300 mb-4">{event.description}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4 text-red-500" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4 text-red-500" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedEvent(event)}
                  className="bg-red-600 hover:bg-red-700 text-white w-full md:w-auto"
                  data-testid={`get-tickets-${event.id}`}
                >
                  {isFreeEntry(event) ? (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Reserve — Free Entry
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4 mr-2" />
                      Get Tickets - From {formatPrice(getEventStartingPrice(event))}
                    </>
                  )}
                </Button>
              </CardContent>
            </div>
          </Card>
        </div>
      ))}

      {/* All Events Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
          <Music className="w-6 h-6 text-red-500" />
          Upcoming Events
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <Card 
              key={event.id} 
              className="overflow-hidden bg-slate-800/50 border-slate-700 hover:border-red-600/50 transition-all duration-300 group cursor-pointer"
              onClick={() => setSelectedEvent(event)}
              data-testid={`event-card-${event.id}`}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {event.featured && (
                  <div className="absolute top-3 left-3 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Featured
                  </div>
                )}
              </div>
              <CardContent className="p-5">
                <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                <div className="space-y-1 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{event.time}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-500 font-semibold">
                    {isFreeEntry(event) ? 'Free Entry' : `From ${formatPrice(getEventStartingPrice(event))}`}
                  </span>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700" data-testid={`event-tickets-btn-${event.id}`}>
                    {isFreeEntry(event) ? (
                      <>
                        <MapPin className="w-3 h-3 mr-1" />
                        Reserve
                      </>
                    ) : (
                      <>
                        <Ticket className="w-3 h-3 mr-1" />
                        Tickets
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Ticket / Reservation Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-700 w-full max-w-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedEvent.name}</h2>
                  <p className="text-slate-400 text-sm">{selectedEvent.date} • {selectedEvent.time}</p>
                  {selectedEvent.location && (
                    <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {selectedEvent.location}
                    </p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedEvent(null)}
                  className="text-slate-400 hover:text-white"
                  data-testid="close-ticket-modal-btn"
                >
                  ✕
                </Button>
              </div>

              {isFreeEntry(selectedEvent) ? (
                /* FREE ENTRY - Reserve via Text */
                <div>
                  <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-5 text-center mb-4">
                    <p className="text-green-400 text-2xl font-bold mb-1">Free Entry</p>
                    <p className="text-slate-400 text-sm">No tickets required — just reserve your spot!</p>
                  </div>

                  {getReservationPhone(selectedEvent) ? (
                    <div className="space-y-3">
                      <p className="text-slate-300 text-sm text-center">Text to reserve your spot:</p>
                      <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-center gap-3">
                        <Phone className="w-5 h-5 text-red-400" />
                        <span className="text-white text-xl font-bold tracking-wide" data-testid="reservation-phone">
                          {getReservationPhone(selectedEvent)}
                        </span>
                      </div>
                      <a
                        href={getReservationSmsLink(selectedEvent)}
                        className="block"
                        data-testid="reservation-sms-link"
                      >
                        <Button className="w-full bg-red-600 hover:bg-red-700 py-6 text-lg">
                          <MessageSquare className="w-5 h-5 mr-2" />
                          Text to Reserve
                        </Button>
                      </a>
                      <p className="text-xs text-slate-500 text-center">
                        Opens your messaging app with a pre-filled reservation request
                      </p>
                    </div>
                  ) : selectedEvent.location_slug === 'all-locations' ? (
                    <div className="space-y-3">
                      <p className="text-slate-300 text-sm text-center mb-3">Text any location to reserve:</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {locations.filter(l => l.reservation_phone).map(loc => {
                          const cleanPhone = loc.reservation_phone.replace(/[^0-9]/g, '');
                          const msg = encodeURIComponent(`Hi, I'd like to reserve for ${selectedEvent.name} (${selectedEvent.date}, ${selectedEvent.time}).`);
                          return (
                            <a
                              key={loc.id}
                              href={`sms:${cleanPhone}?body=${msg}`}
                              className="flex items-center justify-between bg-slate-800 rounded-lg p-3 hover:bg-slate-700 transition-colors"
                              data-testid={`reserve-${loc.slug}`}
                            >
                              <div>
                                <p className="text-white text-sm font-medium">{loc.name?.replace('Fin & Feathers - ', '')}</p>
                                <p className="text-slate-400 text-xs">{loc.reservation_phone}</p>
                              </div>
                              <MessageSquare className="w-4 h-4 text-red-400" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm text-center">
                      Walk-ins welcome! No reservation needed.
                    </p>
                  )}
                </div>
              ) : (
                /* PAID EVENT - Ticket Purchase */
                <>
                  {/* Package Selection */}
                  <div className="mb-6">
                    <label className="text-sm text-slate-300 mb-2 block">Select Package</label>
                    <div className="space-y-2">
                      {selectedEvent.packages.map(pkgId => (
                        <button
                          key={pkgId}
                          onClick={() => setSelectedPackage(pkgId)}
                          className={`w-full p-4 rounded-lg border transition-all ${
                            selectedPackage === pkgId
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                          }`}
                          data-testid={`ticket-package-${pkgId}-btn`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-left">
                              <p className="text-white font-semibold">{packages[pkgId]?.name || pkgId}</p>
                              <p className="text-slate-400 text-sm">{packages[pkgId]?.description}</p>
                            </div>
                            <span className="text-red-500 font-bold text-lg">{formatPrice(getPackagePrice(selectedEvent, pkgId))}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mb-6">
                    <label className="text-sm text-slate-300 mb-2 block">Number of Tickets</label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="border-slate-600"
                        data-testid="ticket-qty-minus"
                      >
                        -
                      </Button>
                      <span className="text-white text-xl font-bold w-8 text-center" data-testid="ticket-qty-value">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                        className="border-slate-600"
                        data-testid="ticket-qty-plus"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Email (optional) */}
                  <div className="mb-6">
                    <label className="text-sm text-slate-300 mb-2 block">Email (for ticket confirmation)</label>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-slate-800 border-slate-700 text-white"
                      data-testid="ticket-email-input"
                    />
                  </div>

                  {/* Total & Purchase */}
                  <div className="border-t border-slate-700 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-slate-300">Total</span>
                      <span className="text-2xl font-bold text-white" data-testid="ticket-total-amount">{formatPrice(totalPrice)}</span>
                    </div>
                    
                    <Button
                      onClick={handlePurchaseTickets}
                      disabled={isPurchasing}
                      className="w-full bg-red-600 hover:bg-red-700 py-6 text-lg"
                      data-testid="purchase-tickets-btn"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Purchase Tickets
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-slate-500 text-center mt-3">
                      Secure checkout powered by Stripe
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
