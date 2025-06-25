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
} from "react-icons/fi";
import { dataService } from "../services";
import { useSettings } from "../contexts/SettingsContext";

function ViewProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { currency = "UGX" } = settings;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
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

        // Load analytics data
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
      // Mock analytics data - replace with actual data service calls
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

          // Calculate profit (assuming cost price is available)
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

      // Sort recent sales by date
      recentSales.sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        totalSold,
        totalRevenue,
        totalProfit,
        averageRating: 4.2, // Mock rating
        recentSales: recentSales.slice(0, 10),
        topCustomers: [], // Mock customers
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

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await dataService.products.delete(id);
        navigate("/inventory");
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Error deleting product. Please try again.");
      }
    }
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/inventory")}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </button>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiEdit className="mr-2 h-4 w-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <FiTrash2 className="mr-2 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <p className="text-sm text-gray-500 mb-4">
                  {product.manufacturer || product.category}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
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

          {/* Top Customers */}
          {productAnalytics.topCustomers.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Top Customers
              </h3>
              <div className="space-y-3">
                {productAnalytics.topCustomers
                  .slice(0, 5)
                  .map((customer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {customer.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {currency} {(customer.totalSpent || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewProduct;
