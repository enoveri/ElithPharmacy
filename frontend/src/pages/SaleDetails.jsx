import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPrinter, FiRefreshCcw, FiArrowLeft, FiShoppingCart } from 'react-icons/fi';
import { mockData, mockHelpers } from '../lib/mockData';

function SaleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    // In a real app, this would fetch from your backend
    const found = mockData.recentTransactions.find(t => t.id.toString() === id);
    if (found) {
      setTransaction({
        ...found,
        items: [
          {
            id: 1,
            name: 'Paracetamol',
            quantity: 2,
            price: 10.00,
            total: 20.00
          },
          {
            id: 2,
            name: 'Amoxicillin',
            quantity: 1,
            price: 15.50,
            total: 15.50
          }
        ]
      });
    }
  }, [id]);

  const handlePrint = () => {
    // In a real app, this would generate a printable receipt
    window.print();
  };

  const handleRefund = () => {
    // In a real app, this would process the refund
    console.log('Processing refund for transaction:', id);
    navigate('/refunds');
  };

  if (!transaction) {
    return (
      <div className="p-6">
        <div className="text-center">Transaction not found</div>
      </div>
    );
  }

  return (    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/sales')}
            className="btn btn-icon"
            title="Go Back"
          >
            <FiArrowLeft />
          </button>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Sale Details #{transaction.id}
          </h2>
          <button
            onClick={() => navigate('/pos')}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <FiShoppingCart />
            Back to POS
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiPrinter />
            Print Receipt
          </button>
          {transaction.status === 'completed' && (
            <button
              onClick={handleRefund}
              className="btn btn-danger flex items-center gap-2"
            >
              <FiRefreshCcw />
              Process Refund
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-bg-card)] p-4 rounded-lg shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-4">Transaction Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span>{new Date(transaction.date).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span>{transaction.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
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
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] p-4 rounded-lg shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-4">Payment Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{mockHelpers.formatCurrency(transaction.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tax</span>
              <span>{mockHelpers.formatCurrency(transaction.amount * 0.1)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{mockHelpers.formatCurrency(transaction.amount * 1.1)}</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] p-4 rounded-lg shadow-[var(--shadow-card)] md:col-span-2">
          <h3 className="font-semibold mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[var(--color-border-light)]">
                  <th className="py-3 px-4 text-left">Product</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items?.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--color-border-light)]"
                  >
                    <td className="py-3 px-4">{item.name}</td>
                    <td className="py-3 px-4 text-right">
                      {mockHelpers.formatCurrency(item.price)}
                    </td>
                    <td className="py-3 px-4 text-right">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">
                      {mockHelpers.formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SaleDetails;
