import { useState, useEffect } from "react";
import {
  FiSave,
  FiRefreshCw,
  FiUser,
  FiShield,
  FiDatabase,
  FiBell,
  FiMoon,
  FiSun,
  FiGlobe,
  FiDollarSign,
  FiPackage,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit3,
  FiCheck,
  FiX,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiExternalLink,
  FiSettings as FiSettingsIcon,
} from "react-icons/fi";
import { supabase } from "../lib/supabase";

const Settings = () => {
  // Get current user from Supabase auth
  const [user, setUser] = useState(null);

  // State management
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formSettings, setFormSettings] = useState({});

  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []); // Fetch settings from database
  const fetchSettings = async () => {
    if (!user?.id) {
      console.log("❌ No user ID, skipping settings fetch");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("🔄 [Settings] Fetching settings for user:", user.id);

      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("❌ [Settings] Error fetching settings:", error);
        throw error;
      }

      console.log("✅ [Settings] Raw settings data:", data);

      // If no settings exist, create default settings
      if (!data) {
        console.log("📝 [Settings] No settings found, creating defaults...");
        const defaultSettings = {
          user_id: user?.id,
          store_name: "My Pharmacy", // Use existing field
          pharmacy_name: "My Pharmacy",
          address: "",
          phone: "",
          email: user?.email || "",
          pharmacy_license: "",
          currency: "UGX",
          tax_rate: 18,
          timezone: "Africa/Kampala",
          date_format: "DD/MM/YYYY",
          low_stock_threshold: 10, // Use existing field
          auto_reorder_point: 10,
          low_stock_alerts: true,
          expiry_alerts: true,
          alert_threshold: 30,
          theme: "light",
          language: "en",
          session_timeout: 30,
          enable_audit_log: true,
          synced: false,
        };

        const { data: newSettings, error: createError } = await supabase
          .from("settings")
          .insert([defaultSettings])
          .select()
          .single();

        if (createError) {
          console.error("❌ [Settings] Error creating settings:", createError);
          throw createError;
        }

        console.log("✅ [Settings] Created new settings:", newSettings);
        const mappedNewSettings = {
          ...newSettings,
          pharmacy_name: newSettings.pharmacy_name || newSettings.store_name,
          auto_reorder_point:
            newSettings.auto_reorder_point || newSettings.low_stock_threshold,
        };

        setSettings(mappedNewSettings);
        setFormSettings(mappedNewSettings);
      } else {
        // Map existing fields to form fields for compatibility
        console.log("✅ [Settings] Found existing settings, mapping fields...");
        const mappedSettings = {
          ...data,
          pharmacy_name: data.pharmacy_name || data.store_name,
          auto_reorder_point:
            data.auto_reorder_point || data.low_stock_threshold,
        };

        console.log("✅ [Settings] Mapped settings:", mappedSettings);
        setSettings(mappedSettings);
        setFormSettings(mappedSettings);
      }
    } catch (error) {
      console.error("❌ [Settings] Error in fetchSettings:", error);
      setError(error.message);

      // Set default form settings so user can still use the page
      const defaultSettings = {
        pharmacy_name: "My Pharmacy",
        address: "",
        phone: "",
        email: user?.email || "",
        pharmacy_license: "",
        currency: "UGX",
        tax_rate: 18,
        timezone: "Africa/Kampala",
        date_format: "DD/MM/YYYY",
        auto_reorder_point: 10,
        low_stock_alerts: true,
        expiry_alerts: true,
        alert_threshold: 30,
        theme: "light",
        language: "en",
        session_timeout: 30,
        enable_audit_log: true,
      };
      setFormSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };
  // Save settings to database
  const saveSettings = async (settingsData) => {
    try {
      // Prepare data for database (map form fields to db fields)
      const dbData = {
        ...settingsData,
        user_id: user?.id,
        store_name: settingsData.pharmacy_name, // Update existing field
        low_stock_threshold: settingsData.auto_reorder_point, // Update existing field
        synced: false,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(dbData).forEach((key) => {
        if (dbData[key] === undefined) {
          delete dbData[key];
        }
      });

      let result;

      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from("settings")
        .select("id")
        .maybeSingle();

      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from("settings")
          .update(dbData)
          .eq("id", existingSettings.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new settings
        const { data, error } = await supabase
          .from("settings")
          .insert([dbData])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Map back to form format
      const mappedResult = {
        ...result,
        pharmacy_name: result.pharmacy_name || result.store_name,
        auto_reorder_point:
          result.auto_reorder_point || result.low_stock_threshold,
      };

      setSettings(mappedResult);
      setFormSettings(mappedResult);
      return { success: true, data: mappedResult };
    } catch (error) {
      console.error("Error saving settings:", error);
      return { success: false, error: error.message };
    }
  };
  // Reset settings to defaults
  const resetSettings = async () => {
    try {
      const defaultSettings = {
        pharmacy_name: "My Pharmacy",
        store_name: "My Pharmacy",
        address: "",
        phone: "",
        email: user?.email || "",
        pharmacy_license: "",
        currency: "UGX",
        tax_rate: 18,
        timezone: "Africa/Kampala",
        date_format: "DD/MM/YYYY",
        auto_reorder_point: 10,
        low_stock_threshold: 10,
        low_stock_alerts: true,
        expiry_alerts: true,
        alert_threshold: 30,
        theme: "light",
        language: "en",
        session_timeout: 30,
        enable_audit_log: true,
        synced: false,
        updated_at: new Date().toISOString(),
      };

      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from("settings")
        .select("id")
        .maybeSingle();

      let result;
      if (existingSettings) {
        const { data, error } = await supabase
          .from("settings")
          .update(defaultSettings)
          .eq("id", existingSettings.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from("settings")
          .insert([{ ...defaultSettings, user_id: user?.id }])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Map back to form format
      const mappedResult = {
        ...result,
        pharmacy_name: result.pharmacy_name || result.store_name,
        auto_reorder_point:
          result.auto_reorder_point || result.low_stock_threshold,
      };

      setSettings(mappedResult);
      setFormSettings(mappedResult);
      return { success: true, data: mappedResult };
    } catch (error) {
      console.error("Error resetting settings:", error);
      return { success: false, error: error.message };
    }
  }; // Fetch settings on component mount
  useEffect(() => {
    if (user?.id) {
      console.log("🔄 [Settings] useEffect triggered, fetching settings...");
      fetchSettings();
    } else {
      console.log("❌ [Settings] No user found, setting loading to false");
      setIsLoading(false);
    }

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("⏰ [Settings] Timeout reached, stopping loading...");
        setIsLoading(false);
        setError("Settings load timeout. Please refresh the page.");
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [user?.id]);
  // Apply theme when settings change
  useEffect(() => {
    if (formSettings.theme) {
      applyThemeSettings();
    }
  }, [formSettings.theme]);

  // Apply theme settings
  const applyThemeSettings = () => {
    // Apply dark mode
    if (formSettings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Apply theme changes
    if (formSettings.theme === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // Show message helper
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  // Helper function to update form settings
  const updateFormSetting = (key, value) => {
    setFormSettings((prev) => ({ ...prev, [key]: value }));
  };
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Use the database save function
      const result = await saveSettings(formSettings);

      if (result.success) {
        showMessage("success", "Settings saved successfully!");
      } else {
        showMessage("error", result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showMessage("error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all settings to default values? This action cannot be undone."
      )
    ) {
      try {
        const result = await resetSettings();
        if (result.success) {
          showMessage("success", "Settings reset to defaults successfully!");
        } else {
          showMessage("error", result.error || "Failed to reset settings");
        }
      } catch (error) {
        console.error("Error resetting settings:", error);
        showMessage("error", "Failed to reset settings");
      }
    }
  };
  const exportSettings = () => {
    try {
      const allSettings = {
        ...formSettings,
        exportDate: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(allSettings, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `pharmacy-settings-${new Date().toISOString().split("T")[0]}.json`;
      link.click();

      showMessage("success", "Settings exported successfully");
    } catch (error) {
      console.error("Error exporting settings:", error);
      showMessage("error", "Failed to export settings");
    }
  };
  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setFormSettings((prev) => ({ ...prev, ...importedSettings }));
          showMessage("success", "Settings imported successfully");
        } catch (error) {
          console.error("Error importing settings:", error);
          showMessage(
            "error",
            "Failed to import settings. Invalid file format."
          );
        }
      };
      reader.readAsText(file);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid #f3f4f6",
            borderTop: "3px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {" "}
      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={handleResetSettings}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <FiRefreshCw size={16} />
            Reset to Defaults
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={saving || isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: saving || isLoading ? "not-allowed" : "pointer",
              opacity: saving || isLoading ? 0.6 : 1,
            }}
          >
            <FiSave size={16} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
      {/* Message Display */}
      {message.text && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "24px",
            borderRadius: "8px",
            backgroundColor: message.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            color: message.type === "success" ? "#166534" : "#dc2626",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {message.text}
        </div>
      )}
      <div style={{ display: "flex", gap: "24px" }}>
        {/* Sidebar Navigation */}
        <div
          style={{
            width: "280px",
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            height: "fit-content",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "16px",
            }}
          >
            Settings Categories
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { id: "general", label: "General", icon: FiSettingsIcon },
              { id: "business", label: "Business Info", icon: FiUser },
              { id: "notifications", label: "Notifications", icon: FiBell },
              { id: "appearance", label: "Appearance", icon: FiMoon },
              { id: "system", label: "System", icon: FiDatabase },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    backgroundColor: isActive ? "#f0f9ff" : "transparent",
                    color: isActive ? "#0369a1" : "#6b7280",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: isActive ? "600" : "500",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.backgroundColor = "#f9fafb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.target.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>{" "}
        {/* Main Content */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "32px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            {/* Content Area */}
            {activeTab === "general" && (
              <div style={{ padding: "0" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <FiSettingsIcon style={{ color: "#3b82f6" }} />
                  General Settings
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                    gap: "32px",
                  }}
                >
                  {/* Business Information */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#1f2937",
                        borderBottom: "2px solid #f3f4f6",
                        paddingBottom: "8px",
                      }}
                    >
                      Business Information
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Business Name
                        </label>{" "}
                        <input
                          type="text"
                          value={formSettings.pharmacy_name || ""}
                          onChange={(e) =>
                            updateFormSetting("pharmacy_name", e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.boxShadow =
                              "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Address
                        </label>
                        <textarea
                          value={formSettings.address || ""}
                          onChange={(e) =>
                            updateFormSetting("address", e.target.value)
                          }
                          rows={3}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            resize: "vertical",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.boxShadow =
                              "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formSettings.phone || ""}
                          onChange={(e) =>
                            updateFormSetting("phone", e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.boxShadow =
                              "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          value={formSettings.email || ""}
                          onChange={(e) =>
                            updateFormSetting("email", e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.boxShadow =
                              "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Pharmacy License
                        </label>{" "}
                        <input
                          type="text"
                          value={formSettings.pharmacy_license || ""}
                          onChange={(e) =>
                            updateFormSetting(
                              "pharmacy_license",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.boxShadow =
                              "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* System Settings */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#1f2937",
                        borderBottom: "2px solid #f3f4f6",
                        paddingBottom: "8px",
                      }}
                    >
                      System Configuration
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Currency
                        </label>
                        <select
                          value={formSettings.currency || "UGX"}
                          onChange={(e) =>
                            updateFormSetting("currency", e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.boxShadow =
                              "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.boxShadow = "none";
                          }}
                        >
                          <option value="UGX">UGX - Uganda Shillings</option>
                          <option value="USD">USD - US Dollars</option>
                          <option value="EUR">EUR - Euros</option>
                          <option value="KES">KES - Kenya Shillings</option>
                          <option value="TZS">TZS - Tanzania Shillings</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Tax Rate (%)
                        </label>{" "}
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formSettings.tax_rate || 18}
                          onChange={(e) =>
                            updateFormSetting(
                              "tax_rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.boxShadow =
                              "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Timezone
                        </label>
                        <select
                          value={formSettings.timezone || "Africa/Kampala"}
                          onChange={(e) =>
                            updateFormSetting("timezone", e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.boxShadow =
                              "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.boxShadow = "none";
                          }}
                        >
                          <option value="Africa/Kampala">
                            Africa/Kampala (Uganda)
                          </option>
                          <option value="Africa/Nairobi">
                            Africa/Nairobi (Kenya)
                          </option>
                          <option value="Africa/Dar_es_Salaam">
                            Africa/Dar_es_Salaam (Tanzania)
                          </option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Date Format
                        </label>{" "}
                        <select
                          value={formSettings.date_format || "DD/MM/YYYY"}
                          onChange={(e) =>
                            updateFormSetting("date_format", e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.boxShadow =
                              "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.boxShadow = "none";
                          }}
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Low Stock Threshold
                        </label>{" "}
                        <input
                          type="number"
                          min="0"
                          value={formSettings.auto_reorder_point || 10}
                          onChange={(e) =>
                            updateFormSetting(
                              "auto_reorder_point",
                              parseInt(e.target.value) || 0
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.boxShadow =
                              "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>{" "}
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div style={{ padding: "0" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <FiBell style={{ color: "#3b82f6" }} />
                  Notification Settings
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <div
                    style={{
                      padding: "20px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#1f2937",
                            }}
                          >
                            Low Stock Alerts
                          </h4>
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#6b7280",
                              marginTop: "4px",
                            }}
                          >
                            Get notified when products are running low
                          </p>
                        </div>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          {" "}
                          <input
                            type="checkbox"
                            checked={formSettings.low_stock_alerts ?? true}
                            onChange={(e) =>
                              updateFormSetting(
                                "low_stock_alerts",
                                e.target.checked
                              )
                            }
                            style={{ marginRight: "8px" }}
                          />
                          <span style={{ fontSize: "14px", color: "#374151" }}>
                            Enable
                          </span>
                        </label>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#1f2937",
                            }}
                          >
                            Expiry Alerts
                          </h4>
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#6b7280",
                              marginTop: "4px",
                            }}
                          >
                            Get notified about products approaching expiry
                          </p>
                        </div>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          {" "}
                          <input
                            type="checkbox"
                            checked={formSettings.expiry_alerts ?? true}
                            onChange={(e) =>
                              updateFormSetting(
                                "expiry_alerts",
                                e.target.checked
                              )
                            }
                            style={{ marginRight: "8px" }}
                          />
                          <span style={{ fontSize: "14px", color: "#374151" }}>
                            Enable
                          </span>
                        </label>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Alert Threshold (days before expiry)
                        </label>{" "}
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={formSettings.alert_threshold || 30}
                          onChange={(e) =>
                            updateFormSetting(
                              "alert_threshold",
                              parseInt(e.target.value) || 30
                            )
                          }
                          style={{
                            width: "200px",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <div style={{ padding: "0" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <FiMoon style={{ color: "#3b82f6" }} />
                  Appearance Settings
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <div
                    style={{
                      padding: "20px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: "16px",
                      }}
                    >
                      Theme Preferences
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Theme
                        </label>
                        <select
                          value={formSettings.theme || "light"}
                          onChange={(e) =>
                            updateFormSetting("theme", e.target.value)
                          }
                          style={{
                            width: "200px",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto (System)</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Language
                        </label>
                        <select
                          value={formSettings.language || "en"}
                          onChange={(e) =>
                            updateFormSetting("language", e.target.value)
                          }
                          style={{
                            width: "200px",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                        >
                          <option value="en">English</option>
                          <option value="sw">Swahili</option>
                          <option value="lg">Luganda</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === "system" && (
              <div style={{ padding: "0" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <FiDatabase style={{ color: "#3b82f6" }} />
                  System Settings
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <div
                    style={{
                      padding: "20px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: "16px",
                      }}
                    >
                      Database & Backup
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          lineHeight: "1.5",
                        }}
                      >
                        Regular database backups are handled automatically by
                        Supabase. You can create manual snapshots from your
                        Supabase dashboard.
                      </p>
                      <a
                        href="https://app.supabase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "12px 20px",
                          backgroundColor: "#10b981",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: "500",
                          width: "fit-content",
                        }}
                      >
                        <FiExternalLink size={16} />
                        Open Supabase Dashboard
                      </a>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "20px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: "16px",
                      }}
                    >
                      Session & Security
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Session Timeout (minutes)
                        </label>{" "}
                        <input
                          type="number"
                          min="5"
                          max="480"
                          value={formSettings.session_timeout || 30}
                          onChange={(e) =>
                            updateFormSetting(
                              "session_timeout",
                              parseInt(e.target.value) || 30
                            )
                          }
                          style={{
                            width: "200px",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <h5
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#1f2937",
                            }}
                          >
                            Audit Log
                          </h5>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginTop: "4px",
                            }}
                          >
                            Track all system activities
                          </p>
                        </div>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          {" "}
                          <input
                            type="checkbox"
                            checked={formSettings.enable_audit_log ?? true}
                            onChange={(e) =>
                              updateFormSetting(
                                "enable_audit_log",
                                e.target.checked
                              )
                            }
                            style={{ marginRight: "8px" }}
                          />
                          <span style={{ fontSize: "14px", color: "#374151" }}>
                            Enable
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
