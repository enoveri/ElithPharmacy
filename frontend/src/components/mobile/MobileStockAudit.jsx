import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar,
  FiPlay,
  FiPause,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiCheck,
  FiAlertTriangle,
  FiActivity,
  FiEye,
  FiEdit3,
  FiTrendingUp,
  FiTrendingDown,
  FiX,
  FiArrowLeft,
  FiSave,
  FiCheckCircle
} from 'react-icons/fi';
import { dataService } from '../../services';
import { useProductsStore, useSettingsStore } from '../../store';

const MobileStockAudit = () => {
  const navigate = useNavigate();
  const { products, fetchProducts, isLoading } = useProductsStore();
  const { settings } = useSettingsStore();
  const { currency = 'UGX' } = settings;

  // State management
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentAudit, setCurrentAudit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    lowStock: false,
    expiringSoon: false,
    varianceOnly: false,
    category: 'all'
  });
  const [sortBy, setSortBy] = useState('name');
  const [auditData, setAuditData] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Categories for filtering
  const categories = [
    'Pain Relief', 'Antibiotics', 'Vitamins & Supplements', 'Cold & Flu',
    'Digestive Health', 'Heart & Blood Pressure', 'Diabetes Care',
    'Skin Care', 'Eye Care', 'Other'
  ];

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle physical count updates
  const updatePhysicalCount = (productId, count) => {
    setAuditData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        physicalCount: parseInt(count) || 0,
        variance: (parseInt(count) || 0) - (getProductById(productId)?.quantity || 0)
      }
    }));
  };

  // Get product by ID
  const getProductById = (id) => products.find(p => p.id === id);

  // Calculate variance
  const getVariance = (productId) => {
    const audit = auditData[productId];
    const product = getProductById(productId);
    if (!audit || !product) return 0;
    return audit.physicalCount - product.quantity;
  };

  // Get status of audit item
  const getAuditStatus = (productId) => {
    const variance = getVariance(productId);
    if (!auditData[productId]) return 'pending';
    if (variance === 0) return 'matched';
    if (Math.abs(variance) >= 10) return 'critical';
    return 'variance';
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Search filter
      const matchesSearch = 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = filters.category === 'all' || product.category === filters.category;

      // Status filters
      let matchesFilters = true;
      if (filters.lowStock) {
        const minStock = product.min_stock_level || 10;
        matchesFilters = matchesFilters && product.quantity <= minStock;
      }
      if (filters.expiringSoon) {
        const expiryDate = product.expiry_date;
        if (expiryDate) {
          const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
          matchesFilters = matchesFilters && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        } else {
          matchesFilters = false;
        }
      }
      if (filters.varianceOnly) {
        matchesFilters = matchesFilters && getVariance(product.id) !== 0;
      }

      return matchesSearch && matchesCategory && matchesFilters;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'stock':
          return b.quantity - a.quantity;
        case 'variance':
          return Math.abs(getVariance(b.id)) - Math.abs(getVariance(a.id));
        default:
          return a.name?.localeCompare(b.name) || 0;
      }
    });

  // Calculate summary statistics
  const auditedItems = Object.keys(auditData).length;
  const totalVariance = Object.values(auditData).reduce((sum, item) => sum + (item.variance || 0), 0);

  // Start new audit
  const startNewAudit = () => {
    setCurrentAudit({
      id: Date.now(),
      startDate: new Date(),
      status: 'in_progress'
    });
    setAuditData({});
  };

  // Save draft functionality
  const saveDraft = async () => {
    try {
      const draftData = {
        audit_date: auditDate,
        audit_items: Object.entries(auditData).map(([productId, data]) => ({
          product_id: productId,
          system_stock: getProductById(productId)?.quantity || 0,
          physical_count: data.physicalCount,
          variance: data.variance,
          status: getAuditStatus(productId)
        })),
        total_items_audited: auditedItems,
        total_variance: totalVariance,
        status: 'draft',
        created_at: new Date().toISOString()
      };

      localStorage.setItem('stock_audit_draft', JSON.stringify(draftData));
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft. Please try again.');
    }
  };

  // Complete audit functionality
  const completeAudit = async () => {
    try {
      if (auditedItems === 0) {
        alert('Please audit at least one item before completing.');
        return;
      }

      const completeAuditData = {
        audit_date: auditDate,
        audit_items: Object.entries(auditData).map(([productId, data]) => ({
          product_id: productId,
          system_stock: getProductById(productId)?.quantity || 0,
          physical_count: data.physicalCount,
          variance: data.variance,
          status: getAuditStatus(productId)
        })),
        total_items_audited: auditedItems,
        total_variance: totalVariance,
        status: 'completed',
        completed_at: new Date().toISOString()
      };

      console.log('Completing audit:', completeAuditData);
      localStorage.removeItem('stock_audit_draft');
      
      alert('Audit completed successfully!');
      navigate('/inventory');
    } catch (error) {
      console.error('Error completing audit:', error);
      alert('Error completing audit. Please try again.');
    }
  };

  // Filter chip component
  const FilterChip = ({ active, onClick, children, icon: Icon }) => (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-blue-100 text-blue-800 border border-blue-200'
          : 'bg-gray-100 text-gray-600 border border-gray-200'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/inventory')}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Stock Audit</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            >
              <FiFilter className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 px-4 py-3 overflow-hidden"
            >
              <div className="space-y-3">
                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <FilterChip
                    active={filters.lowStock}
                    onClick={() => setFilters(prev => ({ ...prev, lowStock: !prev.lowStock }))}
                    icon={FiAlertTriangle}
                  >
                    Low Stock
                  </FilterChip>
                  <FilterChip
                    active={filters.expiringSoon}
                    onClick={() => setFilters(prev => ({ ...prev, expiringSoon: !prev.expiringSoon }))}
                    icon={FiActivity}
                  >
                    Expiring Soon
                  </FilterChip>
                  <FilterChip
                    active={filters.varianceOnly}
                    onClick={() => setFilters(prev => ({ ...prev, varianceOnly: !prev.varianceOnly }))}
                  >
                    Variance Only
                  </FilterChip>
                </div>

                {/* Category and Sort */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="name">Name</option>
                      <option value="stock">Stock Quantity</option>
                      <option value="variance">Variance</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Audit Controls */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <FiCalendar className="w-5 h-5 text-gray-500" />
          <input
            type="date"
            value={auditDate}
            onChange={(e) => setAuditDate(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={startNewAudit}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium"
          >
            <FiPlay className="w-4 h-4" />
            Start New Audit
          </button>
          <button
            onClick={() => console.log('Resume previous')}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            <FiPause className="w-4 h-4" />
            Resume Previous
          </button>
        </div>
      </div>

      {/* Product Cards */}
      <div className="p-4 space-y-3">
        {filteredProducts.map((product) => {
          const variance = getVariance(product.id);
          const status = getAuditStatus(product.id);
          
          return (
            <motion.div
              key={product.id}
              layout
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {product.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{product.batch_number}</p>
                  </div>
                </div>
                
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  status === 'matched' ? 'bg-green-100 text-green-800' :
                  status === 'critical' ? 'bg-red-100 text-red-800' :
                  status === 'variance' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {status === 'matched' && <FiCheck className="w-3 h-3" />}
                  {status === 'critical' && <FiAlertTriangle className="w-3 h-3" />}
                  {status === 'variance' && <FiActivity className="w-3 h-3" />}
                  {status === 'matched' ? 'Match' :
                   status === 'critical' ? 'Critical' :
                   status === 'variance' ? 'Variance' : 'Pending'}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">System</div>
                  <div className="font-semibold text-gray-900">{product.quantity || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Physical</div>
                  <input
                    type="number"
                    value={auditData[product.id]?.physicalCount || ''}
                    onChange={(e) => updatePhysicalCount(product.id, e.target.value)}
                    className="w-full px-2 py-1 text-center border border-gray-300 rounded font-semibold focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Variance</div>
                  <div className={`font-semibold flex items-center justify-center gap-1 ${
                    variance === 0 ? 'text-gray-500' :
                    variance > 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {variance > 0 && <FiTrendingUp className="w-4 h-4" />}
                    {variance < 0 && <FiTrendingDown className="w-4 h-4" />}
                    {variance !== 0 ? (variance > 0 ? '+' : '') + variance : '—'}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/inventory/view/${product.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
                >
                  <FiEye className="w-4 h-4" />
                  View
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg">
                  <FiEdit3 className="w-4 h-4" />
                  Adjust
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-30">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm">
            <span className="text-gray-600">Audited:</span>
            <span className="ml-2 font-semibold text-gray-900">{auditedItems}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Variance:</span>
            <span className={`ml-2 font-semibold ${totalVariance === 0 ? 'text-gray-900' : totalVariance > 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {totalVariance > 0 ? '+' : ''}{totalVariance}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={saveDraft}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
          >
            <FiSave className="w-4 h-4" />
            Save Draft
          </button>
          <button 
            onClick={completeAudit}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg"
          >
            <FiCheckCircle className="w-4 h-4" />
            Complete
          </button>
        </div>
      </div>

      {/* Add padding to account for fixed footer */}
      <div className="h-32"></div>
    </div>
  );
};

export default MobileStockAudit;