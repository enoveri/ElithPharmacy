import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiPackage, 
  FiAlertTriangle,
  FiCheck,
  FiEdit,
  FiEye,
  FiRefreshCw
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services';

const MobileInventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pullDistance, setPullDistance] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Pull-to-refresh state
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // Animation for pull-to-refresh
  const pullAnimation = useSpring({
    transform: `translateY(${Math.min(pullDistance, 100)}px)`,
    config: { tension: 300, friction: 30 }
  });

  const refreshIconAnimation = useSpring({
    transform: `rotate(${pullDistance * 3.6}deg)`,
    opacity: Math.min(pullDistance / 50, 1),
    config: { tension: 300, friction: 30 }
  });

  // Load products
  const loadProducts = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data = await dataService.products.getAll();
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products
  useEffect(() => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  // Pull-to-refresh handlers
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    setPullDistance(distance);
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 80) {
      setRefreshing(true);
      await loadProducts(false);
      
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
        setIsPulling(false);
      }, 1000);
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const getStockStatus = (product) => {
    const quantity = product.quantity || 0;
    const minStock = product.minStockLevel || 0;
    
    if (quantity === 0) return { status: 'out', color: '#ef4444', text: 'Out of Stock' };
    if (quantity <= minStock) return { status: 'low', color: '#f59e0b', text: 'Low Stock' };
    return { status: 'in', color: '#10b981', text: 'In Stock' };
  };

  const categories = [...new Set(products.map(p => p.category))];

  if (loading) {
    return (
      <div className="mobile-page">
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="mobile-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(isPulling || refreshing) && (
        <animated.div 
          style={pullAnimation}
          className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center py-4 bg-white shadow-sm"
        >
          <animated.div style={refreshIconAnimation}>
            <FiRefreshCw 
              className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`}
              style={{ color: pullDistance > 80 ? '#10b981' : '#6b7280' }}
            />
          </animated.div>
          <span className="ml-2 text-sm text-gray-600">
            {refreshing ? 'Refreshing...' : pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </animated.div>
      )}

      {/* Search and Add Button */}
      <div className="mobile-card p-4 mb-4">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mobile-input pl-10"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="mobile-button-secondary p-3"
          >
            <FiFilter className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mobile-input w-full"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/inventory/add')}
          className="mobile-button-primary w-full flex items-center justify-center gap-2"
        >
          <FiPlus className="w-5 h-5" />
          Add Product
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mobile-card p-4 text-center"
        >
          <FiPackage className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{products.length}</div>
          <div className="text-xs text-gray-500">Total</div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mobile-card p-4 text-center"
        >
          <FiCheck className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {products.filter(p => getStockStatus(p).status === 'in').length}
          </div>
          <div className="text-xs text-gray-500">In Stock</div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mobile-card p-4 text-center"
        >
          <FiAlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {products.filter(p => getStockStatus(p).status === 'low').length}
          </div>
          <div className="text-xs text-gray-500">Low Stock</div>
        </motion.div>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredProducts.map((product, index) => {
            const stockInfo = getStockStatus(product);
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="mobile-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{product.manufacturer}</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          ₦{product.price?.toFixed(2)}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          Qty: {product.quantity}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: stockInfo.color }}
                        />
                        <span 
                          className="text-xs font-medium"
                          style={{ color: stockInfo.color }}
                        >
                          {stockInfo.text}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigate(`/inventory/view/${product.id}`)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600"
                    >
                      <FiEye className="w-4 h-4" />
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigate(`/inventory/edit/${product.id}`)}
                      className="p-2 rounded-lg bg-gray-50 text-gray-600"
                    >
                      <FiEdit className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Add your first product to get started'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/inventory/add')}
              className="mobile-button-primary inline-flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Add Product
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default MobileInventory;
