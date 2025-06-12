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

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      title: "Basic Information",
      description: "Product name, category and description",
      icon: FiInfo,
      color: "var(--color-secondary-600)",
    },
    {
      id: 2,
      title: "Pricing & Inventory",
      description: "Prices, quantity and stock levels",
      icon: FiDollarSign,
      color: "var(--color-success-600)",
    },
    {
      id: 3,
      title: "Additional Details",
      description: "Barcode, manufacturer and other details",
      icon: FiPackage,
      color: "var(--color-warning-600)",
    },
  ];

  // Load existing product data
  useEffect(() => {
    if (id) {
      setLoading(true);
      setTimeout(() => {
        setFormData({
          name: "Paracetamol 500mg",
          category: "Pain Relief",
          description: "Effective pain relief and fever reducer",
          price: "25.50",
          costPrice: "18.00",
          quantity: "150",
          minStockLevel: "20",
          barcode: "1234567890123",
          manufacturer: "PharmaCorp Ltd",
          expiryDate: "2025-12-31",
          batchNumber: "PC2024001",
          location: "A-12-03",
          status: "active",
          image: null,
        });
        setLoading(false);
      }, 1000);
    }
  }, [id]);

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
      case 4:
        // Image validation if needed
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Show success message or navigate
      navigate("/inventory", {
        state: { message: "Product updated successfully!" },
      });
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
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
  ];

  if (loading && !formData.name) {
    return (
      <div className="app-layout">
        <div className="main-content">
          <div className="flex items-center justify-center min-h-screen">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: "var(--color-primary-600)" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="card animate-fade-in">
            <div className="card-header">
              <h2 className="card-title">Basic Information</h2>
              <p className="card-subtitle">Enter the basic product details</p>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`form-input ${
                      errors.name ? "border-red-500" : ""
                    }`}
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p
                      className="text-sm mt-1 flex items-center gap-1"
                      style={{ color: "var(--color-danger-500)" }}
                    >
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`form-input ${
                      errors.category ? "border-red-500" : ""
                    }`}
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
                      className="text-sm mt-1 flex items-center gap-1"
                      style={{ color: "var(--color-danger-500)" }}
                    >
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div className="form-group md:col-span-2">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="form-input"
                    placeholder="Enter product description"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="card animate-fade-in">
            <div className="card-header">
              <h2 className="card-title">Pricing & Inventory</h2>
              <p className="card-subtitle">Set prices and stock information</p>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="form-group">
                  <label className="form-label">Selling Price (₦) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`form-input ${
                      errors.price ? "border-red-500" : ""
                    }`}
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p
                      className="text-sm mt-1 flex items-center gap-1"
                      style={{ color: "var(--color-danger-500)" }}
                    >
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.price}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Cost Price (₦) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    className={`form-input ${
                      errors.costPrice ? "border-red-500" : ""
                    }`}
                    placeholder="0.00"
                  />
                  {errors.costPrice && (
                    <p
                      className="text-sm mt-1 flex items-center gap-1"
                      style={{ color: "var(--color-danger-500)" }}
                    >
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.costPrice}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Current Stock *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className={`form-input ${
                      errors.quantity ? "border-red-500" : ""
                    }`}
                    placeholder="0"
                  />
                  {errors.quantity && (
                    <p
                      className="text-sm mt-1 flex items-center gap-1"
                      style={{ color: "var(--color-danger-500)" }}
                    >
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.quantity}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Min Stock Level *</label>
                  <input
                    type="number"
                    name="minStockLevel"
                    value={formData.minStockLevel}
                    onChange={handleInputChange}
                    className={`form-input ${
                      errors.minStockLevel ? "border-red-500" : ""
                    }`}
                    placeholder="0"
                  />
                  {errors.minStockLevel && (
                    <p
                      className="text-sm mt-1 flex items-center gap-1"
                      style={{ color: "var(--color-danger-500)" }}
                    >
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.minStockLevel}
                    </p>
                  )}
                </div>
              </div>

              {/* Profit Margin Display */}
              {formData.price && formData.costPrice && (
                <div
                  className="mt-6 p-4 rounded-lg"
                  style={{ backgroundColor: "var(--color-success-50)" }}
                >
                  <h3
                    className="font-semibold mb-2"
                    style={{ color: "var(--color-success-800)" }}
                  >
                    Profit Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span style={{ color: "var(--color-success-700)" }}>
                        Profit per unit:
                      </span>
                      <span
                        className="font-semibold ml-2"
                        style={{ color: "var(--color-success-800)" }}
                      >
                        ₦
                        {(
                          parseFloat(formData.price) -
                          parseFloat(formData.costPrice)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "var(--color-success-700)" }}>
                        Margin:
                      </span>
                      <span
                        className="font-semibold ml-2"
                        style={{ color: "var(--color-success-800)" }}
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
                      <span style={{ color: "var(--color-success-700)" }}>
                        Total Value:
                      </span>
                      <span
                        className="font-semibold ml-2"
                        style={{ color: "var(--color-success-800)" }}
                      >
                        ₦
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
          </div>
        );

      case 3:
        return (
          <div className="card animate-fade-in">
            <div className="card-header">
              <h2 className="card-title">Additional Details</h2>
              <p className="card-subtitle">
                Product identification and tracking information
              </p>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="form-group">
                  <label className="form-label">Barcode</label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter barcode"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter manufacturer"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Batch Number</label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter batch number"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Storage Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., A-12-03"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--color-bg-main)" }}
    >
      <div className="w-full">
        {/* Header */}
        <div className="topbar">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/inventory")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "white",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border-light)",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                marginRight: "16px",
              }}
            >
              <FiArrowLeft size={16} />
              Back to Inventory
            </button>

            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Edit Product
              </h1>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Update product information in {steps.length} easy steps
              </p>
            </div>
          </div>
        </div>

        {/* Step Progress */}
        <div className="mb-8 px-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep > step.id ? "scale-110" : ""
                  }`}
                  style={{
                    backgroundColor:
                      currentStep >= step.id
                        ? step.color
                        : "var(--color-bg-main)",
                    color:
                      currentStep >= step.id
                        ? "white"
                        : "var(--color-text-muted)",
                    border:
                      currentStep >= step.id
                        ? "none"
                        : "2px solid var(--color-border-light)",
                  }}
                >
                  {currentStep > step.id ? (
                    <FiCheck className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <h3
                  className="font-semibold mt-2 text-center text-sm"
                  style={{
                    color:
                      currentStep >= step.id
                        ? step.color
                        : "var(--color-text-secondary)",
                  }}
                >
                  {step.title}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6">
          <div>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pb-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="btn btn-outline disabled:opacity-50"
              >
                <FiArrowLeft className="w-4 h-4" />
                Previous
              </button>

              <div
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                Step {currentStep} of {steps.length}
              </div>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
                >
                  Next
                  <FiArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn btn-success disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      Update Product
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProduct;
