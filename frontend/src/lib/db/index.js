import { supabase } from "../supabase";

// Helper functions to work with database data
export const dbHelpers = {
  // Get product by ID
  getProductById: async (id) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", parseInt(id))
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      return null;
    }

    return data;
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", parseInt(id))
      .single();

    if (error) {
      console.error("Error fetching customer:", error);
      return null;
    }

    return data;
  },

  // Get products by category
  getProductsByCategory: async (categoryName) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", categoryName);

    if (error) {
      console.error("Error fetching products by category:", error);
      return [];
    }

    return data;
  }, // Get low stock products
  getLowStockProducts: async () => {
    try {
      // Fetch all products since PostgREST doesn't support column-to-column comparison
      const { data: products, error } = await supabase
        .from("products")
        .select("*");

      if (error) {
        console.error("Error fetching low stock products:", error);
        return [];
      }

      // Filter on the client side for low stock products
      const lowStockProducts =
        products?.filter((product) => {
          const quantity = product.quantity || 0;
          const minStock =
            product.min_stock_level || product.minStockLevel || 0;
          return quantity <= minStock;
        }) || [];

      console.log(
        "✅ [DB] Low stock products filtered:",
        lowStockProducts.length
      );
      return lowStockProducts;
    } catch (error) {
      console.error("❌ [DB] Error in getLowStockProducts:", error);
      return [];
    }
  },

  // Get sales by customer
  getSalesByCustomer: async (customerId) => {
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        *,
        sale_items(*)
      `
      )
      .eq("customer_id", parseInt(customerId));

    if (error) {
      console.error("Error fetching sales by customer:", error);
      return [];
    }

    return data;
  },

  // Get recent sales
  getRecentSales: async (limit = 10) => {
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        *,
        customers(first_name, last_name),
        sale_items(*, products(name))
      `
      )
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent sales:", error);
      return [];
    }

    return data;
  },

  // Get top customers by spending
  getTopCustomers: async (limit = 5) => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("total_spent", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching top customers:", error);
      return [];
    }

    return data;
  },

  // Search products
  searchProducts: async (query) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(
        `name.ilike.%${query}%,category.ilike.%${query}%,manufacturer.ilike.%${query}%`
      );

    if (error) {
      console.error("Error searching products:", error);
      return [];
    }

    return data;
  },

  // Search customers
  searchCustomers: async (query) => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
      );

    if (error) {
      console.error("Error searching customers:", error);
      return [];
    }

    return data;
  },

  // Generate unique transaction number
  generateTransactionNumber: async () => {
    // Get the last transaction number from the database
    const { data, error } = await supabase
      .from("sales")
      .select("transaction_number")
      .order("id", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error generating transaction number:", error);
      return `TXN-2024-000001`;
    }

    if (data && data.length > 0) {
      const lastTxn = data[0];
      const lastNumber = parseInt(lastTxn.transaction_number.split("-").pop());
      return `TXN-2024-${(lastNumber + 1).toString().padStart(6, "0")}`;
    } else {
      return `TXN-2024-000001`;
    }
  },

  // Get total revenue
  getTotalRevenue: async () => {
    const { data, error } = await supabase.from("sales").select("total_amount");

    if (error) {
      console.error("Error calculating total revenue:", error);
      return 0;
    }

    return data.reduce((total, sale) => total + sale.total_amount, 0);
  },
  // Get products needing reorder
  getProductsToReorder: async () => {
    try {
      // Fetch all products and filter client-side
      const { data, error } = await supabase.from("products").select("*");

      if (error) {
        console.error("Error fetching products to reorder:", error);
        return [];
      }

      // Filter on client side for products needing reorder
      const productsToReorder =
        data?.filter((product) => {
          const quantity = product.quantity || 0;
          const minStock =
            product.min_stock_level || product.minStockLevel || 0;
          return quantity <= minStock * 1.5;
        }) || [];

      return productsToReorder;
    } catch (error) {
      console.error("❌ [DB] Error in getProductsToReorder:", error);
      return [];
    }
  },

  // Calculate age from date of birth
  calculateAge: (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  },

  // Get products expiring soon
  getExpiringProducts: async (daysThreshold = 30) => {
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setDate(today.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .lt("expiry_date", thresholdDate.toISOString().split("T")[0])
      .gt("expiry_date", today.toISOString().split("T")[0]);

    if (error) {
      console.error("Error fetching expiring products:", error);
      return [];
    }

    return data.map((product) => ({
      ...product,
      daysUntilExpiry: Math.ceil(
        (new Date(product.expiry_date) - today) / (1000 * 60 * 60 * 24)
      ),
    }));
  },

  // Get expired products
  getExpiredProducts: async () => {
    const today = new Date();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .lte("expiry_date", today.toISOString().split("T")[0]);

    if (error) {
      console.error("Error fetching expired products:", error);
      return [];
    }

    return data;
  },

  // Get system notifications
  getSystemNotifications: async () => {
    // This would typically come from a notifications table
    // For now, we'll return static data similar to the mock
    return [
      {
        id: "sys-1",
        type: "info",
        title: "System Backup Complete",
        message: "Daily system backup completed successfully",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        read: false,
      },
      {
        id: "sys-2",
        type: "warning",
        title: "License Renewal",
        message: "Your software license expires in 30 days",
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        read: true,
      },
    ];
  },

  // Get stock notifications
  getStockNotifications: async () => {
    const lowStockProducts = await dbHelpers.getLowStockProducts();

    return lowStockProducts.map((product) => ({
      id: `stock-${product.id}`,
      type: product.quantity === 0 ? "critical" : "warning",
      title: product.quantity === 0 ? "Out of Stock" : "Low Stock Alert",
      message: `${product.name} ${
        product.quantity === 0
          ? "is out of stock"
          : `has only ${product.quantity} units remaining`
      }`,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      read: false,
      productId: product.id,
    }));
  },

  // Get sales notifications
  getSalesNotifications: async () => {
    const recentSales = await dbHelpers.getRecentSales(5);

    return recentSales.map((sale) => ({
      id: `sale-${sale.id}`,
      type: "success",
      title: "Sale Completed",
      message: `Transaction ${sale.transaction_number} - ₦${(sale.total_amount || 0).toFixed(2)}`,
      timestamp: new Date(sale.date),
      read: Math.random() > 0.3,
      saleId: sale.id,
    }));
  },

  // Get expiry notifications
  getExpiryNotifications: async () => {
    const expiringProducts = await dbHelpers.getExpiringProducts(30);
    const expiredProducts = await dbHelpers.getExpiredProducts();

    const expiringNotifications = expiringProducts.map((product) => ({
      id: `expiry-${product.id}`,
      type: product.daysUntilExpiry <= 7 ? "critical" : "warning",
      title:
        product.daysUntilExpiry <= 7
          ? "Product Expiring Soon"
          : "Product Expiry Warning",
      message: `${product.name} expires in ${product.daysUntilExpiry} day${
        product.daysUntilExpiry === 1 ? "" : "s"
      }`,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      read: false,
      productId: product.id,
      expiryDate: product.expiry_date,
      daysUntilExpiry: product.daysUntilExpiry,
    }));

    const expiredNotifications = expiredProducts.map((product) => ({
      id: `expired-${product.id}`,
      type: "critical",
      title: "Product Expired",
      message: `${product.name} has expired on ${new Date(product.expiry_date).toLocaleDateString()}`,
      timestamp: new Date(product.expiry_date),
      read: false,
      productId: product.id,
      expiryDate: product.expiry_date,
    }));

    return [...expiringNotifications, ...expiredNotifications];
  },

  // Get all notifications
  getAllNotifications: async () => {
    const systemNotifications = await dbHelpers.getSystemNotifications();
    const stockNotifications = await dbHelpers.getStockNotifications();
    const salesNotifications = await dbHelpers.getSalesNotifications();
    const expiryNotifications = await dbHelpers.getExpiryNotifications();

    return [
      ...systemNotifications,
      ...stockNotifications,
      ...salesNotifications,
      ...expiryNotifications,
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // Get unread notification count
  getUnreadNotificationCount: async () => {
    const allNotifications = await dbHelpers.getAllNotifications();
    return allNotifications.filter((n) => !n.read).length;
  }, // Create a new product
  createProduct: async (product) => {
    console.log("🔍 [DB] Input product data:", product);
    // Check for existing products to understand the ID situation
    const { data: existingProducts } = await supabase
      .from("products")
      .select("id, name")
      .order("id", { ascending: false })
      .limit(10);
    console.log("🏪 [DB] Existing products (latest 10):", existingProducts);

    // Check the highest ID
    const maxId =
      existingProducts && existingProducts.length > 0
        ? existingProducts[0].id
        : 0;
    console.log("🔢 [DB] Highest existing ID:", maxId);
    const productData = {
      name: product.name,
      category: product.category,
      price: parseFloat(product.price) || 0,
      cost_price: parseFloat(product.costPrice) || 0,
      quantity: parseInt(product.quantity) || 0,
      min_stock_level: parseInt(product.minStockLevel) || 0,
      status: product.status || "active",
      manufacturer: product.manufacturer || "",
      expiry_date: product.expiryDate || null,
      batch_number: product.batchNumber || "",
      barcode: product.barcode || "",
      description: product.description || "",
      synced: false,
    };

    console.log("📤 [DB] Sending to Supabase:", productData);
    const { data, error } = await supabase
      .from("products")
      .insert([productData])
      .select();
    if (error) {
      console.error("Error creating product:", error);

      // If it's a primary key conflict, try inserting with a specific ID
      if (error.code === "23505" && error.message.includes("products_pkey")) {
        console.log(
          "🔄 [DB] Primary key conflict detected, trying with specific ID..."
        );

        // Calculate a safe ID (max + 1)
        const safeId = maxId + 1;
        const productDataWithId = { ...productData, id: safeId };

        console.log(`🆔 [DB] Retrying with ID ${safeId}:`, productDataWithId);

        // Retry the insertion with specific ID
        const { data: retryData, error: retryError } = await supabase
          .from("products")
          .insert([productDataWithId])
          .select();

        if (retryError) {
          console.error("❌ [DB] Retry with specific ID failed:", retryError);
          return null;
        }

        console.log("✅ [DB] Product created successfully with specific ID");
        return retryData[0];
      }

      return null;
    }

    console.log("✅ [DB] Product created successfully:", data[0]);
    return data[0];
  },

  // Update a product
  updateProduct: async (id, updates) => {
    // Convert camelCase to snake_case for database
    const dbUpdates = {};
    if (updates.costPrice !== undefined)
      dbUpdates.cost_price = updates.costPrice;
    if (updates.minStockLevel !== undefined)
      dbUpdates.min_stock_level = updates.minStockLevel;
    if (updates.expiryDate !== undefined)
      dbUpdates.expiry_date = updates.expiryDate;
    if (updates.batchNumber !== undefined)
      dbUpdates.batch_number = updates.batchNumber;

    // Add remaining fields directly
    Object.keys(updates).forEach((key) => {
      if (
        !["costPrice", "minStockLevel", "expiryDate", "batchNumber"].includes(
          key
        )
      ) {
        dbUpdates[key] = updates[key];
      }
    });

    // Mark as not synced
    dbUpdates.synced = false;

    const { data, error } = await supabase
      .from("products")
      .update(dbUpdates)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating product:", error);
      return null;
    }

    return data[0];
  },

  // Delete a product
  deleteProduct: async (id, options = {}) => {
    try {
      console.log("🗑️ [DB] Deleting product:", id, "Options:", options);

      // Check if product exists and get related data
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", parseInt(id))
        .single();

      if (productError) {
        console.error("❌ [DB] Error fetching product for deletion:", productError);
        return { success: false, error: productError };
      }

      // Get related sales data
      const { data: relatedSales, error: salesError } = await supabase
        .from("sale_items")
        .select("sale_id, quantity, product_id")
        .eq("product_id", parseInt(id));

      if (salesError) {
        console.error("❌ [DB] Error fetching related sales:", salesError);
      }

      const uniqueSaleIds = [...new Set(relatedSales?.map(item => item.sale_id) || [])];
      console.log(`📊 [DB] Product has ${relatedSales?.length || 0} sale items in ${uniqueSaleIds.length} sales`);

      if (options.cascadeDelete && relatedSales?.length > 0) {
        console.log("🔄 [DB] Performing cascade delete - removing related sales");
        
        // Delete sale items first
        const { error: saleItemsError } = await supabase
          .from("sale_items")
          .delete()
          .eq("product_id", parseInt(id));

        if (saleItemsError) {
          console.error("❌ [DB] Error deleting sale items:", saleItemsError);
          return { success: false, error: saleItemsError };
        }

        // Delete sales that only contain this product
        for (const saleId of uniqueSaleIds) {
          const { data: remainingItems } = await supabase
            .from("sale_items")
            .select("id")
            .eq("sale_id", saleId);

          if (!remainingItems || remainingItems.length === 0) {
            const { error: saleDeleteError } = await supabase
              .from("sales")
              .delete()
              .eq("id", saleId);

            if (saleDeleteError) {
              console.error(`❌ [DB] Error deleting sale ${saleId}:`, saleDeleteError);
            } else {
              console.log(`✅ [DB] Deleted orphaned sale ${saleId}`);
            }
          }
        }
      }

      // Delete the product
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", parseInt(id));

      if (deleteError) {
        console.error("❌ [DB] Error deleting product:", deleteError);
        return { success: false, error: deleteError };
      }

      console.log("✅ [DB] Product deleted successfully");
      return { 
        success: true, 
        data: {
          deletedProduct: product,
          affectedSales: uniqueSaleIds.length,
          affectedSaleItems: relatedSales?.length || 0
        }
      };

    } catch (error) {
      console.error("❌ [DB] Error in deleteProduct:", error);
      return { success: false, error };
    }
  },

  // Archive product with related data
  archiveProduct: async (id, options = {}) => {
    try {
      console.log("📦 [DB] Archiving product:", id, "Options:", options);

      // Update product status to archived
      const { data: archivedProduct, error: archiveError } = await supabase
        .from("products")
        .update({ 
          status: 'archived',
          archived_at: new Date().toISOString(),
          archived_reason: options.reason || 'Manual archive'
        })
        .eq("id", parseInt(id))
        .select()
        .single();

      if (archiveError) {
        console.error("❌ [DB] Error archiving product:", archiveError);
        return { success: false, error: archiveError };
      }

      if (options.archiveRelatedSales) {
        console.log("🔄 [DB] Archiving related sales");
        
        // Get related sales
        const { data: relatedSales } = await supabase
          .from("sale_items")
          .select("sale_id")
          .eq("product_id", parseInt(id));

        const uniqueSaleIds = [...new Set(relatedSales?.map(item => item.sale_id) || [])];

        // Archive related sales
        if (uniqueSaleIds.length > 0) {
          const { error: salesArchiveError } = await supabase
            .from("sales")
            .update({ 
              status: 'archived',
              archived_at: new Date().toISOString(),
              archived_reason: `Product ${id} archived`
            })
            .in("id", uniqueSaleIds);

          if (salesArchiveError) {
            console.error("❌ [DB] Error archiving related sales:", salesArchiveError);
          } else {
            console.log(`✅ [DB] Archived ${uniqueSaleIds.length} related sales`);
          }
        }
      }

      console.log("✅ [DB] Product archived successfully");
      return { success: true, data: archivedProduct };

    } catch (error) {
      console.error("❌ [DB] Error in archiveProduct:", error);
      return { success: false, error };
    }
  },

  // Delete sale with related items
  deleteSale: async (id, options = {}) => {
    try {
      console.log("🗑️ [DB] Deleting sale:", id);

      // Get sale data before deletion
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", parseInt(id))
        .single();

      if (saleError) {
        console.error("❌ [DB] Error fetching sale for deletion:", saleError);
        return { success: false, error: saleError };
      }

      // Delete sale items first
      const { error: itemsError } = await supabase
        .from("sale_items")
        .delete()
        .eq("sale_id", parseInt(id));

      if (itemsError) {
        console.error("❌ [DB] Error deleting sale items:", itemsError);
        return { success: false, error: itemsError };
      }

      // Delete the sale
      const { error: deleteError } = await supabase
        .from("sales")
        .delete()
        .eq("id", parseInt(id));

      if (deleteError) {
        console.error("❌ [DB] Error deleting sale:", deleteError);
        return { success: false, error: deleteError };
      }

      console.log("✅ [DB] Sale deleted successfully");
      return { success: true, data: sale };

    } catch (error) {
      console.error("❌ [DB] Error in deleteSale:", error);
      return { success: false, error };
    }
  },

  // Delete customer with cascade options
  deleteCustomer: async (id, options = {}) => {
    try {
      console.log("🗑️ [DB] Deleting customer:", id, "Options:", options);

      // Check for related sales
      const { data: relatedSales } = await supabase
        .from("sales")
        .select("id")
        .eq("customer_id", parseInt(id));

      if (relatedSales && relatedSales.length > 0 && !options.cascadeDelete) {
        console.log(`❌ [DB] Customer has ${relatedSales.length} related sales, cascade required`);
        return { 
          success: false, 
          error: { 
            message: "Customer has related sales. Use cascadeDelete option to delete all related data.",
            relatedSales: relatedSales.length 
          }
        };
      }

      if (options.cascadeDelete && relatedSales?.length > 0) {
        console.log(`🔄 [DB] Cascade deleting ${relatedSales.length} related sales`);
        
        // Delete all related sales and their items
        for (const sale of relatedSales) {
          await dbHelpers.deleteSale(sale.id);
        }
      }

      // Delete the customer
      const { data: deletedCustomer, error: deleteError } = await supabase
        .from("customers")
        .delete()
        .eq("id", parseInt(id))
        .select()
        .single();

      if (deleteError) {
        console.error("❌ [DB] Error deleting customer:", deleteError);
        return { success: false, error: deleteError };
      }

      console.log("✅ [DB] Customer deleted successfully");
      return { 
        success: true, 
        data: {
          deletedCustomer,
          deletedSales: relatedSales?.length || 0
        }
      };

    } catch (error) {
      console.error("❌ [DB] Error in deleteCustomer:", error);
      return { success: false, error };
    }
  },

  // Bulk delete products
  bulkDeleteProducts: async (productIds, options = {}) => {
    try {
      console.log("🗑️ [DB] Bulk deleting products:", productIds, "Options:", options);
      
      const results = [];
      const errors = [];

      for (const id of productIds) {
        try {
          if (options.archive) {
            const result = await dbHelpers.archiveProduct(id, options);
            results.push({ id, action: 'archived', result });
          } else {
            const result = await dbHelpers.deleteProduct(id, options);
            results.push({ id, action: 'deleted', result });
          }
        } catch (error) {
          errors.push({ id, error });
          console.error(`❌ [DB] Error processing product ${id}:`, error);
        }
      }

      const successful = results.filter(r => r.result.success);
      const failed = results.filter(r => !r.result.success).concat(errors);

      console.log(`✅ [DB] Bulk operation completed: ${successful.length} successful, ${failed.length} failed`);
      
      return {
        success: failed.length === 0,
        data: {
          successful,
          failed,
          totalProcessed: productIds.length
        }
      };

    } catch (error) {
      console.error("❌ [DB] Error in bulkDeleteProducts:", error);
      return { success: false, error };
    }
  },

  // Get related data for a product (for validation before delete)
  getProductRelations: async (id) => {
    try {
      console.log("🔍 [DB] Getting product relations for:", id);

      const [saleItemsResult, purchaseItemsResult] = await Promise.all([
        supabase
          .from("sale_items")
          .select("sale_id, quantity, created_at")
          .eq("product_id", parseInt(id)),
        
        supabase
          .from("purchase_items")
          .select("purchase_id, quantity, created_at") 
          .eq("product_id", parseInt(id))
          .limit(1) // Just check if any exist
      ]);

      const saleItems = saleItemsResult.data || [];
      const purchaseItems = purchaseItemsResult.data || [];
      const uniqueSaleIds = [...new Set(saleItems.map(item => item.sale_id))];

      // Get sales data
      let salesData = [];
      if (uniqueSaleIds.length > 0) {
        const { data: sales } = await supabase
          .from("sales")
          .select("id, date, total_amount, customer_id, created_at")
          .in("id", uniqueSaleIds);
        
        salesData = sales || [];
      }

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentSales = salesData.filter(sale => 
        new Date(sale.created_at || sale.date) > thirtyDaysAgo
      );

      const relations = {
        salesCount: salesData.length,
        saleItemsCount: saleItems.length,
        recentSalesCount: recentSales.length,
        purchaseItemsCount: purchaseItems.length,
        hasRelatedData: salesData.length > 0 || purchaseItems.length > 0,
        sales: salesData,
        recentSales
      };

      console.log("✅ [DB] Product relations:", relations);
      return { success: true, data: relations };

    } catch (error) {
      console.error("❌ [DB] Error getting product relations:", error);
      return { success: false, error };
    }
  },

  // Create a new sale
  createSale: async (sale) => {
    try {
      console.log("🔄 [DB] Creating sale with data:", sale);

      // Start a transaction - create the sale first
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            transaction_number: sale.transactionNumber,
            customer_id: sale.customerId,
            date: sale.date,
            subtotal: sale.subtotal,
            tax: sale.tax,
            discount: sale.discount,
            total_amount: sale.totalAmount,
            payment_method: sale.paymentMethod,
            status: sale.status,
            cashier_id: sale.cashierId,
            synced: false,
          },
        ])
        .select();

      if (saleError) {
        console.error("❌ [DB] Error creating sale:", saleError);
        throw new Error(`Failed to create sale: ${saleError.message}`);
      }

      const newSaleId = saleData[0].id;
      console.log("✅ [DB] Sale created with ID:", newSaleId);

      // Insert sale items
      for (const item of sale.items) {
        console.log("🔄 [DB] Creating sale item:", item);

        const { error: itemError } = await supabase.from("sale_items").insert([
          {
            sale_id: newSaleId,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            synced: false,
          },
        ]);

        if (itemError) {
          console.error("❌ [DB] Error creating sale item:", itemError);
          throw new Error(`Failed to create sale item: ${itemError.message}`);
        }
      }

      console.log("✅ [DB] Sale and items created successfully");
      return saleData[0];
    } catch (error) {
      console.error("❌ [DB] createSale failed:", error);
      throw error;
    }
  },

  // Get app settings
  getSettings: async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Error fetching settings:", error);
      return null;
    }

    // Convert snake_case to camelCase for frontend
    return {
      storeName: data.store_name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      currency: data.currency,
      taxRate: data.tax_rate,
      lowStockThreshold: data.low_stock_threshold,
    };
  },

  // Update app settings
  updateSettings: async (settings) => {
    const { data, error } = await supabase
      .from("settings")
      .update({
        store_name: settings.storeName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        currency: settings.currency,
        tax_rate: settings.taxRate,
        low_stock_threshold: settings.lowStockThreshold,
        synced: false,
      })
      .eq("id", 1)
      .select();

    if (error) {
      console.error("Error updating settings:", error);
      return null;
    }

    return data[0];
  },

  // Get all products
  getProducts: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching products:", error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  // Get all customers
  getCustomers: async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("first_name");

    if (error) {
      console.error("Error fetching customers:", error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  // Get all sales
  getSales: async () => {
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        *,
        customers(first_name, last_name),
        sale_items(*, products(name))
      `
      )
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching sales:", error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  // Get sale by ID
  getSaleById: async (id) => {
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        *,
        customers(first_name, last_name, email, phone),
        sale_items(*, products(name, category))
      `
      )
      .eq("id", parseInt(id))
      .single();

    if (error) {
      console.error("Error fetching sale:", error);
      return null;
    }

    return data;
  },

  // Get all categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return { data: null, error };
    }

    return { data, error: null };
  }, // Create a new customer
  createCustomer: async (customer) => {
    try {
      // Build a minimal customer object with only required fields
      const customerData = {
        first_name: customer.firstName || "",
        last_name: customer.lastName || "",
        registration_date: new Date().toISOString(),
        status: "active",
        total_purchases: 0,
        total_spent: 0,
        loyalty_points: 0,
        synced: false,
      };

      // Add optional fields only if they exist
      if (customer.email) customerData.email = customer.email;
      if (customer.phone) customerData.phone = customer.phone;
      if (customer.address) customerData.address = customer.address;
      if (customer.city) customerData.city = customer.city;
      if (customer.state) customerData.state = customer.state;
      if (customer.zipCode) customerData.zip_code = customer.zipCode;
      if (customer.dateOfBirth)
        customerData.date_of_birth = customer.dateOfBirth;

      console.log("🔄 [DB] Creating customer with data:", customerData);

      const { data, error } = await supabase
        .from("customers")
        .insert([customerData])
        .select();

      if (error) {
        console.error("❌ [DB] Error creating customer:", error);
        return null;
      }

      console.log("✅ [DB] Customer created successfully:", data[0]);
      return data[0];
    } catch (error) {
      console.error("❌ [DB] createCustomer exception:", error);
      return null;
    }
  },
  // Update a customer
  updateCustomer: async (id, updates) => {
    // Convert camelCase to snake_case for database
    const dbUpdates = {};
    if (updates.firstName !== undefined)
      dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.dateOfBirth !== undefined)
      dbUpdates.date_of_birth = updates.dateOfBirth;
    if (updates.zipCode !== undefined) dbUpdates.zip_code = updates.zipCode;
    if (updates.registrationDate !== undefined)
      dbUpdates.registration_date = updates.registrationDate;
    if (updates.totalPurchases !== undefined)
      dbUpdates.total_purchases = updates.totalPurchases;
    if (updates.totalSpent !== undefined)
      dbUpdates.total_spent = updates.totalSpent;
    if (updates.loyaltyPoints !== undefined)
      dbUpdates.loyalty_points = updates.loyaltyPoints;
    if (updates.lastPurchase !== undefined)
      dbUpdates.last_purchase = updates.lastPurchase;

    // Add optional fields if they exist in the database (graceful handling)
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.allergies !== undefined)
      dbUpdates.allergies = updates.allergies;
    if (updates.medicalConditions !== undefined)
      dbUpdates.medical_conditions = updates.medicalConditions;
    if (updates.emergencyContact !== undefined)
      dbUpdates.emergency_contact = updates.emergencyContact;
    if (updates.emergencyPhone !== undefined)
      dbUpdates.emergency_phone = updates.emergencyPhone;

    // Add remaining basic fields directly
    Object.keys(updates).forEach((key) => {
      if (
        ![
          "firstName",
          "lastName",
          "dateOfBirth",
          "zipCode",
          "registrationDate",
          "totalPurchases",
          "totalSpent",
          "loyaltyPoints",
          "lastPurchase",
          "emergencyContact",
          "emergencyPhone",
          "medicalConditions",
          "allergies",
          "gender",
        ].includes(key)
      ) {
        dbUpdates[key] = updates[key];
      }
    });

    // Mark as not synced
    dbUpdates.synced = false;

    const { data, error } = await supabase
      .from("customers")
      .update(dbUpdates)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating customer:", error);
      // If it's a column not found error, try again without the optional fields
      if (error.code === "PGRST204") {
        console.log("Retrying customer update without optional fields...");
        const basicUpdates = { ...dbUpdates };
        delete basicUpdates.gender;
        delete basicUpdates.allergies;
        delete basicUpdates.emergency_contact;
        delete basicUpdates.emergency_phone;
        delete basicUpdates.medical_conditions;

        const { data: retryData, error: retryError } = await supabase
          .from("customers")
          .update(basicUpdates)
          .eq("id", id)
          .select();

        if (retryError) {
          console.error("Error updating customer on retry:", retryError);
          return null;
        }

        return retryData[0];
      }
      return null;
    }

    return data[0];
  },

  // Notifications functions
  getNotifications: async (userId = null) => {
    try {
      console.log("🔄 [DB] Fetching notifications...");
      console.log("🔍 [DB] userId parameter:", userId);

      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("🔍 [DB] Base query created");

      // For now, let's not filter by user_id to see if RLS is the issue
      // if (userId) {
      //   query = query.eq("user_id", userId);
      //   console.log("🔍 [DB] Added user_id filter:", userId);
      // }

      console.log("🔍 [DB] Executing query...");
      const { data, error } = await query;
      
      console.log("🔍 [DB] Query result:", { 
        dataLength: data?.length, 
        error: error?.message,
        fullData: data 
      });

      if (error) {
        console.error("❌ [DB] Error fetching notifications:", error);
        console.error("🔍 [DB] Full error object:", JSON.stringify(error, null, 2));

        // Check if the error is about table not existing
        if (
          error.message?.includes('relation "notifications" does not exist')
        ) {
          console.error(
            "🚨 [DB] NOTIFICATIONS TABLE DOES NOT EXIST IN SUPABASE!"
          );
          console.error(
            "📋 [DB] Please create the notifications table in your Supabase database."
          );
        }

        return { data: [], error };
      }

      console.log(`✅ [DB] Fetched ${data?.length || 0} notifications`);
      return { data: data || [], error: null };
    } catch (error) {
      console.error("❌ [DB] Error in getNotifications:", error);
      console.error("🔍 [DB] Caught error details:", {
        message: error.message,
        stack: error.stack
      });
      return { data: [], error };
    }
  }, 
  createNotification: async (notificationData) => {
    try {
      console.log("🔄 [DB] Creating notification:", notificationData);

      // Clean notification data to match database schema exactly
      const cleanNotification = {
        user_id: null, // Set to null for now since we're using mock auth
        type: notificationData.type || "info",
        title: notificationData.title,
        message: notificationData.message,
        priority: notificationData.priority || "medium",
        data: notificationData.data || {},
        source: notificationData.source || "system",
        category: notificationData.category || "general",
        is_read: false,
      };

      console.log("🔍 [DB] Clean notification data:", cleanNotification);

      // Remove any undefined values and fields not in schema
      Object.keys(cleanNotification).forEach((key) => {
        if (cleanNotification[key] === undefined) {
          delete cleanNotification[key];
        }
      });

      console.log("🔍 [DB] Final notification data:", cleanNotification);

      const { data, error } = await supabase
        .from("notifications")
        .insert([cleanNotification])
        .select()
        .single();

      console.log("🔍 [DB] Insert result:", { data, error });

      if (error) {
        console.error("❌ [DB] Error creating notification:", error);
        console.error("🔍 [DB] Full error details:", JSON.stringify(error, null, 2));
        
        // If RLS error, provide helpful message
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          console.error("🚨 [DB] RLS POLICY BLOCKING NOTIFICATION CREATION!");
          console.error("💡 [DB] Solution: Run 'ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;' in Supabase SQL editor");
        }
        
        return { success: false, error, data: null };
      }

      console.log("✅ [DB] Created notification:", data);
      return { success: true, data, error: null };
    } catch (error) {
      console.error("❌ [DB] Error creating notification:", error);
      console.error("🔍 [DB] Caught error details:", {
        message: error.message,
        stack: error.stack
      });
      return { success: false, error, data: null };
    }
  },

  // Create notification with duplicate prevention
  createNotificationSafe: async (notification) => {
    try {
      // Check for duplicate notifications in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", notification.user_id)
        .eq("type", notification.type)
        .eq("title", notification.title)
        .eq("category", notification.category || "general")
        .gte("created_at", oneHourAgo)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(
          "⚠️ [DB] Duplicate notification prevented:",
          notification.title
        );
        return existing[0];
      }

      return await dbHelpers.createNotification(notification);
    } catch (error) {
      console.error("❌ [DB] Error in createNotificationSafe:", error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("id", notificationId)
        .select()
        .single();

      if (error) throw error;
      console.log("✅ [DB] Marked notification as read:", data);
      return data;
    } catch (error) {
      console.error("❌ [DB] Error marking notification as read:", error);
      throw error;
    }
  },

  markAllNotificationsAsRead: async (userId) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("is_read", false)
        .select();

      if (error) throw error;
      console.log("✅ [DB] Marked all notifications as read for user:", userId);
      return data;
    } catch (error) {
      console.error("❌ [DB] Error marking all notifications as read:", error);
      throw error;
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
      console.log("✅ [DB] Deleted notification:", notificationId);
      return true;
    } catch (error) {
      console.error("❌ [DB] Error deleting notification:", error);
      throw error;
    }
  },

  // Clean up old notifications (older than 30 days)
  cleanupOldNotifications: async (userId) => {
    try {
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId)
        .lt("created_at", thirtyDaysAgo);

      if (error) throw error;
      console.log("✅ [DB] Cleaned up old notifications for user:", userId);
      return data;
    } catch (error) {
      console.error("❌ [DB] Error cleaning up notifications:", error);
      throw error;
    }
  },

  // Auto-generate notifications for important events
  createLowStockNotification: async (product) => {
    try {
      const notification = {
        type: "warning",
        title: "Low Stock Alert",
        message: `${product.name} is running low (${product.quantity || 0} left, minimum: ${product.min_stock_level || product.minStockLevel || 0})`,
        priority: "high",
        data: { productId: product.id, currentStock: product.quantity },
        actionUrl: `/inventory/${product.id}`,
      };

      return await dbHelpers.createNotification(notification);
    } catch (error) {
      console.error("Error creating low stock notification:", error);
      return { success: false, error };
    }
  },

  createSaleNotification: async (sale) => {
    try {
      const customerName = sale.customer
        ? `${sale.customer.first_name || sale.customer.firstName || ""} ${sale.customer.last_name || sale.customer.lastName || ""}`.trim()
        : "Walk-in Customer";

      const notification = {
        type: "success",
        title: "Sale Completed",
        message: `Sale #${sale.transaction_number} completed for ${customerName} - ₦${(sale.total_amount || sale.totalAmount || 0).toFixed(2)}`,
        priority: "normal",
        data: {
          saleId: sale.id,
          amount: sale.total_amount || sale.totalAmount,
        },
        actionUrl: `/sales/${sale.id}`,
      };

      return await dbHelpers.createNotification(notification);
    } catch (error) {
      console.error("Error creating sale notification:", error);
      return { success: false, error };
    }
  },

  createExpiryNotification: async (product) => {
    try {
      const expiryDate = new Date(product.expiry_date || product.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - new Date()) / (1000 * 60 * 60 * 24)
      );

      const notification = {
        type: "warning",
        title: "Product Expiry Alert",
        message: `${product.name} expires in ${daysUntilExpiry} days (${expiryDate.toLocaleDateString()})`,
        priority: daysUntilExpiry <= 7 ? "high" : "normal",
        data: { productId: product.id, expiryDate: expiryDate.toISOString() },
        actionUrl: `/inventory/${product.id}`,
      };

      return await dbHelpers.createNotification(notification);
    } catch (error) {
      console.error("Error creating expiry notification:", error);
      return { success: false, error };
    }
  },

  // Check and create automatic notifications
  checkAndCreateAutoNotifications: async () => {
    try {
      console.log("🔄 [Notifications] Checking for automatic notifications...");

      // Check for low stock products
      const { data: lowStockProducts } = await dbHelpers.getLowStockProducts();
      for (const product of lowStockProducts || []) {
        await dbHelpers.createLowStockNotification(product);
      }

      // Check for expiring products (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: products } = await dbHelpers.getProducts();
      const expiringProducts = (products || []).filter((product) => {
        const expiryDate = new Date(product.expiry_date || product.expiryDate);
        return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
      });

      for (const product of expiringProducts) {
        await dbHelpers.createExpiryNotification(product);
      }

      console.log("✅ [Notifications] Auto notifications check completed");
      return { success: true };
    } catch (error) {
      console.error("Error in checkAndCreateAutoNotifications:", error);
      return { success: false, error };
    }
  },

  // Purchases functions
  getPurchases: async () => {
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select(
          `
          *,
          supplier:suppliers(*),
          purchase_items(
            *,
            product:products(*)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching purchases:", error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error("Error in getPurchases:", error);
      return { data: [], error };
    }
  },

  getPurchaseById: async (id) => {
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select(
          `
          *,
          supplier:suppliers(*),
          purchase_items(
            *,
            product:products(*)
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching purchase:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getPurchaseById:", error);
      return null;
    }
  },

  createPurchase: async (purchaseData) => {
    try {
      console.log("Creating purchase:", purchaseData);

      // Insert the purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          purchase_number: purchaseData.purchaseNumber,
          supplier_id: purchaseData.supplierId,
          order_date: purchaseData.orderDate,
          expected_delivery: purchaseData.expectedDelivery,
          actual_delivery: purchaseData.actualDelivery,
          status: purchaseData.status || "pending",
          total_amount: purchaseData.totalAmount,
          notes: purchaseData.notes || "",
        })
        .select()
        .single();

      if (purchaseError) {
        console.error("Error creating purchase:", purchaseError);
        return { success: false, error: purchaseError };
      }

      // Insert purchase items if provided
      if (purchaseData.items && purchaseData.items.length > 0) {
        const purchaseItems = purchaseData.items.map((item) => ({
          purchase_id: purchase.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          total: item.total || item.quantity * item.unitCost,
        }));

        const { error: itemsError } = await supabase
          .from("purchase_items")
          .insert(purchaseItems);

        if (itemsError) {
          console.error("Error creating purchase items:", itemsError);
          // Clean up the purchase if items failed
          await supabase.from("purchases").delete().eq("id", purchase.id);
          return { success: false, error: itemsError };
        }
      }

      return { success: true, data: purchase };
    } catch (error) {
      console.error("Error in createPurchase:", error);
      return { success: false, error };
    }
  },

  updatePurchase: async (id, updates) => {
    try {
      const dbUpdates = {};

      if (updates.purchaseNumber !== undefined)
        dbUpdates.purchase_number = updates.purchaseNumber;
      if (updates.supplierId !== undefined)
        dbUpdates.supplier_id = updates.supplierId;
      if (updates.orderDate !== undefined)
        dbUpdates.order_date = updates.orderDate;
      if (updates.expectedDelivery !== undefined)
        dbUpdates.expected_delivery = updates.expectedDelivery;
      if (updates.actualDelivery !== undefined)
        dbUpdates.actual_delivery = updates.actualDelivery;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.totalAmount !== undefined)
        dbUpdates.total_amount = updates.totalAmount;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from("purchases")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating purchase:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error in updatePurchase:", error);
      return { success: false, error };
    }
  },

  deletePurchase: async (id) => {
    try {
      // First delete purchase items
      await supabase.from("purchase_items").delete().eq("purchase_id", id);

      // Then delete the purchase
      const { error } = await supabase.from("purchases").delete().eq("id", id);

      if (error) {
        console.error("Error deleting purchase:", error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in deletePurchase:", error);
      return { success: false, error };
    }
  },

  // Suppliers functions (needed for purchases)
  getSuppliers: async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching suppliers:", error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error("Error in getSuppliers:", error);
      return { data: [], error };
    }
  },

  createSupplier: async (supplierData) => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          name: supplierData.name,
          contact_person: supplierData.contactPerson,
          email: supplierData.email,
          phone: supplierData.phone,
          address: supplierData.address,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating supplier:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error in createSupplier:", error);
      return { success: false, error };
    }
  },
  // Dashboard Stats
  getDashboardStats: async () => {
    try {
      console.log("🔄 [DB] Fetching dashboard stats...");

      // Fetch all data first to check structure
      const [
        { data: products, error: productsError },
        { data: customers, error: customersError },
        { data: allSales, error: salesError },
      ] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("customers").select("*"),
        supabase.from("sales").select("*"),
      ]);

      if (productsError) {
        console.error("❌ [DB] Products error:", productsError);
        throw productsError;
      }

      if (customersError) {
        console.error("❌ [DB] Customers error:", customersError);
        throw customersError;
      }

      if (salesError) {
        console.error("❌ [DB] Sales error:", salesError);
        throw salesError;
      }

      console.log("📊 [DB] Raw data counts:", {
        products: products?.length || 0,
        customers: customers?.length || 0,
        sales: allSales?.length || 0,
      });

      // Log first sale to see structure
      if (allSales && allSales.length > 0) {
        console.log("🔍 [DB] First sale structure:", allSales[0]);
      }

      // Get today's date range
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      // Filter today's sales - try both date and created_at fields
      const todaysSales = (allSales || []).filter((sale) => {
        const saleDate = new Date(
          sale.date || sale.created_at || sale.sale_date
        );
        return saleDate >= todayStart && saleDate < todayEnd;
      });

      // Get current month sales
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const monthlySales = (allSales || []).filter((sale) => {
        const saleDate = new Date(
          sale.date || sale.created_at || sale.sale_date
        );
        return saleDate >= monthStart && saleDate <= monthEnd;
      });

      // Calculate revenue - try multiple field names
      const calculateRevenue = (sales) => {
        return sales.reduce((sum, sale) => {
          const amount = parseFloat(
            sale.total_amount || sale.total || sale.amount || 0
          );
          return sum + amount;
        }, 0);
      };

      const todaysSalesAmount = calculateRevenue(todaysSales);
      const monthlyRevenue = calculateRevenue(monthlySales);
      const totalRevenue = calculateRevenue(allSales || []);

      // Calculate low stock items
      const lowStockItems = (products || []).filter((product) => {
        const quantity = parseInt(product.quantity || 0);
        const minStock = parseInt(
          product.min_stock_level || product.minStockLevel || 0
        );
        return quantity <= minStock;
      }).length;

      // Calculate average order value
      const totalSales = (allSales || []).length;
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Calculate monthly growth (compare with previous month)
      const previousMonthStart = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );
      const previousMonthEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        0
      );

      const previousMonthSales = (allSales || []).filter((sale) => {
        const saleDate = new Date(
          sale.date || sale.created_at || sale.sale_date
        );
        return saleDate >= previousMonthStart && saleDate <= previousMonthEnd;
      });

      const previousMonthRevenue = calculateRevenue(previousMonthSales);
      const monthlyGrowth =
        previousMonthRevenue > 0
          ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) *
            100
          : 0;

      const stats = {
        // Dashboard page expects these fields
        totalProducts: (products || []).length,
        totalCustomers: (customers || []).length,
        totalSales: totalSales,
        totalRevenue: totalRevenue,
        averageOrderValue: averageOrderValue,
        lowStockCount: lowStockItems,

        // Reports page expects these fields
        todaysSales: todaysSalesAmount,
        todaysTransactions: todaysSales.length,
        monthlyRevenue: monthlyRevenue,
        monthlyGrowth: monthlyGrowth,
        recentSales: todaysSales.length,
        recentRevenue: todaysSalesAmount,
      };

      console.log("✅ [DB] Dashboard stats calculated:", stats);
      return { success: true, data: stats };
    } catch (error) {
      console.error("❌ [DB] Error fetching dashboard stats:", error);
      return {
        success: false,
        error: error.message,
        data: {
          totalProducts: 0,
          totalCustomers: 0,
          totalSales: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          lowStockCount: 0,
          todaysSales: 0,
          todaysTransactions: 0,
          monthlyRevenue: 0,
          monthlyGrowth: 0,
          recentSales: 0,
          recentRevenue: 0,
        },
      };
    }
  },

  // Debug function to check sales data
  debugSalesData: async () => {
    try {
      console.log("🔍 [Debug] Checking sales data...");

      // Get all sales
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (salesError) {
        console.error("❌ [Debug] Error fetching sales:", salesError);
        return { error: salesError };
      }

      console.log("📊 [Debug] Sales data:", sales);
      console.log("📊 [Debug] Number of sales:", sales?.length || 0);

      // Check total sales value
      const totalSales =
        sales?.reduce((sum, sale) => {
          const total = parseFloat(sale.total_amount || sale.total || 0);
          console.log(`💰 [Debug] Sale ${sale.id}: ${total}`);
          return sum + total;
        }, 0) || 0;

      console.log("💰 [Debug] Total sales calculated:", totalSales);

      // Get all sale items
      const { data: saleItems, error: itemsError } = await supabase
        .from("sale_items")
        .select("*")
        .limit(10);

      if (itemsError) {
        console.error("❌ [Debug] Error fetching sale items:", itemsError);
      } else {
        console.log("📦 [Debug] Sale items:", saleItems);
      }

      return {
        success: true,
        data: {
          sales,
          saleItems,
          totalSales,
          salesCount: sales?.length || 0,
        },
      };
    } catch (error) {
      console.error("❌ [Debug] Error in debugSalesData:", error);      return { error };
    }
  },

  // User Management Functions
  getAdminUsers: async () => {
    try {
      console.log("🔄 [DB] Fetching admin users...");
      
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("role", "admin")
        .eq("is_active", true);

      if (error) {
        console.error("❌ [DB] Error fetching admin users:", error);
        return { success: false, error, data: [] };
      }

      console.log(`✅ [DB] Found ${data?.length || 0} admin users`);
      return { success: true, data: data || [], error: null };
    } catch (error) {
      console.error("❌ [DB] Error in getAdminUsers:", error);
      return { success: false, error, data: [] };
    }
  },

  createAdminUser: async (userData) => {
    try {
      console.log("🔄 [DB] Creating admin user:", userData.email);

      const { data, error } = await supabase
        .from("admin_users")
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error("❌ [DB] Error creating admin user:", error);
        return { success: false, error, data: null };
      }

      console.log("✅ [DB] Admin user created:", data);
      return { success: true, data, error: null };
    } catch (error) {
      console.error("❌ [DB] Error in createAdminUser:", error);
      return { success: false, error, data: null };
    }
  },

  getUserByEmail: async (email) => {
    try {
      console.log("🔄 [DB] Fetching user by email:", email);

      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return { success: true, data: null, error: null };
        }
        console.error("❌ [DB] Error fetching user:", error);
        return { success: false, error, data: null };
      }

      console.log("✅ [DB] User found:", data?.email);
      return { success: true, data, error: null };
    } catch (error) {
      console.error("❌ [DB] Error in getUserByEmail:", error);
      return { success: false, error, data: null };
    }
  },

  // Delete Functions with Cascade Support

  // Delete product with cascade options
  deleteProduct: async (id, options = {}) => {
    try {
      console.log("🗑️ [DB] Deleting product:", id, "Options:", options);

      // Check if product exists and get related data
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", parseInt(id))
        .single();

      if (productError) {
        console.error("❌ [DB] Error fetching product for deletion:", productError);
        return { success: false, error: productError };
      }

      // Get related sales data
      const { data: relatedSales, error: salesError } = await supabase
        .from("sale_items")
        .select("sale_id, quantity, product_id")
        .eq("product_id", parseInt(id));

      if (salesError) {
        console.error("❌ [DB] Error fetching related sales:", salesError);
      }

      const uniqueSaleIds = [...new Set(relatedSales?.map(item => item.sale_id) || [])];
      console.log(`📊 [DB] Product has ${relatedSales?.length || 0} sale items in ${uniqueSaleIds.length} sales`);

      if (options.cascadeDelete && relatedSales?.length > 0) {
        console.log("🔄 [DB] Performing cascade delete - removing related sales");
        
        // Delete sale items first
        const { error: saleItemsError } = await supabase
          .from("sale_items")
          .delete()
          .eq("product_id", parseInt(id));

        if (saleItemsError) {
          console.error("❌ [DB] Error deleting sale items:", saleItemsError);
          return { success: false, error: saleItemsError };
        }

        // Delete sales that only contain this product
        for (const saleId of uniqueSaleIds) {
          const { data: remainingItems } = await supabase
            .from("sale_items")
            .select("id")
            .eq("sale_id", saleId);

          if (!remainingItems || remainingItems.length === 0) {
            const { error: saleDeleteError } = await supabase
              .from("sales")
              .delete()
              .eq("id", saleId);

            if (saleDeleteError) {
              console.error(`❌ [DB] Error deleting sale ${saleId}:`, saleDeleteError);
            } else {
              console.log(`✅ [DB] Deleted orphaned sale ${saleId}`);
            }
          }
        }
      }

      // Delete the product
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", parseInt(id));

      if (deleteError) {
        console.error("❌ [DB] Error deleting product:", deleteError);
        return { success: false, error: deleteError };
      }

      console.log("✅ [DB] Product deleted successfully");
      return { 
        success: true, 
        data: {
          deletedProduct: product,
          affectedSales: uniqueSaleIds.length,
          affectedSaleItems: relatedSales?.length || 0
        }
      };

    } catch (error) {
      console.error("❌ [DB] Error in deleteProduct:", error);
      return { success: false, error };
    }
  },

  // Archive product with related data
  archiveProduct: async (id, options = {}) => {
    try {
      console.log("📦 [DB] Archiving product:", id, "Options:", options);

      // Update product status to archived
      const { data: archivedProduct, error: archiveError } = await supabase
        .from("products")
        .update({ 
          status: 'archived',
          archived_at: new Date().toISOString(),
          archived_reason: options.reason || 'Manual archive'
        })
        .eq("id", parseInt(id))
        .select()
        .single();

      if (archiveError) {
        console.error("❌ [DB] Error archiving product:", archiveError);
        return { success: false, error: archiveError };
      }

      if (options.archiveRelatedSales) {
        console.log("🔄 [DB] Archiving related sales");
        
        // Get related sales
        const { data: relatedSales } = await supabase
          .from("sale_items")
          .select("sale_id")
          .eq("product_id", parseInt(id));

        const uniqueSaleIds = [...new Set(relatedSales?.map(item => item.sale_id) || [])];

        // Archive related sales
        if (uniqueSaleIds.length > 0) {
          const { error: salesArchiveError } = await supabase
            .from("sales")
            .update({ 
              status: 'archived',
              archived_at: new Date().toISOString(),
              archived_reason: `Product ${id} archived`
            })
            .in("id", uniqueSaleIds);

          if (salesArchiveError) {
            console.error("❌ [DB] Error archiving related sales:", salesArchiveError);
          } else {
            console.log(`✅ [DB] Archived ${uniqueSaleIds.length} related sales`);
          }
        }
      }

      console.log("✅ [DB] Product archived successfully");
      return { success: true, data: archivedProduct };

    } catch (error) {
      console.error("❌ [DB] Error in archiveProduct:", error);
      return { success: false, error };
    }
  },

  // Delete sale with related items
  deleteSale: async (id, options = {}) => {
    try {
      console.log("🗑️ [DB] Deleting sale:", id);

      // Get sale data before deletion
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", parseInt(id))
        .single();

      if (saleError) {
        console.error("❌ [DB] Error fetching sale for deletion:", saleError);
        return { success: false, error: saleError };
      }

      // Delete sale items first
      const { error: itemsError } = await supabase
        .from("sale_items")
        .delete()
        .eq("sale_id", parseInt(id));

      if (itemsError) {
        console.error("❌ [DB] Error deleting sale items:", itemsError);
        return { success: false, error: itemsError };
      }

      // Delete the sale
      const { error: deleteError } = await supabase
        .from("sales")
        .delete()
        .eq("id", parseInt(id));

      if (deleteError) {
        console.error("❌ [DB] Error deleting sale:", deleteError);
        return { success: false, error: deleteError };
      }

      console.log("✅ [DB] Sale deleted successfully");
      return { success: true, data: sale };

    } catch (error) {
      console.error("❌ [DB] Error in deleteSale:", error);
      return { success: false, error };
    }
  },

  // Delete customer with cascade options
  deleteCustomer: async (id, options = {}) => {
    try {
      console.log("🗑️ [DB] Deleting customer:", id, "Options:", options);

      // Check for related sales
      const { data: relatedSales } = await supabase
        .from("sales")
        .select("id")
        .eq("customer_id", parseInt(id));

      if (relatedSales && relatedSales.length > 0 && !options.cascadeDelete) {
        console.log(`❌ [DB] Customer has ${relatedSales.length} related sales, cascade required`);
        return { 
          success: false, 
          error: { 
            message: "Customer has related sales. Use cascadeDelete option to delete all related data.",
            relatedSales: relatedSales.length 
          }
        };
      }

      if (options.cascadeDelete && relatedSales?.length > 0) {
        console.log(`🔄 [DB] Cascade deleting ${relatedSales.length} related sales`);
        
        // Delete all related sales and their items
        for (const sale of relatedSales) {
          await dbHelpers.deleteSale(sale.id);
        }
      }

      // Delete the customer
      const { data: deletedCustomer, error: deleteError } = await supabase
        .from("customers")
        .delete()
        .eq("id", parseInt(id))
        .select()
        .single();

      if (deleteError) {
        console.error("❌ [DB] Error deleting customer:", deleteError);
        return { success: false, error: deleteError };
      }

      console.log("✅ [DB] Customer deleted successfully");
      return { 
        success: true, 
        data: {
          deletedCustomer,
          deletedSales: relatedSales?.length || 0
        }
      };

    } catch (error) {
      console.error("❌ [DB] Error in deleteCustomer:", error);
      return { success: false, error };
    }
  },

  // Bulk delete products
  bulkDeleteProducts: async (productIds, options = {}) => {
    try {
      console.log("🗑️ [DB] Bulk deleting products:", productIds, "Options:", options);
      
      const results = [];
      const errors = [];

      for (const id of productIds) {
        try {
          if (options.archive) {
            const result = await dbHelpers.archiveProduct(id, options);
            results.push({ id, action: 'archived', result });
          } else {
            const result = await dbHelpers.deleteProduct(id, options);
            results.push({ id, action: 'deleted', result });
          }
        } catch (error) {
          errors.push({ id, error });
          console.error(`❌ [DB] Error processing product ${id}:`, error);
        }
      }

      const successful = results.filter(r => r.result.success);
      const failed = results.filter(r => !r.result.success).concat(errors);

      console.log(`✅ [DB] Bulk operation completed: ${successful.length} successful, ${failed.length} failed`);
      
      return {
        success: failed.length === 0,
        data: {
          successful,
          failed,
          totalProcessed: productIds.length
        }
      };

    } catch (error) {
      console.error("❌ [DB] Error in bulkDeleteProducts:", error);
      return { success: false, error };
    }
  },

  // Get related data for a product (for validation before delete)
  getProductRelations: async (id) => {
    try {
      console.log("🔍 [DB] Getting product relations for:", id);

      const [saleItemsResult, purchaseItemsResult] = await Promise.all([
        supabase
          .from("sale_items")
          .select("sale_id, quantity, created_at")
          .eq("product_id", parseInt(id)),
        
        supabase
          .from("purchase_items")
          .select("purchase_id, quantity, created_at") 
          .eq("product_id", parseInt(id))
          .limit(1) // Just check if any exist
      ]);

      const saleItems = saleItemsResult.data || [];
      const purchaseItems = purchaseItemsResult.data || [];
      const uniqueSaleIds = [...new Set(saleItems.map(item => item.sale_id))];

      // Get sales data
      let salesData = [];
      if (uniqueSaleIds.length > 0) {
        const { data: sales } = await supabase
          .from("sales")
          .select("id, date, total_amount, customer_id, created_at")
          .in("id", uniqueSaleIds);
        
        salesData = sales || [];
      }

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentSales = salesData.filter(sale => 
        new Date(sale.created_at || sale.date) > thirtyDaysAgo
      );

      const relations = {
        salesCount: salesData.length,
        saleItemsCount: saleItems.length,
        recentSalesCount: recentSales.length,
        purchaseItemsCount: purchaseItems.length,
        hasRelatedData: salesData.length > 0 || purchaseItems.length > 0,
        sales: salesData,
        recentSales
      };

      console.log("✅ [DB] Product relations:", relations);
      return { success: true, data: relations };

    } catch (error) {
      console.error("❌ [DB] Error getting product relations:", error);
      return { success: false, error };
    }
  },

  // Category management functions
  getCategories: async () => {
    try {
      console.log("📂 [DB] Fetching all categories");
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (error) {
        console.error("❌ [DB] Error fetching categories:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Categories fetched:", data?.length || 0);
      return { success: true, data: data || [] };

    } catch (error) {
      console.error("❌ [DB] Error in getCategories:", error);
      return { success: false, error };
    }
  },

  getCategoryById: async (id) => {
    try {
      console.log("📂 [DB] Fetching category by ID:", id);
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ [DB] Error fetching category:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Category fetched:", data?.name);
      return { success: true, data };

    } catch (error) {
      console.error("❌ [DB] Error in getCategoryById:", error);
      return { success: false, error };
    }
  },

  createCategory: async (category) => {
    try {
      console.log("📂 [DB] Creating category:", category);
      
      const categoryData = {
        name: category.name,
        description: category.description || null,
        status: category.status || "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("categories")
        .insert(categoryData)
        .select()
        .single();

      if (error) {
        console.error("❌ [DB] Error creating category:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Category created:", data?.name);
      return { success: true, data };

    } catch (error) {
      console.error("❌ [DB] Error in createCategory:", error);
      return { success: false, error };
    }
  },

  updateCategory: async (id, updates) => {
    try {
      console.log("📂 [DB] Updating category:", id, updates);
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("categories")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ [DB] Error updating category:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Category updated:", data?.name);
      return { success: true, data };

    } catch (error) {
      console.error("❌ [DB] Error in updateCategory:", error);
      return { success: false, error };
    }
  },

  deleteCategory: async (id) => {
    try {
      console.log("📂 [DB] Deleting category:", id);
      
      // Soft delete by setting status to 'inactive'
      const { data, error } = await supabase
        .from("categories")
        .update({ 
          status: "inactive",
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ [DB] Error deleting category:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Category deleted (soft):", data?.name);
      return { success: true, data };

    } catch (error) {
      console.error("❌ [DB] Error in deleteCategory:", error);
      return { success: false, error };
    }
  },

  // Purchase management functions
  getPurchases: async () => {
    try {
      console.log("📦 [DB] Fetching all purchases");
      
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          *,
          purchase_items (
            *,
            product:products (*)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ [DB] Error fetching purchases:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Purchases fetched:", data?.length || 0);
      return { success: true, data: data || [] };

    } catch (error) {
      console.error("❌ [DB] Error in getPurchases:", error);
      return { success: false, error };
    }
  },

  getPurchaseById: async (id) => {
    try {
      console.log("📦 [DB] Fetching purchase by ID:", id);
      
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          *,
          purchase_items (
            *,
            product:products (*)
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ [DB] Error fetching purchase:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Purchase fetched:", data?.purchase_number);
      return { success: true, data };

    } catch (error) {
      console.error("❌ [DB] Error in getPurchaseById:", error);
      return { success: false, error };
    }
  },

  createPurchase: async (purchase) => {
    try {
      console.log("📦 [DB] Creating purchase:", purchase);
      
      const purchaseData = {
        purchase_number: purchase.purchase_number || purchase.purchaseNumber,
        supplier_name: purchase.supplier_name || purchase.supplierName,
        supplier_contact: purchase.supplier_contact,
        supplier_email: purchase.supplier_email,
        supplier_phone: purchase.supplier_phone,
        order_date: purchase.order_date || purchase.orderDate,
        delivery_date: purchase.delivery_date || purchase.deliveryDate,
        expected_delivery: purchase.expected_delivery || purchase.expectedDelivery,
        actual_delivery: purchase.actual_delivery || purchase.actualDelivery,
        status: purchase.status || "pending",
        total_amount: purchase.total_amount || purchase.totalAmount,
        total_items: purchase.total_items,
        notes: purchase.notes,
        type: purchase.type || "purchase",
        is_stock_receipt: purchase.is_stock_receipt || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: purchaseResult, error: purchaseError } = await supabase
        .from("purchases")
        .insert(purchaseData)
        .select()
        .single();

      if (purchaseError) {
        console.error("❌ [DB] Error creating purchase:", purchaseError);
        return { success: false, error: purchaseError };
      }

      // Create purchase items if provided
      if (purchase.purchase_items || purchase.items) {
        const items = purchase.purchase_items || purchase.items;
        const purchaseItems = items.map(item => ({
          purchase_id: purchaseResult.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity_ordered: item.quantity_ordered || item.quantityReceived,
          quantity_received: item.quantity_received || item.quantityReceived,
          cost_price: item.cost_price,
          selling_price: item.selling_price,
          line_total: item.line_total,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          manufacturer: item.manufacturer,
          volume: item.volume,
          notes: item.notes,
          created_at: new Date().toISOString()
        }));

        const { error: itemsError } = await supabase
          .from("purchase_items")
          .insert(purchaseItems);

        if (itemsError) {
          console.error("❌ [DB] Error creating purchase items:", itemsError);
          // Continue anyway, don't fail the whole purchase
        }
      }

      console.log("✅ [DB] Purchase created:", purchaseResult?.purchase_number);
      return { success: true, data: purchaseResult, id: purchaseResult.id };

    } catch (error) {
      console.error("❌ [DB] Error in createPurchase:", error);
      return { success: false, error };
    }
  },

  updatePurchase: async (id, updates) => {
    try {
      console.log("📦 [DB] Updating purchase:", id, updates);
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("purchases")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ [DB] Error updating purchase:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Purchase updated:", data?.purchase_number);
      return { success: true, data };

    } catch (error) {
      console.error("❌ [DB] Error in updatePurchase:", error);
      return { success: false, error };
    }
  },

  deletePurchase: async (id) => {
    try {
      console.log("📦 [DB] Deleting purchase:", id);
      
      // Delete purchase items first
      await supabase
        .from("purchase_items")
        .delete()
        .eq("purchase_id", id);

      // Delete purchase
      const { data, error } = await supabase
        .from("purchases")
        .delete()
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ [DB] Error deleting purchase:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Purchase deleted:", data?.purchase_number);
      return { success: true, data };

    } catch (error) {
      console.error("❌ [DB] Error in deletePurchase:", error);
      return { success: false, error };
    }
  },

  // Supplier management functions
  getSuppliers: async () => {
    try {
      console.log("🏢 [DB] Fetching all suppliers");
      
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      if (error) {
        console.error("❌ [DB] Error fetching suppliers:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Suppliers fetched:", data?.length || 0);
      return { success: true, data: data || [] };

    } catch (error) {
      console.error("❌ [DB] Error in getSuppliers:", error);
      return { success: false, error };
    }
  },

  getSupplierById: async (id) => {
    try {
      console.log("🏢 [DB] Fetching supplier by ID:", id);
      
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ [DB] Error fetching supplier:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Supplier fetched:", data?.name);
      return { success: true, data };

    } catch (error) {
      console.error("❌ [DB] Error in getSupplierById:", error);
      return { success: false, error };
    }
  },

  createSupplier: async (supplier) => {
    try {
      console.log("🏢 [DB] Creating supplier:", supplier);
      
      const supplierData = {
        name: supplier.name,
        contact: supplier.contact,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("suppliers")
        .insert(supplierData)
        .select()
        .single();

      if (error) {
        console.error("❌ [DB] Error creating supplier:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Supplier created:", data?.name);
      return { success: true, data };

    } catch (error) {
      console.error("❌ [DB] Error in createSupplier:", error);
      return { success: false, error };
    }
  },

  updateSupplier: async (id, updates) => {
    try {
      console.log("🏢 [DB] Updating supplier:", id, updates);
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("suppliers")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ [DB] Error updating supplier:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Supplier updated:", data?.name);
      return { success: true, data };

    } catch (error) {
      console.error("❌ [DB] Error in updateSupplier:", error);
      return { success: false, error };
    }
  },

  deleteSupplier: async (id) => {
    try {
      console.log("🏢 [DB] Deleting supplier:", id);
      
      const { data, error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ [DB] Error deleting supplier:", error);
        return { success: false, error };
      }

      console.log("✅ [DB] Supplier deleted:", data?.name);
      return { success: true, data };

    } catch (error) {
      console.error("❌ [DB] Error in deleteSupplier:", error);
      return { success: false, error };
    }
  },
};

export default dbHelpers;

// Export supabase client for external use
export { supabase };
