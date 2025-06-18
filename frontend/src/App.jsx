import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index.jsx";
import { AppProvider } from "./contexts/AppContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { dataService } from "./services";
import "./App.css";

function App() {
  // Add debug helpers to window object for console testing
  if (typeof window !== 'undefined') {
    window.debugPharmacy = {
      dataService,
      testDashboard: async () => {
        console.log('🧪 Testing dashboard stats...');
        const result = await dataService.dashboard.getStats();
        console.log('📊 Dashboard result:', result);
        return result;
      },
      testSales: async () => {
        console.log('🧪 Testing sales data...');
        const result = await dataService.debug.salesData();
        console.log('💰 Sales result:', result);
        return result;
      }
    };
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
