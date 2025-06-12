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
import Reports from "../pages/Reports";
import ViewProduct from "../pages/ViewProduct";

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
      },
      {
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
        path: "/customers/edit/:id",
        element: <EditCustomer />,
      },
      {
        path: "/reports",
        element: <Reports />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]);
