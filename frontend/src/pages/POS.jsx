import React from 'react';

function POS() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">Point of Sale</h2>
      <div className="flex space-x-6 mobile-stack">
        <div className="w-2/3 bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-card)] rounded-[var(--radius-xl)]">
          <input
            type="text"
            placeholder="Search products..."
            className="form-input mb-4 w-full"
          />
          <div className="grid grid-cols-3 gap-4">
            {['Paracetamol', 'Ibuprofen', 'Aspirin'].map((product, index) => (
              <div key={index} className="p-2 border border-[var(--color-border-light)] rounded hover:bg-[var(--color-bg-main)] cursor-pointer">
                {product}
              </div>
            ))}
          </div>
        </div>
        <div className="w-1/3 bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-card)] rounded-[var(--radius-xl)]">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Transaction Summary</h3>
          <div className="mb-4">
            <p>Items: 0</p>
            <p>Total: $0.00</p>
          </div>
          <button className="btn btn-success w-full">
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
}

export default POS;