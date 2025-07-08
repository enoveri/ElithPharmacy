import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingCart,
  FiCalendar,
  FiAlertTriangle,
  FiBarChart,
  FiPieChart,
  FiClock,
  FiUser,
  FiMapPin,
  FiX,
  FiArchive,
  FiLoader,
} from "react-icons/fi";
import { dataService } from "../services";
import { useSettingsStore } from "../store";
import { useIsMobile } from "../hooks/useIsMobile";
import "../styles/mobile.css";

const OVERLAY = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";
const MODAL  = "bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden";
const HEADER = "flex items-center justify-between px-6 py-4 border-b border-gray-200";
const BODY   = "p-6 space-y-6";
const FOOTER = "flex justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200";  

function ViewProduct() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { currency = "UGX" } = settings;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteValidation, setDeleteValidation] = useState({
    hasSales: false,
    hasActiveOrders: false,
    hasStockMovements: false,
    canDelete: true,
    warnings: []
  });
  const [productAnalytics, setProductAnalytics] = useState({
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averageRating: 0,
    recentSales: [],
    topCustomers: [],
  });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const productData = await dataService.products.getById(id);
        setProduct(productData);

        const analytics = await loadProductAnalytics(id);
        setProductAnalytics(analytics);
      } catch (error) {
        console.error("Error loading product:", error);
        navigate("/inventory");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id, navigate]);

  const loadProductAnalytics = async (productId) => {
    try {
      const salesData = await dataService.sales.getAll();
      const productSales = salesData.filter((sale) =>
        sale.items?.some(
          (item) =>
            item.product_id === productId || item.productId === productId
        )
      );

      let totalSold = 0;
      let totalRevenue = 0;
      let totalProfit = 0;
      const recentSales = [];

      productSales.forEach((sale) => {
        const productItem = sale.items?.find(
          (item) =>
            item.product_id === productId || item.productId === productId
        );
        if (productItem) {
          totalSold += productItem.quantity || 0;
          const revenue =
            (productItem.price || 0) * (productItem.quantity || 0);
          totalRevenue += revenue;
          const cost =
            (product?.costPrice || product?.cost_price || 0) *
            (productItem.quantity || 0);
          totalProfit += revenue - cost;

          recentSales.push({
            id: sale.id,
            date: sale.created_at || sale.date,
            quantity: productItem.quantity,
            revenue,
            profit: revenue - cost,
            customer: sale.customer_name || "Walk-in",
          });
        }
      });

      recentSales.sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        totalSold,
        totalRevenue,
        totalProfit,
        averageRating: 4.2,
        recentSales: recentSales.slice(0, 10),
        topCustomers: [],
      };
    } catch (error) {
      console.error("Error loading analytics:", error);
      return {
        totalSold: 0,
        totalRevenue: 0,
        totalProfit: 0,
        averageRating: 0,
        recentSales: [],
        topCustomers: [],
      };
    }
  };

  const handleEdit = () => {
    navigate(`/products/edit/${id}`);
  };

  const validateBeforeDelete = async (productId) => {
    try {
      const relations = await dataService.products.getRelations(productId);
      
      if (!relations) {
        setDeleteValidation({
          hasSales: false,
          hasActiveOrders: false,
          hasStockMovements: false,
          canDelete: false,
          warnings: ["Unable to validate product dependencies. Please try again."]
        });
        return null;
      }

      const warnings = [];
      
      if (relations.salesCount > 0) {
        warnings.push(`This product has ${relations.salesCount} sales records that will be affected.`);
      }
      
      if (product?.quantity > 0) {
        warnings.push(`Product has ${product.quantity} units in stock that will be removed.`);
      }
      
      if (relations.recentSalesCount > 0) {
        warnings.push(`Product has ${relations.recentSalesCount} recent sales in the last 30 days.`);
      }
      
      const canDelete = true;
      
      const validation = {
        hasSales: relations.salesCount > 0,
        hasActiveOrders: false,
        hasStockMovements: product?.quantity > 0,
        canDelete,
        warnings,
        salesCount: relations.salesCount,
        recentSalesCount: relations.recentSalesCount,
        relations
      };
      
      setDeleteValidation(validation);
      return validation;
      
    } catch (error) {
      console.error("Error validating product:", error);
      setDeleteValidation({
        hasSales: false,
        hasActiveOrders: false,
        hasStockMovements: false,
        canDelete: false,
        warnings: ["Unable to validate product dependencies. Please try again."]
      });
      return null;
    }
  };

  const showDeleteConfirmation = async () => {
    setShowDeleteModal(true);
    await validateBeforeDelete(id);
  };

  const handleDelete = async () => {
    if (!deleteValidation.canDelete) {
      alert("This product cannot be deleted due to existing dependencies.");
      return;
    }

    setIsDeleting(true);
    try {
      const result = await dataService.products.delete(id, { cascadeDelete: true });
      
      if (result) {
        setShowDeleteModal(false);
        const message = result.affectedSales > 0 
          ? `Product deleted successfully along with ${result.affectedSales} related sales!`
          : "Product deleted successfully!";
        alert(message);
        navigate("/inventory");
      } else {
        throw new Error("Delete operation failed");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    setIsDeleting(true);
    try {
      const result = await dataService.products.archive(id, { 
        archiveRelatedSales: true,
        reason: 'Manual archive from ViewProduct'
      });
      
      if (result) {
        setShowDeleteModal(false);
        alert("Product archived successfully! It will no longer appear in active inventory.");
        navigate("/inventory");
      } else {
        throw new Error("Archive operation failed");
      }
    } catch (error) {
      console.error("Error archiving product:", error);
      alert("Error archiving product. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteValidation({
      hasSales: false,
      hasActiveOrders: false,
      hasStockMovements: false,
      canDelete: true,
      warnings: []
    });
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0)
      return {
        status: "Out of Stock",
        color: "text-red-600",
        bg: "bg-red-100",
      };
    if (quantity < 10)
      return {
        status: "Low Stock",
        color: "text-yellow-600",
        bg: "bg-yellow-100",
      };
    return { status: "In Stock", color: "text-green-600", bg: "bg-green-100" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center">
          <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Product not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The product you're looking for doesn't exist.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate("/inventory")}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.quantity || 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Actions */}
      <div className="mb-6 flex justify-between items-center p-10">
        <button
          onClick={() => navigate("/inventory")}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Inventory
        </button>
        <div className="flex gap-6 space-x-3 pt-16">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
          >
            <FiEdit className="w-4 h-4 mr-2" />
            Edit Product
          </button>
          <button
            onClick={showDeleteConfirmation}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <FiTrash2 className="w-4 h-4 mr-2" />
            Delete Product
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 p-6">
          {/* Product Information */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h1>
                  <p className="text-sm text-gray-500 mb-4">
                    {product.manufacturer || product.category}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-6 ">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Selling Price
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currency} {(product.price || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Cost Price
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currency}{" "}
                        {(product.costPrice || product.cost_price || 0).toFixed(
                          2
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Profit Margin
                      </p>
                      <p className="text-lg font-semibold text-green-600">
                        {currency}
                        {(
                          (product.price || 0) -
                          (product.costPrice || product.cost_price || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Stock</p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}
                      >
                        {product.quantity || 0} units
                      </span>
                    </div>
                  </div>

                  {product.description && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Description
                      </h3>
                      <p className="text-sm text-gray-600">
                        {product.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-500">SKU</p>
                      <p className="text-gray-900">
                        {product.sku || product.barcode || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Category</p>
                      <p className="text-gray-900">
                        {product.category || "Uncategorized"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Status</p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}
                      >
                        {stockStatus.status}
                      </span>
                    </div>
                    {product.expiry_date && (
                      <div>
                        <p className="font-medium text-gray-500">Expiry Date</p>
                        <p className="text-gray-900">
                          {new Date(product.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
                   
          {/* Analytics Sidebar */}
          <div className="space-y-6 w-full">
            {/* Quick Stats */}
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                Performance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiShoppingCart className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600">Total Sold</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {productAnalytics.totalSold} units
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiDollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm text-gray-600">Revenue</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {currency} {(productAnalytics.totalRevenue || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiTrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm text-gray-600">Profit</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {currency} {(productAnalytics.totalProfit || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Sales */}
            {productAnalytics.recentSales.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Sales
                </h3>
                <div className="space-y-3">
                  {productAnalytics.recentSales.slice(0, 5).map((sale, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {sale.quantity} units
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(sale.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {currency} {(sale.revenue || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-green-600">
                          {currency} {(sale.profit || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Improved Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Product
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isDeleting}
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-base text-gray-700">
                Are you sure you want to delete <strong className="font-semibold">{product?.name}</strong>?
              </p>
              
              {deleteValidation.warnings.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-md p-4">
                  <div className="flex">
                    <FiAlertTriangle className="flex-shrink-0 w-5 h-5 text-yellow-500 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">
                        Warning: This product has dependencies
                      </h4>
                      <ul className="text-yellow-700 space-y-2 text-sm">
                        {deleteValidation.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Impact Summary:</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <FiBarChart className="w-4 h-4 text-gray-500 mr-2" />
                    <span>Sales History: {deleteValidation.salesCount || 0} records</span>
                  </li>
                  <li className="flex items-center">
                    <FiPackage className="w-4 h-4 text-gray-500 mr-2" />
                    <span>Current Stock: {product?.quantity || 0} units</span>
                  </li>
                  <li className="flex items-center">
                    <FiCalendar className="w-4 h-4 text-gray-500 mr-2" />
                    <span>Recent Sales: {deleteValidation.recentSalesCount || 0} (last 30 days)</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Choose an action:</h4>
                <button
                  onClick={handleArchive}
                  className="w-full text-left p-3 border border-blue-200 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center">
                    <FiArchive className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-blue-900">Archive (Recommended)</p>
                      <p className="text-blue-700 text-xs mt-1">Hide from inventory but keep all data</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left p-3 border border-red-200 rounded-md bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center">
                    <FiTrash2 className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium text-red-900">Permanent Delete</p>
                      <p className="text-red-700 text-xs mt-1">Remove product and all associated data</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <div className="space-x-3">
                <button
                  onClick={handleArchive}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                      Archiving...
                    </>
                  ) : (
                    <>
                      <FiArchive className="w-4 h-4 mr-2" />
                      Archive
                    </>
                  )}
                </button>
                {deleteValidation.canDelete && (
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FiTrash2 className="w-4 h-4 mr-2" />
                        Delete Forever
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewProduct;