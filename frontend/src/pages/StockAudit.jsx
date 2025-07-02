import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FiBarChart,
  FiGrid,
  FiList,
  FiDownload,
  FiX
} from 'react-icons/fi';
import { dataService } from '../services';
import { useProductsStore, useSettingsStore } from '../store';

const StockAudit = () => {
  const navigate = useNavigate();
  const { products, fetchProducts, isLoading } = useProductsStore();
  const { settings } = useSettingsStore();
  const { currency = 'UGX' } = settings;

  // State management
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentAudit, setCurrentAudit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    lowStock: false,
    expiringSoon: false,
    varianceOnly: false,
    category: 'all'
  });
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('table');
  const [auditData, setAuditData] = useState({});
  const [showFilters, setShowFilters] = useState(false);

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
  const estimatedValue = totalVariance * 5000; // Rough estimate

  // Start new audit
  const startNewAudit = () => {
    setCurrentAudit({
      id: Date.now(),
      startDate: new Date(),
      status: 'in_progress'
    });
    setAuditData({});
  };

  // Resume previous audit
  const resumePreviousAudit = () => {
    // In a real app, this would load from storage/database
    console.log('Resuming previous audit...');
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
        estimated_value_impact: estimatedValue,
        status: 'draft',
        created_at: new Date().toISOString()
      };

      // Save to localStorage for now, later replace with API call
      localStorage.setItem('stock_audit_draft', JSON.stringify(draftData));
      console.log('Draft saved successfully', draftData);
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft. Please try again.');
    }
  };

  // Export to CSV functionality
  const exportToCSV = () => {
    try {
      const headers = [
        'Product Name',
        'Batch Number',
        'Category',
        'System Stock',
        'Physical Count',
        'Variance',
        'Status',
        'Audit Date'
      ];

      const csvData = filteredProducts.map(product => {
        const variance = getVariance(product.id);
        const status = getAuditStatus(product.id);
        const physicalCount = auditData[product.id]?.physicalCount || '';
        
        return [
          product.name || '',
          product.batch_number || '',
          product.category || '',
          product.quantity || 0,
          physicalCount,
          variance,
          status === 'matched' ? 'Matched' :
          status === 'critical' ? 'Critical' :
          status === 'variance' ? 'Variance' : 'Pending',
          auditDate
        ];
      });

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `stock_audit_${auditDate}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
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
        estimated_value_impact: estimatedValue,
        status: 'completed',
        completed_at: new Date().toISOString()
      };

      // Save completed audit (replace with API call)
      console.log('Completing audit:', completeAuditData);
      
      // Clear draft
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
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-800 border border-blue-200'
          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Audit</h1>
            <p className="text-gray-600 mt-1">Perform comprehensive inventory audits and track variances</p>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Inventory
          </button>
        </div>

        {/* Audit Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <FiCalendar className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Audit Date:</label>
                <input
                  type="date"
                  value={auditDate}
                  onChange={(e) => setAuditDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={startNewAudit}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <FiPlay className="w-4 h-4" />
                Start New Audit
              </button>
              <button
                onClick={resumePreviousAudit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <FiPause className="w-4 h-4" />
                Resume Previous
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
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
            icon={FiBarChart}
          >
            Variance Only
          </FilterChip>
          
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="appearance-none bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5 pr-8 text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Sort and View Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Name</option>
                <option value="stock">Stock Quantity</option>
                <option value="variance">Variance</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <FiList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">System Stock</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Physical Count</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Variance</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const variance = getVariance(product.id);
                  const status = getAuditStatus(product.id);
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {product.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.batch_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-gray-900">{product.quantity || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={auditData[product.id]?.physicalCount || ''}
                          onChange={(e) => updatePhysicalCount(product.id, e.target.value)}
                          className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 font-medium ${
                          variance === 0 ? 'text-gray-500' :
                          variance > 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {variance > 0 && <FiTrendingUp className="w-4 h-4" />}
                          {variance < 0 && <FiTrendingDown className="w-4 h-4" />}
                          {variance !== 0 ? (variance > 0 ? '+' : '') + variance : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'matched' ? 'bg-green-100 text-green-800' :
                          status === 'critical' ? 'bg-red-100 text-red-800' :
                          status === 'variance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {status === 'matched' && <FiCheck className="w-3 h-3" />}
                          {status === 'critical' && <FiAlertTriangle className="w-3 h-3" />}
                          {status === 'variance' && <FiActivity className="w-3 h-3" />}
                          {status === 'matched' ? 'Matched' :
                           status === 'critical' ? 'Critical' :
                           status === 'variance' ? 'Variance' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/inventory/view/${product.id}`)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Adjust Stock"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const variance = getVariance(product.id);
            const status = getAuditStatus(product.id);
            
            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {product.name?.charAt(0)?.toUpperCase()}
                    </span>
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
                
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.batch_number}</p>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">System Stock:</span>
                    <span className="font-medium">{product.quantity || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Physical Count:</span>
                    <input
                      type="number"
                      value={auditData[product.id]?.physicalCount || ''}
                      onChange={(e) => updatePhysicalCount(product.id, e.target.value)}
                      className="w-16 px-2 py-1 text-right border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Variance:</span>
                    <span className={`font-medium ${
                      variance === 0 ? 'text-gray-500' :
                      variance > 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {variance !== 0 ? (variance > 0 ? '+' : '') + variance : '—'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/inventory/view/${product.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FiEye className="w-4 h-4" />
                    View
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    <FiEdit3 className="w-4 h-4" />
                    Adjust
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-600">Items Audited:</span>
              <span className="ml-2 font-semibold text-gray-900">{auditedItems}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Variance:</span>
              <span className={`ml-2 font-semibold ${totalVariance === 0 ? 'text-gray-900' : totalVariance > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {totalVariance > 0 ? '+' : ''}{totalVariance}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Estimated Impact:</span>
              <span className={`ml-2 font-semibold ${estimatedValue === 0 ? 'text-gray-900' : estimatedValue > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {estimatedValue > 0 ? '+' : ''}{currency} {Math.abs(estimatedValue).toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={saveDraft}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Save Draft
            </button>
            <button 
              onClick={completeAudit}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Complete Audit
            </button>
          </div>
        </div>
      </div>

      {/* Add padding to account for fixed summary bar */}
      <div className="h-20"></div>
    </div>
  );
};

export default StockAudit;
