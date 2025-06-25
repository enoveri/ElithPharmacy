// Export utility functions for data export

export const exportToCSV = (data, filename = "export.csv") => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values that contain commas, quotes, or newlines
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"') || value.includes("\n"))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || "";
        })
        .join(",")
    ),
  ].join("\n");

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data, filename = "export.xlsx") => {
  // For now, we'll export as CSV with .xlsx extension
  // In a real implementation, you'd use a library like SheetJS
  exportToCSV(data, filename.replace(".xlsx", ".csv"));
};

export const exportToPDF = async (
  data,
  filename = "export.pdf",
  title = "Data Export"
) => {
  // Create a simple HTML table for PDF generation
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        h1 { color: #333; margin-bottom: 20px; }
        .export-date { color: #666; font-size: 12px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="export-date">Exported on: ${new Date().toLocaleString()}</div>
      <table>
        <thead>
          <tr>
            ${Object.keys(data[0] || {})
              .map((key) => `<th>${key}</th>`)
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) => `
            <tr>
              ${Object.values(row)
                .map((value) => `<td>${value || ""}</td>`)
                .join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Open in new window for printing
  const newWindow = window.open("", "_blank");
  newWindow.document.write(htmlContent);
  newWindow.document.close();

  // Trigger print dialog
  setTimeout(() => {
    newWindow.print();
  }, 500);
};

export const formatCustomerDataForExport = (customers) => {
  return customers.map((customer) => ({
    "Customer ID": customer.id,
    "First Name": customer.firstName,
    "Last Name": customer.lastName,
    Email: customer.email,
    Phone: customer.phone,
    Address: customer.address,
    City: customer.city,
    State: customer.state,
    Status: customer.status,
    "Total Purchases": customer.totalPurchases,
    "Total Spent": `UGX ${(customer.totalSpent || 0).toLocaleString()}`,
    "Loyalty Points": customer.loyaltyPoints,
    "Registration Date": new Date(
      customer.registrationDate
    ).toLocaleDateString(),
    "Last Purchase": new Date(customer.lastPurchase).toLocaleDateString(),
  }));
};

export const formatProductDataForExport = (products) => {
  return products.map((product) => ({
    "Product ID": product.id,
    "Product Name": product.name,
    Category: product.category,
    Price: `UGX ${(product.price || 0).toFixed(2)}`,
    "Cost Price": `UGX ${(product.costPrice || 0).toFixed(2)}`,
    Quantity: product.quantity,
    "Min Stock Level": product.minStockLevel,
    Status: product.status,
    Manufacturer: product.manufacturer,
    "Batch Number": product.batchNumber,
    "Expiry Date": new Date(product.expiryDate).toLocaleDateString(),
  }));
};
