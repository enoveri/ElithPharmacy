import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiMinus, FiTrash2, FiUser, FiShoppingCart, FiList, FiRotateCcw } from 'react-icons/fi';
import { mockData, mockHelpers } from '../lib/mockData';

function POS() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Initialize products from mock data
  useEffect(() => {
    const products = mockData.topProducts.map(p => ({
      ...p,
      price: p.revenue / p.sales, // Calculate average price
      stock: 100 // Mock stock value
    }));
    setFilteredProducts(products);
  }, []);

  // Filter products based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(mockData.topProducts.map(p => ({
        ...p,
        price: p.revenue / p.sales,
        stock: 100
      })));
      return;
    }
    
    const filtered = mockData.topProducts
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(p => ({
        ...p,
        price: p.revenue / p.sales,
        stock: 100
      }));
    setFilteredProducts(filtered);
  }, [searchTerm]);

  // Cart operations
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    const existing = cart.find(item => item.id === productId);
    if (existing.quantity > 1) {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.id !== productId));
    }
  };

  const clearCart = () => setCart([]);

  // Calculate totals
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Handle transaction completion
  const completeSale = () => {
    if (cart.length === 0) return;

    // Create transaction record
    const transaction = {
      id: Date.now(),
      date: new Date().toISOString(),
      customer: customer?.name || 'Walk-in Customer',
      amount: cartTotal,
      status: 'completed',
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }))
    };

    // In a real app, we would save this to the backend
    console.log('Transaction completed:', transaction);
    
    // Clear cart and customer
    clearCart();
    setCustomer(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Point of Sale</h2>
          <button
            onClick={() => navigate('/sales-history')}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <FiList />
            View Sales History
          </button>
          <button
            onClick={() => navigate('/refunds')}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <FiRotateCcw />
            Process Refund
          </button>
        </div>
        <button
          onClick={() => setShowCustomerModal(true)}
          className="btn btn-outline flex items-center gap-2"
        >
          <FiUser />
          {customer ? customer.name : 'Select Customer'}
        </button>
      </div>

      <div className="flex space-x-6 mobile-stack">
        {/* Products Section */}
        <div className="w-2/3 bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-card)] rounded-[var(--radius-xl)]">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="form-input w-full pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-4 border border-[var(--color-border-light)] rounded-lg hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors"
              >
                <h3 className="font-medium mb-2">{product.name}</h3>
                <div className="flex justify-between text-sm">
                  <span>{mockHelpers.formatCurrency(product.price)}</span>
                  <span className="text-gray-500">Stock: {product.stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-1/3 bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-card)] rounded-[var(--radius-xl)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              Cart <span className="text-sm text-gray-500">({itemCount} items)</span>
            </h3>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-600"
              >
                <FiTrash2 />
              </button>
            )}
          </div>

          <div className="mb-4 max-h-[400px] overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b">
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <div className="text-sm text-gray-500">
                    {mockHelpers.formatCurrency(item.price)} × {item.quantity}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{mockHelpers.formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{mockHelpers.formatCurrency(cartTotal)}</span>
            </div>
          </div>

          <button
            onClick={completeSale}
            disabled={cart.length === 0}
            className="mt-4 btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <FiShoppingCart />
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
}

export default POS;