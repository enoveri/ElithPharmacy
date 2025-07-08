import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// Import layout components
import { ResponsiveLayout } from "../components/layout";

// Import responsive page components
import ResponsiveInventory from "../components/responsive/ResponsiveInventory";
import ResponsiveCustomers from "../components/responsive/ResponsiveCustomers";
import ResponsiveReports from "../components/responsive/ResponsiveReports";
import ResponsiveSettings from "../components/responsive/ResponsiveSettings";
import ResponsiveSalesHistory from "../components/responsive/ResponsiveSalesHistory";
import ResponsivePurchases from "../components/responsive/ResponsivePurchases";
import ResponsivePOS from "../components/responsive/ResponsivePOS";

// Import page components that don't need mobile versions yet
import ResponsiveDashboard from "../pages/ResponsiveDashboard";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import AddProduct from "../pages/AddProduct";
import EditProduct from "../pages/EditProduct";
import SaleDetails from "../pages/SaleDetails";
import EditSale from "../pages/EditSale";
import ResponsiveRefunds from "../components/responsive/ResponsiveRefunds";
import EditCustomer from "../pages/EditCustomer";
import ViewCustomer from "../pages/ViewCustomer";
import CustomerSales from "../pages/CustomerSales";
import ViewProduct from "../pages/ViewProduct";
import PurchaseDetails from "../pages/PurchaseDetails";
import Notifications from "../pages/Notifications";

import AdminSetup from "../pages/AdminSetup";
import EnhancedAdminPanel from "../pages/WorkingEnhancedAdminPanel";
import ResponsiveStockAudit from "../components/responsive/ResponsiveStockAudit";
import ReceiveStock from "../pages/ReceiveStock";


export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <ResponsiveLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ResponsiveDashboard />,
      },
      {
        path: "/inventory",
        element: <ResponsiveInventory />,
      },
      {
        path: "/inventory/view/:id",
        element: <ViewProduct />,
      },
      {
        path: "/inventory/add",
        element: <AddProduct />,
      },
      {
        path: "/inventory/edit/:id",
        element: <EditProduct />,
      },
      {
        path: "/inventory/audit",
        element: <ResponsiveStockAudit />,
      },
      {
        path: "/inventory/receive",
        element: <ReceiveStock />,
      },
      {
        path: "/pos",
        element: <ResponsivePOS />,
      },
      {
        path: "/sales",
        element: <ResponsiveSalesHistory />,
      },
      {
        path: "/sales/:id",
        element: <SaleDetails />,
      },
      {
        path: "/sales/edit/:id",
        element: <EditSale />,
      },
      {
        path: "/refunds",
        element: <ResponsiveRefunds />,
      },
      {
        path: "/customers",
        element: <ResponsiveCustomers />,
      },
      {
        path: "/customers/view/:id",
        element: <ViewCustomer />,
      },
      {
        path: "/customers/add",
        element: <EditCustomer />,
      },
      {
        path: "/customers/edit/:id",
        element: <EditCustomer />,
      },
      {
        path: "/customers/sales/:id",
        element: <CustomerSales />,
      },
      {
        path: "/reports",
        element: <ResponsiveReports />,
      },
      {
        path: "/purchases",
        element: <ResponsivePurchases />,
      },
      {
        path: "/purchases/:id",
        element: <PurchaseDetails />,
      },
      {
        path: "/settings",
        element: <ResponsiveSettings />,
      },
      {
        path: "/notifications",
        element: <Notifications />,
      },
      {
        path: "/admin",
        element: (
          <ProtectedRoute adminOnly={true}>
            <EnhancedAdminPanel />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/admin-setup",
    element: <AdminSetup />,
  },

]);
