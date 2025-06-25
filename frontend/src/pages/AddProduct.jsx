// Add Product page
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiArrowRight, FiCheck, FiPackage } from "react-icons/fi";
import { dataService } from "../services";
import { useProductsStore, useSettingsStore } from "../store";

function AddProduct() {
  // Settings store for currency
  const { settings } = useSettingsStore();
  const { currency } = settings;

  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const { addProduct } = useProductsStore();

  // Check if this is being called from a purchase order
  const isFromPurchaseOrder = location.state?.fromPurchaseOrder;
  const purchaseOrderData = location.state?.purchaseOrderData;

  // Product data state
  const [productData, setProductData] = useState({
    name: "",
    category: "",
    manufacturer: "",
    supplierId: "",
    supplierName: "",
    batchNumber: "",
    description: "",
    costPrice: 0,
    price: 0,
    quantity: 0,
    minStockLevel: 0,
    expiryDate: "",
    barcode: "",
  });

  // Additional state for purchase order details
  const [purchaseDetails, setPurchaseDetails] = useState({
    supplierId: "",
    supplierName: "",
    quantity: 1,
    expectedDelivery: "",
    notes: "",
  });

  // Mock suppliers data
  const suppliers = [
    { id: 1, name: "PharmaCorp Ltd", email: "orders@pharmacorp.com" },
    { id: 2, name: "MediPharm", email: "procurement@medipharm.com" },
    { id: 3, name: "HealthSupply Co", email: "orders@healthsupply.com" },
  ];

  // Add purchase order step if coming from purchase order
  const steps = isFromPurchaseOrder
    ? [
        "Basic Information",
        "Pricing & Stock",
        "Purchase Details",
        "Additional Details",
        "Review",
      ]
    : ["Basic Information", "Pricing & Stock", "Additional Details", "Review"];

  // Initialize purchase details if coming from purchase order
  useEffect(() => {
    if (isFromPurchaseOrder && purchaseOrderData) {
      setPurchaseDetails({
        ...purchaseDetails,
        ...purchaseOrderData,
        expectedDelivery: purchaseOrderData.expectedDelivery
          ? new Date(purchaseOrderData.expectedDelivery)
              .toISOString()
              .split("T")[0]
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
      });
    }
  }, [isFromPurchaseOrder, purchaseOrderData]);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await dataService.categories.getAll();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading categories:", error);
        // Fallback to hardcoded categories
        setCategories([
          { id: 1, name: "Antibiotics" },
          { id: 2, name: "Pain Relief" },
          { id: 3, name: "Vitamins" },
          { id: 4, name: "Cold & Flu" },
          { id: 5, name: "Supplements" },
          { id: 6, name: "First Aid" },
          { id: 7, name: "Diabetes Care" },
          { id: 8, name: "Heart Health" },
          { id: 9, name: "Skin Care" },
          { id: 10, name: "Mental Health" },
        ]);
      }
    };

    loadCategories();
  }, []);

  const renderBasicInfoStep = () => (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #f1f5f9",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "500",
              marginBottom: "6px",
            }}
          >
            Product Name *
          </label>
          <input
            type="text"
            value={productData.name}
            onChange={(e) =>
              setProductData({ ...productData, name: e.target.value })
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "13px",
            }}
            placeholder="Enter product name"
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "500",
              marginBottom: "6px",
            }}
          >
            Category *
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              list="categories"
              value={productData.category}
              onChange={(e) =>
                setProductData({ ...productData, category: e.target.value })
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
              }}
              placeholder="Select or type category"
              required
            />
            <datalist id="categories">
              {categories.map((category) => (
                <option key={category.id} value={category.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "500",
              marginBottom: "6px",
            }}
          >
            Supplier *
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              list="suppliers"
              value={productData.supplierName}
              onChange={(e) => {
                const inputValue = e.target.value;
                const existingSupplier = suppliers.find(
                  (s) => s.name === inputValue
                );

                setProductData({
                  ...productData,
                  supplierName: inputValue,
                  supplierId: existingSupplier ? existingSupplier.id : "",
                });
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
              }}
              placeholder="Select or type supplier name"
              required
            />
            <datalist id="suppliers">
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.name} />
              ))}
            </datalist>
            {productData.supplierName && !productData.supplierId && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#eff6ff",
                  border: "1px solid #93c5fd",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  color: "#1e40af",
                  marginTop: "4px",
                  zIndex: 10,
                }}
              >
                ✨ New supplier "{productData.supplierName}" will be created
              </div>
            )}
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "500",
              marginBottom: "6px",
            }}
          >
            Manufacturer
          </label>
          <input
            type="text"
            value={productData.manufacturer}
            onChange={(e) =>
              setProductData({ ...productData, manufacturer: e.target.value })
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "13px",
            }}
            placeholder="Enter manufacturer name (optional)"
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "500",
              marginBottom: "6px",
            }}
          >
            Batch Number
          </label>
          <input
            type="text"
            value={productData.batchNumber}
            onChange={(e) =>
              setProductData({ ...productData, batchNumber: e.target.value })
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "13px",
            }}
            placeholder="Enter batch number (optional)"
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "500",
              marginBottom: "6px",
            }}
          >
            Description
          </label>
          <textarea
            value={productData.description}
            onChange={(e) =>
              setProductData({ ...productData, description: e.target.value })
            }
            rows="3"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "13px",
              resize: "vertical",
            }}
            placeholder="Enter product description..."
          />
        </div>
      </div>
    </div>
  );
  const renderPricingStep = () => (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #f1f5f9",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Cost Price ({currency}) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={productData.costPrice}
            onChange={(e) =>
              setProductData({
                ...productData,
                costPrice: parseFloat(e.target.value) || 0,
              })
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
              backgroundColor: "#ffffff",
            }}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Selling Price ({currency}) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={productData.price}
            onChange={(e) =>
              setProductData({
                ...productData,
                price: parseFloat(e.target.value) || 0,
              })
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
              backgroundColor: "#ffffff",
            }}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Initial Stock *
          </label>
          <input
            type="number"
            min="0"
            value={productData.quantity}
            onChange={(e) =>
              setProductData({
                ...productData,
                quantity: parseInt(e.target.value) || 0,
              })
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
              backgroundColor: "#ffffff",
            }}
            placeholder="0"
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Min Stock Level *
          </label>
          <input
            type="number"
            min="0"
            value={productData.minStockLevel}
            onChange={(e) =>
              setProductData({
                ...productData,
                minStockLevel: parseInt(e.target.value) || 0,
              })
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
              backgroundColor: "#ffffff",
            }}
            placeholder="0"
            required
          />
        </div>
      </div>

      {/* Compact Profit Analysis */}
      {productData.price && productData.costPrice && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "6px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #d1fae5",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#166534",
              marginBottom: "8px",
            }}
          >
            Profit Analysis
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "12px",
              fontSize: "12px",
            }}
          >
            <div>
              <span style={{ color: "#16a34a" }}>Profit per unit:</span>
              <span
                style={{
                  fontWeight: "600",
                  marginLeft: "6px",
                  color: "#166534",
                }}
              >
                {currency}
                {(productData.price - productData.costPrice).toFixed(2)}
              </span>
            </div>
            <div>
              <span style={{ color: "#16a34a" }}>Margin:</span>
              <span
                style={{
                  fontWeight: "600",
                  marginLeft: "6px",
                  color: "#166534",
                }}
              >
                {(
                  ((productData.price - productData.costPrice) /
                    productData.price) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div>
              <span style={{ color: "#16a34a" }}>Total Value:</span>
              <span
                style={{
                  fontWeight: "600",
                  marginLeft: "6px",
                  color: "#166534",
                }}
              >
                {currency}
                {(productData.price * productData.quantity).toFixed(2)}
              </span>
            </div>{" "}
          </div>{" "}
        </div>
      )}
    </div>
  );

  const renderPurchaseDetailsStep = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#1f2937",
          marginBottom: "8px",
        }}
      >
        Purchase Order Details
      </h2>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "8px",
            }}
          >
            Supplier *
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              list="purchase-suppliers"
              value={purchaseDetails.supplierName}
              onChange={(e) => {
                const inputValue = e.target.value;
                const existingSupplier = suppliers.find(
                  (s) => s.name === inputValue
                );

                setPurchaseDetails({
                  ...purchaseDetails,
                  supplierName: inputValue,
                  supplierId: existingSupplier ? existingSupplier.id : "",
                });
              }}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
              }}
              placeholder="Select or type supplier name"
              required
            />
            <datalist id="purchase-suppliers">
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.name} />
              ))}
            </datalist>
            {purchaseDetails.supplierName && !purchaseDetails.supplierId && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#eff6ff",
                  border: "1px solid #93c5fd",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  color: "#1e40af",
                  marginTop: "4px",
                  zIndex: 10,
                }}
              >
                ✨ New supplier "{purchaseDetails.supplierName}" will be created
              </div>
            )}
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "8px",
            }}
          >
            Order Quantity *
          </label>
          <input
            type="number"
            min="1"
            value={purchaseDetails.quantity}
            onChange={(e) =>
              setPurchaseDetails({
                ...purchaseDetails,
                quantity: parseInt(e.target.value) || 1,
              })
            }
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
            }}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "8px",
            }}
          >
            Expected Delivery Date *
          </label>
          <input
            type="date"
            value={purchaseDetails.expectedDelivery}
            onChange={(e) =>
              setPurchaseDetails({
                ...purchaseDetails,
                expectedDelivery: e.target.value,
              })
            }
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
            }}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "8px",
            }}
          >
            Total Cost
          </label>
          <input
            type="text"
            value={`${currency}${(productData.costPrice * purchaseDetails.quantity).toFixed(2)}`}
            readOnly
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "#f9fafb",
              color: "#6b7280",
            }}
          />
        </div>
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "500",
            marginBottom: "8px",
          }}
        >
          Purchase Notes
        </label>
        <textarea
          value={purchaseDetails.notes}
          onChange={(e) =>
            setPurchaseDetails({ ...purchaseDetails, notes: e.target.value })
          }
          rows="3"
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
            resize: "vertical",
          }}
          placeholder="Add any notes for this purchase order..."
        />
      </div>
    </div>
  );
  const renderAdditionalDetailsStep = () => (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #f1f5f9",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Expiry Date *
          </label>
          <input
            type="date"
            value={productData.expiryDate}
            onChange={(e) =>
              setProductData({ ...productData, expiryDate: e.target.value })
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
              backgroundColor: "#ffffff",
            }}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Barcode
          </label>
          <input
            type="text"
            value={productData.barcode}
            onChange={(e) =>
              setProductData({ ...productData, barcode: e.target.value })
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
              backgroundColor: "#ffffff",
            }}
            placeholder="Enter barcode (optional)"
          />
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#1f2937",
          marginBottom: "8px",
        }}
      >
        Review{" "}
        {isFromPurchaseOrder ? "Product & Purchase Order" : "Product Details"}
      </h2>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#1f2937",
            marginBottom: "16px",
          }}
        >
          Product Information
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              Product Name:
            </span>
            <div style={{ fontWeight: "600", color: "#1f2937" }}>
              {productData.name}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              Category:
            </span>
            <div style={{ fontWeight: "600", color: "#1f2937" }}>
              {productData.category}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              Supplier:
            </span>
            <div style={{ fontWeight: "600", color: "#1f2937" }}>
              {productData.supplierName}
            </div>
          </div>
          {productData.manufacturer && (
            <div>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                Manufacturer:
              </span>
              <div style={{ fontWeight: "600", color: "#1f2937" }}>
                {productData.manufacturer}
              </div>
            </div>
          )}
          <div>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              Cost Price:
            </span>
            <div style={{ fontWeight: "600", color: "#1f2937" }}>
              {currency}
              {(parseFloat(productData.costPrice) || 0).toFixed(2)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              Selling Price:
            </span>
            <div
              style={{ fontWeight: "600", color: "#10b981", fontSize: "16px" }}
            >
              {currency}
              {(parseFloat(productData.price) || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {isFromPurchaseOrder && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "16px",
            }}
          >
            Purchase Order Summary
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                Supplier:
              </span>
              <div style={{ fontWeight: "600", color: "#1f2937" }}>
                {purchaseDetails.supplierName}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                Quantity:
              </span>
              <div style={{ fontWeight: "600", color: "#1f2937" }}>
                {purchaseDetails.quantity} units
              </div>
            </div>
            <div>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                Expected Delivery:
              </span>
              <div style={{ fontWeight: "600", color: "#1f2937" }}>
                {new Date(
                  purchaseDetails.expectedDelivery
                ).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                Total Cost:
              </span>
              <div
                style={{
                  fontWeight: "600",
                  color: "#10b981",
                  fontSize: "16px",
                }}
              >
                {currency}
                {(productData.costPrice * purchaseDetails.quantity).toFixed(2)}
              </div>
            </div>
          </div>
          {purchaseDetails.notes && (
            <div style={{ marginTop: "16px" }}>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>Notes:</span>
              <div
                style={{
                  marginTop: "4px",
                  padding: "8px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "4px",
                }}
              >
                {purchaseDetails.notes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderSteps = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {steps.map((step, index) => (
        <div
          key={index}
          onClick={() => setCurrentStep(index)}
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor:
              currentStep === index ? "var(--color-primary)" : "white",
            color:
              currentStep === index ? "white" : "var(--color-text-primary)",
            fontWeight: currentStep === index ? "600" : "500",
            cursor: "pointer",
            border:
              currentStep === index
                ? "none"
                : "1px solid var(--color-border-light)",
            transition: "background-color 0.3s, color 0.3s",
          }}
        >
          {step}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    if (isFromPurchaseOrder) {
      switch (currentStep) {
        case 0:
          return renderBasicInfoStep();
        case 1:
          return renderPricingStep();
        case 2:
          return renderPurchaseDetailsStep();
        case 3:
          return renderAdditionalDetailsStep();
        case 4:
          return renderReviewStep();
        default:
          return renderBasicInfoStep();
      }
    } else {
      switch (currentStep) {
        case 0:
          return renderBasicInfoStep();
        case 1:
          return renderPricingStep();
        case 2:
          return renderAdditionalDetailsStep();
        case 3:
          return renderReviewStep();
        default:
          return renderBasicInfoStep();
      }
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Basic Information
        return !!(
          productData.name &&
          productData.category &&
          productData.supplierName
        );
      case 1: // Pricing & Stock
        return !!(
          productData.costPrice > 0 &&
          productData.price > 0 &&
          productData.quantity >= 0 &&
          productData.minStockLevel >= 0
        );
      case 2: // Purchase Details or Additional Details
        if (isFromPurchaseOrder) {
          return !!(
            purchaseDetails.supplierId &&
            purchaseDetails.quantity > 0 &&
            purchaseDetails.expectedDelivery
          );
        } else {
          return !!productData.expiryDate;
        }
      case 3: // Additional Details or Review
        if (isFromPurchaseOrder) {
          return !!productData.expiryDate;
        } else {
          return true; // Review step
        }
      case 4: // Review (only for purchase orders)
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);

    try {
      console.log("🚀 Starting product creation process");
      console.log("📋 Product data:", productData);

      // Prepare product data for database
      const productForDb = {
        name: productData.name,
        category: productData.category,
        manufacturer: productData.manufacturer || "",
        description: productData.description || "",
        costPrice: parseFloat(productData.costPrice) || 0,
        price: parseFloat(productData.price) || 0,
        quantity: parseInt(productData.quantity) || 0,
        minStockLevel: parseInt(productData.minStockLevel) || 0,
        expiryDate: productData.expiryDate || null,
        batchNumber: productData.batchNumber || "",
        barcode: productData.barcode || "",
        status: "active",
      };

      console.log("💾 Prepared product for database:", productForDb);

      // Create product in database
      const newProduct = await dataService.products.create(productForDb);

      if (!newProduct) {
        throw new Error("Failed to create product - no data returned");
      }

      console.log("✅ Product created successfully:", newProduct);

      // Update the store with new product
      addProduct(newProduct);

      if (isFromPurchaseOrder && purchaseOrderData) {
        // Handle purchase order creation
        const newPurchase = {
          id: Date.now(),
          purchaseNumber: `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
          supplierId: purchaseDetails.supplierId || Date.now(),
          supplierName: purchaseDetails.supplierName,
          orderDate: new Date().toISOString(),
          expectedDelivery: purchaseDetails.expectedDelivery,
          actualDelivery: null,
          status: "ordered",
          totalAmount: productData.costPrice * purchaseDetails.quantity,
          items: [
            {
              productId: newProduct.id,
              productName: productData.name,
              quantity: purchaseDetails.quantity,
              unitCost: productData.costPrice,
              total: productData.costPrice * purchaseDetails.quantity,
            },
          ],
          subtotal: productData.costPrice * purchaseDetails.quantity,
          tax: productData.costPrice * purchaseDetails.quantity * 0.1,
          discount: 0,
          notes:
            purchaseDetails.notes || "Product added through purchase order",
        };

        // For now, still using localStorage for purchases (we can update this later)
        const existingPurchases = JSON.parse(
          localStorage.getItem("purchases") || "[]"
        );
        existingPurchases.unshift(newPurchase);
        localStorage.setItem("purchases", JSON.stringify(existingPurchases));

        console.log("📦 Purchase order created:", newPurchase);

        navigate("/purchases", {
          state: {
            message: "Product and purchase order created successfully!",
            newPurchaseId: newPurchase.id,
          },
        });
      } else {
        navigate("/inventory", {
          state: { message: "Product added successfully!" },
        });
      }
    } catch (error) {
      console.error("❌ Error adding product:", error);

      // Show user-friendly error message
      const errorMessage =
        error.message || "Failed to add product. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>
      {/* Compact Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          padding: "12px 16px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() =>
              navigate(isFromPurchaseOrder ? "/purchases" : "/inventory")
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              backgroundColor: "#f8fafc",
              color: "#64748b",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <FiArrowLeft size={14} />
            Back to {isFromPurchaseOrder ? "Purchases" : "Inventory"}
          </button>
          <div>
            <h1
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                margin: "0",
              }}
            >
              {isFromPurchaseOrder
                ? "Add Product via Purchase Order"
                : "Add New Product"}
            </h1>
            <p style={{ color: "#6b7280", fontSize: "12px", margin: "0" }}>
              Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
            </p>
          </div>
        </div>
      </div>

      {/* Compact Progress Bar */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "8px",
            gap: "16px",
          }}
        >
          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: index <= currentStep ? "#3b82f6" : "#e5e7eb",
                  color: index <= currentStep ? "white" : "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "6px",
                }}
              >
                {index < currentStep ? <FiCheck size={14} /> : index + 1}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  color: index <= currentStep ? "#3b82f6" : "#9ca3af",
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            width: "100%",
            height: "3px",
            backgroundColor: "#e5e7eb",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
              height: "100%",
              backgroundColor: "#3b82f6",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div style={{ marginBottom: "16px" }}>{renderStepContent()}</div>

      {/* Compact Navigation Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #f1f5f9",
        }}
      >
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            backgroundColor: currentStep === 0 ? "#f3f4f6" : "white",
            color: currentStep === 0 ? "#9ca3af" : "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: currentStep === 0 ? "not-allowed" : "pointer",
          }}
        >
          <FiArrowLeft size={14} />
          Previous
        </button>

        {currentStep === steps.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={loading || !validateStep(currentStep)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor:
                loading || !validateStep(currentStep) ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor:
                loading || !validateStep(currentStep)
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                {isFromPurchaseOrder ? "Creating..." : "Adding..."}
              </>
            ) : (
              <>
                <FiPackage size={14} />
                {isFromPurchaseOrder
                  ? "Create Product & Purchase Order"
                  : "Add Product"}
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!validateStep(currentStep)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: !validateStep(currentStep)
                ? "#9ca3af"
                : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: !validateStep(currentStep) ? "not-allowed" : "pointer",
            }}
          >
            Next
            <FiArrowRight size={14} />
          </button>
        )}
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

export default AddProduct;
