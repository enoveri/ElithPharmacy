// Add Product page
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";

function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const validateStep = (step) => {
    // Add your step validation logic here
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      navigate("/inventory", {
        state: { message: "Product added successfully!" },
      });
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>This is the Add Product page</h1>
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
    </div>
  );
}

export default AddProduct;
