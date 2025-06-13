import { useState } from "react";
import {
  FiUpload,
  FiX,
  FiDownload,
  FiAlertCircle,
  FiCheck,
} from "react-icons/fi";
import { parseCSV } from "../utils/importUtils";

const ImportModal = ({
  isOpen,
  onClose,
  onImport,
  type = "customers", // 'customers' or 'products'
  validateData,
  transformData,
}) => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: upload, 2: preview, 3: results

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setErrors([]);
    } else {
      alert("Please select a valid CSV file");
    }
  };

  const handleFileUpload = () => {
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csvData = parseCSV(e.target.result);
        const validationErrors = validateData(csvData);

        setData(csvData);
        setErrors(validationErrors);
        setStep(2);
      } catch (error) {
        alert(`Error parsing CSV: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (errors.length > 0) {
      alert("Please fix all validation errors before importing");
      return;
    }

    setLoading(true);
    try {
      const transformedData = transformData(data);
      await onImport(transformedData);
      setStep(3);
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templates = {
      customers: `First Name,Last Name,Email,Phone,Address,City,State,ZIP Code,Status,Date of Birth,Gender
John,Doe,john.doe@email.com,+234 801 234 5678,123 Lagos Street,Lagos,Lagos State,100001,active,1985-06-15,male
Jane,Smith,jane.smith@email.com,+234 802 345 6789,456 Abuja Road,Abuja,FCT,900001,active,1990-03-22,female`,
      products: `Product Name,Category,Price,Cost Price,Quantity,Min Stock Level,Status,Manufacturer,Batch Number,Barcode,Description
Paracetamol 500mg,Pain Relief,25.50,18.00,150,20,active,PharmaCorp Ltd,PC2024001,1234567890123,Effective pain relief
Amoxicillin 250mg,Antibiotics,45.00,32.00,75,15,active,MediPharm,MP2023045,2345678901234,Antibiotic medication`,
    };

    const csvContent = templates[type];
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${type}_template.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetModal = () => {
    setFile(null);
    setData([]);
    setErrors([]);
    setStep(1);
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
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
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          width: "90%",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#1f2937",
              margin: 0,
            }}
          >
            Import {type.charAt(0).toUpperCase() + type.slice(1)}
          </h2>
          <button
            onClick={handleClose}
            style={{
              padding: "8px",
              backgroundColor: "#f3f4f6",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div>
            <div
              style={{
                border: "2px dashed #d1d5db",
                borderRadius: "8px",
                padding: "40px",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              <FiUpload
                size={48}
                style={{ color: "#6b7280", marginBottom: "16px" }}
              />
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Upload CSV File
              </h3>
              <p style={{ color: "#6b7280", marginBottom: "16px" }}>
                Select a CSV file containing {type} data
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  marginBottom: "16px",
                }}
              />
              {file && (
                <div style={{ color: "#10b981", fontSize: "14px" }}>
                  Selected: {file.name}
                </div>
              )}
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
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Need a template?
              </h4>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "12px",
                }}
              >
                Download our CSV template with the correct format and sample
                data.
              </p>
              <button
                onClick={downloadTemplate}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <FiDownload size={16} />
                Download Template
              </button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={handleClose}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!file || loading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: file && !loading ? "#10b981" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: file && !loading ? "pointer" : "not-allowed",
                }}
              >
                {loading ? "Processing..." : "Upload & Validate"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Validation */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "16px",
                }}
              >
                Data Preview ({data.length} records)
              </h3>

              {errors.length > 0 && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <FiAlertCircle color="#ef4444" size={16} />
                    <span style={{ fontWeight: "600", color: "#dc2626" }}>
                      {errors.length} validation error(s) found
                    </span>
                  </div>
                  <div style={{ maxHeight: "120px", overflow: "auto" }}>
                    {errors.map((error, index) => (
                      <div
                        key={index}
                        style={{
                          fontSize: "12px",
                          color: "#dc2626",
                          marginBottom: "4px",
                        }}
                      >
                        Row {error.row}: {error.errors.join(", ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  maxHeight: "300px",
                  overflow: "auto",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ backgroundColor: "#f9fafb" }}>
                    <tr>
                      {data.length > 0 &&
                        Object.keys(data[0]).map((key) => (
                          <th
                            key={key}
                            style={{
                              padding: "8px 12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#374151",
                              borderBottom: "1px solid #e5e7eb",
                              textAlign: "left",
                            }}
                          >
                            {key}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 10).map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, valueIndex) => (
                          <td
                            key={valueIndex}
                            style={{
                              padding: "8px 12px",
                              fontSize: "12px",
                              color: "#6b7280",
                              borderBottom: "1px solid #f3f4f6",
                            }}
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.length > 10 && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "8px",
                  }}
                >
                  Showing first 10 records. Total: {data.length} records
                </p>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleClose}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={errors.length > 0 || loading}
                  style={{
                    padding: "8px 16px",
                    backgroundColor:
                      errors.length === 0 && !loading ? "#10b981" : "#9ca3af",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor:
                      errors.length === 0 && !loading
                        ? "pointer"
                        : "not-allowed",
                  }}
                >
                  {loading ? "Importing..." : "Import Data"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div style={{ textAlign: "center" }}>
            <FiCheck
              size={64}
              style={{ color: "#10b981", marginBottom: "16px" }}
            />
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Import Successful!
            </h3>
            <p style={{ color: "#6b7280", marginBottom: "24px" }}>
              {data.length} {type} have been imported successfully.
            </p>
            <button
              onClick={handleClose}
              style={{
                padding: "12px 24px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;
