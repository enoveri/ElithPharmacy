import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index.jsx";
import { AppProvider } from "./contexts/AppContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { dataService } from "./services";
import { supabase } from "./lib/supabase";
import "./App.css";

function App() {  // Add debug helpers to window object for console testing
  if (typeof window !== "undefined") {
    window.debugPharmacy = {
      dataService,
      // Authentication helpers
      auth: {
        getUser: async () => {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();
          console.log("👤 Current user:", user);
          if (error) console.error("❌ Auth error:", error);
          return { user, error };
        },
        signIn: async (email, password) => {
          console.log("🔐 Signing in...");
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            console.error("❌ Sign in failed:", error);
          } else {
            console.log("✅ Signed in successfully:", data.user?.email);
          }
          return { data, error };
        },
        signOut: async () => {
          console.log("🚪 Signing out...");
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error("❌ Sign out failed:", error);
          } else {
            console.log("✅ Signed out successfully");
          }
          return { error };
        },
      },
      testDashboard: async () => {
        console.log("🧪 Testing dashboard stats...");
        const result = await dataService.dashboard.getStats();
        console.log("📊 Dashboard result:", result);
        return result;
      },      testSales: async () => {
        console.log("🧪 Testing sales data...");
        const result = await dataService.debug.salesData();
        console.log("💰 Sales result:", result);
        return result;
      },
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
