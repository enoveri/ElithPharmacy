import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FiChevronRight,
  FiCheck,
  FiXCircle,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiExternalLink,
  FiSettings as FiSettingsIcon,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useIsMobile } from "../hooks/useIsMobile";
import MobileSettings from "../components/mobile/MobileSettings";
import "../styles/mobile.css";

const Settings = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formSettings, setFormSettings] = useState({});

  // Fetch settings from database
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
          store_name: "My Pharmacy",
          pharmacy_name: "My Pharmacy",
          address: "",
          phone: "",
          email: user?.email || "",
          pharmacy_license: "",
          currency: "UGX",
          tax_rate: 0,
          disable_tax: true,
          timezone: "Africa/Kampala",
          date_format: "DD/MM/YYYY",
          low_stock_threshold: 10,
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

        setSettings(defaultSettings);
        setFormSettings(defaultSettings);

        // Create default settings in database
        const { error: createError } = await supabase
          .from("settings")
          .insert(defaultSettings);

        if (createError) {
          console.error(
            "❌ [Settings] Error creating default settings:",
            createError
          );
        }
      } else {
        setSettings(data);
        setFormSettings(data);
      }
    } catch (err) {
      console.error("❌ [Settings] Error in fetchSettings:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update form setting
  const updateFormSetting = (key, value) => {
    setFormSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase
        .from("settings")
        .upsert(formSettings, { onConflict: "user_id" });

      if (error) throw error;

      setSettings(formSettings);
      setMessage({ type: "success", text: "Settings saved successfully!" });

      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("❌ [Settings] Error saving settings:", err);
      setError(err.message);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  // Reset settings
  const handleResetSettings = () => {
    setFormSettings(settings);
    setMessage({ type: "success", text: "Settings reset to last saved state" });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  // Fetch settings when user is available
  useEffect(() => {
    if (user) {
      fetchSettings();
    } else if (user === null) {
      // If user is explicitly null (not logged in), stop loading
      setIsLoading(false);
    }
  }, [user]);

  // Add a timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("⚠️ [Settings] Loading timeout, stopping loading state");
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className={`${isMobile ? "mobile-container" : "min-h-screen bg-gray-50"} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  // If mobile, use the MobileSettings component
  if (isMobile) {
    return <MobileSettings />;
  }

  return (
    <div style={{
      padding: "24px",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
    }}>
      {/* Header Section */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "32px",
      }}>
        <div>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#111827",
            marginBottom: "8px",
          }}>
                Settings
              </h1>
          <p style={{
            fontSize: "16px",
            color: "#6b7280",
            margin: 0,
          }}>
            Configure your pharmacy management system
          </p>
          </div>

          {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleResetSettings}
              disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#e5e7eb"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#f3f4f6"}
          >
            <FiRefreshCw style={{ fontSize: "16px" }} />
            Reset
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving || isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
              opacity: saving || isLoading ? 0.5 : 1,
            }}
            onMouseOver={(e) => {
              if (!saving && !isLoading) e.target.style.backgroundColor = "#2563eb";
            }}
            onMouseOut={(e) => {
              if (!saving && !isLoading) e.target.style.backgroundColor = "#3b82f6";
            }}
          >
            <FiSave style={{ fontSize: "16px" }} />
            {saving ? "Saving..." : "Save"}
            </button>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div style={{
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
          backgroundColor: message.type === "success" ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          color: message.type === "success" ? "#166534" : "#dc2626",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {message.type === "success" ? (
              <FiCheck style={{ fontSize: "16px" }} />
            ) : (
              <FiXCircle style={{ fontSize: "16px" }} />
            )}
            <span style={{ fontSize: "14px", fontWeight: "500" }}>{message.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: "24px",
        alignItems: "start",
      }}>
        {/* Sidebar Navigation */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #f1f5f9",
          height: "fit-content",
        }}>
          <h3 style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "20px",
          }}>
              Settings Categories
            </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { id: "general", label: "General", icon: FiSettingsIcon, description: "Basic settings" },
              { id: "business", label: "Business", icon: FiUser, description: "Store info" },
              { id: "notifications", label: "Notifications", icon: FiBell, description: "Alerts & notifications" },
              { id: "appearance", label: "Appearance", icon: FiMoon, description: "Theme & UI" },
              { id: "system", label: "System", icon: FiDatabase, description: "Advanced settings" },
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
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: isActive ? "#eff6ff" : "transparent",
                    color: isActive ? "#1d4ed8" : "#6b7280",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "left",
                    width: "100%",
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.target.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.target.style.backgroundColor = "transparent";
                  }}
                >
                  <Icon style={{ 
                    fontSize: "16px",
                    color: isActive ? "#1d4ed8" : "#9ca3af",
                  }} />
                  <div>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      marginBottom: "2px",
                    }}>
                        {tab.label}
                      </div>
                    <div style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                    }}>
                          {tab.description}
                        </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Main Content Panel */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #f1f5f9",
        }}>
          {/* General Settings Tab */}
            {activeTab === "general" && (
            <div>


              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "48px",
              }}>
                {/* Business Information Column */}
                <div>
                  <h3 style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: "24px",
                    paddingBottom: "12px",
                    borderBottom: "2px solid #e5e7eb",
                  }}>
                      Business Information
                    </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      <div>
                      <label style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}>
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={formSettings.pharmacy_name || ""}
                        onChange={(e) => updateFormSetting("pharmacy_name", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "#f9fafb",
                          transition: "all 0.2s",
                        }}
                          placeholder="Enter your pharmacy name"
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#d1d5db";
                          e.target.style.backgroundColor = "#f9fafb";
                        }}
                        />
                      </div>

                      <div>
                      <label style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}>
                          Address
                        </label>
                        <textarea
                          value={formSettings.address || ""}
                        onChange={(e) => updateFormSetting("address", e.target.value)}
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "#f9fafb",
                          transition: "all 0.2s",
                          resize: "none",
                        }}
                          placeholder="Enter your pharmacy address"
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#d1d5db";
                          e.target.style.backgroundColor = "#f9fafb";
                        }}
                        />
                      </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                        <label style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "8px",
                        }}>
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formSettings.phone || ""}
                          onChange={(e) => updateFormSetting("phone", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "#f9fafb",
                            transition: "all 0.2s",
                          }}
                            placeholder="Enter phone number"
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.backgroundColor = "#f9fafb";
                          }}
                          />
                        </div>

                        <div>
                        <label style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "8px",
                        }}>
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={formSettings.email || ""}
                          onChange={(e) => updateFormSetting("email", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "#f9fafb",
                            transition: "all 0.2s",
                          }}
                            placeholder="Enter email address"
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.backgroundColor = "#f9fafb";
                          }}
                          />
                        </div>
                      </div>

                      <div>
                      <label style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}>
                          Pharmacy License Number
                        </label>
                        <input
                          type="text"
                          value={formSettings.pharmacy_license || ""}
                        onChange={(e) => updateFormSetting("pharmacy_license", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "#f9fafb",
                          transition: "all 0.2s",
                        }}
                          placeholder="Enter pharmacy license number"
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#d1d5db";
                          e.target.style.backgroundColor = "#f9fafb";
                        }}
                        />
                      </div>
                    </div>
                  </div>

                {/* Operational Settings Column */}
                <div>
                  <h3 style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: "24px",
                    paddingBottom: "12px",
                    borderBottom: "2px solid #e5e7eb",
                  }}>
                      Operational Settings
                    </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                        <label style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "8px",
                        }}>
                            Currency
                          </label>
                          <select
                            value={formSettings.currency || "UGX"}
                          onChange={(e) => updateFormSetting("currency", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "#f9fafb",
                            transition: "all 0.2s",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.backgroundColor = "white";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.backgroundColor = "#f9fafb";
                          }}
                        >
                          <option value="UGX">Ugandan Shilling (UGX)</option>
                          <option value="USD">US Dollar (USD)</option>
                          <option value="EUR">Euro (EUR)</option>
                          <option value="GBP">British Pound (GBP)</option>
                          </select>
                        </div>

                        <div>
                        <label style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "8px",
                        }}>
                            Tax Rate (%)
                          </label>
                          <input
                            type="number"
                          value={formSettings.tax_rate || 0}
                          onChange={(e) => updateFormSetting("tax_rate", parseFloat(e.target.value))}
                          disabled={formSettings.disable_tax}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: formSettings.disable_tax ? "#f3f4f6" : "#f9fafb",
                            transition: "all 0.2s",
                            opacity: formSettings.disable_tax ? 0.6 : 1,
                          }}
                            placeholder="0"
                          onFocus={(e) => {
                            if (!formSettings.disable_tax) {
                              e.target.style.borderColor = "#3b82f6";
                              e.target.style.backgroundColor = "white";
                            }
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.backgroundColor = formSettings.disable_tax ? "#f3f4f6" : "#f9fafb";
                          }}
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                            <div>
                            <p style={{ fontSize: "14px", fontWeight: "500", color: "#374151", margin: "0" }}>
                                Disable Tax Calculation
                            </p>
                            <p style={{ fontSize: "12px", color: "#6b7280", margin: "0" }}>
                                When enabled, tax will not be calculated or displayed anywhere
                            </p>
                              </div>
                          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={formSettings.disable_tax || false}
                              onChange={(e) => updateFormSetting("disable_tax", e.target.checked)}
                              style={{ display: "none" }}
                            />
                            <div style={{
                              width: "44px",
                              height: "24px",
                              backgroundColor: formSettings.disable_tax ? "#3b82f6" : "#d1d5db",
                              borderRadius: "12px",
                              position: "relative",
                              transition: "all 0.2s",
                            }}>
                              <div style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: "white",
                                borderRadius: "50%",
                                position: "absolute",
                                top: "2px",
                                left: formSettings.disable_tax ? "22px" : "2px",
                                transition: "all 0.2s",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              }} />
                            </div>
                          </label>
                          </div>
                      </div>

                      <div>
                      <label style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}>
                          Low Stock Threshold
                        </label>
                        <input
                          type="number"
                        value={formSettings.low_stock_threshold || 10}
                        onChange={(e) => updateFormSetting("low_stock_threshold", parseInt(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "#f9fafb",
                          transition: "all 0.2s",
                        }}
                          placeholder="10"
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.backgroundColor = "white";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#d1d5db";
                          e.target.style.backgroundColor = "#f9fafb";
                        }}
                      />
                      <p style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "4px",
                      }}>
                          Alert when product quantity falls below this number
                        </p>
                      </div>

                    <div>
                      <h4 style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "16px",
                      }}>
                          Alert Settings
                        </h4>

                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                            <p style={{ fontSize: "14px", fontWeight: "500", color: "#374151", margin: "0" }}>
                                Low Stock Alerts
                            </p>
                            <p style={{ fontSize: "12px", color: "#6b7280", margin: "0" }}>
                                Get notified when products are running low
                            </p>
                              </div>
                          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={formSettings.low_stock_alerts || false}
                              onChange={(e) => updateFormSetting("low_stock_alerts", e.target.checked)}
                              style={{ display: "none" }}
                            />
                            <div style={{
                              width: "44px",
                              height: "24px",
                              backgroundColor: formSettings.low_stock_alerts ? "#3b82f6" : "#d1d5db",
                              borderRadius: "12px",
                              position: "relative",
                              transition: "all 0.2s",
                            }}>
                              <div style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: "white",
                                borderRadius: "50%",
                                position: "absolute",
                                top: "2px",
                                left: formSettings.low_stock_alerts ? "22px" : "2px",
                                transition: "all 0.2s",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              }} />
                            </div>
                          </label>
                          </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                            <p style={{ fontSize: "14px", fontWeight: "500", color: "#374151", margin: "0" }}>
                                Expiry Alerts
                            </p>
                            <p style={{ fontSize: "12px", color: "#6b7280", margin: "0" }}>
                                Get notified about expiring products
                            </p>
                              </div>
                          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={formSettings.expiry_alerts || false}
                              onChange={(e) => updateFormSetting("expiry_alerts", e.target.checked)}
                              style={{ display: "none" }}
                            />
                            <div style={{
                              width: "44px",
                              height: "24px",
                              backgroundColor: formSettings.expiry_alerts ? "#3b82f6" : "#d1d5db",
                              borderRadius: "12px",
                              position: "relative",
                              transition: "all 0.2s",
                            }}>
                              <div style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: "white",
                                borderRadius: "50%",
                                position: "absolute",
                                top: "2px",
                                left: formSettings.expiry_alerts ? "22px" : "2px",
                                transition: "all 0.2s",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              }} />
                          </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}

          {/* Other tabs content placeholder */}
          {activeTab !== "general" && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <h3 style={{ fontSize: "18px", color: "#6b7280", marginBottom: "8px" }}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings
              </h3>
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                This section is coming soon...
              </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
