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

// Notifications store
export const useNotificationsStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  // Actions
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setLoading: (isLoading) => set({ isLoading }),

  // Fetch notifications
  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const [notifications, unreadCount] = await Promise.all([
        dataService.notifications.getAll(),
        dataService.notifications.getUnreadCount(),
      ]);
      set({ notifications, unreadCount });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Mark notification as read
  markAsRead: (notificationId) => {
    const { notifications } = get();
    set({
      notifications: notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    });
    
    // Update unread count
    const unreadCount = notifications.filter((n) => !n.read && n.id !== notificationId).length;
    set({ unreadCount });
  },

  // Mark all as read
  markAllAsRead: () => {
    const { notifications } = get();
    set({
      notifications: notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });
  },
}));

// App settings store with persistence
export const useSettingsStore = create(
  persist(
    (set, get) => ({
      settings: {
        storeName: "Elith Pharmacy",
        currency: "NGN",
        taxRate: 0.1,
        theme: "light",
        language: "en",
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
        set({ settings: { ...settings, [key]: value } });
      },

      // Fetch settings
      fetchSettings: async () => {
        try {
          set({ isLoading: true, error: null });
          const settings = await dataService.settings.get();
          if (settings) {
            set({ settings });
          }
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
          const savedSettings = await dataService.settings.update(newSettings);
          if (savedSettings) {
            set({ settings: savedSettings });
            return { success: true };
          }
          return { success: false, error: "Failed to save settings" };
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
