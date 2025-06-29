import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiAlertCircle, FiHome, FiArrowLeft } from "react-icons/fi";

const NotFound = () => {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Top color band */}
        <div className="h-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        <div className="p-6 sm:p-10 py-12 sm:py-16">
          <motion.div
            className="text-center flex flex-col items-center justify-center min-h-[400px] sm:min-h-[450px]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Error code with animated circle */}
            <motion.div
              className="relative mx-auto mb-8 sm:mb-12"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-blue-100 flex items-center justify-center">
                <FiAlertCircle className="h-14 w-14 sm:h-18 sm:w-18 text-blue-600" />
              </div>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <motion.div
                  className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  404
                </motion.div>
              </div>
            </motion.div>

            {/* Error message */}
            <motion.h1
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6"
              variants={itemVariants}
            >
              Page Not Found
            </motion.h1>
            
            <motion.p
              className="text-lg text-gray-600 mb-10 sm:mb-14 px-4 max-w-md"
              variants={itemVariants}
            >
              The page you're looking for doesn't exist or has been moved.
            </motion.p>

            {/* Action buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mt-auto"
              variants={itemVariants}
            >
              <motion.button
                onClick={() => navigate("/")}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiHome className="h-5 w-5" />
                Go to Dashboard
              </motion.button>
              
              <motion.button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-gray-300 text-gray-700 text-lg rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiArrowLeft className="h-5 w-5" />
                Go Back
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound; 