import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index.jsx";
import { AppProvider } from "./contexts/AppContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { dataService } from "./services";
import { notificationTester } from "./lib/notificationTester.js";
import { supabase } from "./lib/supabase";
import "./App.css";

function App() {
  // Add debug helpers to window object for console testing
  if (typeof window !== "undefined") {
    window.debugPharmacy = {
      dataService,
      notificationTester,
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
      },
      testSales: async () => {
        console.log("🧪 Testing sales data...");
        const result = await dataService.debug.salesData();
        console.log("💰 Sales result:", result);
        return result;
      },
      testNotifications: async () => {
        console.log("🧪 Testing notification system...");

        // Check auth first
        const authCheck = await notificationTester.checkAuthentication();
        if (!authCheck.authenticated) {
          console.warn(
            '⚠️ Please sign in first: window.debugPharmacy.auth.signIn("email", "password")'
          );
          return { error: "Authentication required", authCheck };
        }

        const result = await notificationTester.runAllTests();
        console.log("🔔 Notification test result:", result);
        return result;
      },
      checkNotificationHealth: async () => {
        console.log("🏥 Checking notification system health...");
        const result = await notificationTester.quickHealthCheck();
        console.log("💚 Health check result:", result);
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
