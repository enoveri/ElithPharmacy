import { useState, useEffect } from "react";
import { FiSearch, FiSettings, FiBell, FiMenu, FiUser } from "react-icons/fi";

const Header = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Format date as "Thursday, November 25, 2021"
  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format time as "07:01:39"
  const hours = time.getHours() % 12 || 12;
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = time.getMinutes().toString().padStart(2, "0");
  const formattedSeconds = time.getSeconds().toString().padStart(2, "0");
  const amPm = time.getHours() >= 12 ? "PM" : "AM";

  return (
    <header
      className="bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm"
      style={{ fontFamily: "var(--font-family-sans)" }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Search */}
          <div className="flex items-center flex-1 max-w-lg ml-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products, customers, transactions..."
                className="items-center block w-full pl-10 pr-4 py-4  transition-all outline-none duration-200 hover:shadow-sm border-b-2"
                style={{
                  borderBottom: "2px solid var(--color-border-light)",
                  color: "var(--color-text-primary)",
                  fontSize: "1rem",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-border-focus)";
                  e.target.style.boxShadow = "0 0 0 3px rgb(59 130 246 / 0.1)";
                  e.target.style.borderBottom =
                    "2px solid var(--color-border-focus)";
                  e.target.style.filter =
                    "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-border-light)";
                  e.target.style.boxShadow = "none";
                  e.target.style.borderBottom =
                    "2px solid var(--color-border-light)";
                  e.target.style.filter = "none";
                }}
                onMouseEnter={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderBottom =
                      "2px solid var(--color-secondary-400)";
                    e.target.style.filter =
                      "drop-shadow(0 2px 4px rgba(56, 189, 248, 0.2))";
                  }
                }}
                onMouseLeave={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderBottom =
                      "2px solid var(--color-border-light)";
                    e.target.style.filter = "none";
                  }
                }}
              />
              <div className="absolute inset-y-0 right-0 pl-3 flex items-center pointer-events-none">
                <FiSearch
                  className="h-5 w-5"
                  style={{ color: "var(--color-text-muted)" }}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Clock Display */}
          <div
            className="border rounded-xl shadow-sm p-4 min-w-[200px] backdrop-blur-sm"
            style={{
              background: "var(--color-bg-gradient-secondary)",
              borderColor: "var(--color-border-light)",
              fontFamily: "var(--font-family-sans)",
            }}
          >
            <div className="text-center">
              <div
                className="text-xs font-medium mb-1 tracking-wide"
                style={{ color: "var(--color-text-white)", opacity: 0.9 }}
              >
                {formattedDate}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div
                  className="text-xl font-bold tracking-wider"
                  style={{
                    color: "var(--color-text-white)",
                    fontFamily: "var(--font-family-mono)",
                  }}
                >
                  {formattedHours}:{formattedMinutes}:{formattedSeconds}
                </div>
                <div
                  className="px-2 py-1 rounded-md text-xs font-bold shadow-sm"
                  style={{
                    background: "var(--color-primary-600)",
                    color: "var(--color-text-white)",
                  }}
                >
                  {amPm}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between px-4 items-center gap-4">
            <button
              className="p-2.5 rounded-xl transition-all duration-200 hover:shadow-sm"
              style={{
                color: "var(--color-text-secondary)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "var(--color-bg-main)";
                e.target.style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "var(--color-text-secondary)";
              }}
            >
              <FiSettings className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                className="p-2.5 rounded-xl transition-all duration-200 hover:shadow-sm"
                style={{
                  color: "var(--color-text-secondary)",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "var(--color-bg-main)";
                  e.target.style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "var(--color-text-secondary)";
                }}
              >
                <FiBell className="h-5 w-5" />
                <span
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-sm"
                  style={{ background: "var(--color-danger-500)" }}
                >
                  <span
                    className="block w-full h-full rounded-full animate-pulse"
                    style={{ background: "var(--color-danger-400)" }}
                  ></span>
                </span>
              </button>
            </div>

            <button
              className="p-2.5 rounded-xl transition-all duration-200 hover:shadow-sm"
              style={{
                color: "var(--color-text-secondary)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "var(--color-bg-main)";
                e.target.style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "var(--color-text-secondary)";
              }}
            >
              <FiUser className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
