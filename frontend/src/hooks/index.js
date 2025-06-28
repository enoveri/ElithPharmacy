import { useState, useEffect, useCallback } from "react";
import { dataService } from "../services";
import { useIsMobile } from "./useIsMobile";
import { useUserRole } from "./useUserRole";

// Custom hook for fetching data with loading and error states
export const useDataService = (serviceMethod, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await serviceMethod();
      setData(result);
    } catch (err) {
      setError(err.message || "An error occurred");
      console.error("Data service error:", err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook for products
export const useProducts = () => {
  return useDataService(() => dataService.products.getAll());
};

// Hook for customers
export const useCustomers = () => {
  return useDataService(() => dataService.customers.getAll());
};

// Hook for sales
export const useSales = () => {
  return useDataService(() => dataService.sales.getAll());
};

// Hook for dashboard stats
export const useDashboardStats = () => {
  return useDataService(() => dataService.dashboard.getStats());
};

// Hook for notifications
export const useNotifications = () => {
  return useDataService(() => dataService.notifications.getAll());
};

// Hook for low stock products
export const useLowStockProducts = () => {
  return useDataService(() => dataService.products.getLowStock());
};

// Hook for expiring products
export const useExpiringProducts = (days = 30) => {
  return useDataService(() => dataService.products.getExpiring(days), [days]);
};

// Hook for top customers
export const useTopCustomers = (limit = 5) => {
  return useDataService(() => dataService.customers.getTop(limit), [limit]);
};

// Hook for recent sales
export const useRecentSales = (limit = 10) => {
  return useDataService(() => dataService.sales.getRecent(limit), [limit]);
};

// Hook for search functionality
export const useSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState({
    products: [],
    customers: [],
  });
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (term) => {
    if (!term.trim()) {
      setSearchResults({ products: [], customers: [] });
      return;
    }

    try {
      setIsSearching(true);
      const [products, customers] = await Promise.all([
        dataService.products.search(term),
        dataService.customers.search(term),
      ]);
      setSearchResults({ products, customers });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(searchTerm);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, search]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
  };
};

// Hook for managing async operations with loading states
export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (operation) => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || "An error occurred";
      setError(errorMessage);
      console.error("Async operation error:", err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute, setError };
};

export {
  useDataService,
  useProducts,
  useCustomers,
  useSales,
  useDashboardStats,
  useNotifications,
  useLowStockProducts,
  useExpiringProducts,
  useTopCustomers,
  useRecentSales,
  useSearch,
  useAsyncOperation,
  useIsMobile,
  useUserRole,
};
