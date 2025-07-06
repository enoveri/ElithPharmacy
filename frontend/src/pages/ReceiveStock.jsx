import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiMinus,
  FiSave,
  FiArrowLeft,
  FiPackage,
  FiSearch,
  FiDollarSign,
  FiUser,
  FiTruck,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiUpload,
  FiDownload,
  FiFileText,
  FiX,
} from "react-icons/fi";
import { dataService } from "../services";
import { useSettingsStore } from "../store";
import { useIsMobile } from "../hooks/useIsMobile";

function ReceiveStock() {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { currency = "UGX" } = settings;
  const isMobile = useIsMobile();

  // Form state
  const [supplier, setSupplier] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
  });
  const [referenceNumber, setReferenceNumber] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  // Products and search
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  // Loading and status
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Import functionality
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewStats, setPreviewStats] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Load products on mount
  useEffect(() => {
    loadProducts();
    generateReferenceNumber();
  }, []);

  // Search products
  useEffect(() => {
    if (searchTerm.length > 2) {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      const productsData = await dataService.products.getAll();
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error loading products:", error);
      setError("Failed to load products");
    }
  };

  const generateReferenceNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = date.getTime().toString().slice(-4);
    setReferenceNumber(`RS-${dateStr}-${timeStr}`);
  };

  const addProductToReceive = (product) => {
    const existingIndex = selectedProducts.findIndex((p) => p.id === product.id);
    
    if (existingIndex >= 0) {
      // Product already selected, just increase quantity
      const updated = [...selectedProducts];
      updated[existingIndex].quantityReceived += 1;
      setSelectedProducts(updated);
    } else {
      // Add new product
      setSelectedProducts([
        ...selectedProducts,
        {
          ...product,
          quantityReceived: 1,
          costPrice: product.cost_price || 0,
          sellingPrice: product.price || 0,
          batchNumber: "",
          expiryDate: "",
          manufacturer: product.manufacturer || "",
          volume: product.volume || "",
          notes: "",
        },
      ]);
    }
    
    setSearchTerm("");
    setShowSearch(false);
  };

  const createNewProduct = async (searchTerm) => {
    try {
      setCreatingProduct(true);
      console.log("🔄 [ReceiveStock] Creating new product:", searchTerm);

      // Create the new product in the database
      const productData = {
        name: searchTerm.trim(),
        category: "Other", // Default category
        manufacturer: "",
        quantity: 0, // New product starts with 0 inventory
        cost_price: 0,
        price: 0,
        min_stock_level: 0,
        volume: "",
        batch_number: "",
        expiry_date: null,
        description: `Product created during stock receipt on ${new Date().toLocaleDateString()}`,
      };

      const newProduct = await dataService.products.create(productData);
      console.log("✅ [ReceiveStock] New product created:", newProduct);

      // Check if product was actually created
      if (!newProduct) {
        throw new Error("Product creation returned null");
      }

      // Add to local products list
      setProducts((prev) => [...prev, newProduct]);

      // Add the newly created product to receive stock
      addProductToReceive(newProduct);

      return newProduct;
    } catch (error) {
      console.error("❌ [ReceiveStock] Error creating product:", error);

      // Provide more specific error messages
      let errorMessage = "Error creating product. Please try again.";
      if (error.message && error.message.includes("duplicate")) {
        errorMessage =
          "A product with this name already exists. Please search for it instead.";
      } else if (error.message && error.message.includes("constraint")) {
        errorMessage =
          "Invalid product information. Please check and try again.";
      }

      setError(errorMessage);
      return null;
    } finally {
      setCreatingProduct(false);
    }
  };

  const updateProductQuantity = (index, change) => {
    const updated = [...selectedProducts];
    const newQuantity = updated[index].quantityReceived + change;
    
    if (newQuantity <= 0) {
      // Remove product if quantity becomes 0 or less
      updated.splice(index, 1);
    } else {
      updated[index].quantityReceived = newQuantity;
    }
    
    setSelectedProducts(updated);
  };

  const updateProductField = (index, field, value) => {
    const updated = [...selectedProducts];
    updated[index][field] = value;
    setSelectedProducts(updated);
  };

  const removeProduct = (index) => {
    const updated = [...selectedProducts];
    updated.splice(index, 1);
    setSelectedProducts(updated);
  };

  const calculateTotals = () => {
    const totalItems = selectedProducts.reduce((sum, product) => sum + product.quantityReceived, 0);
    const totalCost = selectedProducts.reduce((sum, product) => sum + (product.quantityReceived * product.costPrice), 0);
    
    return { totalItems, totalCost };
  };

  // Import functionality
  const downloadTemplate = () => {
    const headers = [
      "Product_Name",
      "Category", 
      "Volume",
      "Retail_Price",
      "Cost_Price",
      "Quantity_Received",
      "Batch_Number",
      "Expiry_Date",
      "Manufacturer",
      "Notes"
    ];
    
    const sampleData = [
      [
        "Panadol 500mg",
        "Pain Relief",
        "500mg", 
        "1000",
        "750",
        "100",
        "BATCH001",
        "2025-12-31",
        "GSK",
        "From supplier ABC Ltd"
      ],
      [
        "Amoxicillin 250mg",
        "Antibiotics",
        "250mg",
        "500", 
        "300",
        "50",
        "BATCH002",
        "2026-06-30",
        "Generic Labs",
        "Express delivery"
      ]
    ];
    
    const csvContent = [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "stock_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError("Please select a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }
    
    setImportFile(file);
    setError("");
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length >= headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    
    return data;
  };

  const processImportData = async () => {
    if (!importFile) return;
    
    setImportLoading(true);
    setImportProgress(0);
    setError("");
    
    try {
      const text = await importFile.text();
      const data = parseCSV(text);
      
      if (data.length === 0) {
        throw new Error("No valid data found in file");
      }
      
      // Validate required fields
      const requiredFields = ['Product_Name'];
      const validData = data.filter(row => {
        return requiredFields.every(field => row[field] && row[field].trim());
      });
      
      if (validData.length === 0) {
        throw new Error("No rows with required Product_Name found");
      }
      
      // Process each row
      const processedData = [];
      let existingProducts = 0;
      let newProducts = 0;
      
      for (let i = 0; i < validData.length; i++) {
        const row = validData[i];
        setImportProgress((i / validData.length) * 100);
        
        // Check if product exists
        const existingProduct = products.find(p => 
          p.name.toLowerCase() === row.Product_Name.toLowerCase()
        );
        
        if (existingProduct) {
          existingProducts++;
                     processedData.push({
             ...existingProduct,
             quantityReceived: parseInt(row.Quantity_Received) || 0,
             costPrice: parseFloat(row.Cost_Price) || existingProduct.cost_price || 0,
             sellingPrice: parseFloat(row.Retail_Price) || existingProduct.price || 0,
             batchNumber: row.Batch_Number || "",
             expiryDate: row.Expiry_Date || "",
             manufacturer: row.Manufacturer || existingProduct.manufacturer || "",
             volume: row.Volume || existingProduct.volume || "",
             notes: row.Notes || "",
             isExisting: true
           });
        } else {
          newProducts++;
                     processedData.push({
             id: `new-${Date.now()}-${i}`,
             name: row.Product_Name.trim(),
             category: row.Category || "Other",
             manufacturer: row.Manufacturer || "",
             quantity: 0,
             cost_price: parseFloat(row.Cost_Price) || 0,
             price: parseFloat(row.Retail_Price) || 0,
             min_stock_level: 0,
             quantityReceived: parseInt(row.Quantity_Received) || 0,
             costPrice: parseFloat(row.Cost_Price) || 0,
             sellingPrice: parseFloat(row.Retail_Price) || 0,
             batchNumber: row.Batch_Number || "",
             expiryDate: row.Expiry_Date || "",
             volume: row.Volume || "",
             notes: row.Notes || "",
             isNewProduct: true
           });
        }
      }
      
      setImportProgress(100);
      setImportPreview(processedData);
      setPreviewStats({
        total: processedData.length,
        existing: existingProducts,
        new: newProducts
      });
      setShowPreview(true);
      
    } catch (error) {
      console.error("Import processing error:", error);
      setError(`Import failed: ${error.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    
    setConfirmLoading(true);
    setError("");
    
    try {
      // Create new products first
      const newProducts = importPreview.filter(p => p.isNewProduct);
      const createdProducts = [];
      
      for (const productData of newProducts) {
        try {
                     const newProduct = await dataService.products.create({
             name: productData.name,
             category: productData.category,
             manufacturer: productData.manufacturer,
             quantity: 0,
             cost_price: productData.cost_price,
             price: productData.price,
             min_stock_level: 0,
             volume: productData.volume,
             batch_number: productData.batchNumber,
             expiry_date: productData.expiryDate,
             description: `Imported on ${new Date().toLocaleDateString()}`
           });
          
          if (newProduct) {
                         createdProducts.push({
               ...newProduct,
               quantityReceived: productData.quantityReceived,
               costPrice: productData.costPrice,
               sellingPrice: productData.sellingPrice,
               batchNumber: productData.batchNumber,
               expiryDate: productData.expiryDate,
               manufacturer: productData.manufacturer,
               volume: productData.volume,
               notes: productData.notes
             });
          }
        } catch (error) {
          console.error("Error creating product:", productData.name, error);
        }
      }
      
      // Add existing products
      const existingProducts = importPreview.filter(p => p.isExisting);
      
      // Combine all products for receiving
      const allProducts = [...createdProducts, ...existingProducts];
      
      // Add to selected products
      setSelectedProducts(prev => {
        const combined = [...prev];
        
        allProducts.forEach(importedProduct => {
          const existingIndex = combined.findIndex(p => p.id === importedProduct.id);
          
                     if (existingIndex >= 0) {
             // Update existing selection
             combined[existingIndex].quantityReceived += importedProduct.quantityReceived;
             combined[existingIndex].costPrice = importedProduct.costPrice;
             combined[existingIndex].sellingPrice = importedProduct.sellingPrice;
             combined[existingIndex].batchNumber = importedProduct.batchNumber;
             combined[existingIndex].expiryDate = importedProduct.expiryDate;
             combined[existingIndex].manufacturer = importedProduct.manufacturer;
             combined[existingIndex].volume = importedProduct.volume;
             combined[existingIndex].notes = importedProduct.notes;
          } else {
            // Add new selection
            combined.push(importedProduct);
          }
        });
        
        return combined;
      });
      
      // Update products list with new products
      setProducts(prev => [...prev, ...createdProducts]);
      
      // Show success and reset import
      setImportResults({
        total: allProducts.length,
        created: createdProducts.length,
        updated: existingProducts.length
      });
      
      // Reset import state
      setImportFile(null);
      setImportPreview(null);
      setShowPreview(false);
      setShowImport(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error("Import confirmation error:", error);
      setError(`Import failed: ${error.message}`);
    } finally {
      setConfirmLoading(false);
    }
  };

  const cancelImport = () => {
    setImportFile(null);
    setImportPreview(null);
    setShowPreview(false);
    setImportProgress(0);
    setError("");
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportPreview(null);
    setShowPreview(false);
    setImportProgress(0);
    setImportResults(null);
    setError("");
    setShowImport(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      setError("Please add at least one product to receive stock");
      return;
    }

    if (!supplier.name.trim()) {
      setError("Please enter supplier name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create the stock receive record with proper field mapping for Purchases page
      const receiveData = {
        // Core purchase fields
        purchase_number: referenceNumber,
        purchaseNumber: referenceNumber, // Alternative field name
        
        // Supplier information
        supplier_name: supplier.name,
        supplierName: supplier.name, // Alternative field name
        supplier_contact: supplier.contact,
        supplier_email: supplier.email,
        supplier_phone: supplier.phone,
        
        // Dates
        order_date: new Date().toISOString().split('T')[0], // Today as order date
        orderDate: new Date().toISOString().split('T')[0], // Alternative field name
        delivery_date: deliveryDate, // Keep original for reference
        expected_delivery: deliveryDate,
        expectedDelivery: deliveryDate, // Alternative field name
        actual_delivery: deliveryDate, // Mark as delivered immediately for stock receipts
        actualDelivery: deliveryDate, // Alternative field name
        
        // Financial totals
        total_items: calculateTotals().totalItems,
        total_cost: calculateTotals().totalCost,
        total_amount: calculateTotals().totalCost,
        totalAmount: calculateTotals().totalCost, // Alternative field name
        
        // Status and type
        status: "delivered", // Stock receipts are automatically delivered
        type: "stock_receipt", // Identify this as a stock receipt vs regular purchase order
        is_stock_receipt: true,
        
        // Notes
        notes: notes,
        
        // Product items in the format expected by Purchases page
        purchase_items: selectedProducts.map(product => ({
          product_id: product.id,
          product_name: product.name,
          quantity_received: product.quantityReceived,
          quantity_ordered: product.quantityReceived, // Same as received for stock receipts
          cost_price: product.costPrice,
          selling_price: product.sellingPrice,
          batch_number: product.batchNumber,
          expiry_date: product.expiryDate,
          manufacturer: product.manufacturer,
          volume: product.volume,
          notes: product.notes,
          line_total: product.quantityReceived * product.costPrice
        })),
        items: selectedProducts.map(product => ({ // Alternative field name
          product_id: product.id,
          product_name: product.name,
          quantity_received: product.quantityReceived,
          quantity_ordered: product.quantityReceived,
          cost_price: product.costPrice,
          selling_price: product.sellingPrice,
          batch_number: product.batchNumber,
          expiry_date: product.expiryDate,
          manufacturer: product.manufacturer,
          volume: product.volume,
          notes: product.notes,
          line_total: product.quantityReceived * product.costPrice
        }))
      };

      // Submit the receive stock record as a purchase
      const result = await dataService.purchases.create(receiveData);
      
      if (result) {
        // Update product quantities and all relevant fields after successful purchase
        for (const product of selectedProducts) {
          try {
            const currentProduct = await dataService.products.getById(product.id);
            if (currentProduct) {
              const updateData = {
                quantity: (currentProduct.quantity || 0) + product.quantityReceived,
                cost_price: product.costPrice || currentProduct.cost_price,
                last_restock_date: new Date().toISOString()
              };

              // Update selling price if provided
              if (product.sellingPrice && product.sellingPrice > 0) {
                updateData.price = product.sellingPrice;
              }

              // Update batch number if provided
              if (product.batchNumber) {
                updateData.batch_number = product.batchNumber;
              }

              // Update expiry date if provided
              if (product.expiryDate) {
                updateData.expiry_date = product.expiryDate;
              }

              // Update manufacturer if provided
              if (product.manufacturer) {
                updateData.manufacturer = product.manufacturer;
              }

              // Update volume if provided
              if (product.volume) {
                updateData.volume = product.volume;
              }

              await dataService.products.update(product.id, updateData);
            }
          } catch (error) {
            console.error("Error updating product:", error);
          }
        }
        
        setSuccess(true);
        
        // Reset form and redirect to purchases page
        setTimeout(() => {
          navigate("/purchases", { 
            state: { 
              message: "Stock received successfully!",
              newPurchaseId: result.id 
            } 
          });
        }, 2000);
      } else {
        throw new Error("Failed to submit stock receive record");
      }
    } catch (error) {
      console.error("Error submitting stock receive:", error);
      setError("Failed to submit stock receive record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Basic JSX structure
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: isMobile ? "16px" : "24px",
      }}
    >
      {/* Add CSS for animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => navigate("/inventory")}
              style={{
                padding: "8px",
                backgroundColor: "white",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiArrowLeft style={{ fontSize: "18px" }} />
            </button>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#1f2937",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiPackage style={{ fontSize: "24px" }} />
              Receive Stock
            </h1>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setShowImport(!showImport)}
              style={{
                padding: "8px 16px",
                backgroundColor: showImport ? "#3b82f6" : "white",
                border: "1px solid #3b82f6",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: showImport ? "white" : "#3b82f6",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <FiUpload style={{ fontSize: "16px" }} />
              {showImport ? "Hide Import" : "Bulk Import"}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div
            style={{
              backgroundColor: "#dcfce7",
              border: "1px solid #22c55e",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FiCheckCircle style={{ color: "#22c55e" }} />
            <span style={{ color: "#166534" }}>Stock received successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #ef4444",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FiAlertCircle style={{ color: "#ef4444" }} />
            <span style={{ color: "#dc2626" }}>{error}</span>
          </div>
        )}

        {/* Import Success Message */}
        {importResults && (
          <div
            style={{
              backgroundColor: "#dcfce7",
              border: "1px solid #22c55e",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FiCheckCircle style={{ color: "#22c55e" }} />
            <span style={{ color: "#166534" }}>
              Import successful! {importResults.total} products processed 
              ({importResults.created} created, {importResults.updated} updated)
            </span>
            <button
              onClick={resetImport}
              style={{
                marginLeft: "auto",
                padding: "4px",
                backgroundColor: "transparent",
                border: "none",
                color: "#22c55e",
                cursor: "pointer",
              }}
            >
              <FiX />
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Supplier Information */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "500",
                color: "#1f2937",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiTruck style={{ fontSize: "20px" }} />
              Supplier Information
            </h2>
            
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
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
                    marginBottom: "6px",
                  }}
                >
                  Supplier Name *
                </label>
                <input
                  type="text"
                  value={supplier.name}
                  onChange={(e) => setSupplier({ ...supplier, name: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="Enter supplier name"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Contact Person
                </label>
                <input
                  type="text"
                  value={supplier.contact}
                  onChange={(e) => setSupplier({ ...supplier, contact: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Phone
                </label>
                <input
                  type="tel"
                  value={supplier.phone}
                  onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={supplier.email}
                  onChange={(e) => setSupplier({ ...supplier, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="Email address"
                />
              </div>
            </div>
          </div>

          {/* Import Section */}
          {showImport && (
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "500",
                  color: "#1f2937",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FiUpload style={{ fontSize: "20px" }} />
                Bulk Import Products
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Download Template */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    onClick={downloadTemplate}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    <FiDownload style={{ fontSize: "16px" }} />
                    Download Template
                  </button>
                  <span style={{ fontSize: "14px", color: "#6b7280" }}>
                    Get the CSV template with sample data
                  </span>
                </div>

                {/* File Upload */}
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
                    Upload CSV/Excel File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px dashed #d1d5db",
                      borderRadius: "8px",
                      backgroundColor: "#f9fafb",
                      cursor: "pointer",
                    }}
                  />
                  {importFile && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "8px 12px",
                        backgroundColor: "#f0f9ff",
                        border: "1px solid #3b82f6",
                        borderRadius: "6px",
                        fontSize: "14px",
                        color: "#1e40af",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <FiFileText />
                      {importFile.name}
                    </div>
                  )}
                </div>

                {/* Process Button */}
                {importFile && !importLoading && !showPreview && (
                  <button
                    onClick={processImportData}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#3b82f6",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      alignSelf: "flex-start",
                    }}
                  >
                    <FiUpload />
                    Process File
                  </button>
                )}

                {/* Import Progress */}
                {importLoading && (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f0f9ff",
                      border: "1px solid #3b82f6",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          border: "2px solid #3b82f6",
                          borderTop: "2px solid transparent",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      <span style={{ fontSize: "14px", color: "#1e40af" }}>
                        Processing import... {Math.round(importProgress)}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        backgroundColor: "#e5e7eb",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${importProgress}%`,
                          height: "100%",
                          backgroundColor: "#3b82f6",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Import Preview */}
                {showPreview && importPreview && previewStats && (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f9fafb",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "500",
                        color: "#1f2937",
                        marginBottom: "12px",
                      }}
                    >
                      Import Preview
                    </h3>
                    
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#dbeafe",
                          borderRadius: "6px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "18px", fontWeight: "600", color: "#1e40af" }}>
                          {previewStats.total}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>Total Products</div>
                      </div>
                      <div
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#dcfce7",
                          borderRadius: "6px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "18px", fontWeight: "600", color: "#166534" }}>
                          {previewStats.new}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>New Products</div>
                      </div>
                      <div
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#fef3c7",
                          borderRadius: "6px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "18px", fontWeight: "600", color: "#92400e" }}>
                          {previewStats.existing}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>Existing Products</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <button
                        onClick={confirmImport}
                        disabled={confirmLoading}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: confirmLoading ? "#d1d5db" : "#22c55e",
                          border: "none",
                          borderRadius: "6px",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "500",
                          cursor: confirmLoading ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {confirmLoading ? (
                          <>
                            <div
                              style={{
                                width: "14px",
                                height: "14px",
                                border: "2px solid #ffffff",
                                borderTop: "2px solid transparent",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                              }}
                            />
                            Importing...
                          </>
                        ) : (
                          <>
                            <FiCheckCircle />
                            Confirm Import
                          </>
                        )}
                      </button>
                      <button
                        onClick={cancelImport}
                        disabled={confirmLoading}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "white",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          color: "#374151",
                          fontSize: "14px",
                          fontWeight: "500",
                          cursor: confirmLoading ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <FiX />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Import Instructions */}
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#1f2937",
                      marginBottom: "8px",
                    }}
                  >
                    Import Instructions:
                  </h3>
                  <ul style={{ fontSize: "12px", color: "#6b7280", margin: 0, paddingLeft: "16px" }}>
                    <li>Download the template to see the required format</li>
                    <li>Product_Name column is required for all rows</li>
                    <li>Categories will be created automatically if they don't exist</li>
                    <li>Existing products will have their stock quantities updated</li>
                    <li>New products will be created with the provided information</li>
                    <li>Supports both CSV and Excel (.xlsx, .xls) files</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Product Search and Selection */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "500",
                color: "#1f2937",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiSearch style={{ fontSize: "20px" }} />
              Add Products Manually
            </h2>
            
            {/* Search Box */}
            <div style={{ position: "relative", marginBottom: "24px" }}>
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  height: "100%",
                  paddingLeft: "12px",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <FiSearch style={{ fontSize: "20px", color: "#9ca3af" }} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  paddingLeft: "40px",
                  paddingRight: "16px",
                  paddingTop: "12px",
                  paddingBottom: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
                placeholder="Search products by name, category, or manufacturer..."
              />
              
              {/* Search Results Dropdown */}
              {showSearch && (
                <div
                  style={{
                    position: "absolute",
                    zIndex: "10",
                    width: "100%",
                    backgroundColor: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    marginTop: "4px",
                    maxHeight: "240px",
                    overflowY: "auto",
                  }}
                >
                  {searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProductToReceive(product)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          textAlign: "left",
                          backgroundColor: "white",
                          border: "none",
                          borderBottom: "1px solid #f3f4f6",
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#f9fafb";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "white";
                        }}
                      >
                        <div style={{ fontWeight: "500", color: "#1f2937" }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          {product.category} • Current Stock: {product.quantity || 0}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        color: "#6b7280",
                        fontSize: "14px",
                      }}
                    >
                      No existing products found
                    </div>
                  )}
                  
                  {/* Create new product option */}
                  {searchTerm.trim() && (
                    <div
                      onClick={() => createNewProduct(searchTerm)}
                      style={{
                        padding: "12px",
                        cursor: creatingProduct ? "not-allowed" : "pointer",
                        backgroundColor: creatingProduct ? "#f3f4f6" : "#f0f9ff",
                        border: "2px dashed #3b82f6",
                        borderRadius: "4px",
                        margin: "4px",
                        opacity: creatingProduct ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!creatingProduct) {
                          e.target.style.backgroundColor = "#dbeafe";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!creatingProduct) {
                          e.target.style.backgroundColor = "#f0f9ff";
                        }
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "500",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FiPlus size={16} />
                        {creatingProduct
                          ? "Creating..."
                          : `Create "${searchTerm}"`}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        {creatingProduct
                          ? "Please wait..."
                          : "Add as new product"}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Products */}
            {selectedProducts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontWeight: "500", color: "#1f2937", fontSize: "16px" }}>Products to Receive</h3>
                
                {selectedProducts.map((product, index) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-500">{product.category}</p>
                        <p className="text-xs text-gray-400">Current Stock: {product.quantity || 0}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => updateProductQuantity(index, -1)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <FiMinus />
                          </button>
                          <input
                            type="number"
                            value={product.quantityReceived}
                            onChange={(e) => updateProductField(index, "quantityReceived", parseInt(e.target.value) || 0)}
                            className="w-16 text-center border-t border-b border-gray-300 py-1"
                            min="0"
                          />
                          <button
                            type="button"
                            onClick={() => updateProductQuantity(index, 1)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <FiPlus />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cost Price ({currency})
                        </label>
                        <input
                          type="number"
                          value={product.costPrice}
                          onChange={(e) => updateProductField(index, "costPrice", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Selling Price ({currency})
                        </label>
                        <input
                          type="number"
                          value={product.sellingPrice || 0}
                          onChange={(e) => updateProductField(index, "sellingPrice", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Batch Number
                        </label>
                        <input
                          type="text"
                          value={product.batchNumber}
                          onChange={(e) => updateProductField(index, "batchNumber", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={product.expiryDate}
                          onChange={(e) => updateProductField(index, "expiryDate", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Manufacturer
                        </label>
                        <input
                          type="text"
                          value={product.manufacturer || ""}
                          onChange={(e) => updateProductField(index, "manufacturer", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Optional"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Volume/Size
                        </label>
                        <input
                          type="text"
                          value={product.volume || ""}
                          onChange={(e) => updateProductField(index, "volume", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="e.g., 500mg, 100ml"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total Items:</span>
                    <span className="text-lg font-semibold text-gray-900">{calculateTotals().totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium text-gray-900">Total Cost:</span>
                    <span className="text-lg font-semibold text-gray-900">{currency} {calculateTotals().totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "500",
                color: "#1f2937",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiFileText style={{ fontSize: "20px" }} />
              Additional Details
            </h2>
            
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
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
                    marginBottom: "6px",
                  }}
                >
                  Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="Auto-generated reference"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
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
            </div>

            <div style={{ marginTop: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  resize: "vertical",
                }}
                placeholder="Additional notes about this stock receipt..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/inventory")}
              style={{
                padding: "12px 24px",
                backgroundColor: "white",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedProducts.length === 0}
              style={{
                padding: "12px 24px",
                backgroundColor: loading || selectedProducts.length === 0 ? "#d1d5db" : "#3b82f6",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "white",
                cursor: loading || selectedProducts.length === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #ffffff",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <FiSave style={{ fontSize: "16px" }} />
                  Receive Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReceiveStock; 