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
  FiEdit3,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import { dataService } from "../services";
import { useSalesStore, useSettingsStore } from "../store";
import { useIsMobile } from "../hooks/useIsMobile";
import "../styles/mobile.css";

function SaleDetails() {
  // Mobile detection hook
  const isMobile = useIsMobile();

  // Settings store for currency
  const { settings } = useSettingsStore();
  const { currency, disableTax } = settings;

  const { id } = useParams();
  const navigate = useNavigate();
  const { updateSale } = useSalesStore();
  const [sale, setSale] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [sharingMethod, setSharingMethod] = useState(""); // 'whatsapp' or 'email'
  
  // Edit functionality states
  const [isEditing, setIsEditing] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    const loadSaleDetails = async () => {
      try {
        setLoading(true);

        // Find the sale by ID
        const foundSale = await dataService.sales.getById(id);

        if (!foundSale) {
          setError("Sale not found");
          setLoading(false);
          return;
        }
        setSale(foundSale);

        // Transform sale data to match expected format if needed
        if (foundSale.sale_items && !foundSale.items) {
          foundSale.items = foundSale.sale_items;
        }

        // Get customer details if available
        if (foundSale.customerId || foundSale.customer_id) {
          const customerId = foundSale.customerId || foundSale.customer_id;
          const foundCustomer = await dataService.customers.getById(customerId);
          setCustomer(foundCustomer);
        }

        setError(null);
      } catch (err) {
        console.error("Error loading sale details:", err);
        setError("Failed to load sale details");
      } finally {
        setLoading(false);
      }
    };
    loadSaleDetails();
  }, [id]);

  // Start editing mode
  const handleStartEdit = () => {
    setEditingSale({
      ...sale,
      items: [...sale.items],
      discount: sale.discount || 0,
      notes: sale.notes || "",
      paymentMethod: sale.paymentMethod || sale.payment_method || "cash",
    });
    setIsEditing(true);
    setEditError(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingSale(null);
    setEditError(null);
  };

  // Update item quantity
  const handleItemQuantityChange = (itemIndex, newQuantity) => {
    if (newQuantity <= 0) return;
    
    setEditingSale(prev => ({
      ...prev,
      items: prev.items.map((item, index) => {
        if (index === itemIndex) {
          return {
            ...item,
            quantity: newQuantity,
            total: (item.price || 0) * newQuantity
          };
        }
        return item;
      })
    }));
  };

  // Remove item from sale
  const handleRemoveItem = (itemIndex) => {
    setEditingSale(prev => ({
      ...prev,
      items: prev.items.filter((_, index) => index !== itemIndex)
    }));
  };

  // Update discount
  const handleDiscountChange = (newDiscount) => {
    setEditingSale(prev => ({
      ...prev,
      discount: Math.max(0, Math.min(100, newDiscount))
    }));
  };

  // Update payment method
  const handlePaymentMethodChange = (newMethod) => {
    setEditingSale(prev => ({
      ...prev,
      paymentMethod: newMethod
    }));
  };

  // Update notes
  const handleNotesChange = (newNotes) => {
    setEditingSale(prev => ({
      ...prev,
      notes: newNotes
    }));
  };

  // Calculate totals for editing
  const calculateEditTotals = () => {
    if (!editingSale) return { subtotal: 0, discountAmount: 0, total: 0 };
    
    const subtotal = editingSale.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const discountAmount = (subtotal * editingSale.discount) / 100;
    const total = subtotal - discountAmount;
    
    return { subtotal, discountAmount, total };
  };

  // Save edited sale
  const handleSaveEdit = async () => {
    if (!editingSale || editingSale.items.length === 0) {
      setEditError("Sale must have at least one item");
      return;
    }

    setSaving(true);
    setEditError(null);

    try {
      const { total } = calculateEditTotals();
      
      // Calculate tax based on settings
      const { subtotal, discountAmount } = calculateEditTotals();
      const taxAmount = disableTax ? 0 : (subtotal - discountAmount) * (settings.taxRate || 0) / 100;
      
      const updatedSaleData = {
        ...editingSale,
        totalAmount: total,
        subtotal: subtotal,
        tax: taxAmount,
        discount: editingSale.discount,
        notes: editingSale.notes,
        paymentMethod: editingSale.paymentMethod,
        updatedAt: new Date().toISOString()
      };

      // Update the sale in the database
      await dataService.sales.update(id, updatedSaleData);
      
      // Update local state
      setSale(updatedSaleData);
      setIsEditing(false);
      setEditingSale(null);
      
      // Show success message
      alert("Sale updated successfully!");
      
    } catch (error) {
      console.error("Error updating sale:", error);
      setEditError("Failed to update sale. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Navigate to full edit page
  const handleNavigateToEdit = () => {
    navigate(`/sales/edit/${id}`);
  };

  const getProductName = (productId, saleItem = null) => {
    // If the sale item has product information from the join, use it
    if (saleItem && saleItem.products && saleItem.products.name) {
      return saleItem.products.name;
    }

    // Fallback to the item's product name if available directly
    if (saleItem && saleItem.productName) {
      return saleItem.productName;
    }

    // Last resort fallback
    return `Product #${productId}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    // Create receipt content
    const receiptContent = `
      ELITH PHARMACY
      ===============
        Transaction: ${sale.transactionNumber || sale.transaction_number || "N/A"}
      Date: ${sale.date ? new Date(sale.date).toLocaleDateString() : "N/A"}
      Time: ${sale.date ? new Date(sale.date).toLocaleTimeString() : "N/A"}
      
      ${customer ? `Customer: ${customer.firstName || customer.first_name || ""} ${customer.lastName || customer.last_name || ""}`.trim() : "Customer: Walk-in"}
      
      ITEMS:
      ------
      ${sale.items
        .map(
          (item) =>
            `${getProductName(item.productId || item.product_id, item)} x${item.quantity || 0} - ${currency} ${(item.total || 0).toFixed(2)}`
        )
        .join("\n")}
        ------      Subtotal: ${currency} ${(sale.subtotal || 0).toFixed(2)}
      ${!disableTax ? `Tax: ${currency} ${(sale.tax || 0).toFixed(2)}` : ''}
      ${(sale.discount || 0) > 0 ? `Discount: -${currency} ${(sale.discount || 0).toFixed(2)}` : ""}
      Total: ${currency} ${(sale.totalAmount || 0).toFixed(2)}
        Payment Method: ${(sale.paymentMethod || sale.payment_method || "N/A").toUpperCase()}
      Status: ${(sale.status || "N/A").toUpperCase()}
      
      Thank you for your business!
    `;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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

            ${
              customer
                ? `
              <div class="customer-info">
                <div><strong>Customer:</strong> ${customer.firstName} ${customer.lastName}</div>
                <div><strong>Phone:</strong> ${customer.phone}</div>
                <div><strong>Email:</strong> ${customer.email}</div>
              </div>
            `
                : ""
            }

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
                ${sale.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${getProductName(item.productId)}</td>
                    <td>${item.quantity}</td>                    <td>{currency} {(item.price || 0).toFixed(2)}</td>
                    <td>{currency} {(item.total || 0).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="totals">              <div class="total-row">
                <span>Subtotal:</span>
                <span>{currency} {(sale.subtotal || 0).toFixed(2)}</span>
              </div>
              ${!disableTax ? `
              <div class="total-row">
                <span>Tax:</span>
                <span>{currency} {(sale.tax || 0).toFixed(2)}</span>
              </div>
              ` : ''}
              ${
                (sale.discount || 0) > 0
                  ? `
                <div class="total-row">
                  <span>Discount:</span>
                  <span>-{currency} {(sale.discount || 0).toFixed(2)}</span>
                </div>
              `
                  : ""
              }
              <div class="total-row final">
                <span>TOTAL:</span>
                <span>{currency} {(sale.totalAmount || sale.total_amount || 0).toFixed(2)}</span>
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
      const printWindow = window.open("", "_blank");
      printWindow.document.write(receiptHTML);
      printWindow.document.close();

      // Wait a moment for content to load, then show print dialog
      setTimeout(() => {
        printWindow.print();
        setShowShareModal(true);
      }, 500);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF receipt");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const shareViaWhatsApp = () => {
    setSharingMethod("whatsapp");
    setGeneratingPDF(true);

    try {
      const message = `*ELITH PHARMACY RECEIPT*\n\nReceipt: ${sale.transactionNumber || sale.transaction_number}\nDate: ${new Date(sale.date).toLocaleDateString()}\nTotal: ${currency} ${(sale.totalAmount || sale.total_amount || 0).toFixed(2)}\n\n${customer ? `Customer: ${customer.firstName || customer.first_name} ${customer.lastName || customer.last_name}\n` : ""}Items:\n${(sale.items || sale.sale_items || []).map((item) => `• ${getProductName(item.productId || item.product_id, item)} x${item.quantity} - ${currency} ${(item.total || 0).toFixed(2)}`).join("\n")}\n\nThank you for choosing Elith Pharmacy!`;

      const phoneNumber = customer?.phone?.replace(/[^\d]/g, "") || "";
      const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

      // Simulate processing time
      setTimeout(() => {
        window.open(whatsappURL, "_blank");
        setGeneratingPDF(false);
        setSharingMethod("");
      }, 1000);
    } catch (error) {
      console.error("Error sharing via WhatsApp:", error);
      alert("Failed to share via WhatsApp");
      setGeneratingPDF(false);
      setSharingMethod("");
    }
  };

  const shareViaEmail = () => {
    setSharingMethod("email");
    setGeneratingPDF(true);

    try {
      const subject = `Receipt from Elith Pharmacy - ${sale.transactionNumber}`;
      const body = `Dear ${customer ? `${customer.firstName} ${customer.lastName}` : "Valued Customer"},

Thank you for your purchase at Elith Pharmacy!

RECEIPT DETAILS:
Receipt Number: ${sale.transactionNumber || sale.transaction_number || "N/A"}
Date: ${new Date(sale.date).toLocaleDateString()}
Time: ${new Date(sale.date).toLocaleTimeString()}

ITEMS PURCHASED:
${(sale.items || sale.sale_items || []).map((item) => `• ${getProductName(item.productId || item.product_id, item)} x${item.quantity} - ${currency} ${(item.total || 0).toFixed(2)}`).join("\n")}

PAYMENT SUMMARY:
Subtotal: ${currency} ${(sale.subtotal || 0).toFixed(2)}
      ${!disableTax ? `Tax: ${currency} ${(sale.tax || 0).toFixed(2)}` : ''}${(sale.discount || 0) > 0 ? `\nDiscount: -${currency} ${(sale.discount || 0).toFixed(2)}` : ""}
TOTAL: ${currency} ${(sale.totalAmount || sale.total_amount || 0).toFixed(2)}

Payment Method: ${(sale.paymentMethod || sale.payment_method || "N/A").toUpperCase()}

We appreciate your business and look forward to serving you again!

Best regards,
Elith Pharmacy Team
Phone: +234 800 123 4567
Email: info@elithpharmacy.com`;

      // Simulate processing time
      setTimeout(() => {
        const emailURL = `mailto:${customer?.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = emailURL;
        setGeneratingPDF(false);
        setSharingMethod("");
      }, 1000);
    } catch (error) {
      console.error("Error sharing via Email:", error);
      alert("Failed to share via Email");
      setGeneratingPDF(false);
      setSharingMethod("");
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

  // Safety check - ensure sale data exists before rendering
  if (!sale) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
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
            Sale Not Found
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            The requested sale could not be loaded.
          </p>
          <button
            onClick={() => navigate("/sales")}
            style={{
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
            Back to Sales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={isMobile ? "mobile-container" : ""}
      style={
        isMobile
          ? { paddingBottom: 24 }
          : {
              padding: "24px",
              backgroundColor: "#f8fafc",
              minHeight: "100vh",
            }
      }
    >
      {/* Mobile Layout */}
      {isMobile ? (
        <>
          {/* Header Card */}
          <div className="mobile-card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => navigate("/sales")}
                className="mobile-action-button secondary"
                style={{ marginRight: 8 }}
              >
                <span className="mobile-nav-icon">
                  <FiArrowLeft size={18} />
                </span>
                Back
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#1f2937" }}>
                  {sale.transactionNumber}
                </div>
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>
                  <FiCalendar size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
                  {new Date(sale.date).toLocaleDateString()} at {new Date(sale.date).toLocaleTimeString()}
                </div>
              </div>
              <span
                className={`sale-status-badge ${sale.status}`}
                style={{ fontSize: 12, padding: "4px 10px", borderRadius: 12 }}
              >
                <FiCheckCircle size={12} style={{ marginRight: 4, verticalAlign: -2 }} />
                {sale.status.toUpperCase()}
              </span>
            </div>
            {/* Action Buttons Row */}
            <div style={{ display: "flex", gap: 8, marginTop: 14, overflowX: "auto" }}>
              <button onClick={handleDownloadReceipt} className="mobile-action-button">
                <FiDownload size={16} /> Receipt
              </button>
              <button
                onClick={shareViaWhatsApp}
                className="mobile-action-button"
                style={{ background: "#25D366", color: "#fff" }}
                disabled={generatingPDF}
              >
                <FiMessageCircle size={16} /> WhatsApp
              </button>
              <button
                onClick={shareViaEmail}
                className="mobile-action-button"
                style={{ background: "#3b82f6", color: "#fff" }}
                disabled={generatingPDF}
              >
                <FiMail size={16} /> Email
              </button>
              <button
                onClick={handleStartEdit}
                className="mobile-action-button"
                style={{ background: "#f59e0b", color: "#fff" }}
                disabled={isEditing}
              >
                <FiEdit3 size={16} /> Edit
              </button>
              <button
                onClick={handleNavigateToEdit}
                className="mobile-action-button"
                style={{ background: "#8b5cf6", color: "#fff" }}
              >
                <FiEdit3 size={16} /> Full Edit
              </button>
            </div>
          </div>

          {/* Items Purchased Card */}
          <div className="mobile-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", marginBottom: 12 }}>
              Items Purchased
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                    <th style={{ padding: 8, textAlign: "left" }}>Product</th>
                    <th style={{ padding: 8, textAlign: "right" }}>Price</th>
                    <th style={{ padding: 8, textAlign: "right" }}>Qty</th>
                    <th style={{ padding: 8, textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(sale.items || sale.sale_items || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: 10 }}>
                        <span style={{ fontWeight: 500, color: "#1f2937" }}>
                          {getProductName(item.productId || item.product_id, item)}
                        </span>
                      </td>
                      <td style={{ padding: 10, textAlign: "right", color: "#6b7280" }}>
                        {currency} {(item.price || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: 10, textAlign: "right", color: "#6b7280" }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: 10, textAlign: "right", fontWeight: 600, color: "#1f2937" }}>
                        {currency} {(item.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Info Card */}
          <div className="mobile-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", marginBottom: 12 }}>
              Payment Information
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FiCreditCard size={16} color="#6b7280" />
                <span style={{ color: "#6b7280", fontSize: 13 }}>Payment Method</span>
                <span style={{ fontWeight: 600, color: "#1f2937", textTransform: "capitalize", marginLeft: "auto" }}>
                  {sale.paymentMethod}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FiDollarSign size={16} color="#6b7280" />
                <span style={{ color: "#6b7280", fontSize: 13 }}>Total Amount</span>
                <span style={{ fontWeight: 600, color: "#10b981", fontSize: 15, marginLeft: "auto" }}>
                  {currency} {(sale.totalAmount || sale.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="mobile-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", marginBottom: 12 }}>
              Order Summary
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Subtotal:</span>
                <span style={{ fontWeight: 600, color: "#1f2937" }}>{currency} {(sale.subtotal || 0).toFixed(2)}</span>
              </div>
              {!disableTax && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Tax:</span>
                  <span style={{ fontWeight: 600, color: "#1f2937" }}>{currency} {(sale.tax || 0).toFixed(2)}</span>
                </div>
              )}
              {(sale.discount || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Discount:</span>
                  <span style={{ fontWeight: 600, color: "#ef4444" }}>-{currency} {(sale.discount || 0).toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#1f2937" }}>Total:</span>
                <span style={{ fontSize: 16, fontWeight: "bold", color: "#10b981" }}>{currency} {(sale.totalAmount || sale.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="mobile-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", marginBottom: 12 }}>
              Customer Information
            </h3>
            {customer ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FiUser size={16} color="#6b7280" />
                  <span style={{ fontWeight: 600, color: "#1f2937" }}>{customer.firstName} {customer.lastName}</span>
                  <span style={{ color: "#6b7280", fontSize: 13, marginLeft: "auto" }}>ID: {customer.id}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FiPhone size={16} color="#6b7280" />
                  <span style={{ fontWeight: 600, color: "#1f2937" }}>{customer.phone}</span>
                  <span style={{ color: "#6b7280", fontSize: 13, marginLeft: "auto" }}>Phone</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FiMail size={16} color="#6b7280" />
                  <span style={{ fontWeight: 600, color: "#1f2937" }}>{customer.email}</span>
                  <span style={{ color: "#6b7280", fontSize: 13, marginLeft: "auto" }}>Email</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <FiMapPin size={16} color="#6b7280" style={{ marginTop: 2 }} />
                  <span style={{ fontWeight: 600, color: "#1f2937" }}>{customer.address}</span>
                  <span style={{ color: "#6b7280", fontSize: 13, marginLeft: "auto" }}>{customer.city}, {customer.state}</span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f9fafb", borderRadius: 8, padding: 12 }}>
                <FiUser size={16} color="#6b7280" />
                <span style={{ fontWeight: 600, color: "#1f2937" }}>Walk-in Customer</span>
                <span style={{ color: "#6b7280", fontSize: 13, marginLeft: "auto" }}>No info</span>
              </div>
            )}
          </div>

          {/* Transaction Details Card */}
          <div className="mobile-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", marginBottom: 12 }}>
              Transaction Details
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Transaction ID:</span>
                <span style={{ fontWeight: 600, color: "#1f2937" }}>{sale.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Cashier ID:</span>
                <span style={{ fontWeight: 600, color: "#1f2937" }}>{sale.cashierId || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Items Count:</span>
                <span style={{ fontWeight: 600, color: "#1f2937" }}>{sale.items.length} item(s)</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
      {/* Header */}
      <div
        className={isMobile ? "mobile-card" : ""}
        style={
          isMobile
            ? { marginBottom: "16px" }
            : {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
              }
        }
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={() => navigate("/sales")}
            className={isMobile ? "mobile-action-button secondary" : ""}
            style={
              isMobile
                ? {}
                : {
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
                  }
            }
          >
            <div className={isMobile ? "mobile-nav-icon" : ""}>
              <FiArrowLeft size={16} />
            </div>
            {isMobile ? "Back" : "Back to Sales"}
          </button>
          <div>
            <h1
              style={{
                fontSize: isMobile ? "20px" : "28px",
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
              cursor:
                generatingPDF && sharingMethod === "whatsapp"
                  ? "not-allowed"
                  : "pointer",
              opacity: generatingPDF && sharingMethod === "whatsapp" ? 0.7 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!(generatingPDF && sharingMethod === "whatsapp")) {
                e.target.style.backgroundColor = "#128C7E";
              }
            }}
            onMouseLeave={(e) => {
              if (!(generatingPDF && sharingMethod === "whatsapp")) {
                e.target.style.backgroundColor = "#25D366";
              }
            }}
          >
            {generatingPDF && sharingMethod === "whatsapp" ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid white",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
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
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor:
                generatingPDF && sharingMethod === "email"
                  ? "not-allowed"
                  : "pointer",
              opacity: generatingPDF && sharingMethod === "email" ? 0.7 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!(generatingPDF && sharingMethod === "email")) {
                e.target.style.backgroundColor = "#2563eb";
              }
            }}
            onMouseLeave={(e) => {
              if (!(generatingPDF && sharingMethod === "email")) {
                e.target.style.backgroundColor = "#3b82f6";
              }
            }}
          >
            {generatingPDF && sharingMethod === "email" ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid white",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Sending...
              </>
            ) : (
              <>
                <FiMail size={16} />
                Email
              </>
            )}
          </button>

          <button
            onClick={handleStartEdit}
            disabled={isEditing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isEditing ? "not-allowed" : "pointer",
              opacity: isEditing ? 0.7 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isEditing) {
                e.target.style.backgroundColor = "#7c3aed";
              }
            }}
            onMouseLeave={(e) => {
              if (!isEditing) {
                e.target.style.backgroundColor = "#8b5cf6";
              }
            }}
          >
            <FiEdit3 size={16} />
            Quick Edit
          </button>

          <button
            onClick={handleNavigateToEdit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#5856eb";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#6366f1";
            }}
          >
            <FiEdit3 size={16} />
            Full Edit
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
                  {(sale.items || sale.sale_items || []).map((item, index) => (
                    <tr
                      key={index}
                      style={{ borderBottom: "1px solid #f3f4f6" }}
                    >
                      <td style={{ padding: "16px 12px" }}>
                        <div
                          style={{
                            fontWeight: "600",
                            color: "#1f2937",
                          }}
                        >
                          {getProductName(
                            item.productId || item.product_id,
                            item
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "16px 12px",
                          textAlign: "right",
                          color: "#6b7280",
                        }}
                      >
                        {currency} {(item.price || 0).toFixed(2)}
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
                        {currency} {(item.total || 0).toFixed(2)}
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
                    {currency}{" "}
                    {(sale.totalAmount || sale.total_amount || 0).toFixed(2)}
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
                <span style={{ color: "#6b7280" }}>Subtotal:</span>{" "}
                <span style={{ fontWeight: "600", color: "#1f2937" }}>
                  Ush {(sale.subtotal || 0).toFixed(2)}
                </span>
              </div>
              {!disableTax && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Tax:</span>
                  <span style={{ fontWeight: "600", color: "#1f2937" }}>
                    Ush{(sale.tax || 0).toFixed(2)}
                  </span>
                </div>
              )}
              {(sale.discount || 0) > 0 && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#6b7280" }}>Discount:</span>{" "}
                  <span style={{ fontWeight: "600", color: "#ef4444" }}>
                    -Ush{(sale.discount || 0).toFixed(2)}
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
                  Ush{(sale.totalAmount || sale.total_amount || 0).toFixed(2)}
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
                  <FiMapPin
                    size={20}
                    color="#6b7280"
                    style={{ marginTop: "2px" }}
                  />
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
        </>
      )}

      {/* Inline Editing Interface */}
      {isEditing && editingSale && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#1f2937" }}>
                Edit Sale - {editingSale.transactionNumber || editingSale.transaction_number}
              </h2>
              <button
                onClick={handleCancelEdit}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                <FiX />
              </button>
            </div>

            {/* Error Message */}
            {editError && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FiAlertCircle size={16} />
                {editError}
              </div>
            )}

            {/* Items Section */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "#1f2937" }}>
                Items ({editingSale.items.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {editingSale.items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "4px" }}>
                        {getProductName(item.productId || item.product_id, item)}
                      </div>
                      <div style={{ fontSize: "14px", color: "#6b7280" }}>
                        {currency} {(item.price || 0).toFixed(2)} each
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => handleItemQuantityChange(index, (item.quantity || 1) - 1)}
                        disabled={(item.quantity || 1) <= 1}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          backgroundColor: "white",
                          cursor: (item.quantity || 1) <= 1 ? "not-allowed" : "pointer",
                          opacity: (item.quantity || 1) <= 1 ? 0.5 : 1,
                        }}
                      >
                        <FiMinus size={14} />
                      </button>
                      <span style={{ minWidth: "40px", textAlign: "center", fontWeight: "600" }}>
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() => handleItemQuantityChange(index, (item.quantity || 1) + 1)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          backgroundColor: "white",
                          cursor: "pointer",
                        }}
                      >
                        <FiPlus size={14} />
                      </button>
                      <span style={{ fontWeight: "600", color: "#10b981", minWidth: "80px", textAlign: "right" }}>
                        {currency} {(item.total || 0).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "4px",
                          border: "1px solid #fecaca",
                          backgroundColor: "#fef2f2",
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment and Discount Section */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "#1f2937" }}>
                Payment & Discount
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#374151" }}>
                    Payment Method
                  </label>
                  <select
                    value={editingSale.paymentMethod || "cash"}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#374151" }}>
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingSale.discount || 0}
                    onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#374151" }}>
                Notes
              </label>
              <textarea
                value={editingSale.notes || ""}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
                placeholder="Add any notes about this sale..."
              />
            </div>

            {/* Totals Section */}
            <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#1f2937" }}>
                Order Summary
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Subtotal:</span>
                  <span style={{ fontWeight: "600" }}>{currency} {calculateEditTotals().subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Discount ({editingSale.discount || 0}%):</span>
                  <span style={{ fontWeight: "600", color: "#ef4444" }}>
                    -{currency} {calculateEditTotals().discountAmount.toFixed(2)}
                  </span>
                </div>
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>Total:</span>
                  <span style={{ fontSize: "18px", fontWeight: "bold", color: "#10b981" }}>
                    {currency} {calculateEditTotals().total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "white",
                  color: "#6b7280",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || editingSale.items.length === 0}
                style={{
                  padding: "12px 24px",
                  backgroundColor: saving || editingSale.items.length === 0 ? "#9ca3af" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: saving || editingSale.items.length === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {saving ? (
                  <>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid white",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
