import React, { createContext, useContext, useEffect } from "react";
import { useAuthStore, useSettingsStore } from "../store";
import { auth } from "../lib/supabase";

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
    // Initialize app settings when authenticated
    if (isAuthenticated) {
      fetchSettings();
    }  }, [isAuthenticated, fetchSettings]);

  const value = {
    // Add any global context values here
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
