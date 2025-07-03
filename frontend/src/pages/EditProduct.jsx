import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiSave,
  FiX,
  FiUpload,
  FiImage,
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiPackage,
  FiDollarSign,
  FiInfo,
  FiCamera,
} from "react-icons/fi";
import { dataService } from "../services";
import { useSettings } from "../contexts/SettingsContext";
import { useIsMobile } from "../hooks/useIsMobile";
import "../styles/mobile.css";

function EditProduct() {
  // Mobile detection hook
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { currency = "UGX" } = settings;
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    costPrice: "",
    quantity: "",
    minStockLevel: "",
    barcode: "",
    manufacturer: "",
    expiryDate: "",
    batchNumber: "",
    location: "",
    status: "active",
    image: null,
  });

  const steps = [
    {
      id: 1,
      title: "Basic Info",
      description: "Product name, category and description",
      icon: FiInfo,
      color: "#3b82f6",
    },
    {
      id: 2,
      title: "Pricing",
      description: "Prices, quantity and stock levels",
      icon: FiDollarSign,
      color: "#10b981",
    },
    {
      id: 3,
      title: "Details",
      description: "Barcode, manufacturer and other details",
      icon: FiPackage,
      color: "#f59e0b",
    },
  ];

  const [categories, setCategories] = useState([
    "Pain Relief",
    "Antibiotics",
    "Vitamins & Supplements",
    "Cold & Flu",
    "Digestive Health",
    "Heart & Blood Pressure",
    "Diabetes Care",
    "Skin Care",
    "Eye Care",
    "Other",
  ]);

  // Load existing product data and categories
  useEffect(() => {
    const loadData = async () => {
      if (id) {
        setLoading(true);
        try {
          console.log("🔍 [EditProduct] Loading product with ID:", id);

          // Load product and categories in parallel
          const [product, categoriesData] = await Promise.all([
            dataService.products.getById(id),
            dataService.categories.getAll().catch(() => []), // Fallback to empty array
          ]);

          if (!product) {
            console.error("❌ [EditProduct] Product not found");
            navigate("/inventory", {
              state: { message: "Product not found!", type: "error" },
            });
            return;
          }

          console.log("✅ [EditProduct] Product loaded:", product);

          // Update categories if loaded successfully
          if (categoriesData && categoriesData.length > 0) {
            const categoryNames = categoriesData.map((cat) => cat.name || cat);
            setCategories([...new Set([...categoryNames, "Other"])]);
            console.log("✅ [EditProduct] Categories loaded:", categoryNames);
          }

          // Map database fields to form fields (handle both camelCase and snake_case)
          setFormData({
            name: product.name || "",
            category: product.category || "",
            description: product.description || "",
            price: (product.price || 0).toString(),
            costPrice: (
              product.costPrice ||
              product.cost_price ||
              0
            ).toString(),
            quantity: (product.quantity || 0).toString(),
            minStockLevel: (
              product.minStockLevel ||
              product.min_stock_level ||
              0
            ).toString(),
            barcode: product.barcode || "",
            manufacturer: product.manufacturer || "",
            expiryDate: product.expiryDate || product.expiry_date || "",
            batchNumber: product.batchNumber || product.batch_number || "",
            location: product.location || "",
            status: product.status || "active",
            image: null,
          });
        } catch (error) {
          console.error("❌ [EditProduct] Error loading product:", error);
          navigate("/inventory", {
            state: { message: "Error loading product!", type: "error" },
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = "Product name is required";
        if (!formData.category) newErrors.category = "Category is required";
        break;
      case 2:
        if (!formData.price || parseFloat(formData.price) <= 0)
          newErrors.price = "Valid price is required";
        if (!formData.costPrice || parseFloat(formData.costPrice) <= 0)
          newErrors.costPrice = "Valid cost price is required";
        if (!formData.quantity || parseInt(formData.quantity) < 0)
          newErrors.quantity = "Valid quantity is required";
        if (!formData.minStockLevel || parseInt(formData.minStockLevel) < 0)
          newErrors.minStockLevel = "Valid minimum stock level is required";
        break;
      case 3:
        // Additional validation for step 3 if needed
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) return;

    setLoading(true);

    try {
      console.log("🚀 [EditProduct] Starting product update");
      console.log("📋 [EditProduct] Form data:", formData);

      // Prepare update data
      const updateData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        quantity: parseInt(formData.quantity) || 0,
        minStockLevel: parseInt(formData.minStockLevel) || 0,
        barcode: formData.barcode,
        manufacturer: formData.manufacturer,
        expiryDate: formData.expiryDate || null,
        batchNumber: formData.batchNumber,
        // location: formData.location, // Commented out - column doesn't exist in database
        status: formData.status,
      };

      console.log("💾 [EditProduct] Prepared update data:", updateData);

      // Update product in database
      const updatedProduct = await dataService.products.update(id, updateData);

      if (!updatedProduct) {
        throw new Error("Failed to update product - no data returned");
      }

      console.log(
        "✅ [EditProduct] Product updated successfully:",
        updatedProduct
      );

      // Show success message and navigate
      navigate("/inventory", {
        state: { message: "Product updated successfully!" },
      });
    } catch (error) {
      console.error("❌ [EditProduct] Error updating product:", error);

      // Show user-friendly error message
      const errorMessage =
        error.message || "Failed to update product. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
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
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: errors.name
                      ? "1px solid #ef4444"
                      : "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#ef4444",
                      marginTop: "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <FiAlertCircle size={12} />
                    {errors.name}
                  </p>
                )}
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
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: errors.category
                      ? "1px solid #ef4444"
                      : "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#ef4444",
                      marginTop: "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <FiAlertCircle size={12} />
                    {errors.category}
                  </p>
                )}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                    resize: "vertical",
                  }}
                  placeholder="Enter product description"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
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
                  Selling Price ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: errors.price
                      ? "1px solid #ef4444"
                      : "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#ef4444",
                      marginTop: "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <FiAlertCircle size={12} />
                    {errors.price}
                  </p>
                )}
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
                  Cost Price ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: errors.costPrice
                      ? "1px solid #ef4444"
                      : "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                  placeholder="0.00"
                />
                {errors.costPrice && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#ef4444",
                      marginTop: "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <FiAlertCircle size={12} />
                    {errors.costPrice}
                  </p>
                )}
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
                  Current Stock *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: errors.quantity
                      ? "1px solid #ef4444"
                      : "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                  placeholder="0"
                />
                {errors.quantity && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#ef4444",
                      marginTop: "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <FiAlertCircle size={12} />
                    {errors.quantity}
                  </p>
                )}
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
                  name="minStockLevel"
                  value={formData.minStockLevel}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: errors.minStockLevel
                      ? "1px solid #ef4444"
                      : "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                  placeholder="0"
                />
                {errors.minStockLevel && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#ef4444",
                      marginTop: "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <FiAlertCircle size={12} />
                    {errors.minStockLevel}
                  </p>
                )}
              </div>
            </div>

            {/* Compact Profit Analysis */}
            {formData.price && formData.costPrice && (
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
                      {(
                        parseFloat(formData.price) -
                        parseFloat(formData.costPrice)
                      ).toFixed(2)}
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
                        ((parseFloat(formData.price) -
                          parseFloat(formData.costPrice)) /
                          parseFloat(formData.price)) *
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
                      {(
                        parseFloat(formData.price) *
                        parseInt(formData.quantity || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
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
                  Barcode
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                  placeholder="Enter barcode"
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
                  Manufacturer
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                  placeholder="Enter manufacturer"
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
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
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
                  Batch Number
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                  placeholder="Enter batch number"
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
                  Storage Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                  placeholder="e.g., A-12-03"
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
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid #f3f4f6",
            borderTop: "3px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>
      {/* Compact Page Header with Back Button */}
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
            onClick={() => navigate("/inventory")}
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
            Back
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
              Edit Product - Step {currentStep} of {steps.length}
            </h1>
            <p style={{ color: "#6b7280", fontSize: "12px", margin: "0" }}>
              {steps[currentStep - 1]?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Compact Step Progress */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            marginBottom: "8px",
          }}
        >
          {steps.map((step) => (
            <div
              key={step.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  backgroundColor:
                    currentStep >= step.id ? step.color : "#f3f4f6",
                  color: currentStep >= step.id ? "white" : "#9ca3af",
                  border: currentStep >= step.id ? "none" : "2px solid #e5e7eb",
                }}
              >
                {currentStep > step.id ? (
                  <FiCheck size={14} />
                ) : (
                  <step.icon size={14} />
                )}
              </div>
              <h3
                style={{
                  fontSize: "10px",
                  fontWeight: "500",
                  marginTop: "3px",
                  textAlign: "center",
                  color: currentStep >= step.id ? step.color : "#6b7280",
                }}
              >
                {step.title}
              </h3>
            </div>
          ))}
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
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            backgroundColor: "white",
            color: "#6b7280",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: currentStep === 1 ? "not-allowed" : "pointer",
            opacity: currentStep === 1 ? 0.5 : 1,
          }}
        >
          <FiArrowLeft size={14} />
          Previous
        </button>

        <div style={{ fontSize: "12px", color: "#6b7280" }}>
          Step {currentStep} of {steps.length}
        </div>

        {currentStep < steps.length ? (
          <button
            type="button"
            onClick={nextStep}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Next
            <FiArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
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
                ></div>
                Updating...
              </>
            ) : (
              <>
                <FiSave size={14} />
                Update Product
              </>
            )}
          </button>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default EditProduct;
