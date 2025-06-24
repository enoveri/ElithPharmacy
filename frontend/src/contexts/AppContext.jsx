import React, { createContext, useContext, useEffect } from "react";
import { useAuthStore, useSettingsStore } from "../store";
import { auth } from "../lib/supabase";
import { NotificationManager } from "../lib/notificationManager";

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { setUser, setLoading, isAuthenticated } = useAuthStore();
  const { fetchSettings } = useSettingsStore();

  // Initialize notification manager instance
  const notificationManager = React.useRef(new NotificationManager());

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const { user } = await auth.getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth changes
    const {
      data: { subscription },
    } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    initializeAuth();

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, [setUser, setLoading]);

  useEffect(() => {
    // Initialize app settings and notification system when authenticated
    if (isAuthenticated) {
      fetchSettings();

      // Initialize comprehensive notification system
      const initializeNotifications = async () => {
        try {
          console.log("🚀 [AppContext] Initializing notification system...");
          const result = await notificationManager.current.initialize();

          if (result.success) {
            console.log(
              "✅ [AppContext] Notification system initialized successfully"
            );
          } else {
            console.error(
              "❌ [AppContext] Failed to initialize notification system:",
              result.error
            );
          }
        } catch (error) {
          console.error(
            "❌ [AppContext] Notification system initialization error:",
            error
          );
        }
      };

      initializeNotifications();
    }
  }, [isAuthenticated, fetchSettings]);

  // Cleanup notification system on unmount
  useEffect(() => {
    return () => {
      if (notificationManager.current) {
        notificationManager.current.cleanup();
      }
    };
  }, []);
  const value = {
    // Add any global context values here
    notificationManager: notificationManager.current,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
