import { createContext, useContext, useState, useEffect } from "react";
import { dataService } from "../services";

const SettingsContext = createContext();

// Default settings for Uganda-based pharmacy
const defaultSettings = {
  // General Settings
  pharmacyName: "Elith Pharmacy",
  address: "",
  phone: "",
  email: "",
  pharmacyLicense: "",

  // Business Settings
  currency: "UGX", // Uganda Shillings
  taxRate: 18, // Uganda VAT rate
  timezone: "Africa/Kampala",
  fiscalYearStart: "July",

  // Notification Settings
  lowStockAlerts: true,
  expiryAlerts: true,
  alertThreshold: 30, // days before expiry
  emailNotifications: true,

  // Display Settings
  theme: "light",
  language: "English",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24-hour",

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
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load settings from database on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load settings from database/localStorage
      const savedSettings = localStorage.getItem("pharmacySettings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }

      console.log("✅ [Settings] Settings loaded successfully");
    } catch (error) {
      console.error("❌ [Settings] Error loading settings:", error);
      setError(error.message);
      // Fall back to default settings
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      setError(null);

      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Save to localStorage (in a real app, this would go to database)
      localStorage.setItem("pharmacySettings", JSON.stringify(updatedSettings));

      console.log("✅ [Settings] Settings updated:", newSettings);
      return { success: true };
    } catch (error) {
      console.error("❌ [Settings] Error updating settings:", error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const resetSettings = async () => {
    try {
      setSettings(defaultSettings);
      localStorage.removeItem("pharmacySettings");
      console.log("✅ [Settings] Settings reset to defaults");
      return { success: true };
    } catch (error) {
      console.error("❌ [Settings] Error resetting settings:", error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const getSetting = (key) => {
    return settings[key];
  };

  const value = {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    getSetting,
    loadSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export default SettingsContext;
