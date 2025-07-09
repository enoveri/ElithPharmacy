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

// Overlay and Modal style constants
const OVERLAY = "fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200";
const MODAL  = "bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200";
const HEADER = "flex items-center justify-between px-6 py-4 border-b border-gray-100";
const BODY   = "p-6 space-y-6";
const FOOTER = "flex justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-100";

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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white shadow-lg rounded-xl p-8 text-center">
          <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-bold text-gray-900">Product not found</h3>
          <p className="mt-1 text-sm text-gray-500">The product you're looking for doesn't exist.</p>
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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-8 w-full">
      {/* Nav-style Action Buttons above the card */}
      <div className="w-full max-w-lg flex justify-between items-center mb-6 px-2 md:px-0">
        <div className="flex-1 flex justify-start">
          <button
            onClick={() => navigate("/inventory")}
            className="px-6 py-2 rounded-md border border-gray-300 bg-gray-50 text-gray-700 font-mono hover:bg-gray-100 transition flex items-center"
          >
            <FiArrowLeft className="inline mr-2" />Back
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <button
            onClick={handleEdit}
            className="px-6 py-2 rounded-md border border-blue-300 bg-blue-50 text-blue-700 font-mono hover:bg-blue-100 transition flex items-center"
          >
            <FiEdit className="inline mr-2" />Edit
          </button>
        </div>
        <div className="flex-1 flex justify-end">
          <button
            onClick={showDeleteConfirmation}
            className="px-6 py-2 rounded-md border border-red-300 bg-red-50 text-red-700 font-mono hover:bg-red-100 transition flex items-center"
          >
            <FiTrash2 className="inline mr-2" />Delete
          </button>
        </div>
      </div>
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl border border-gray-200 flex flex-col receipt-font p-4 md:p-8" style={{ minHeight: '90vh' }}>
        {/* Enhanced Receipt Header */}
        <div className="pt-4 pb-4 border-b border-dashed border-gray-300 text-center bg-gradient-to-r from-gray-50 to-white px-2 md:px-8">
          <h1 className="text-3xl font-extrabold tracking-widest text-gray-900 mb-1">{product.name}</h1>
          <p className="text-xs uppercase tracking-wider text-gray-500">{product.manufacturer || product.category}</p>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color === 'text-green-600' ? 'bg-green-100 text-green-800' : stockStatus.color === 'text-red-600' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{stockStatus.status}</span>
          </div>
        </div>
        {/* Improved Product Details Grid with HRs */}
        <div className="py-4 border-b border-dashed border-gray-300 px-2 md:px-8">
          <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
            <div className="font-mono text-gray-600">Selling Price:</div>
            <div className="font-mono text-right text-gray-900">{currency} {(product.price || 0).toFixed(2)}</div>
            <div className="col-span-2"><hr className="border-t border-gray-200 my-1" /></div>
            <div className="font-mono text-gray-600">Cost Price:</div>
            <div className="font-mono text-right text-gray-900">{currency} {(product.costPrice || product.cost_price || 0).toFixed(2)}</div>
            <div className="col-span-2"><hr className="border-t border-gray-200 my-1" /></div>
            <div className="font-mono text-gray-600">Profit Margin:</div>
            <div className="font-mono text-right text-green-600">{currency}{((product.price || 0) - (product.costPrice || product.cost_price || 0)).toFixed(2)}</div>
            <div className="col-span-2"><hr className="border-t border-gray-200 my-1" /></div>
            <div className="font-mono text-gray-600">Stock:</div>
            <div className={`font-mono text-right ${product.quantity <= 5 ? 'text-yellow-700 font-semibold' : 'text-gray-900'}`}>{product.quantity || 0} units</div>
            <div className="col-span-2"><hr className="border-t border-gray-200 my-1" /></div>
            <div className="font-mono text-gray-600">SKU:</div>
            <div className="font-mono text-right text-gray-900">{product.sku || product.barcode || "N/A"}</div>
            <div className="col-span-2"><hr className="border-t border-gray-200 my-1" /></div>
            <div className="font-mono text-gray-600">Category:</div>
            <div className="font-mono text-right text-gray-900">{product.category || "Uncategorized"}</div>
            <div className="col-span-2"><hr className="border-t border-gray-200 my-1" /></div>
            <div className="font-mono text-gray-600">Status:</div>
            <div className={`font-mono text-right ${stockStatus.color}`}>{stockStatus.status}</div>
            {product.expiry_date && (
              <>
                <div className="col-span-2"><hr className="border-t border-gray-200 my-1" /></div>
                <div className="font-mono text-gray-600">Expiry Date:</div>
                <div className={`font-mono text-right ${new Date(product.expiry_date) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>{new Date(product.expiry_date).toLocaleDateString()}</div>
                <div className="col-span-2"><hr className="border-t border-gray-200 my-1" /></div>
              </>
            )}
          </div>
        </div>
        {/* Description Section with Toggle */}
        {product.description && (
          <div className="py-4 border-b border-dashed border-gray-300 px-2 md:px-8">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsDescExpanded(!isDescExpanded)}>
              <h3 className="text-xs font-bold text-gray-700 mb-1 tracking-wider">Description</h3>
              <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDescExpanded ? 'transform rotate-180' : ''}`} />
            </div>
            <div className={`font-mono text-gray-600 text-sm transition-all overflow-hidden ${isDescExpanded ? 'max-h-96 mt-2' : 'max-h-0'}`}>{product.description}</div>
          </div>
        )}
        {/* Performance Summary with Visual Metrics */}
        <div className="py-6 bg-gray-50 px-2 md:px-8">
          <h3 className="text-center text-lg font-bold tracking-widest text-gray-800 mb-4 relative">
            <span className="relative z-10 px-4 bg-gray-50">Performance Summary</span>
            <span className="absolute top-1/2 left-0 right-0 h-px bg-gray-300 -z-0"></span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
            {/* Total Sold Card */}
            <div className="bg-white p-3 rounded border border-gray-200 shadow-xs flex flex-col items-center justify-center pt-6">
              <div className="p-1 rounded-full bg-blue-100 text-blue-600 mb-1"><FiShoppingCart className="w-5 h-5" /></div>
              <p className="text-xs text-gray-500">Total Sold</p>
              <p className="text-base font-semibold">{productAnalytics.totalSold} units</p>
            </div>
            {/* Revenue Card */}
            <div className="bg-white p-3 rounded border border-gray-200 shadow-xs flex flex-col items-center justify-center">
              <div className="p-1 rounded-full bg-green-100 text-green-600 mb-1"><FiDollarSign className="w-5 h-5" /></div>
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-base font-semibold">{currency} {(productAnalytics.totalRevenue || 0).toFixed(2)}</p>
            </div>
            {/* Profit Card */}
            <div className="bg-white p-3 rounded border border-gray-200 shadow-xs flex flex-col items-center justify-center">
              <div className="p-1 rounded-full bg-purple-100 text-purple-600 mb-1"><FiTrendingUp className="w-5 h-5" /></div>
              <p className="text-xs text-gray-500">Profit</p>
              <p className="text-base font-semibold">{currency} {(productAnalytics.totalProfit || 0).toFixed(2)}</p>
            </div>
          </div>
          {/* Recent Sales with Hover Effects */}
          {productAnalytics.recentSales.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-700 mb-2 tracking-wider">Recent Sales</h4>
              <div className="space-y-2">
                {productAnalytics.recentSales.slice(0, 3).map((sale, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-lg hover:bg-white hover:shadow-xs transition-all">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-2"><FiDollarSign className="w-3 h-3 text-blue-600" /></div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{new Date(sale.date).toLocaleDateString()}</p>
                        <p className="text-xxs text-gray-500">{sale.quantity}u sold</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{currency} {(sale.revenue || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Delete Modal */}
        {showDeleteModal && (
          <div className={OVERLAY}>
            <div className={MODAL}>
              <div className={HEADER}>
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <FiAlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Delete Product</h3>
                    <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
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
              <div className={BODY + " flex flex-col gap-6"}>
                <p className="text-base text-gray-700 mb-2">
                  Are you sure you want to delete <strong className="font-semibold">{product?.name}</strong>?
                </p>
                {deleteValidation.warnings.length > 0 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-md p-4 mb-2">
                    <div className="flex">
                      <FiAlertTriangle className="flex-shrink-0 w-5 h-5 text-yellow-500 mt-0.5 mr-3" />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-2">Warning: This product has dependencies</h4>
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
                <div className="bg-gray-50 rounded-md p-4 border border-gray-200 mb-2 py-4">
                  <h4 className="font-medium text-gray-900 mb-3">Impact Summary:</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-center"><FiBarChart className="w-4 h-4 text-gray-500 mr-2" /><span>Sales History: {deleteValidation.salesCount || 0} records</span></li>
                    <li className="flex items-center"><FiPackage className="w-4 h-4 text-gray-500 mr-2" /><span>Current Stock: {product?.quantity || 0} units</span></li>
                    <li className="flex items-center"><FiCalendar className="w-4 h-4 text-gray-500 mr-2" /><span>Recent Sales: {deleteValidation.recentSalesCount || 0} (last 30 days)</span></li>
                  </ul>
                </div>
                <div className="flex flex-col gap-4 mb-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Choose an action:</h4>
                  <button
                    onClick={handleArchive}
                    className="w-full text-left p-4 border border-blue-200 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors mb-2"
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
                    className="w-full text-left p-4 border border-red-200 rounded-md bg-red-50 hover:bg-red-100 transition-colors"
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
              <div className={FOOTER + " flex flex-wrap gap-4 justify-between mt-2"}>
                <button
                  onClick={closeDeleteModal}
                  className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={handleArchive}
                    className="inline-flex items-center px-5 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
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
                      className="inline-flex items-center px-5 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
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
    </div>
  );
}
  export default ViewProduct;