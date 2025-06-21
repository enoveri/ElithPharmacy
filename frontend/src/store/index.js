import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dataService } from "../services";

// Auth store
export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  setLoading: (isLoading) => set({ isLoading }),

  // Login
  login: async (email, password) => {
    try {
      set({ isLoading: true });
      // For now, we'll simulate authentication
      // Later this will integrate with Supabase auth
      const mockUser = { id: 1, email, name: "Admin User" };
      set({ user: mockUser, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout
  logout: async () => {
    try {
      set({ user: null, isAuthenticated: false });
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  },
}));

// Products store
export const useProductsStore = create((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,

  // Actions
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Fetch products
  fetchProducts: async () => {
    try {
      set({ isLoading: true, error: null });
      const products = await dataService.products.getAll();
      set({ products });
    } catch (error) {
      console.error("Error fetching products:", error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch categories
  fetchCategories: async () => {
    try {
      const categories = await dataService.categories.getAll();
      set({ categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      set({ error: error.message });
    }
  },

  // Add product
  addProduct: async (product) => {
    try {
      set({ isLoading: true, error: null });
      const newProduct = await dataService.products.create(product);
      if (newProduct) {
        set((state) => ({ products: [...state.products, newProduct] }));
        return { success: true, product: newProduct };
      }
      return { success: false, error: "Failed to create product" };
    } catch (error) {
      console.error("Error adding product:", error);
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Update product
  updateProduct: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedProduct = await dataService.products.update(id, updates);
      if (updatedProduct) {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === parseInt(id) ? updatedProduct : p
          ),
        }));
        return { success: true, product: updatedProduct };
      }
      return { success: false, error: "Failed to update product" };
    } catch (error) {
      console.error("Error updating product:", error);
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const success = await dataService.products.delete(id);
      if (success) {
        set((state) => ({
          products: state.products.filter((p) => p.id !== parseInt(id)),
        }));
        return { success: true };
      }
      return { success: false, error: "Failed to delete product" };
    } catch (error) {
      console.error("Error deleting product:", error);
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Customers store
export const useCustomersStore = create((set, get) => ({
  customers: [],
  isLoading: false,
  error: null,

  // Actions
  setCustomers: (customers) => set({ customers }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Fetch customers
  fetchCustomers: async () => {
    try {
      set({ isLoading: true, error: null });
      const customers = await dataService.customers.getAll();
      set({ customers });
    } catch (error) {
      console.error("Error fetching customers:", error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Add customer
  addCustomer: async (customer) => {
    try {
      set({ isLoading: true, error: null });
      const newCustomer = await dataService.customers.create(customer);
      if (newCustomer) {
        set((state) => ({ customers: [...state.customers, newCustomer] }));
        return { success: true, customer: newCustomer };
      }
      return { success: false, error: "Failed to create customer" };
    } catch (error) {
      console.error("Error adding customer:", error);
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Update customer
  updateCustomer: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedCustomer = await dataService.customers.update(id, updates);
      if (updatedCustomer) {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === parseInt(id) ? updatedCustomer : c
          ),
        }));
        return { success: true, customer: updatedCustomer };
      }
      return { success: false, error: "Failed to update customer" };
    } catch (error) {
      console.error("Error updating customer:", error);
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Delete customer
  deleteCustomer: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const success = await dataService.customers.delete(id);
      if (success) {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== parseInt(id)),
        }));
        return { success: true };
      }
      return { success: false, error: "Failed to delete customer" };
    } catch (error) {
      console.error("Error deleting customer:", error);
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Sales store
export const useSalesStore = create((set, get) => ({
  sales: [],
  currentSale: null,
  cart: [],
  isLoading: false,
  error: null,

  // Actions
  setSales: (sales) => set({ sales }),
  setCurrentSale: (currentSale) => set({ currentSale }),
  setCart: (cart) => set({ cart }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Cart actions
  addToCart: (product, quantity = 1) => {
    const { cart } = get();
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      set({
        cart: cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
      set({
        cart: [
          ...cart,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            total: product.price * quantity,
          },
        ],
      });
    }
  },

  removeFromCart: (productId) => {
    const { cart } = get();
    set({ cart: cart.filter((item) => item.productId !== productId) });
  },

  updateCartQuantity: (productId, quantity) => {
    const { cart } = get();
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }

    set({
      cart: cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity, total: item.price * quantity }
          : item
      ),
    });
  },

  clearCart: () => set({ cart: [] }),

  // Fetch sales
  fetchSales: async () => {
    try {
      set({ isLoading: true, error: null });
      const sales = await dataService.sales.getAll();
      set({ sales });
    } catch (error) {
      console.error("Error fetching sales:", error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Create sale
  createSale: async (saleData) => {
    try {
      set({ isLoading: true, error: null });
      const newSale = await dataService.sales.create(saleData);
      if (newSale) {
        set((state) => ({ sales: [newSale, ...state.sales] }));
        get().clearCart();
        return { success: true, sale: newSale };
      }
      return { success: false, error: "Failed to create sale" };
    } catch (error) {
      console.error("Error creating sale:", error);
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },
}));

// App settings store with persistence
export const useSettingsStore = create(
  persist(
    (set, get) => ({
      settings: {
        // General Settings
        storeName: "Elith Pharmacy",
        pharmacyName: "Elith Pharmacy",
        address: "",
        phone: "",
        email: "",
        pharmacyLicense: "",

        // Business Settings
        currency: "UGX", // Uganda Shillings
        taxRate: 18, // Uganda VAT rate (percentage)
        timezone: "Africa/Kampala",
        fiscalYearStart: "July",

        // Display Settings
        theme: "light",
        language: "en",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "24-hour",

        // Notification Settings
        lowStockAlerts: true,
        expiryAlerts: true,
        alertThreshold: 30, // days before expiry
        emailNotifications: true,

        // POS Settings
        receiptHeader: "Elith Pharmacy",
        receiptFooter: "Thank you for your business!",
        autoprint: false,

        // Inventory Settings
        enableBarcodeScanning: false,
        autoReorderPoint: 10,

        // System Settings
        backupFrequency: "daily",
        sessionTimeout: 30, // minutes
        enableAuditLog: true,
      },
      isLoading: false,
      error: null,

      // Actions
      setSettings: (settings) => set({ settings }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Update setting
      updateSetting: (key, value) => {
        const { settings } = get();
        const updatedSettings = { ...settings, [key]: value };
        set({ settings: updatedSettings });

        // Also save to localStorage immediately
        try {
          localStorage.setItem(
            "elith-pharmacy-settings",
            JSON.stringify({ settings: updatedSettings })
          );
          console.log(`✅ [Settings] Updated ${key}:`, value);
        } catch (error) {
          console.error("❌ [Settings] Error saving to localStorage:", error);
        }
      },

      // Update multiple settings
      updateSettings: (newSettings) => {
        const { settings } = get();
        const updatedSettings = { ...settings, ...newSettings };
        set({ settings: updatedSettings });

        // Save to localStorage
        try {
          localStorage.setItem(
            "elith-pharmacy-settings",
            JSON.stringify({ settings: updatedSettings })
          );
          console.log("✅ [Settings] Updated settings:", newSettings);
          return { success: true };
        } catch (error) {
          console.error("❌ [Settings] Error updating settings:", error);
          set({ error: error.message });
          return { success: false, error: error.message };
        }
      },

      // Get specific setting
      getSetting: (key) => {
        const { settings } = get();
        return settings[key];
      },

      // Reset to defaults
      resetSettings: () => {
        const defaultSettings = {
          storeName: "Elith Pharmacy",
          pharmacyName: "Elith Pharmacy",
          address: "",
          phone: "",
          email: "",
          pharmacyLicense: "",
          currency: "UGX",
          taxRate: 18,
          timezone: "Africa/Kampala",
          fiscalYearStart: "July",
          theme: "light",
          language: "en",
          dateFormat: "DD/MM/YYYY",
          timeFormat: "24-hour",
          lowStockAlerts: true,
          expiryAlerts: true,
          alertThreshold: 30,
          emailNotifications: true,
          receiptHeader: "Elith Pharmacy",
          receiptFooter: "Thank you for your business!",
          autoprint: false,
          enableBarcodeScanning: false,
          autoReorderPoint: 10,
          backupFrequency: "daily",
          sessionTimeout: 30,
          enableAuditLog: true,
        };

        set({ settings: defaultSettings });

        try {
          localStorage.setItem(
            "elith-pharmacy-settings",
            JSON.stringify({ settings: defaultSettings })
          );
          console.log("✅ [Settings] Reset to defaults");
          return { success: true };
        } catch (error) {
          console.error("❌ [Settings] Error resetting settings:", error);
          return { success: false, error: error.message };
        }
      },

      // Fetch settings
      fetchSettings: async () => {
        try {
          set({ isLoading: true, error: null });

          // First try localStorage
          const stored = localStorage.getItem("elith-pharmacy-settings");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.settings) {
              set({ settings: parsed.settings });
              console.log("✅ [Settings] Loaded from localStorage");
              return;
            }
          }

          // If no localStorage, keep defaults
          console.log("✅ [Settings] Using default settings");
        } catch (error) {
          console.error("Error fetching settings:", error);
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },

      // Save settings
      saveSettings: async (newSettings) => {
        try {
          set({ isLoading: true, error: null });
          const { settings } = get();
          const updatedSettings = { ...settings, ...newSettings };

          // Save to localStorage
          localStorage.setItem(
            "elith-pharmacy-settings",
            JSON.stringify({ settings: updatedSettings })
          );
          set({ settings: updatedSettings });

          console.log("✅ [Settings] Settings saved successfully");
          return { success: true };
        } catch (error) {
          console.error("Error saving settings:", error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "elith-pharmacy-settings",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

// Export notifications store
export { useNotificationsStore } from "./notifications";

// Export all stores
export * from "./notifications";
