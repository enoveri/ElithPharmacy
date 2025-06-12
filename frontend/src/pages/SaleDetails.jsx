import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiCreditCard,
  FiMapPin,
  FiPhone,
  FiMail,
  FiAlertCircle,
  FiCheckCircle,
  FiShare2,
  FiMessageCircle,
  FiX,
} from "react-icons/fi";
import { mockData, mockHelpers } from "../lib/mockData";

function SaleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [sharingMethod, setSharingMethod] = useState(''); // 'whatsapp' or 'email'

  useEffect(() => {
    try {
      setLoading(true);

      // Find the sale by ID
      const foundSale = mockData.sales.find((s) => s.id === parseInt(id));

      if (!foundSale) {
        setError("Sale not found");
        setLoading(false);
        return;
      }

      setSale(foundSale);

      // Get customer details if available
      if (foundSale.customerId) {
        const foundCustomer = mockHelpers.getCustomerById(foundSale.customerId);
        setCustomer(foundCustomer);
      }

      setError(null);
    } catch (err) {
      console.error("Error loading sale details:", err);
      setError("Failed to load sale details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const getProductName = (productId) => {
    const product = mockHelpers.getProductById(productId);
    return product ? product.name : "Unknown Product";
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    // Create receipt content
    const receiptContent = `
      ELITH PHARMACY
      ===============
      
      Transaction: ${sale.transactionNumber}
      Date: ${new Date(sale.date).toLocaleDateString()}
      Time: ${new Date(sale.date).toLocaleTimeString()}
      
      ${customer ? `Customer: ${customer.firstName} ${customer.lastName}` : 'Customer: Walk-in'}
      
      ITEMS:
      ------
      ${sale.items.map(item => 
        `${getProductName(item.productId)} x${item.quantity} - ₦${item.total.toFixed(2)}`
      ).join('\n')}
      
      ------
      Subtotal: ₦${sale.subtotal.toFixed(2)}
      Tax: ₦${sale.tax.toFixed(2)}
      ${sale.discount > 0 ? `Discount: -₦${sale.discount.toFixed(2)}` : ''}
      Total: ₦${sale.totalAmount.toFixed(2)}
      
      Payment Method: ${sale.paymentMethod.toUpperCase()}
      Status: ${sale.status.toUpperCase()}
      
      Thank you for your business!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${sale.transactionNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReceiptPDF = async () => {
    setGeneratingPDF(true);
    
    try {
      // Create receipt HTML content for PDF
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Receipt - ${sale.transactionNumber}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: #000;
            }
            .receipt-container {
              max-width: 400px;
              margin: 0 auto;
              border: 1px solid #ddd;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .store-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .store-info {
              font-size: 12px;
              color: #666;
            }
            .transaction-info {
              margin-bottom: 20px;
            }
            .transaction-info div {
              margin-bottom: 5px;
              font-size: 14px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th, .items-table td {
              text-align: left;
              padding: 8px 4px;
              border-bottom: 1px solid #ddd;
              font-size: 12px;
            }
            .items-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .totals {
              border-top: 2px solid #000;
              padding-top: 10px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 14px;
            }
            .total-row.final {
              font-weight: bold;
              font-size: 16px;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid #000;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            .customer-info {
              margin-bottom: 15px;
              padding: 10px;
              background-color: #f9f9f9;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="store-name">ELITH PHARMACY</div>
              <div class="store-info">123 Main Street, Lagos<br>Phone: +234 800 123 4567</div>
            </div>
            
            <div class="transaction-info">
              <div><strong>Receipt #:</strong> ${sale.transactionNumber}</div>
              <div><strong>Date:</strong> ${new Date(sale.date).toLocaleDateString()}</div>
              <div><strong>Time:</strong> ${new Date(sale.date).toLocaleTimeString()}</div>
              <div><strong>Payment:</strong> ${sale.paymentMethod.toUpperCase()}</div>
            </div>

            ${customer ? `
              <div class="customer-info">
                <div><strong>Customer:</strong> ${customer.firstName} ${customer.lastName}</div>
                <div><strong>Phone:</strong> ${customer.phone}</div>
                <div><strong>Email:</strong> ${customer.email}</div>
              </div>
            ` : ''}

            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items.map(item => `
                  <tr>
                    <td>${getProductName(item.productId)}</td>
                    <td>${item.quantity}</td>
                    <td>₦${item.price.toFixed(2)}</td>
                    <td>₦${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>₦${sale.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Tax:</span>
                <span>₦${sale.tax.toFixed(2)}</span>
              </div>
              ${sale.discount > 0 ? `
                <div class="total-row">
                  <span>Discount:</span>
                  <span>-₦${sale.discount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-row final">
                <span>TOTAL:</span>
                <span>₦${sale.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <div>Thank you for choosing Elith Pharmacy!</div>
              <div>Visit us again for all your pharmaceutical needs</div>
              <div style="margin-top: 10px; font-size: 10px;">
                Generated on ${new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Wait a moment for content to load, then show print dialog
      setTimeout(() => {
        printWindow.print();
        setShowShareModal(true);
      }, 500);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF receipt');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const shareViaWhatsApp = () => {
    setSharingMethod('whatsapp');
    setGeneratingPDF(true);
    
    try {
      const message = `*ELITH PHARMACY RECEIPT*\n\nReceipt: ${sale.transactionNumber}\nDate: ${new Date(sale.date).toLocaleDateString()}\nTotal: ₦${sale.totalAmount.toFixed(2)}\n\n${customer ? `Customer: ${customer.firstName} ${customer.lastName}\n` : ''}Items:\n${sale.items.map(item => `• ${getProductName(item.productId)} x${item.quantity} - ₦${item.total.toFixed(2)}`).join('\n')}\n\nThank you for choosing Elith Pharmacy!`;
      
      const phoneNumber = customer?.phone?.replace(/[^\d]/g, '') || '';
      const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      // Simulate processing time
      setTimeout(() => {
        window.open(whatsappURL, '_blank');
        setGeneratingPDF(false);
        setSharingMethod('');
      }, 1000);
      
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      alert('Failed to share via WhatsApp');
      setGeneratingPDF(false);
      setSharingMethod('');
    }
  };

  const shareViaEmail = () => {
    setSharingMethod('email');
    setGeneratingPDF(true);
    
    try {
      const subject = `Receipt from Elith Pharmacy - ${sale.transactionNumber}`;
      const body = `Dear ${customer ? `${customer.firstName} ${customer.lastName}` : 'Valued Customer'},

Thank you for your purchase at Elith Pharmacy!

RECEIPT DETAILS:
Receipt Number: ${sale.transactionNumber}
Date: ${new Date(sale.date).toLocaleDateString()}
Time: ${new Date(sale.date).toLocaleTimeString()}

ITEMS PURCHASED:
${sale.items.map(item => `• ${getProductName(item.productId)} x${item.quantity} - ₦${item.total.toFixed(2)}`).join('\n')}

PAYMENT SUMMARY:
Subtotal: ₦${sale.subtotal.toFixed(2)}
Tax: ₦${sale.tax.toFixed(2)}${sale.discount > 0 ? `\nDiscount: -₦${sale.discount.toFixed(2)}` : ''}
TOTAL: ₦${sale.totalAmount.toFixed(2)}

Payment Method: ${sale.paymentMethod.toUpperCase()}

We appreciate your business and look forward to serving you again!

Best regards,
Elith Pharmacy Team
Phone: +234 800 123 4567
Email: info@elithpharmacy.com`;

      // Simulate processing time
      setTimeout(() => {
        const emailURL = `mailto:${customer?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = emailURL;
        setGeneratingPDF(false);
        setSharingMethod('');
      }, 1000);
      
    } catch (error) {
      console.error('Error sharing via Email:', error);
      alert('Failed to share via Email');
      setGeneratingPDF(false);
      setSharingMethod('');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid #f3f4f6",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
          textAlign: "center",
        }}
      >
        <FiAlertCircle
          size={64}
          style={{ color: "#ef4444", marginBottom: "16px" }}
        />
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#374151",
            marginBottom: "8px",
          }}
        >
          {error || "Sale Not Found"}
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>
          The sale you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/sales")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          <FiArrowLeft size={16} />
          Back to Sales
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={() => navigate("/sales")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "white",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              marginRight: "16px",
            }}
          >
            <FiArrowLeft size={16} />
            Back to Sales
          </button>
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#1f2937",
                margin: "0 0 4px 0",
              }}
            >
              {sale.transactionNumber}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                color: "#6b7280",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <FiCalendar size={16} />
                {new Date(sale.date).toLocaleDateString()} at{" "}
                {new Date(sale.date).toLocaleTimeString()}
              </div>
              <div
                style={{
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "500",
                  backgroundColor:
                    sale.status === "completed" ? "#dcfce7" : "#fef3c7",
                  color: sale.status === "completed" ? "#166534" : "#92400e",
                }}
              >
                <FiCheckCircle size={12} style={{ marginRight: "4px" }} />
                {sale.status.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleDownloadReceipt}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "white",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            <FiDownload size={16} />
            Download Receipt
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "white",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            <FiPrinter size={16} />
            Print Receipt
          </button>
          <button
            onClick={shareViaWhatsApp}
            disabled={generatingPDF}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "#25D366",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: generatingPDF && sharingMethod === 'whatsapp' ? 'not-allowed' : 'pointer',
              opacity: generatingPDF && sharingMethod === 'whatsapp' ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!(generatingPDF && sharingMethod === 'whatsapp')) {
                e.target.style.backgroundColor = '#128C7E';
              }
            }}
            onMouseLeave={(e) => {
              if (!(generatingPDF && sharingMethod === 'whatsapp')) {
                e.target.style.backgroundColor = '#25D366';
              }
            }}
          >
            {generatingPDF && sharingMethod === 'whatsapp' ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Sharing...
              </>
            ) : (
              <>
                <FiMessageCircle size={16} />
                WhatsApp
              </>
            )}
          </button>
          
          <button
            onClick={shareViaEmail}
            disabled={generatingPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: generatingPDF && sharingMethod === 'email' ? 'not-allowed' : 'pointer',
              opacity: generatingPDF && sharingMethod === 'email' ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!(generatingPDF && sharingMethod === 'email')) {
                e.target.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!(generatingPDF && sharingMethod === 'email')) {
                e.target.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            {generatingPDF && sharingMethod === 'email' ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Sending...
              </>
            ) : (
              <>
                <FiMail size={16} />
                Email
              </>
            )}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
        }}
      >
        {/* Left Column - Transaction Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Items List */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "20px",
              }}
            >
              Items Purchased
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Product
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Price
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Quantity
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "16px 12px" }}>
                        <div
                          style={{
                            fontWeight: "600",
                            color: "#1f2937",
                          }}
                        >
                          {getProductName(item.productId)}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "16px 12px",
                          textAlign: "right",
                          color: "#6b7280",
                        }}
                      >
                        ₦{item.price.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "16px 12px",
                          textAlign: "right",
                          color: "#6b7280",
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        style={{
                          padding: "16px 12px",
                          textAlign: "right",
                          fontWeight: "600",
                          color: "#1f2937",
                        }}
                      >
                        ₦{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Information */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "20px",
              }}
            >
              Payment Information
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <FiCreditCard size={20} color="#6b7280" />
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    Payment Method
                  </div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#1f2937",
                      textTransform: "capitalize",
                    }}
                  >
                    {sale.paymentMethod}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <FiDollarSign size={20} color="#6b7280" />
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    Total Amount
                  </div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#10b981",
                      fontSize: "18px",
                    }}
                  >
                    ₦{sale.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary & Customer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Order Summary */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "20px",
              }}
            >
              Order Summary
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Subtotal:</span>
                <span style={{ fontWeight: "600", color: "#1f2937" }}>
                  ₦{sale.subtotal.toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Tax:</span>
                <span style={{ fontWeight: "600", color: "#1f2937" }}>
                  ₦{sale.tax.toFixed(2)}
                </span>
              </div>
              {sale.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Discount:</span>
                  <span style={{ fontWeight: "600", color: "#ef4444" }}>
                    -₦{sale.discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  Total:
                </span>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#10b981",
                  }}
                >
                  ₦{sale.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "20px",
              }}
            >
              Customer Information
            </h3>

            {customer ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <FiUser size={20} color="#6b7280" />
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      Customer ID: {customer.id}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <FiPhone size={20} color="#6b7280" />
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      {customer.phone}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      Phone Number
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <FiMail size={20} color="#6b7280" />
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      {customer.email}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      Email Address
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <FiMapPin size={20} color="#6b7280" style={{ marginTop: "2px" }} />
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      {customer.address}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      {customer.city}, {customer.state}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                }}
              >
                <FiUser size={20} color="#6b7280" />
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    Walk-in Customer
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    No customer information available
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Details */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "20px",
              }}
            >
              Transaction Details
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Transaction ID:</span>
                <span style={{ fontWeight: "600", color: "#1f2937" }}>
                  {sale.id}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Cashier ID:</span>
                <span style={{ fontWeight: "600", color: "#1f2937" }}>
                  {sale.cashierId || "N/A"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Items Count:</span>
                <span style={{ fontWeight: "600", color: "#1f2937" }}>
                  {sale.items.length} item(s)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SaleDetails;
