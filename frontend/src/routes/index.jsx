import { createBrowserRouter } from "react-router-dom";

// Import layout components
import { MainLayout } from "../components/layout";

// Import page components
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Inventory from "../pages/Inventory";
import AddProduct from "../pages/AddProduct";
import EditProduct from "../pages/EditProduct";
import POS from "../pages/POS";
import SalesHistory from "../pages/SalesHistory";
import SaleDetails from "../pages/SaleDetails";
import Refunds from "../pages/Refunds";
import Customers from "../pages/Customers";
import EditCustomer from "../pages/EditCustomer";
import ViewCustomer from "../pages/ViewCustomer";
import CustomerSales from "../pages/CustomerSales";
import Reports from "../pages/Reports";
import ViewProduct from "../pages/ViewProduct";
import Purchases from "../pages/Purchases";
import PurchaseDetails from "../pages/PurchaseDetails";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "/inventory",
        element: <Inventory />,
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
      },      {
        path: "/pos",
        element: <POS />,
      },
      {
        path: "/sales",
        element: <SalesHistory />,
      },
      {
        path: "/sales/:id",
        element: <SaleDetails />,
      },
      {
        path: "/refunds",
        element: <Refunds />,
      },
      {
        path: "/customers",
        element: <Customers />,
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
        element: <Reports />,
      },
      {
        path: "/purchases",
        element: <Purchases />,
      },      {
        path: "/purchases/:id",
        element: <PurchaseDetails />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]);
