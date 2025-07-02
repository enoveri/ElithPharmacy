import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index.jsx";
import { AppProvider } from "./contexts/AppContext.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { SettingsProvider } from "./contexts/SettingsContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import AuthStatus from "./components/AuthStatus.jsx";
import { dataService } from "./services";
import { supabase } from "./lib/supabase";
import "./App.css";
import "./styles/mobile.css";

function App() {
  // Add debug helpers to window object for console testing
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
      // User debug helpers
      users: {
        checkUserStatus: async (email) => {
          console.log("🔍 Checking user status for:", email);
          
          let authUser = null;
          let adminUser = null;
          
          // Try to get current user first
          const { data: currentUser } = await supabase.auth.getUser();
          if (currentUser?.user?.email === email) {
            authUser = currentUser.user;
            console.log("✅ Found in Auth (current user):", {
              id: authUser.id,
              email: authUser.email,
              emailConfirmed: authUser.email_confirmed_at ? "Yes" : "No",
              createdAt: authUser.created_at,
              lastSignIn: authUser.last_sign_in_at || "Never"
            });
          } else {
            console.log("ℹ️ User is not currently signed in or email doesn't match");
          }
          
          // Check admin_users table
          const { data: adminUserData, error: adminError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single();
            
          if (adminUserData) {
            adminUser = adminUserData;
            console.log("✅ Found in admin_users:", adminUser);
            
            // Check for ID mismatch
            if (authUser && authUser.id !== adminUser.user_id) {
              console.log("⚠️ ID MISMATCH DETECTED!");
              console.log("Auth ID:", authUser.id);
              console.log("Admin table user_id:", adminUser.user_id);
            }
          } else {
            console.log("❌ NOT found in admin_users table");
            if (adminError) console.log("Error:", adminError);
          }
          
          return { authUser, adminUser };
        },
        listAllUsers: async () => {
          console.log("📋 Listing all users...");
          
          const { data: adminUsers, error } = await supabase
            .from('admin_users')
            .select('*')
            .order('created_at', { ascending: false });
            
          console.log("Admin Users:", adminUsers);
          console.log("Error:", error);
          return { adminUsers, error };
        },
        testAdminUsersTable: async () => {
          console.log("🔍 Testing admin_users table...");
          
          // Test if we can select from the table
          const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .limit(1);
            
          if (error) {
            console.error("❌ Cannot read from admin_users table:", error);
            return { success: false, error };
          } else {
            console.log("✅ Can read from admin_users table");
            console.log("Sample data:", data);
            
            // Test if we can insert (with a test record)
            const testData = {
              id: "test-id-12345",
              email: "test@example.com",
              full_name: "Test User",
              role: "staff",
              is_active: true,
              created_at: new Date().toISOString()
            };
            
            const { error: insertError } = await supabase
              .from('admin_users')
              .insert(testData);
              
            if (insertError) {
              console.error("❌ Cannot insert into admin_users table:", insertError);
              
              // Clean up test record if it was partially created
              await supabase.from('admin_users').delete().eq('id', 'test-id-12345');
              
              return { success: false, insertError };
            } else {
              console.log("✅ Can insert into admin_users table");
              
              // Clean up test record
              await supabase.from('admin_users').delete().eq('id', 'test-id-12345');
              
              return { success: true };
            }
          }
        },
        testRoleValues: async () => {
          console.log("🔍 Testing role values...");
          
          const testRoles = ["admin", "manager", "pharmacist", "staff", "user", "employee"];
          const results = {};
          
          for (const role of testRoles) {
            try {
              // Generate a proper UUID for testing
              const testId = crypto.randomUUID();
              const testData = {
                id: testId,
                email: `test-${role}@example.com`,
                full_name: `Test ${role}`,
                role: role,
                is_active: true,
                created_at: new Date().toISOString()
              };
              
              const { error } = await supabase
                .from('admin_users')
                .insert(testData);
                
              if (error) {
                results[role] = `❌ ${error.message}`;
              } else {
                results[role] = "✅ Valid";
                // Clean up
                await supabase.from('admin_users').delete().eq('id', testId);
              }
            } catch (err) {
              results[role] = `❌ ${err.message}`;
            }
          }
          
          console.log("Role validation results:", results);
          return results;
        },
        fixIdMismatch: async (email) => {
          console.log("🔧 Fixing ID mismatch for:", email);
          
          // Get current user
          const { data: currentUser } = await supabase.auth.getUser();
          if (!currentUser?.user || currentUser.user.email !== email) {
            console.log("❌ User must be signed in to fix their own record");
            return { success: false, error: "User not signed in or email mismatch" };
          }
          
          const authId = currentUser.user.id;
          
          // Check admin_users table
          const { data: adminUser, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single();
            
          if (!adminUser) {
            console.log("❌ User not found in admin_users table");
            return { success: false, error: "User not found in admin_users" };
          }
          
          if (adminUser.user_id === authId) {
            console.log("✅ IDs already match - no fix needed");
            return { success: true, message: "IDs already match" };
          }
          
          // Update admin_users with correct ID
          console.log(`🔄 Updating user_id from ${adminUser.user_id} to ${authId}`);
          const { error: updateError } = await supabase
            .from('admin_users')
            .update({ user_id: authId })
            .eq('email', email);
            
          if (updateError) {
            console.error("❌ Failed to update user_id:", updateError);
            return { success: false, error: updateError.message };
          }
          
          console.log("✅ Successfully updated user_id");
          return { success: true, message: "ID mismatch fixed" };
        }
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
      createAdmin: async () => {
        console.log("👑 Creating admin user...");
        const { createDefaultAdminUser } = await import('./utils/createAdminUser');
        const result = await createDefaultAdminUser();
        console.log("👑 Admin creation result:", result);
        return result;
      },
    };
  }
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <AppProvider>
            <RouterProvider router={router} />
            <AuthStatus />
          </AppProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
