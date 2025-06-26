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
import { useIsMobile } from "../hooks/useIsMobile";
import "../styles/mobile.css";

const Settings = () => {
  // Mobile detection hook
  const isMobile = useIsMobile();
  
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
  }, []);

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
          tax_rate: 18,
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
          console.error("❌ [Settings] Error creating default settings:", createError);
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
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'mobile-container' : 'min-h-screen bg-gray-50'} ${isMobile ? 'p-4' : 'p-6'}`}>
      {/* Header Section */}
      <div className={`${isMobile ? 'mb-6' : 'mb-8'}`}>
        <div className={`flex items-center ${isMobile ? 'flex-col space-y-4' : 'justify-between'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FiSettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div className={isMobile ? 'text-center' : ''}>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>Settings</h1>
              <p className="text-sm text-gray-600">Configure your pharmacy system preferences</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className={`flex items-center ${isMobile ? 'w-full justify-center space-x-3' : 'space-x-3'}`}>
            <button
              onClick={handleResetSettings}
              disabled={isLoading}
              className={`flex items-center gap-2 ${isMobile ? 'px-4 py-3 text-sm flex-1' : 'px-5 py-2.5'} bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl transition-all duration-200 font-medium disabled:opacity-50`}
            >
              <FiRefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving || isLoading}
              className={`flex items-center gap-2 ${isMobile ? 'px-4 py-3 text-sm flex-1' : 'px-5 py-2.5'} bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium disabled:opacity-50`}
            >
              <FiSave className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Message Display */}
      {message.text && (
        <div className={`${isMobile ? 'mb-4' : 'mb-6'} p-4 rounded-xl border ${
          message.type === "success" 
            ? 'bg-green-50/80 border-green-200 text-green-800' 
            : 'bg-red-50/80 border-red-200 text-red-800'
        } backdrop-blur-sm`}>
          <div className="flex items-center space-x-2">
            {message.type === "success" ? (
              <FiCheck className="h-4 w-4" />
            ) : (
              <FiX className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`${isMobile ? 'space-y-6' : 'flex gap-6'}`}>
        {/* Sidebar Navigation */}
        <div className={`${isMobile ? 'w-full' : 'w-80 flex-shrink-0'}`}>
          <div className={`${isMobile ? 'glass-card p-4' : 'bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl'}`}>
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile ? 'mb-3' : 'mb-4'}`}>
              Settings Categories
            </h3>

            <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-col space-y-2'}`}>
              {[
                { id: "general", label: "General", icon: FiSettingsIcon, description: "Basic settings" },
                { id: "business", label: "Business", icon: FiUser, description: "Store info" },
                { id: "notifications", label: "Alerts", icon: FiBell, description: "Notifications" },
                { id: "appearance", label: "Display", icon: FiMoon, description: "Theme & UI" },
                { id: "system", label: "System", icon: FiDatabase, description: "Advanced" },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      isMobile ? 'p-3 flex-col' : 'p-4 flex-row'
                    } flex items-center gap-3 rounded-xl transition-all duration-200 font-medium ${
                      isActive
                        ? 'bg-blue-50/80 text-blue-700 border border-blue-200/50'
                        : 'text-gray-600 hover:bg-gray-50/70 hover:text-gray-800'
                    }`}
                  >
                    <Icon className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} ${isActive ? 'text-blue-600' : ''}`} />
                    <div className={`${isMobile ? 'text-center' : 'text-left'}`}>
                      <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold`}>{tab.label}</div>
                      {!isMobile && (
                        <div className="text-xs text-gray-500">{tab.description}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`${isMobile ? 'w-full' : 'flex-1'}`}>
          <div className={`${isMobile ? 'glass-card p-4' : 'bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl'}`}>
            {/* Content Area */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <FiSettingsIcon className="h-6 w-6 text-blue-600" />
                  <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
                    General Settings
                  </h2>
                </div>

                <div className={`${isMobile ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'}`}>
                  {/* Business Information */}
                  <div className="space-y-6">
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 border-b-2 border-gray-100 pb-2`}>
                      Business Information
                    </h3>

                    <div className={`space-y-${isMobile ? '5' : '5'}`}>
                      <div>
                        <label className={`block text-sm font-semibold text-gray-700 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={formSettings.pharmacy_name || ""}
                          onChange={(e) =>
                            updateFormSetting("pharmacy_name", e.target.value)
                          }
                          className={`w-full ${isMobile ? 'px-4 py-4 text-base' : 'px-4 py-3'} border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                          placeholder="Enter your pharmacy name"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold text-gray-700 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                          Address
                        </label>
                        <textarea
                          value={formSettings.address || ""}
                          onChange={(e) =>
                            updateFormSetting("address", e.target.value)
                          }
                          rows={isMobile ? 4 : 3}
                          className={`w-full ${isMobile ? 'px-4 py-4 text-base' : 'px-4 py-3'} border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70 resize-none`}
                          placeholder="Enter your pharmacy address"
                        />
                      </div>

                      <div className={`grid ${isMobile ? 'grid-cols-1 gap-5' : 'grid-cols-2 gap-4'}`}>
                        <div>
                          <label className={`block text-sm font-semibold text-gray-700 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formSettings.phone || ""}
                            onChange={(e) =>
                              updateFormSetting("phone", e.target.value)
                            }
                            className={`w-full ${isMobile ? 'px-4 py-4 text-base' : 'px-4 py-3'} border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                            placeholder="Enter phone number"
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-semibold text-gray-700 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={formSettings.email || ""}
                            onChange={(e) =>
                              updateFormSetting("email", e.target.value)
                            }
                            className={`w-full ${isMobile ? 'px-4 py-4 text-base' : 'px-4 py-3'} border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                            placeholder="Enter email address"
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold text-gray-700 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                          Pharmacy License Number
                        </label>
                        <input
                          type="text"
                          value={formSettings.pharmacy_license || ""}
                          onChange={(e) =>
                            updateFormSetting("pharmacy_license", e.target.value)
                          }
                          className={`w-full ${isMobile ? 'px-4 py-4 text-base' : 'px-4 py-3'} border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                          placeholder="Enter pharmacy license number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Operational Settings */}
                  <div className="space-y-6">
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 border-b-2 border-gray-100 pb-2`}>
                      Operational Settings
                    </h3>

                    <div className={`space-y-${isMobile ? '5' : '5'}`}>
                      <div className={`grid ${isMobile ? 'grid-cols-1 gap-5' : 'grid-cols-2 gap-4'}`}>
                        <div>
                          <label className={`block text-sm font-semibold text-gray-700 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                            Currency
                          </label>
                          <select
                            value={formSettings.currency || "UGX"}
                            onChange={(e) =>
                              updateFormSetting("currency", e.target.value)
                            }
                            className={`w-full ${isMobile ? 'px-4 py-4 text-base' : 'px-4 py-3'} border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70 appearance-none cursor-pointer`}
                          >
                            <option value="UGX">UGX - Ugandan Shilling</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                          </select>
                        </div>

                        <div>
                          <label className={`block text-sm font-semibold text-gray-700 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                            Tax Rate (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formSettings.tax_rate || ""}
                            onChange={(e) =>
                              updateFormSetting("tax_rate", parseFloat(e.target.value) || 0)
                            }
                            className={`w-full ${isMobile ? 'px-4 py-4 text-base' : 'px-4 py-3'} border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                            placeholder="18"
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold text-gray-700 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                          Low Stock Threshold
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formSettings.low_stock_threshold || ""}
                          onChange={(e) =>
                            updateFormSetting("low_stock_threshold", parseInt(e.target.value) || 10)
                          }
                          className={`w-full ${isMobile ? 'px-4 py-4 text-base' : 'px-4 py-3'} border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50/70`}
                          placeholder="10"
                        />
                        <p className="text-xs text-gray-500 mt-2">Alert when product quantity falls below this number</p>
                      </div>

                      {/* Alert Settings */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-800">Alert Settings</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                            <div>
                              <div className="text-sm font-semibold text-gray-700">Low Stock Alerts</div>
                              <div className="text-xs text-gray-500">Get notified when products are running low</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={formSettings.low_stock_alerts || false}
                              onChange={(e) =>
                                updateFormSetting("low_stock_alerts", e.target.checked)
                              }
                              className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                            <div>
                              <div className="text-sm font-semibold text-gray-700">Expiry Alerts</div>
                              <div className="text-xs text-gray-500">Get notified about expiring products</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={formSettings.expiry_alerts || false}
                              onChange={(e) =>
                                updateFormSetting("expiry_alerts", e.target.checked)
                              }
                              className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs content */}
            {activeTab === "business" && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <FiUser className="h-6 w-6 text-blue-600" />
                  <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
                    Business Information
                  </h2>
                </div>
                <div className="text-center py-12">
                  <FiUser className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Business settings will be available here.</p>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <FiBell className="h-6 w-6 text-blue-600" />
                  <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
                    Notification Settings
                  </h2>
                </div>
                <div className="text-center py-12">
                  <FiBell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Notification settings will be available here.</p>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <FiMoon className="h-6 w-6 text-blue-600" />
                  <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
                    Appearance Settings
                  </h2>
                </div>
                <div className="text-center py-12">
                  <FiMoon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Appearance settings will be available here.</p>
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <FiDatabase className="h-6 w-6 text-blue-600" />
                  <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
                    System Settings
                  </h2>
                </div>
                <div className="text-center py-12">
                  <FiDatabase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">System settings will be available here.</p>
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
