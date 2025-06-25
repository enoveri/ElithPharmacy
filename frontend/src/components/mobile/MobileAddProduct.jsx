import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSave,
  FiXCircle,
  FiCamera,
  FiDollarSign,
  FiPackage,
  FiFileText,
  FiCalendar,
  FiTag,
  FiHash,
  FiMapPin,
} from "react-icons/fi";

function MobileAddProduct() {
  const navigate = useNavigate();
  const [loading, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    barcode: "",
    price: "",
    cost: "",
    quantity: "",
    minStock: "",
    manufacturer: "",
    expiryDate: "",
    batchNumber: "",
    location: "",
    image: null,
  });

  const [errors, setErrors] = useState({});

  const categories = [
    "Pain Relief",
    "Antibiotics",
    "Vitamins",
    "First Aid",
    "Prescription",
    "OTC",
    "Medical Devices",
    "Other",
  ];

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Product name is required";
      if (!formData.category) newErrors.category = "Category is required";
      if (!formData.description.trim())
        newErrors.description = "Description is required";
    } else if (step === 2) {
      if (!formData.price || formData.price <= 0)
        newErrors.price = "Valid price is required";
      if (!formData.cost || formData.cost <= 0)
        newErrors.cost = "Valid cost is required";
      if (!formData.quantity || formData.quantity <= 0)
        newErrors.quantity = "Valid quantity is required";
      if (!formData.minStock || formData.minStock < 0)
        newErrors.minStock = "Valid minimum stock is required";
    } else if (step === 3) {
      if (!formData.manufacturer.trim())
        newErrors.manufacturer = "Manufacturer is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setSaving(true);
      // In a real app, this would save to the database
      console.log("Saving product:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      navigate("/inventory", {
        state: { message: "Product added successfully!" },
      });
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    required = false,
    error,
    icon: Icon,
    multiline = false,
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        )}
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={`w-full ${Icon ? "pl-10" : "pl-3"} pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full ${Icon ? "pl-10" : "pl-3"} pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          />
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );

  const SelectField = ({
    label,
    value,
    onChange,
    options,
    required = false,
    error,
    icon: Icon,
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${Icon ? "pl-10" : "pl-3"} pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep
                ? "bg-blue-600 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            {step}
          </div>
          {step < 3 && (
            <div
              className={`w-12 h-1 mx-2 ${
                step < currentStep ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const stepTitles = {
    1: "Product Info",
    2: "Pricing & Stock",
    3: "Details & Save",
  };
  return (
    <div className="mobile-container">
      {/* Mobile Header */}
      <div className="search-filter-section">
        <div className="flex items-center justify-between mb-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="mobile-action-button secondary"
            style={{ padding: "12px" }}
          >
            <FiXCircle size={20} />
          </motion.button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-semibold gradient-text">Add Product</h1>
            <p className="text-sm text-gray-500">{stepTitles[currentStep]}</p>
          </div>
        </div>
        <StepIndicator />
      </div>

      {/* Form Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <InputField
                label="Product Name"
                value={formData.name}
                onChange={(value) => updateField("name", value)}
                placeholder="Enter product name"
                required
                error={errors.name}
                icon={FiPackage}
              />
              <SelectField
                label="Category"
                value={formData.category}
                onChange={(value) => updateField("category", value)}
                options={categories}
                required
                error={errors.category}
                icon={FiTag}
              />
              <InputField
                label="Description"
                value={formData.description}
                onChange={(value) => updateField("description", value)}
                placeholder="Enter product description"
                required
                error={errors.description}
                icon={FiFileText}
                multiline
              />{" "}
              <InputField
                label="Barcode"
                value={formData.barcode}
                onChange={(value) => updateField("barcode", value)}
                placeholder="Scan or enter barcode"
                icon={FiHash}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <InputField
                label="Selling Price"
                value={formData.price}
                onChange={(value) => updateField("price", value)}
                type="number"
                placeholder="0.00"
                required
                error={errors.price}
                icon={FiDollarSign}
              />

              <InputField
                label="Cost Price"
                value={formData.cost}
                onChange={(value) => updateField("cost", value)}
                type="number"
                placeholder="0.00"
                required
                error={errors.cost}
                icon={FiDollarSign}
              />

              <InputField
                label="Current Stock"
                value={formData.quantity}
                onChange={(value) => updateField("quantity", value)}
                type="number"
                placeholder="0"
                required
                error={errors.quantity}
                icon={FiPackage}
              />

              <InputField
                label="Minimum Stock Level"
                value={formData.minStock}
                onChange={(value) => updateField("minStock", value)}
                type="number"
                placeholder="0"
                required
                error={errors.minStock}
                icon={FiPackage}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <InputField
                label="Manufacturer"
                value={formData.manufacturer}
                onChange={(value) => updateField("manufacturer", value)}
                placeholder="Enter manufacturer name"
                required
                error={errors.manufacturer}
                icon={FiPackage}
              />
              <InputField
                label="Expiry Date"
                value={formData.expiryDate}
                onChange={(value) => updateField("expiryDate", value)}
                type="date"
                icon={FiCalendar}
              />{" "}
              <InputField
                label="Batch Number"
                value={formData.batchNumber}
                onChange={(value) => updateField("batchNumber", value)}
                placeholder="Enter batch number"
                icon={FiHash}
              />
              <InputField
                label="Location/Shelf"
                value={formData.location}
                onChange={(value) => updateField("location", value)}
                placeholder="e.g., A1-B2"
                icon={FiMapPin}
              />
              {/* Photo Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Photo
                </label>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500"
                >
                  <div className="text-center">
                    <FiCamera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Tap to add photo</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-3">
          {currentStep > 1 && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={prevStep}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium"
            >
              Previous
            </motion.button>
          )}

          {currentStep < totalSteps ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={nextStep}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium"
            >
              Next
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                </motion.div>
              ) : (
                <FiSave className="w-5 h-5 mr-2" />
              )}
              {loading ? "Saving..." : "Save Product"}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileAddProduct;
