import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSave,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiInfo,
} from "react-icons/fi";
import { dbHelpers } from "../lib/db";
import { useIsMobile } from "../hooks/useIsMobile";
import "../styles/mobile.css";

function AddCustomer() {
  // Mobile detection hook
  const isMobile = useIsMobile();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    dateOfBirth: "",
    gender: "",
    emergencyContact: "",
    emergencyPhone: "",
    allergies: "",
    medicalConditions: "",
    status: "active",
  });

  const steps = [
    {
      id: 1,
      title: "Basic Information",
      description: "Personal details and contact info",
      icon: FiUser,
      color: "var(--color-secondary-600)",
    },
    {
      id: 2,
      title: "Address Information",
      description: "Location and address details",
      icon: FiMapPin,
      color: "var(--color-primary-600)",
    },
    {
      id: 3,
      title: "Additional Information",
      description: "Medical and emergency details",
      icon: FiInfo,
      color: "var(--color-success-600)",
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) {
          newErrors.firstName = "First name is required";
        }
        if (!formData.lastName.trim()) {
          newErrors.lastName = "Last name is required";
        }
        if (!formData.phone.trim()) {
          newErrors.phone = "Phone number is required";
        }
        break;
      case 2:
        if (!formData.address.trim()) {
          newErrors.address = "Address is required";
        }
        if (!formData.city.trim()) {
          newErrors.city = "City is required";
        }
        break;
      case 3:
        // Optional step - no required fields
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);

    try {
      // Create customer using dbHelpers
      const newCustomer = await dbHelpers.customers.create(formData);

      if (newCustomer) {
        // Show success message (you might want to add a toast notification here)
        console.log("Customer created successfully:", newCustomer);

        // Navigate back to customers list
        navigate("/customers");
      } else {
        throw new Error("Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      setErrors({ submit: "Failed to create customer. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div
            className={isMobile ? "mobile-card" : ""}
            style={
              isMobile
                ? {}
                : {
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    border: "1px solid #f1f5f9",
                  }
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: errors.firstName
                            ? "1px solid #ef4444"
                            : "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="error-text">{errors.firstName}</p>
                )}
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: errors.lastName
                            ? "1px solid #ef4444"
                            : "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="error-text">{errors.lastName}</p>
                )}
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Enter email address"
                />
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: errors.phone
                            ? "1px solid #ef4444"
                            : "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Enter phone number"
                />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                        }
                  }
                />
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-select" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                        }
                  }
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div
            className={isMobile ? "mobile-card" : ""}
            style={
              isMobile
                ? {}
                : {
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    border: "1px solid #f1f5f9",
                  }
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              <div
                className={isMobile ? "mobile-form-group" : ""}
                style={{ gridColumn: isMobile ? "1" : "1 / -1" }}
              >
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: errors.address
                            ? "1px solid #ef4444"
                            : "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                          resize: "vertical",
                          minHeight: "80px",
                        }
                  }
                  placeholder="Enter full address"
                />
                {errors.address && (
                  <p className="error-text">{errors.address}</p>
                )}
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: errors.city
                            ? "1px solid #ef4444"
                            : "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Enter city"
                />
                {errors.city && <p className="error-text">{errors.city}</p>}
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Enter state"
                />
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Enter ZIP code"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div
            className={isMobile ? "mobile-card" : ""}
            style={
              isMobile
                ? {}
                : {
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    border: "1px solid #f1f5f9",
                  }
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  Emergency Contact
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Enter emergency contact name"
                />
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Enter emergency phone number"
                />
              </div>

              <div
                className={isMobile ? "mobile-form-group" : ""}
                style={{ gridColumn: isMobile ? "1" : "1 / -1" }}
              >
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  Allergies
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                          resize: "vertical",
                          minHeight: "60px",
                        }
                  }
                  placeholder="List any known allergies (optional)"
                />
              </div>

              <div
                className={isMobile ? "mobile-form-group" : ""}
                style={{ gridColumn: isMobile ? "1" : "1 / -1" }}
              >
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }
                  }
                >
                  Medical Conditions
                </label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {}
                      : {
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "13px",
                          backgroundColor: "#ffffff",
                          resize: "vertical",
                          minHeight: "60px",
                        }
                  }
                  placeholder="List any medical conditions (optional)"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div
        className={isMobile ? "mobile-container" : ""}
        style={
          isMobile
            ? {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "50vh",
              }
            : {
                padding: "24px",
                backgroundColor: "var(--color-bg-main)",
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }
        }
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid #f3f4f6",
            borderTop: "4px solid var(--color-primary-600)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={isMobile ? "mobile-container" : ""}
      style={
        isMobile
          ? {}
          : { maxWidth: "1200px", margin: "0 auto", padding: "16px" }
      }
    >
      {/* Header */}
      <div
        className={isMobile ? "mobile-card" : ""}
        style={
          isMobile
            ? {}
            : {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                padding: "12px 16px",
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #f1f5f9",
              }
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/customers")}
            className={isMobile ? "mobile-action-button secondary" : ""}
            style={
              isMobile
                ? {}
                : {
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
                  }
            }
          >
            <div className={isMobile ? "mobile-nav-icon" : ""}>
              <FiArrowLeft size={14} />
            </div>
            Back
          </button>
          <div>
            <h1
              style={{
                fontSize: isMobile ? "20px" : "18px",
                fontWeight: "600",
                color: isMobile ? "white" : "#1f2937",
                margin: "0",
                textShadow: isMobile ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none",
              }}
            >
              Add New Customer - Step {currentStep} of {steps.length}
            </h1>
            <p
              style={{
                color: isMobile ? "rgba(255, 255, 255, 0.8)" : "#6b7280",
                fontSize: "12px",
                margin: "0",
              }}
            >
              {steps[currentStep - 1]?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          {steps.map((step, index) => (
            <div
              key={step.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flex: 1,
                color: currentStep >= step.id ? "#3b82f6" : "#9ca3af",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor:
                    currentStep >= step.id ? "#3b82f6" : "#e5e7eb",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {currentStep > step.id ? <FiCheck size={14} /> : step.id}
              </div>
              {!isMobile && (
                <span style={{ fontSize: "12px", fontWeight: "500" }}>
                  {step.title}
                </span>
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            height: "4px",
            backgroundColor: "#e5e7eb",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              backgroundColor: "#3b82f6",
              borderRadius: "2px",
              width: `${(currentStep / steps.length) * 100}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      <form onSubmit={handleSubmit}>
        {renderStepContent()}

        {/* Error Message */}
        {errors.submit && (
          <div
            className={isMobile ? "mobile-card" : ""}
            style={
              isMobile
                ? {
                    marginTop: "16px",
                    background: "rgba(239, 68, 68, 0.1)",
                    borderColor: "rgba(239, 68, 68, 0.3)",
                  }
                : {
                    marginTop: "16px",
                    padding: "12px",
                    backgroundColor: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }
            }
          >
            {errors.submit}
          </div>
        )}

        {/* Navigation Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "24px",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={isMobile ? "mobile-action-button secondary" : ""}
            style={
              isMobile
                ? {
                    opacity: currentStep === 1 ? 0.5 : 1,
                    cursor: currentStep === 1 ? "not-allowed" : "pointer",
                  }
                : {
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    backgroundColor: currentStep === 1 ? "#f9fafb" : "#ffffff",
                    color: currentStep === 1 ? "#9ca3af" : "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: currentStep === 1 ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }
            }
          >
            <FiArrowLeft size={16} />
            Back
          </button>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNext}
              className={isMobile ? "mobile-action-button" : ""}
              style={
                isMobile
                  ? {}
                  : {
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }
              }
            >
              Next
              <FiArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className={isMobile ? "mobile-action-button" : ""}
              style={
                isMobile
                  ? {
                      opacity: loading ? 0.5 : 1,
                      cursor: loading ? "not-allowed" : "pointer",
                    }
                  : {
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      backgroundColor: loading ? "#9ca3af" : "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }
              }
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid transparent",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  Create Customer
                </>
              )}
            </button>
          )}
        </div>
      </form>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .error-text {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}

export default AddCustomer;
