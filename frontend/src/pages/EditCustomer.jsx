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

function EditCustomer() {
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
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "32px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              Basic Information
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                marginBottom: "24px",
              }}
            >
              Enter the customer's personal details
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${errors.firstName ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    <FiAlertCircle
                      style={{ display: "inline", marginRight: "4px" }}
                    />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${errors.lastName ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    <FiAlertCircle
                      style={{ display: "inline", marginRight: "4px" }}
                    />
                    {errors.lastName}
                  </p>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${errors.email ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    <FiAlertCircle
                      style={{ display: "inline", marginRight: "4px" }}
                    />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${errors.phone ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    <FiAlertCircle
                      style={{ display: "inline", marginRight: "4px" }}
                    />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: "white",
                  }}
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
              borderRadius: "12px",
              padding: "32px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              Address & Location
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                marginBottom: "24px",
              }}
            >
              Enter the customer's address details
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "24px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${errors.address ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="Enter street address"
                />
                {errors.address && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    <FiAlertCircle
                      style={{ display: "inline", marginRight: "4px" }}
                    />
                    {errors.address}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 200px",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: `1px solid ${errors.city ? "#ef4444" : "#d1d5db"}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <p
                      style={{
                        color: "#ef4444",
                        fontSize: "12px",
                        marginTop: "4px",
                      }}
                    >
                      <FiAlertCircle
                        style={{ display: "inline", marginRight: "4px" }}
                      />
                      {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: `1px solid ${errors.state ? "#ef4444" : "#d1d5db"}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    placeholder="Enter state"
                  />
                  {errors.state && (
                    <p
                      style={{
                        color: "#ef4444",
                        fontSize: "12px",
                        marginTop: "4px",
                      }}
                    >
                      <FiAlertCircle
                        style={{ display: "inline", marginRight: "4px" }}
                      />
                      {errors.state}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
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
              borderRadius: "12px",
              padding: "32px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              Medical Information
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                marginBottom: "24px",
              }}
            >
              Health details and emergency contact information
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="Emergency contact name"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="Emergency contact phone"
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Known Allergies
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                  }}
                  placeholder="List any known allergies (comma separated)"
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Medical Conditions
                </label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleInputChange}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                  }}
                  placeholder="List any medical conditions"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
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
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: "white",
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "var(--color-bg-main)",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <button
          onClick={() => navigate("/customers")}
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
          Back to Customers
        </button>{" "}
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "var(--color-text-primary)",
              margin: "0 0 4px 0",
            }}
          >
            {id ? "Edit Customer" : "Add Customer"}
          </h1>
          <p
            style={{
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            {id ? "Update" : "Add"} customer information in {steps.length} easy
            steps
          </p>
        </div>
      </div>

      {/* Step Progress */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "32px",
        }}
      >
        {steps.map((step) => (
          <div
            key={step.id}
            style={{ display: "flex", alignItems: "center", margin: "0 16px" }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  currentStep >= step.id ? step.color : "#f3f4f6",
                color: currentStep >= step.id ? "white" : "#6b7280",
                marginRight: "8px",
              }}
            >
              {currentStep > step.id ? (
                <FiCheck size={16} />
              ) : (
                <step.icon size={16} />
              )}
            </div>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: currentStep >= step.id ? step.color : "#6b7280",
              }}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "32px",
        }}
      >
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            backgroundColor: "white",
            color:
              currentStep === 1 ? "#9ca3af" : "var(--color-text-secondary)",
            border: "1px solid var(--color-border-light)",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: currentStep === 1 ? "not-allowed" : "pointer",
          }}
        >
          <FiArrowLeft size={16} />
          Previous
        </button>

        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Step {currentStep} of {steps.length}
        </div>

        {currentStep < steps.length ? (
          <button
            onClick={nextStep}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "var(--color-primary-600)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Next
            <FiArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {" "}
            {loading ? (
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
                {id ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <FiSave size={16} />
                {id ? "Update Customer" : "Add Customer"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default EditCustomer;
