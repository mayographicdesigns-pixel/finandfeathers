import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, ExternalLink, Tag, Loader2, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MerchandisePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

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

  // Get unique categories
  const categories = ['all', ...new Set(products.flatMap(p => p.categories || []))];

  // Filter products by category
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.categories?.includes(selectedCategory));

  const handleBuyNow = (product) => {
    window.open(product.permalink, '_blank');
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
                    onClick={() => handleBuyNow(product)}
                    disabled={!product.in_stock}
                    className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-700"
                    data-testid={`buy-${product.id}`}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {product.in_stock ? 'Buy Now' : 'Sold Out'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
