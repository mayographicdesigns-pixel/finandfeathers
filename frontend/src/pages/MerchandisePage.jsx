import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, ShoppingBag, ExternalLink, Tag, Loader2, MapPin, ShoppingCart, Plus, Minus, X, Trash2, CheckCircle, CreditCard, Store } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from '../hooks/use-toast';
import { createCartCheckout, getCartOrderStatus, createStripeMerchCheckout, getStripeCheckoutStatus, pollStripePaymentStatus } from '../services/api';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MerchandisePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' or 'woocommerce'

  useEffect(() => {
    fetchProducts();
    // Load cart from localStorage
    const savedCart = localStorage.getItem('ff_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Check for order return (WooCommerce or Stripe)
  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const orderStatus = searchParams.get('order');
    const sessionId = searchParams.get('session_id');
    const payment = searchParams.get('payment');
    
    if (orderId && orderStatus === 'success') {
      checkOrderStatus(orderId);
    }
    
    // Handle Stripe payment return
    if (sessionId && payment === 'success') {
      handleStripePaymentReturn(sessionId);
    }
  }, [searchParams]);

  const handleStripePaymentReturn = async (sessionId) => {
    try {
      const result = await pollStripePaymentStatus(sessionId, 10, 2000);
      if (result.success) {
        setOrderSuccess(true);
        setCart([]);
        localStorage.removeItem('ff_cart');
        toast({ title: 'Order Confirmed!', description: 'Thank you for your purchase!' });
      }
      window.history.replaceState({}, '', '/merch');
    } catch (error) {
      console.error('Error checking Stripe payment:', error);
    }
  };

  const checkOrderStatus = async (orderId) => {
    try {
      const order = await getCartOrderStatus(orderId);
      if (order.status === 'paid') {
        setOrderSuccess(true);
        // Clear cart
        setCart([]);
        localStorage.removeItem('ff_cart');
        toast({ title: 'Order Confirmed!', description: 'Thank you for your purchase!' });
      }
      window.history.replaceState({}, '', '/merch');
    } catch (error) {
      console.error('Error checking order:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/merchandise`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ff_cart', JSON.stringify(cart));
  }, [cart]);

  // Get unique categories
  const categories = ['all', ...new Set(products.flatMap(p => p.categories || []))];

  // Filter products by category
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.categories?.includes(selectedCategory));

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast({ title: 'Added to Cart', description: `${product.name} added to your cart` });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: 'Cart Empty', description: 'Add some items to your cart first', variant: 'destructive' });
      return;
    }

    setCheckingOut(true);
    try {
      if (paymentMethod === 'stripe') {
        // Format cart items for Stripe
        const stripeItems = cart.map(item => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));
        const result = await createStripeMerchCheckout(stripeItems, customerEmail || null);
        window.location.href = result.checkout_url;
      } else {
        // WooCommerce checkout
        const result = await createCartCheckout(cart, customerEmail || null);
        window.location.href = result.checkout_url;
      }
    } catch (error) {
      toast({ title: 'Checkout Error', description: error.message, variant: 'destructive' });
      setCheckingOut(false);
    }
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
              onClick={() => setShowCart(true)}
              variant="outline"
              className="border-amber-600 text-amber-500 hover:bg-amber-600/10 relative"
              data-testid="cart-btn"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
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

      {/* Order Success Banner */}
      {orderSuccess && (
        <div className="bg-green-600/20 border-b border-green-600 py-4">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-400">Your order has been confirmed! Thank you for your purchase.</span>
          </div>
        </div>
      )}

      {/* Logo */}
      <div className="flex flex-col items-center pt-8 pb-4">
        <img 
          src="https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/cropped-fin-and-feathers-logo-2022-1.png"
          alt="Fin & Feathers"
          className="h-24 w-auto mb-4"
        />
        <h1 className="text-3xl font-bold text-white mb-2">
          <ShoppingBag className="inline w-8 h-8 mr-2 text-red-500" />
          F&F Merch Shop
        </h1>
        <p className="text-slate-400 text-center max-w-lg">
          Rep your favorite restaurant! Official Fin & Feathers merchandise.
        </p>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 px-4 py-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'All Products' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
            <p className="text-slate-400">Loading merchandise...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={fetchProducts} className="bg-red-600 hover:bg-red-700">
              Try Again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No merchandise available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="bg-slate-900 border-slate-700 overflow-hidden hover:border-red-600/50 transition-all group"
                data-testid={`product-${product.id}`}
              >
                <div className="aspect-square overflow-hidden bg-slate-800">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-slate-600" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p 
                      className="text-slate-400 text-sm mb-3 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  )}
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white">
                        ${product.price}
                      </span>
                      {product.sale_price && product.regular_price !== product.sale_price && (
                        <span className="text-sm text-slate-500 line-through">
                          ${product.regular_price}
                        </span>
                      )}
                    </div>
                    {!product.in_stock && (
                      <span className="text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => addToCart(product)}
                    disabled={!product.in_stock}
                    className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-700"
                    data-testid={`add-to-cart-${product.id}`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {product.in_stock ? 'Add to Cart' : 'Sold Out'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCart(false)}
          />
          <div className="relative w-full max-w-md bg-slate-900 h-full overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                <ShoppingCart className="inline w-5 h-5 mr-2" />
                Your Cart ({cartCount})
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Your cart is empty</p>
                </div>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 bg-slate-800 rounded-lg p-3">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-sm line-clamp-2">{item.name}</h3>
                        <p className="text-amber-500 font-bold">${item.price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center hover:bg-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-white w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center hover:bg-slate-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-slate-700 pt-4 space-y-4">
                    <div className="flex justify-between text-lg">
                      <span className="text-slate-400">Subtotal:</span>
                      <span className="text-white font-bold">${cartTotal.toFixed(2)}</span>
                    </div>

                    <div>
                      <label className="text-sm text-slate-400 block mb-1">Email (optional)</label>
                      <Input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>

                    <Button
                      onClick={handleCheckout}
                      disabled={checkingOut || cart.length === 0}
                      className="w-full bg-amber-600 hover:bg-amber-700 h-12 text-lg"
                      data-testid="checkout-btn"
                    >
                      {checkingOut ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-5 h-5 mr-2" />
                          Checkout ${cartTotal.toFixed(2)}
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-slate-500 text-center">
                      Secure payment via Fin & Feathers store
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-8 border-t border-slate-800">
        <p className="text-slate-500 text-sm">
          All purchases are processed securely through our official store.
        </p>
      </div>
    </div>
  );
};

export default MerchandisePage;
