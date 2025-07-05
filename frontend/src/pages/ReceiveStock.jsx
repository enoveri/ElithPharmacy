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
          batchNumber: "",
          expiryDate: "",
          notes: "",
        },
      ]);
    }
    
    setSearchTerm("");
    setShowSearch(false);
  };

  const addNewProduct = () => {
    if (!searchTerm.trim()) return;
    
    // Create a new product object for receiving
    const newProduct = {
      id: `new-${Date.now()}`, // Temporary ID for new products
      name: searchTerm.trim(),
      category: "Other", // Default category
      manufacturer: "",
      quantity: 0, // New product starts with 0 inventory
      cost_price: 0,
      price: 0,
      min_stock_level: 0,
      isNewProduct: true, // Flag to identify new products
    };
    
    addProductToReceive(newProduct);
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
    const subtotal = selectedProducts.reduce(
      (sum, product) => sum + (product.quantityReceived * (product.costPrice || 0)),
      0
    );
    const tax = subtotal * (settings.taxRate || 18) / 100;
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      setError("Please add at least one product to receive");
      return;
    }

    if (!supplier.name.trim()) {
      setError("Please enter supplier name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const processedProducts = [];
      
      // Update product quantities in inventory
      for (const product of selectedProducts) {
        const currentProduct = await dataService.products.getById(product.id);
        if (currentProduct) {
          const newQuantity = (currentProduct.quantity || 0) + product.quantityReceived;
          
          const updateData = {
            quantity: newQuantity,
            last_restock_date: new Date().toISOString(),
          };

          // Update cost price if provided
          if (product.costPrice > 0) {
            updateData.cost_price = product.costPrice;
          }

          // Update batch and expiry if provided
          if (product.batchNumber) {
            updateData.batch_number = product.batchNumber;
          }
          if (product.expiryDate) {
            updateData.expiry_date = product.expiryDate;
          }

          await dataService.products.update(product.id, updateData);
          
          // Track processed products for purchase record
          processedProducts.push({
            product_name: product.name,
            quantity: product.quantityReceived,
            unit_cost: product.costPrice || 0,
            total: product.quantityReceived * (product.costPrice || 0)
          });
        }
      }

      // Create purchase record for the manual stock receipt
      try {
        const totalAmount = processedProducts.reduce((sum, item) => sum + item.total, 0);
        const receiptDate = new Date().toISOString();

        const purchaseData = {
          purchase_number: referenceNumber,
          supplier: {
            name: supplier.name,
            contact: supplier.contact,
            email: supplier.email,
            phone: supplier.phone
          },
          order_date: receiptDate,
          expected_delivery: deliveryDate + 'T00:00:00Z',
          actual_delivery: receiptDate,
          status: 'delivered',
          total_amount: totalAmount,
          purchase_items: processedProducts,
          notes: notes || `Manual stock receipt. ${selectedProducts.length} products received.`,
          is_import: false,
          delivery_info: {
            reference_number: referenceNumber,
            delivery_date: deliveryDate,
            notes: notes
          }
        };

        await dataService.purchases.create(purchaseData);
        console.log("✅ Purchase record created for manual receipt:", referenceNumber);
      } catch (error) {
        console.error("Error creating purchase record:", error);
        // Don't fail the entire process if purchase record creation fails
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/inventory");
      }, 2000);

    } catch (error) {
      console.error("Error receiving stock:", error);
      setError("Failed to receive stock. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Import functionality methods
  const downloadTemplate = () => {
    const template = [
      [
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
      ],
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

    const csvContent = template.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "stock_import_template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportFile(file);
        setError("");
      } else {
        setError("Please select a valid CSV or Excel file");
        event.target.value = "";
      }
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= headers.length && values[0]) {
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
      const fileText = await importFile.text();
      const importData = parseCSV(fileText);
      
      if (importData.length === 0) {
        throw new Error("No valid data found in file");
      }

      // Load existing products and categories
      const existingProducts = await dataService.products.getAll();
      const existingCategories = await dataService.categories.getAll();
      
      const stats = {
        processed: 0,
        updated: 0,
        created: 0,
        categoriesCreated: 0,
        errors: []
      };

      // Get or create categories first
      const categoryMap = new Map();
      existingCategories.forEach(cat => {
        categoryMap.set(cat.name.toLowerCase(), cat.name);
      });

      const newCategories = new Set();
      
      for (const row of importData) {
        const category = row.Category || row.category || row.Tags || row.tags || '';
        if (category && !categoryMap.has(category.toLowerCase())) {
          newCategories.add(category);
        }
      }

      // Count new categories that will be created
      stats.categoriesCreated = newCategories.size;

      // Process products for preview
      const previewData = [];
      for (let i = 0; i < importData.length; i++) {
        try {
          const row = importData[i];
          setImportProgress(Math.round((i / importData.length) * 100));

          // Map the data fields (handle various column name formats)
          const productName = row.Product_Name || row.Product || row.product_name || row.product || '';
          const category = row.Category || row.category || row.Tags || row.tags || '';
          const volume = row.Volume || row.volume || '';
          const retailPrice = parseFloat(row.Retail_Price || row.retail_price || row.price || '0');
          const costPrice = parseFloat(row.Cost_Price || row.cost_price || '0');
          const quantityReceived = parseInt(row.Quantity_Received || row.In_Stock || row.in_stock || row.quantity || '0');
          const batchNumber = row.Batch_Number || row.batch_number || '';
          const expiryDate = row.Expiry_Date || row.expiry_date || row.Earliest_Expiry || '';
          const manufacturer = row.Manufacturer || row.manufacturer || '';
          // Note: Facility_Name is ignored as it represents the pharmacy (customer), not the supplier

          if (!productName) {
            stats.errors.push(`Row ${i + 2}: Product name is required`);
            continue;
          }

          // Find existing product by name
          const existingProduct = existingProducts.find(p => 
            p.name.toLowerCase() === productName.toLowerCase()
          );

          const previewItem = {
            rowNumber: i + 2,
            productName,
            category: category || 'General',
            volume,
            retailPrice,
            costPrice,
            quantityReceived,
            batchNumber,
            expiryDate,
            manufacturer,
            action: existingProduct ? 'update' : 'create',
            currentQuantity: existingProduct ? existingProduct.quantity || 0 : 0,
            newQuantity: existingProduct ? (existingProduct.quantity || 0) + quantityReceived : quantityReceived,
            existingProduct
          };

          previewData.push(previewItem);

          if (existingProduct) {
            stats.updated++;
          } else {
            stats.created++;
          }

          stats.processed++;
        } catch (error) {
          console.error("Error processing row:", i + 2, error);
          stats.errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      setImportPreview(previewData);
      setPreviewStats(stats);
      setShowPreview(true);

    } catch (error) {
      console.error("Import error:", error);
      setError(`Import failed: ${error.message}`);
    } finally {
      setImportLoading(false);
      setImportProgress(0);
    }
  };

  const confirmImport = async () => {
    if (!importPreview || !previewStats) return;

    setConfirmLoading(true);
    setError("");

    try {
      // Load existing categories
      const existingCategories = await dataService.categories.getAll();
      const categoryMap = new Map();
      existingCategories.forEach(cat => {
        categoryMap.set(cat.name.toLowerCase(), cat.name);
      });

      // Create new categories first
      const newCategories = new Set();
      for (const item of importPreview) {
        if (item.category && !categoryMap.has(item.category.toLowerCase())) {
          newCategories.add(item.category);
        }
      }

      for (const categoryName of newCategories) {
        try {
          await dataService.categories.create({
            name: categoryName,
            description: `Auto-created from import`,
            status: 'active'
          });
          categoryMap.set(categoryName.toLowerCase(), categoryName);
        } catch (error) {
          console.error("Error creating category:", categoryName, error);
        }
      }

      // Process products
      const results = {
        processed: 0,
        updated: 0,
        created: 0,
        categoriesCreated: newCategories.size,
        errors: []
      };

      const processedProducts = [];
      for (const item of importPreview) {
        try {
          if (item.action === 'update') {
            // Update existing product
            const updateData = {
              quantity: item.newQuantity,
              last_restock_date: new Date().toISOString(),
            };

            if (item.costPrice > 0) updateData.cost_price = item.costPrice;
            if (item.retailPrice > 0) updateData.price = item.retailPrice;
            if (item.category) updateData.category = item.category;
            if (item.manufacturer) updateData.manufacturer = item.manufacturer;

            await dataService.products.update(item.existingProduct.id, updateData);
            results.updated++;
          } else {
            // Create new product
            const newProduct = {
              name: item.productName,
              category: item.category || 'General',
              price: item.retailPrice || 0,
              cost_price: item.costPrice || 0,
              quantity: item.quantityReceived || 0,
              manufacturer: item.manufacturer || '',
              last_restock_date: new Date().toISOString(),
            };

            if (item.volume) newProduct.volume = item.volume;
            
            await dataService.products.create(newProduct);
            results.created++;
          }

          // Track processed products for purchase record
          processedProducts.push({
            product_name: item.productName,
            quantity: item.quantityReceived,
            unit_cost: item.costPrice,
            total: item.quantityReceived * item.costPrice
          });

          results.processed++;
        } catch (error) {
          console.error("Error processing item:", item.productName, error);
          results.errors.push(`${item.productName}: ${error.message}`);
        }
      }

      // Create purchase record for the import
      try {
        const purchaseNumber = `IMP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
        const totalAmount = processedProducts.reduce((sum, item) => sum + item.total, 0);
        const importDate = new Date().toISOString();

        const purchaseData = {
          purchase_number: purchaseNumber,
          supplier: {
            name: supplier.name || 'CSV Import',
            contact: supplier.contact || '',
            email: supplier.email || '',
            phone: supplier.phone || ''
          },
          order_date: importDate,
          expected_delivery: importDate,
          actual_delivery: importDate,
          status: 'delivered',
          total_amount: totalAmount,
          purchase_items: processedProducts,
          notes: `Bulk import from CSV file. ${results.processed} items processed, ${results.updated} updated, ${results.created} created.`,
          is_import: true, // Flag to identify this as an import record
          import_stats: {
            processed: results.processed,
            updated: results.updated,
            created: results.created,
            categoriesCreated: results.categoriesCreated,
            import_date: importDate,
            reference_number: referenceNumber
          }
        };

        await dataService.purchases.create(purchaseData);
        console.log("✅ Purchase record created for import:", purchaseNumber);
      } catch (error) {
        console.error("Error creating purchase record:", error);
        // Don't fail the entire import if purchase record creation fails
      }

      setImportResults(results);
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reset preview state
      setImportPreview(null);
      setPreviewStats(null);
      setShowPreview(false);

      // Reload products to update the search
      await loadProducts();

    } catch (error) {
      console.error("Import error:", error);
      setError(`Import failed: ${error.message}`);
    } finally {
      setConfirmLoading(false);
    }
  };

  const cancelImport = () => {
    setImportPreview(null);
    setPreviewStats(null);
    setShowPreview(false);
    setImportFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetImport = () => {
    setShowImport(false);
    setImportFile(null);
    setImportResults(null);
    setImportProgress(0);
    setImportPreview(null);
    setPreviewStats(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (success) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: "48px",
            textAlign: "center",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <FiCheckCircle
            style={{
              fontSize: "64px",
              color: "#10b981",
              marginBottom: "16px",
            }}
          />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "8px",
            }}
          >
            Stock Received Successfully!
          </h2>
          <p
            style={{
              color: "#6b7280",
              marginBottom: "16px",
            }}
          >
            Inventory has been updated with the received stock.
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#9ca3af",
            }}
          >
            Redirecting to inventory...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <FiPackage style={{ fontSize: "24px", color: "#3b82f6" }} />
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#1f2937",
            }}
          >
            Receive Stock
          </h1>
        </div>
        <button
          onClick={() => navigate("/inventory")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          <FiArrowLeft size={16} />
          Back to Inventory
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Error Display */}
        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <FiAlertCircle style={{ color: "#f87171", fontSize: "20px" }} />
            <span style={{ color: "#dc2626", fontSize: "14px" }}>{error}</span>
          </div>
        )}

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
            <FiUser style={{ fontSize: "20px" }} />
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
                  marginBottom: "8px",
                }}
              >
                Supplier Name *
              </label>
              <input
                type="text"
                required
                value={supplier.name}
                onChange={(e) => setSupplier({ ...supplier, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
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
                  marginBottom: "8px",
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
                  marginBottom: "8px",
                }}
              >
                Phone Number
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
                  marginBottom: "8px",
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
                }}
                placeholder="Email address"
              />
            </div>
          </div>
        </div>

        {/* Delivery Information */}
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
            Delivery Information
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
                  marginBottom: "8px",
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
                }}
                placeholder="Reference/Invoice number"
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
                marginBottom: "8px",
              }}
            >
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                resize: "vertical",
              }}
              placeholder="Additional notes about the delivery..."
            />
          </div>
        </div>

        {/* Import Section */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "500",
                color: "#1f2937",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiUpload style={{ fontSize: "20px" }} />
              Import Stock Data
            </h2>
            <button
              type="button"
              onClick={() => setShowImport(!showImport)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              <FiFileText size={16} />
              {showImport ? "Hide Import" : "Bulk Import"}
            </button>
          </div>

          {showImport && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Template Download */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  backgroundColor: "#dbeafe",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <h3 style={{ fontWeight: "500", color: "#1e3a8a" }}>Download Template</h3>
                  <p style={{ fontSize: "14px", color: "#1d4ed8" }}>
                    Get the correct CSV template to ensure proper data import
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  <FiDownload size={16} />
                  Download Template
                </button>
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Upload CSV/Excel File
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    <FiUpload className="h-4 w-4 mr-2" />
                    Choose File
                  </button>
                  {importFile && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{importFile.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setImportFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {importFile && (
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={processImportData}
                      disabled={importLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                    >
                      {importLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing... {importProgress}%
                        </>
                      ) : (
                        <>
                          <FiUpload className="h-4 w-4 mr-2" />
                          Import Data
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelImport}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Import Progress */}
              {importLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing import...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Import Preview */}
              {showPreview && importPreview && previewStats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Import Preview</h3>
                    <div className="text-sm text-gray-500">
                      {importPreview.length} items found
                    </div>
                  </div>
                  
                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-600">{previewStats.processed}</div>
                      <div className="text-sm text-blue-700">To Process</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">{previewStats.updated}</div>
                      <div className="text-sm text-green-700">Will Update</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-semibold text-purple-600">{previewStats.created}</div>
                      <div className="text-sm text-purple-700">Will Create</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg font-semibold text-orange-600">{previewStats.categoriesCreated}</div>
                      <div className="text-sm text-orange-700">Categories</div>
                    </div>
                  </div>

                  {/* Errors */}
                  {previewStats.errors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
                      <div className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                        {previewStats.errors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h4 className="font-medium text-gray-900">Products to Import</h4>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product Name
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cost Price
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Retail Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importPreview.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                {item.manufacturer && (
                                  <div className="text-xs text-gray-500">{item.manufacturer}</div>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.action === 'create' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {item.action === 'create' ? 'Create' : 'Update'}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {item.category}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {item.action === 'update' ? (
                                  <span className="text-green-600">
                                    {item.currentQuantity} → {item.newQuantity}
                                  </span>
                                ) : (
                                  <span>{item.quantityReceived}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {currency} {item.costPrice.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {currency} {item.retailPrice.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Confirmation Buttons */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={cancelImport}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmImport}
                      disabled={confirmLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                    >
                      {confirmLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Confirming...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className="h-4 w-4 mr-2" />
                          Confirm Import
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Import Results */}
              {importResults && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Import Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-600">{importResults.processed}</div>
                      <div className="text-sm text-blue-700">Processed</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">{importResults.updated}</div>
                      <div className="text-sm text-green-700">Updated</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-semibold text-purple-600">{importResults.created}</div>
                      <div className="text-sm text-purple-700">Created</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg font-semibold text-orange-600">{importResults.categoriesCreated}</div>
                      <div className="text-sm text-orange-700">Categories</div>
                    </div>
                  </div>
                  
                  {importResults.errors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                      <div className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                        {importResults.errors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={resetImport}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close Import
                  </button>
                </div>
              )}

              {/* Import Instructions */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Import Instructions:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Download the template to see the required format</li>
                  <li>• Product_Name column is required for all rows</li>
                  <li>• Categories (Tags column) will be created automatically if they don't exist</li>
                  <li>• Existing products will have their stock quantities updated (added to current stock)</li>
                  <li>• New products will be created with the provided information</li>
                  <li>• Facility_Name column is ignored (represents your pharmacy, not the supplier)</li>
                  <li>• Supports both CSV and Excel (.xlsx, .xls) files</li>
                </ul>
              </div>
            </div>
          )}
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
          {showSearch && searchResults.length > 0 && (
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
              {searchResults.map((product) => (
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
              ))}
            </div>
          )}
        </div>

        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontWeight: "500", color: "#1f2937", fontSize: "16px" }}>Products to Receive</h3>
            
            {selectedProducts.map((product, index) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                {isMobile ? (
                  // Mobile Layout
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-500">{product.category}</p>
                        <p className="text-xs text-gray-400">Current: {product.quantity || 0}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => updateProductQuantity(index, -1)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <FiMinus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={product.quantityReceived}
                            onChange={(e) => updateProductField(index, 'quantityReceived', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => updateProductQuantity(index, 1)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <FiPlus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cost ({currency})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={product.costPrice}
                          onChange={(e) => updateProductField(index, 'costPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Batch #
                        </label>
                        <input
                          type="text"
                          value={product.batchNumber}
                          onChange={(e) => updateProductField(index, 'batchNumber', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          placeholder="Batch"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry
                        </label>
                        <input
                          type="date"
                          value={product.expiryDate}
                          onChange={(e) => updateProductField(index, 'expiryDate', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Desktop Layout
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-3">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-500">{product.category}</p>
                      <p className="text-xs text-gray-400">Current: {product.quantity || 0}</p>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => updateProductQuantity(index, -1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <FiMinus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={product.quantityReceived}
                          onChange={(e) => updateProductField(index, 'quantityReceived', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => updateProductQuantity(index, 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <FiPlus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost Price ({currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={product.costPrice}
                        onChange={(e) => updateProductField(index, 'costPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={product.batchNumber}
                        onChange={(e) => updateProductField(index, 'batchNumber', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        placeholder="Batch #"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={product.expiryDate}
                        onChange={(e) => updateProductField(index, 'expiryDate', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FiPackage className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No products selected</p>
            <p className="text-sm">Search and add products above to receive stock</p>
          </div>
        )}
      </div>

      {/* Totals */}
      {selectedProducts.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiDollarSign className="h-5 w-5 mr-2" />
            Summary
          </h2>
          
          <div className="space-y-2">
            {(() => {
              const totals = calculateTotals();
              return (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{currency} {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({settings.taxRate || 18}%):</span>
                    <span className="font-medium">{currency} {totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>{currency} {totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-4'}`}>
        <button
          type="button"
          onClick={() => navigate("/inventory")}
          className={`px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 ${isMobile ? 'w-full' : ''}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || selectedProducts.length === 0}
          className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${isMobile ? 'w-full justify-center' : ''}`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Receiving Stock...
            </>
          ) : (
            <>
              <FiSave className="h-4 w-4 mr-2" />
              Receive Stock
            </>
          )}
        </button>
      </div>
    </form>
  </div>
);
}

export default ReceiveStock; 