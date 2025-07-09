import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiPackage,
  FiAlertCircle,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiX,
} from "react-icons/fi";
import { dataService } from "../services";
import { useSalesStore, useSettingsStore } from "../store";

function SalesHistory() {
  
  const { settings } = useSettingsStore();
  const { currency } = settings;

  const location = useLocation();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightedSale, setHighlightedSale] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);

  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null); 
        
        const [salesData, customersData, productsData] = await Promise.all([
          dataService.sales.getAll(),
          dataService.customers.getAll().catch(() => []),
          dataService.products.getAll().catch(() => []), 
        ]);

        console.log("✅ [SalesHistory] Sales loaded:", salesData?.length || 0);
        console.log("✅ [SalesHistory] Customers loaded:", customersData?.length || 0);
        console.log("✅ [SalesHistory] Products loaded:", productsData?.length || 0);

        setSales(salesData || []);
        setCustomers(customersData || []);
        setProducts(productsData || []);
      } catch (err) {
        console.error("❌ [SalesHistory] Error loading data:", err);
        setError("Failed to load sales data");
        setSales([]);
        setCustomers([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  
  useEffect(() => {
    if (location.state?.saleId) {
      setHighlightedSale(location.state.saleId);
      const saleElement = document.getElementById(`sale-${location.state.saleId}`);
      if (saleElement) {
        saleElement.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          setHighlightedSale(null);
        }, 3000);
      }
    }
  }, [location.state]);

  
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name || product.productName || `Product #${productId}` : `Product #${productId}`;
  };

  
  const handleViewSale = (saleId, e) => {
    e.stopPropagation();
    navigate(`/sales/${saleId}`);
  };

  const handleEditSale = async (sale, e) => {
    e.stopPropagation();
    
    try {
      console.log("🔄 [SalesHistory] Starting edit for sale:", sale.id);
      
      
      let fullSaleData = sale;
      if (!sale.items && !sale.sale_items) {
        console.log("🔄 [SalesHistory] Fetching full sale data...");
        fullSaleData = await dataService.sales.getById(sale.id);
      }

      
      const items = (fullSaleData.items || fullSaleData.sale_items || []).map(item => ({
        id: item.id || `${item.productId || item.product_id}_${Date.now()}`,
        productId: item.productId || item.product_id,
        productName: getProductName(item.productId || item.product_id),
        unitPrice: parseFloat(item.unitPrice || item.unit_price || item.price || 0),
        quantity: parseInt(item.quantity || 0),
        originalQuantity: parseInt(item.quantity || 0),
        totalPrice: parseFloat(item.totalPrice || item.total_price || 0),
        discountAmount: parseFloat(item.discountAmount || item.discount_amount || 0),
        prescriptionNumber: item.prescriptionNumber || item.prescription_number,
      }));

      console.log("✅ [SalesHistory] Prepared items for editing:", items);

      setEditingSale(fullSaleData);
      setEditItems(items);
      setShowEditModal(true);

    } catch (err) {
      console.error("❌ [SalesHistory] Error preparing sale for edit:", err);
      alert("Failed to load sale for editing. Please try again.");
    }
  };

  const handleDeleteSale = (sale, e) => {
    e.stopPropagation();
    setSaleToDelete(sale);
    setShowDeleteModal(true);
  };

  
  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 0) return;
    
    setEditItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice - item.discountAmount
            }
          : item
      )
    );
  };

  const incrementQuantity = (itemId) => {
    const item = editItems.find(i => i.id === itemId);
    if (item) {
      updateItemQuantity(itemId, item.quantity + 1);
    }
  };

  const decrementQuantity = (itemId) => {
    const item = editItems.find(i => i.id === itemId);
    if (item && item.quantity > 0) {
      updateItemQuantity(itemId, item.quantity - 1);
    }
  };

  const calculateEditTotals = () => {
    const subtotal = editItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = editItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const taxAmount = editingSale?.taxAmount || editingSale?.tax_amount || 0;
    const total = subtotal - totalDiscount + taxAmount;

    return { subtotal, totalDiscount, taxAmount, total };
  };

  
  const handleUpdateSale = async () => {
    if (!editingSale) return;

    try {
      setUpdateLoading(true);
      console.log("🔄 [SalesHistory] Starting sale update...");

      const totals = calculateEditTotals();
      
      
      const updatedSaleData = {
        id: editingSale.id,
        items: editItems.map(item => ({
          id: item.id,
          productId: item.productId,
          product_id: item.productId,
          productName: item.productName, 
          product_name: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit_price: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice - item.discountAmount,
          total_price: item.quantity * item.unitPrice - item.discountAmount,
          discountAmount: item.discountAmount,
          discount_amount: item.discountAmount,
          prescriptionNumber: item.prescriptionNumber,
          prescription_number: item.prescriptionNumber,
        })),
        subtotal: totals.subtotal,
        discountAmount: totals.totalDiscount,
        discount_amount: totals.totalDiscount,
        taxAmount: totals.taxAmount,
        tax_amount: totals.taxAmount,
        totalAmount: totals.total,
        total_amount: totals.total,
        customerId: editingSale.customerId || editingSale.customer_id,
        customer_id: editingSale.customerId || editingSale.customer_id,
        paymentMethod: editingSale.paymentMethod || editingSale.payment_method,
        payment_method: editingSale.paymentMethod || editingSale.payment_method,
        paymentReference: editingSale.paymentReference || editingSale.payment_reference,
        payment_reference: editingSale.paymentReference || editingSale.payment_reference,
        notes: editingSale.notes,
        date: editingSale.date,
        transactionNumber: editingSale.transactionNumber || editingSale.transaction_number,
        transaction_number: editingSale.transactionNumber || editingSale.transaction_number,
        updated_at: new Date().toISOString(),
      };

      console.log("📤 [SalesHistory] Sending update data:", updatedSaleData);

      
      let updateResult = await dataService.sales.update(editingSale.id, updatedSaleData);
      if (!updateResult) {
        throw new Error("Update failed");
      }

      
      setSales(prevSales =>
        prevSales.map(sale =>
          sale.id === editingSale.id
            ? { 
                ...sale, 
                ...updatedSaleData,
                
                items: updatedSaleData.items,
                sale_items: updatedSaleData.items 
              }
            : sale
        )
      );

      console.log("✅ [SalesHistory] Sale updated successfully:", editingSale.id);
      alert("Sale updated successfully!");
      
      
      setShowEditModal(false);
      setEditingSale(null);
      setEditItems([]);

    } catch (err) {
      console.error("❌ [SalesHistory] Error updating sale:", err);
      alert(`Failed to update sale: ${err.message}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingSale(null);
    setEditItems([]);
  };

  const confirmDelete = async () => {
    if (!saleToDelete) return;

    try {
      setDeleteLoading(true);
      
      let deleteResult = await dataService.sales.delete(saleToDelete.id);
      if (!deleteResult) {
        throw new Error("Delete method not available");
      }
      
      
      setSales(prevSales => prevSales.filter(sale => sale.id !== saleToDelete.id));
      
      console.log("✅ [SalesHistory] Sale deleted successfully:", saleToDelete.id);
      alert("Sale deleted successfully!");
      
    } catch (err) {
      console.error("❌ [SalesHistory] Error deleting sale:", err);
      alert(`Failed to delete sale: ${err.message}`);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSaleToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSaleToDelete(null);
  };

  const getCustomerName = (customerId) => {
    if (!customerId) return "Walk-in Customer";
    const customer = customers.find((c) => c.id === customerId);
    return customer
      ? `${customer.firstName || customer.first_name || ""} ${customer.lastName || customer.last_name || ""}`.trim() ||
          customer.name ||
          `Customer #${customerId}`
      : `Customer #${customerId}`;
  };

  const getPaymentMethodDisplay = (method) => {
    const paymentMethods = {
      cash: "Cash",
      mobile_money: "Mobile Money",
      bank: "Bank Transfer",
      credit: "Credit",
    };
    return paymentMethods[method] || method || "Unknown";
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      cash: "#10b981",
      mobile_money: "#f59e0b",
      bank: "#3b82f6",
      credit: "#ef4444",
    };
    return colors[method] || "#6b7280";
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "var(--color-bg-main)",
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

  if (error) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "var(--color-bg-main)",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
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
            Error Loading Sales Data
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
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
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "var(--color-bg-main)",
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            color: "var(--color-text-primary)",
            marginBottom: "8px",
          }}
        >
          Sales History
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          View and manage your sales transactions
        </p>
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {sales.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
              textAlign: "center",
            }}
          >
            <FiPackage
              size={48}
              style={{ color: "#9ca3af", marginBottom: "16px" }}
            />
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              No Sales Found
            </h3>
            <p style={{ color: "#6b7280" }}>
              No sales transactions have been recorded yet.
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {sales
              .map((sale) => {
                
                if (!sale || !sale.id) {
                  console.warn("Invalid sale object:", sale);
                  return null;
                }

                return (
                  <div
                    key={sale.id}
                    id={`sale-${sale.id}`}
                    style={{
                      padding: "16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      backgroundColor:
                        highlightedSale === sale.id ? "#fef3c7" : "transparent",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        highlightedSale === sale.id ? "#fef3c7" : "#f9fafb";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        highlightedSale === sale.id ? "#fef3c7" : "transparent";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    
                    <div
                      style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        display: "flex",
                        gap: "8px",
                        zIndex: 10,
                      }}
                    >
                      <button
                        onClick={(e) => handleViewSale(sale.id, e)}
                        style={{
                          padding: "8px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#2563eb";
                          e.target.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#3b82f6";
                          e.target.style.transform = "scale(1)";
                        }}
                        title="View Sale Details"
                      >
                        <FiEye size={16} />
                      </button>

                      <button
                        onClick={(e) => handleEditSale(sale, e)}
                        style={{
                          padding: "8px",
                          backgroundColor: "#f59e0b",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#d97706";
                          e.target.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#f59e0b";
                          e.target.style.transform = "scale(1)";
                        }}
                        title="Edit Sale"
                      >
                        <FiEdit size={16} />
                      </button>

                      <button
                        onClick={(e) => handleDeleteSale(sale, e)}
                        style={{
                          padding: "8px",
                          backgroundColor: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#dc2626";
                          e.target.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#ef4444";
                          e.target.style.transform = "scale(1)";
                        }}
                        title="Delete Sale"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                        paddingRight: "120px",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1f2937",
                          }}
                        >
                          {sale.transactionNumber ||
                            sale.transaction_number ||
                            `Transaction #${sale.id}`}
                        </h3>
                        <p style={{ fontSize: "14px", color: "#6b7280" }}>
                          {sale.date
                            ? new Date(sale.date).toLocaleDateString()
                            : "Unknown date"}
                          {sale.date &&
                            ` at ${new Date(sale.date).toLocaleTimeString()}`}
                        </p>
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#10b981",
                        }}
                      >
                        {currency}
                        {(sale.subtotal || sale.total_amount || sale.totalAmount || 0).toFixed(
                          2
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "16px",
                        fontSize: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FiUser color="#6b7280" size={16} />
                        <div>
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {getCustomerName(
                              sale.customerId || sale.customer_id
                            )}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Customer
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FiPackage color="#6b7280" size={16} />
                        <div>
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {sale.items && Array.isArray(sale.items)
                              ? sale.items.length
                              : sale.sale_items &&
                                  Array.isArray(sale.sale_items)
                                ? sale.sale_items.length
                                : 0}{" "}
                            item(s)
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Products
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FiDollarSign color="#6b7280" size={16} />
                        <div>
                          <div style={{ fontWeight: "500", color: "#1f2937" }}>
                            {currency}
                            {(sale.subtotal || 0).toFixed(2)}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Subtotal
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            backgroundColor: getPaymentMethodColor(
                              sale.paymentMethod || sale.payment_method
                            ),
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontWeight: "500",
                              color: "#1f2937",
                            }}
                          >
                            {getPaymentMethodDisplay(
                              sale.paymentMethod || sale.payment_method
                            )}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Payment
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
              .filter(Boolean)}
          </div>
        )}
      </div>

      
      {showEditModal && editingSale && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "16px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "4px",
                  }}
                >
                  Edit Sale
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  Transaction: {editingSale.transactionNumber || editingSale.transaction_number || `#${editingSale.id}`}
                </p>
              </div>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: "8px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Items List */}
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "16px",
                }}
              >
                Items in Sale
              </h4>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {editItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h5
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "4px",
                        }}
                      >
                        {item.productName}
                      </h5>
                      <p style={{ fontSize: "12px", color: "#6b7280" }}>
                        {currency}{item.unitPrice.toFixed(2)} per unit
                        {item.prescriptionNumber && ` • Prescription: ${item.prescriptionNumber}`}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      {/* Quantity Controls */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          backgroundColor: "white",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          padding: "4px",
                        }}
                      >
                        <button
                          onClick={() => decrementQuantity(item.id)}
                          disabled={item.quantity <= 0}
                          style={{
                            padding: "6px",
                            backgroundColor: item.quantity <= 0 ? "#f3f4f6" : "#ef4444",
                            color: item.quantity <= 0 ? "#9ca3af" : "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: item.quantity <= 0 ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (item.quantity > 0) {
                              e.target.style.backgroundColor = "#dc2626";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (item.quantity > 0) {
                              e.target.style.backgroundColor = "#ef4444";
                            }
                          }}
                        >
                          <FiMinus size={14} />
                        </button>

                        <span
                          style={{
                            minWidth: "40px",
                            textAlign: "center",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1f2937",
                            padding: "0 8px",
                          }}
                        >
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => incrementQuantity(item.id)}
                          style={{
                            padding: "6px",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#059669";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#10b981";
                          }}
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>

                      
                      <div
                        style={{
                          minWidth: "80px",
                          textAlign: "right",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1f2937",
                          }}
                        >
                          {currency}{(item.quantity * item.unitPrice - item.discountAmount).toFixed(2)}
                        </div>
                        {item.discountAmount > 0 && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#ef4444",
                            }}
                          >
                            -{currency}{item.discountAmount.toFixed(2)} discount
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "12px",
                }}
              >
                Sale Summary
              </h4>
              
              {(() => {
                const totals = calculateEditTotals();
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      <span>Subtotal:</span>
                      <span>{currency}{totals.subtotal.toFixed(2)}</span>
                    </div>
                    
                    {totals.totalDiscount > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "14px",
                          color: "#ef4444",
                        }}
                      >
                        <span>Discount:</span>
                        <span>-{currency}{totals.totalDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {totals.taxAmount > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "14px",
                          color: "#6b7280",
                        }}
                      >
                        <span>Tax:</span>
                        <span>{currency}{totals.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1f2937",
                        borderTop: "1px solid #e5e7eb",
                        paddingTop: "8px",
                        marginTop: "4px",
                      }}
                    >
                      <span>Total:</span>
                      <span>{currency}{totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "24px",
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
              }}
            >
              <div>
                <h5
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "4px",
                  }}
                >
                  Customer
                </h5>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  {getCustomerName(editingSale.customerId || editingSale.customer_id)}
                </p>
              </div>
              
              <div>
                <h5
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "4px",
                  }}
                >
                  Payment Method
                </h5>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: getPaymentMethodColor(
                        editingSale.paymentMethod || editingSale.payment_method
                      ),
                    }}
                  />
                  <span style={{ fontSize: "14px", color: "#6b7280" }}>
                    {getPaymentMethodDisplay(
                      editingSale.paymentMethod || editingSale.payment_method
                    )}
                  </span>
                </div>
              </div>
            </div>

            
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                borderTop: "1px solid #e5e7eb",
                paddingTop: "16px",
              }}
            >
              <button
                onClick={handleCancelEdit}
                disabled={updateLoading}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: updateLoading ? "not-allowed" : "pointer",
                  opacity: updateLoading ? 0.6 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!updateLoading) {
                    e.target.style.backgroundColor = "#e5e7eb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!updateLoading) {
                    e.target.style.backgroundColor = "#f3f4f6";
                  }
                }}
              >
                Cancel
              </button>
              
              <button
              onClick={handleUpdateSale}
              disabled={updateLoading}
              style={{
              padding: "12px 20px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: updateLoading ? "not-allowed" : "pointer",
              opacity: updateLoading ? 0.6 : 1,
              display: "flex",
                alignItems: "center",
                  gap: "8px",
                transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                if (!updateLoading) {
                  e.target.style.backgroundColor = "#059669";
                }
              }}
              onMouseLeave={(e) => {
              if (!updateLoading) {
                e.target.style.backgroundColor = "#10b981";
              }
              }}
              >
              {updateLoading && (
              <div
                style={{
                  width: "16px",
                  height: "16px",
                    border: "2px solid #ffffff40",
                      borderTop: "2px solid #ffffff",
                    borderRadius: "50%",
                  animation: "spin 1s linear infinite",
              }}
              />
              )}
              {updateLoading ? "Updating..." : "Update Sale"}
              </button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Confirmation Modal */}
    {showDeleteModal && saleToDelete && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={cancelDelete}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: "16px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              Delete Sale
            </h3>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Are you sure you want to delete this sale? This action cannot be undone.
            </p>
          </div>

          <div
            style={{
              padding: "12px",
              backgroundColor: "#f3f4f6",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>
              {saleToDelete.transactionNumber ||
                saleToDelete.transaction_number ||
                `Transaction #${saleToDelete.id}`}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              {getCustomerName(saleToDelete.customerId || saleToDelete.customer_id)} •{" "}
              {currency}
              {(saleToDelete.subtotal || saleToDelete.total_amount || saleToDelete.totalAmount || 0).toFixed(2)}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={cancelDelete}
              disabled={deleteLoading}
              style={{
                padding: "10px 16px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: deleteLoading ? "not-allowed" : "pointer",
                opacity: deleteLoading ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!deleteLoading) {
                  e.target.style.backgroundColor = "#e5e7eb";
                }
              }}
              onMouseLeave={(e) => {
                if (!deleteLoading) {
                  e.target.style.backgroundColor = "#f3f4f6";
                }
              }}
            >
              Cancel
            </button>

            <button
              onClick={confirmDelete}
              disabled={deleteLoading}
              style={{
                padding: "10px 16px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: deleteLoading ? "not-allowed" : "pointer",
                opacity: deleteLoading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!deleteLoading) {
                  e.target.style.backgroundColor = "#dc2626";
                }
              }}
              onMouseLeave={(e) => {
                if (!deleteLoading) {
                  e.target.style.backgroundColor = "#ef4444";
                }
              }}
            >
              {deleteLoading && (
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid #ffffff40",
                    borderTop: "2px solid #ffffff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              )}
              {deleteLoading ? "Deleting..." : "Delete Sale"}
            </button>
          </div>
        </div>
      </div>
    )}

    
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);
}

export default SalesHistory;
