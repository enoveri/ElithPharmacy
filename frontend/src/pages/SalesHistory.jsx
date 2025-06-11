import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiDownload, FiEye, FiShoppingCart } from 'react-icons/fi';
import { mockData, mockHelpers } from '../lib/mockData';

function SalesHistory() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSearch = () => {
    // Trigger search effect
    setSearchTerm(searchTerm);
  };

  useEffect(() => {
    // In a real app, this would fetch from your backend
    setTransactions(mockData.recentTransactions);
    setFilteredTransactions(mockData.recentTransactions);
  }, []);

  useEffect(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toString().includes(searchTerm)
      );
    }

    // Apply date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        return date >= new Date(dateRange.start) && date <= new Date(dateRange.end);
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, dateRange, statusFilter, transactions]);

  const exportTransactions = () => {
    // In a real app, this would generate a CSV/PDF
    console.log('Exporting transactions:', filteredTransactions);
  };

  return (    <div className="p-6 pl-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Sales History</h2>
          <button
            onClick={() => navigate('/pos')}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <FiShoppingCart />
            Back to Point of Sale
          </button>
        </div>
        <button
          onClick={exportTransactions}
          className="btn btn-outline flex items-center gap-2"
        >
          <FiDownload />
          Export
        </button>
      </div>

      <div className="bg-[var(--color-bg-card)] p-4 rounded-lg shadow-[var(--shadow-card)]">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-6 mb-6">
          <div className="w-[320px] flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="   Search transactions..."
                className="form-input w-full pl-10 pr-4 py-2"
              />
            </div>
            <button 
              onClick={handleSearch}
              className="btn btn-primary px-4"
            >
              Search
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="form-input py-2"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="form-input py-2"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select py-2 border-gray-300"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto mt-8 border-t border-gray-200 pt-6">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[var(--color-border-light)]">
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-left">Amount</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-[var(--color-border-light)] hover:bg-[var(--color-bg-hover)]"
                >
                  <td className="py-3 px-4">{transaction.id}</td>
                  <td className="py-3 px-4">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">{transaction.customer}</td>
                  <td className="py-3 px-4">
                    {mockHelpers.formatCurrency(transaction.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                        mockHelpers.getStatusColor(transaction.status) === 'green'
                          ? 'bg-green-100 text-green-800'
                          : mockHelpers.getStatusColor(transaction.status) === 'yellow'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => navigate(`/sales/${transaction.id}`)}
                      className="btn btn-icon"
                      title="View Details"
                    >
                      <FiEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalesHistory;
