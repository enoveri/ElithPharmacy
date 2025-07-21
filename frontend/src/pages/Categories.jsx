import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiTag,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiArrowLeft,
  FiPackage,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiLoader,
  FiArrowRight,
  FiEye,
} from "react-icons/fi";
import { dataService } from "../services";

function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs for modal management
  const modalRef = useRef(null);
  const nameInputRef = useRef(null);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Focus management for modals
  useEffect(() => {
    if (showAddModal || showEditModal) {
      // Focus the name input when modal opens
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [showAddModal, showEditModal]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && (showAddModal || showEditModal || showDeleteModal)) {
        if (!isSubmitting) {
          closeModals();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAddModal, showEditModal, showDeleteModal, isSubmitting]);

  // Handle form submission with Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showAddModal || showEditModal) {
        submitCategory();
      }
    }
  };

  // Prevent modal close when clicking inside modal content
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = () => {
    if (!isSubmitting) {
      closeModals();
    }
  };

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 [Categories] Loading categories...");
      const categoriesData = await dataService.categories.getAll();
      console.log("✅ [Categories] Categories loaded:", categoriesData);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("❌ [Categories] Error loading categories:", error);
      // Fallback categories
      setCategories([
        { id: 1, name: "Pain Relief", description: "Pain management medications", productCount: 15 },
        { id: 2, name: "Antibiotics", description: "Antibiotic medications", productCount: 8 },
        { id: 3, name: "Vitamins & Supplements", description: "Nutritional supplements", productCount: 23 },
        { id: 4, name: "Cold & Flu", description: "Cold and flu remedies", productCount: 12 },
        { id: 5, name: "Digestive Health", description: "Digestive system medications", productCount: 7 },
        { id: 6, name: "Heart & Blood Pressure", description: "Cardiovascular medications", productCount: 11 },
        { id: 7, name: "Diabetes Care", description: "Diabetes management products", productCount: 9 },
        { id: 8, name: "Skin Care", description: "Dermatological products", productCount: 18 },
        { id: 9, name: "Eye Care", description: "Ophthalmic products", productCount: 5 },
        { id: 10, name: "Other", description: "Miscellaneous products", productCount: 3 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCategory = () => {
    setFormData({ name: "", description: "" });
    setSelectedCategory(null);
    setShowAddModal(true);
  };

  const handleEditCategory = (e, category) => {
    e.stopPropagation(); // Prevent category navigation
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setShowEditModal(true);
  };

  const handleDeleteCategory = (e, category) => {
    e.stopPropagation(); // Prevent category navigation
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  // Navigate to category products page
  const handleCategoryClick = (category) => {
    console.log("🔄 [Categories] Navigating to category:", category.name);
    navigate(`/categories/${category.id}`, { 
      state: { 
        categoryName: category.name,
        categoryDescription: category.description 
      } 
    });
  };

  const submitCategory = async () => {
    if (!formData.name.trim()) {
      alert("Category name is required");
      nameInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      if (showEditModal) {
        // Update existing category
        await dataService.categories.update(selectedCategory.id, formData);
        console.log("✅ [Categories] Category updated successfully");
      } else {
        // Create new category
        await dataService.categories.create(formData);
        console.log("✅ [Categories] Category created successfully");
      }
      
      await loadCategories();
      closeModals();
    } catch (error) {
      console.error("❌ [Categories] Error saving category:", error);
      alert("Error saving category. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);
    try {
      await dataService.categories.delete(selectedCategory.id);
      console.log("✅ [Categories] Category deleted successfully");
      await loadCategories();
      closeModals();
    } catch (error) {
      console.error("❌ [Categories] Error deleting category:", error);
      alert("Error deleting category. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModals = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedCategory(null);
    setFormData({ name: "", description: "" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => navigate("/inventory")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "white",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <FiArrowLeft size={16} />
              Back to Inventory
            </button>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>
                Categories Management
              </h1>
              <p style={{ fontSize: "16px", color: "#6b7280", margin: "4px 0 0 0" }}>
                Manage product categories and organize your inventory
              </p>
            </div>
          </div>
          <button
            onClick={handleAddCategory}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            <FiPlus size={16} />
            Add Category
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "white",
            }}
          />
          <FiSearch
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6b7280",
            }}
          />
        </div>
      </div>

            {/* Categories Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
            }}
            onClick={() => navigate(`/categories/${category.id}`, {
              state: {
                categoryName: category.name,
                categoryDescription: category.description
              }
            })}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#dbeafe",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "12px",
                }}
              >
                <FiTag color="#3b82f6" size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: 0 }}>
                  {category.name}
                </h3>
              </div>
            </div>
            
            {category.description && (
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
                {category.description}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FiPackage size={14} color="#6b7280" />
                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                  Click to view products
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    handleEditCategory(category);
                  }}
                  style={{
                    padding: "6px",
                    backgroundColor: "#dbeafe",
                    color: "#3b82f6",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                  title="Edit Category"
                >
                  <FiEdit size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    handleDeleteCategory(category);
                  }}
                  style={{
                    padding: "6px",
                    backgroundColor: "#fecaca",
                    color: "#ef4444",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                  title="Delete Category"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#f3f4f6",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <FiTag size={32} color="#9ca3af" />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
            No categories found
          </h3>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
            {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first category"}
          </p>
          {!searchTerm && (
            <button
              onClick={handleAddCategory}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              <FiPlus size={16} />
              Add Your First Category
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal Dialog */}
      {(showAddModal || showEditModal) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          }}
        >
          <div 
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-200"
            onClick={handleModalClick}
            style={{
              animation: "slideIn 0.2s ease-out",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <FiTag className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {showEditModal ? "Edit Category" : "Add New Category"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {showEditModal ? "Update category information" : "Create a new product category"}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModals} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
                title="Close dialog (Esc)"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); submitCategory(); }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter category name"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Enter category description (optional)"
                    rows="3"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Press Enter to submit, Shift+Enter for new line
                  </p>
                </div>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeModals}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={submitCategory}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isSubmitting || !formData.name.trim()}
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                    {showEditModal ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4 mr-2" />
                    {showEditModal ? "Update Category" : "Create Category"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
          style={{ 
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-200"
            onClick={handleModalClick}
            style={{
              animation: "slideIn 0.2s ease-out",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Delete Category</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <button 
                onClick={closeModals} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
                title="Close dialog (Esc)"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <FiAlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">
                      Warning: Category Deletion
                    </p>
                    <p className="text-yellow-700">
                      Deleting this category will affect all products currently assigned to it.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the category{" "}
                <span className="font-semibold text-gray-900">"{selectedCategory?.name}"</span>?
              </p>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeModals}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4 mr-2" />
                    Delete Category
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default Categories;
