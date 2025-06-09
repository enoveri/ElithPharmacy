import { createBrowserRouter } from 'react-router-dom';

// Import layout components
import { MainLayout } from '../components/layout';

// Import page components
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Inventory from '../pages/Inventory';
import POS from '../pages/POS';
import ProductList from '../pages/ProductList';
import AddProduct from '../pages/AddProduct';
import EditProduct from '../pages/EditProduct';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: '/inventory',
        element: <Inventory />,
      },
      {
        path: '/pos',
        element: <POS />,
      },
      {
        path: '/products',
        element: <ProductList />,
      },
      {
        path: '/products/add',
        element: <AddProduct />,
      },
      {
        path: '/products/edit/:id',
        element: <EditProduct />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
]); 