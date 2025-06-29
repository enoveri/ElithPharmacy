import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  FiAlertCircle,
} from "react-icons/fi";
import { dbHelpers } from "../lib/db";
import { useIsMobile } from "../hooks/useIsMobile";
import "../styles/mobile.css";

function EditCustomer() {
  // Mobile detection hook
  const isMobile = useIsMobile();
  const { id } = useParams();
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
      title: "Address & Location",
      description: "Address and location details",
      icon: FiMapPin,
      color: "var(--color-success-600)",
    },
    {
      id: 3,
      title: "Medical Information",
      description: "Health details and emergency contacts",
      icon: FiCalendar,
      color: "var(--color-warning-600)",
    },
  ];

  // Load existing customer data
  useEffect(() => {
    if (id) {
      const loadCustomer = async () => {
        setLoading(true);
        try {
          const customer = await dbHelpers.getCustomerById(id);
          if (customer) {
            setFormData({
              firstName: customer.first_name || customer.firstName || "",
              lastName: customer.last_name || customer.lastName || "",
              email: customer.email || "",
              phone: customer.phone || "",
              address: customer.address || "",
              city: customer.city || "",
              state: customer.state || "",
              zipCode: customer.zip_code || customer.zipCode || "",
              dateOfBirth: customer.date_of_birth || customer.dateOfBirth || "",
              gender: customer.gender || "",
              emergencyContact:
                customer.emergency_contact || customer.emergencyContact || "",
              emergencyPhone:
                customer.emergency_phone || customer.emergencyPhone || "",
              allergies: customer.allergies || "",
              medicalConditions:
                customer.medical_conditions || customer.medicalConditions || "",
              status: customer.status || "active",
            });
          }
        } catch (error) {
          console.error("Error loading customer:", error);
        } finally {
          setLoading(false);
        }
      };
      loadCustomer();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim())
          newErrors.firstName = "First name is required";
        if (!formData.lastName.trim())
          newErrors.lastName = "Last name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.phone.trim())
          newErrors.phone = "Phone number is required";
        break;
      case 2:
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        break;
      case 3:
        // Optional validation for medical info
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
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);

    try {
      let result;
      if (id) {
        // Update existing customer
        result = await dbHelpers.updateCustomer(id, formData);
        console.log("Customer updated successfully:", result);
      } else {
        // Create new customer
        result = await dbHelpers.createCustomer(formData);
        console.log("Customer created successfully:", result);
      }

      if (result) {
        navigate("/customers", {
          state: {
            message: id
              ? "Customer updated successfully!"
              : "Customer added successfully!",
          },
        });
      } else {
        console.error("Failed to save customer");
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.firstName) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "var(--color-bg-main)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
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
                      ? {
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "8px",
                        }
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
                      ? {
                          width: "100%",
                          padding: "12px 16px",
                          border: errors.firstName
                            ? "2px solid #ef4444"
                            : "2px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "16px",
                          backgroundColor: "#ffffff",
                          color: "#1f2937",
                          outline: "none",
                        }
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
                  <p
                    style={{
                      fontSize: isMobile ? "13px" : "11px",
                      color: "#ef4444",
                      marginTop: isMobile ? "6px" : "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "6px" : "3px",
                      fontWeight: isMobile ? "500" : "normal",
                    }}
                  >
                    <FiAlertCircle size={isMobile ? 14 : 12} />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "8px",
                        }
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
                      ? {
                          width: "100%",
                          padding: "12px 16px",
                          border: errors.lastName
                            ? "2px solid #ef4444"
                            : "2px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "16px",
                          backgroundColor: "#ffffff",
                          color: "#1f2937",
                          outline: "none",
                        }
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
                  <p
                    style={{
                      fontSize: isMobile ? "13px" : "11px",
                      color: "#ef4444",
                      marginTop: isMobile ? "6px" : "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "6px" : "3px",
                      fontWeight: isMobile ? "500" : "normal",
                    }}
                  >
                    <FiAlertCircle size={isMobile ? 14 : 12} />
                    {errors.lastName}
                  </p>
                )}
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "8px",
                        }
                      : {
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                        }
                  }
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {
                          width: "100%",
                          padding: "12px 16px",
                          border: errors.email
                            ? "2px solid #ef4444"
                            : "2px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "16px",
                          backgroundColor: "#ffffff",
                          color: "#1f2937",
                          outline: "none",
                        }
                      : {
                    width: "100%",
                    padding: "10px 12px",
                    border: errors.email
                      ? "1px solid #ef4444"
                      : "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p
                    style={{
                      fontSize: isMobile ? "13px" : "11px",
                      color: "#ef4444",
                      marginTop: isMobile ? "6px" : "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "6px" : "3px",
                      fontWeight: isMobile ? "500" : "normal",
                    }}
                  >
                    <FiAlertCircle size={isMobile ? 14 : 12} />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "8px",
                        }
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
                      ? {
                          width: "100%",
                          padding: "12px 16px",
                          border: errors.phone
                            ? "2px solid #ef4444"
                            : "2px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "16px",
                          backgroundColor: "#ffffff",
                          color: "#1f2937",
                          outline: "none",
                        }
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
                {errors.phone && (
                  <p
                    style={{
                      fontSize: isMobile ? "13px" : "11px",
                      color: "#ef4444",
                      marginTop: isMobile ? "6px" : "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "6px" : "3px",
                      fontWeight: isMobile ? "500" : "normal",
                    }}
                  >
                    <FiAlertCircle size={isMobile ? 14 : 12} />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "8px",
                        }
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
                      ? {
                          width: "100%",
                          padding: "12px 16px",
                          border: "2px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "16px",
                          backgroundColor: "#ffffff",
                          color: "#1f2937",
                          outline: "none",
                        }
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
                      ? {
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "8px",
                        }
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
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {
                          width: "100%",
                          padding: "12px 16px",
                          border: "2px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "16px",
                          backgroundColor: "#ffffff",
                          color: "#1f2937",
                          outline: "none",
                        }
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
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
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
                gridTemplateColumns: "1fr",
                gap: "16px",
              }}
            >
              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "8px",
                        }
                      : {
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                        }
                  }
                >
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {
                          width: "100%",
                          padding: "12px 16px",
                          border: errors.address
                            ? "2px solid #ef4444"
                            : "2px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "16px",
                          backgroundColor: "#ffffff",
                          color: "#1f2937",
                          outline: "none",
                        }
                      : {
                    width: "100%",
                    padding: "10px 12px",
                    border: errors.address
                      ? "1px solid #ef4444"
                      : "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Enter street address"
                />
                {errors.address && (
                  <p
                    style={{
                      fontSize: isMobile ? "13px" : "11px",
                      color: "#ef4444",
                      marginTop: isMobile ? "6px" : "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? "6px" : "3px",
                      fontWeight: isMobile ? "500" : "normal",
                    }}
                  >
                    <FiAlertCircle size={isMobile ? 14 : 12} />
                    {errors.address}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 200px",
                  gap: "16px",
                }}
              >
                <div className={isMobile ? "mobile-form-group" : ""}>
                  <label
                    className={isMobile ? "mobile-form-label" : ""}
                    style={
                      isMobile
                        ? {
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1f2937",
                            marginBottom: "8px",
                          }
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
                        ? {
                            width: "100%",
                            padding: "12px 16px",
                            border: errors.city
                              ? "2px solid #ef4444"
                              : "2px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "16px",
                            backgroundColor: "#ffffff",
                            color: "#1f2937",
                            outline: "none",
                          }
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
                  {errors.city && (
                    <p
                      style={{
                        fontSize: isMobile ? "13px" : "11px",
                        color: "#ef4444",
                        marginTop: isMobile ? "6px" : "3px",
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? "6px" : "3px",
                        fontWeight: isMobile ? "500" : "normal",
                      }}
                    >
                      <FiAlertCircle size={isMobile ? 14 : 12} />
                      {errors.city}
                    </p>
                  )}
                </div>

                <div className={isMobile ? "mobile-form-group" : ""}>
                  <label
                    className={isMobile ? "mobile-form-label" : ""}
                    style={
                      isMobile
                        ? {
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1f2937",
                            marginBottom: "8px",
                          }
                        : {
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "6px",
                          }
                    }
                  >
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={isMobile ? "mobile-form-input" : ""}
                    style={
                      isMobile
                        ? {
                            width: "100%",
                            padding: "12px 16px",
                            border: errors.state
                              ? "2px solid #ef4444"
                              : "2px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "16px",
                            backgroundColor: "#ffffff",
                            color: "#1f2937",
                            outline: "none",
                          }
                        : {
                      width: "100%",
                      padding: "10px 12px",
                      border: errors.state
                        ? "1px solid #ef4444"
                        : "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "13px",
                      backgroundColor: "#ffffff",
                          }
                    }
                    placeholder="Enter state"
                  />
                  {errors.state && (
                    <p
                      style={{
                        fontSize: isMobile ? "13px" : "11px",
                        color: "#ef4444",
                        marginTop: isMobile ? "6px" : "3px",
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? "6px" : "3px",
                        fontWeight: isMobile ? "500" : "normal",
                      }}
                    >
                      <FiAlertCircle size={isMobile ? 14 : 12} />
                      {errors.state}
                    </p>
                  )}
                </div>

                <div className={isMobile ? "mobile-form-group" : ""}>
                  <label
                    className={isMobile ? "mobile-form-label" : ""}
                    style={
                      isMobile
                        ? {
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1f2937",
                            marginBottom: "8px",
                          }
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
                        ? {
                            width: "100%",
                            padding: "12px 16px",
                            border: "2px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "16px",
                            backgroundColor: "#ffffff",
                            color: "#1f2937",
                            outline: "none",
                          }
                        : {
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "13px",
                      backgroundColor: "#ffffff",
                          }
                    }
                    placeholder="ZIP code"
                  />
                </div>
              </div>
            </div>
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
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "8px",
                        }
                      : {
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                        }
                  }
                >
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {
                          width: "100%",
                          padding: "12px 16px",
                          border: "2px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "16px",
                          backgroundColor: "#ffffff",
                          color: "#1f2937",
                          outline: "none",
                        }
                      : {
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Emergency contact name"
                />
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "8px",
                        }
                      : {
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                        }
                  }
                >
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {
                          width: "100%",
                          padding: "12px 16px",
                          border: "2px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "16px",
                          backgroundColor: "#ffffff",
                          color: "#1f2937",
                          outline: "none",
                        }
                      : {
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                        }
                  }
                  placeholder="Emergency contact phone"
                />
              </div>

              <div className={isMobile ? "mobile-form-group" : ""}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "8px",
                        }
                      : {
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                        }
                  }
                >
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {
                          width: "100%",
                          padding: "12px 16px",
                          border: "2px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "16px",
                          backgroundColor: "#ffffff",
                          color: "#1f2937",
                          outline: "none",
                        }
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className={isMobile ? "mobile-form-group" : ""} style={{ gridColumn: "1 / -1" }}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "8px",
                        }
                      : {
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                        }
                  }
                >
                  Known Allergies
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  rows={3}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {
                          width: "100%",
                          padding: "12px 16px",
                          border: "2px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "16px",
                          backgroundColor: "#ffffff",
                          color: "#1f2937",
                          outline: "none",
                          resize: "vertical",
                        }
                      : {
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                    resize: "vertical",
                        }
                  }
                  placeholder="List any known allergies (comma separated)"
                />
              </div>

              <div className={isMobile ? "mobile-form-group" : ""} style={{ gridColumn: "1 / -1" }}>
                <label
                  className={isMobile ? "mobile-form-label" : ""}
                  style={
                    isMobile
                      ? {
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "8px",
                        }
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
                  rows={3}
                  className={isMobile ? "mobile-form-input" : ""}
                  style={
                    isMobile
                      ? {
                          width: "100%",
                          padding: "12px 16px",
                          border: "2px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "16px",
                          backgroundColor: "#ffffff",
                          color: "#1f2937",
                          outline: "none",
                          resize: "vertical",
                        }
                      : {
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                    resize: "vertical",
                        }
                  }
                  placeholder="List any medical conditions"
                />
              </div>
            </div>
          </div>
        );
    }
  };
  return (
    <div
      className={isMobile ? "mobile-container" : ""}
      style={
        isMobile
          ? {}
          : { maxWidth: "1200px", margin: "0 auto", padding: "16px" }
      }
    >
      {/* Compact Page Header with Back Button */}
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
                color: "#1f2937",
                margin: "0",
              }}
            >
              {id ? "Edit Customer" : "Add Customer"} - Step {currentStep} of{" "}
              {steps.length}
            </h1>
            <p style={{ 
              color: "#6b7280", 
              fontSize: isMobile ? "14px" : "12px", 
              margin: "0",
            }}>
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
                  width: isMobile ? "36px" : "28px",
                  height: isMobile ? "36px" : "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  backgroundColor:
                    currentStep >= step.id ? "#3b82f6" : isMobile ? "#ffffff" : "#f3f4f6",
                  color: currentStep >= step.id ? "white" : isMobile ? "#6b7280" : "#9ca3af",
                  border: currentStep >= step.id ? "none" : isMobile ? "3px solid #d1d5db" : "2px solid #e5e7eb",
                  boxShadow: isMobile ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
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
                  fontSize: isMobile ? "12px" : "10px",
                  fontWeight: isMobile ? "600" : "500",
                  marginTop: isMobile ? "6px" : "3px",
                  textAlign: "center",
                  color: currentStep >= step.id ? "#3b82f6" : isMobile ? "#1f2937" : "#6b7280",
                  textShadow: isMobile ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
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
                {id ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <FiSave size={14} />
                {id ? "Update Customer" : "Add Customer"}
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

export default EditCustomer;
