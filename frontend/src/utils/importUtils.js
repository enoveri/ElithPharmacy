// Import utility functions for data import

export const parseCSV = (csvText) => {
  const lines = csvText.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error(
      "CSV file must contain at least a header row and one data row"
    );
  }

  const headers = lines[0]
    .split(",")
    .map((header) => header.trim().replace(/"/g, ""));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }

  return data;
};

const parseCSVLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

export const validateCustomerData = (data) => {
  const errors = [];
  const requiredFields = ["First Name", "Last Name", "Email", "Phone"];

  data.forEach((row, index) => {
    const rowErrors = [];

    requiredFields.forEach((field) => {
      if (!row[field] || row[field].trim() === "") {
        rowErrors.push(`${field} is required`);
      }
    });

    // Email validation
    if (row.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.Email)) {
      rowErrors.push("Invalid email format");
    }

    // Phone validation
    if (row.Phone && !/^[\+]?[\d\s\-\(\)]+$/.test(row.Phone)) {
      rowErrors.push("Invalid phone format");
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: index + 2, // +2 because index is 0-based and we skip header
        errors: rowErrors,
      });
    }
  });

  return errors;
};

export const validateProductData = (data) => {
  const errors = [];
  const requiredFields = ["Product Name", "Category", "Price", "Quantity"];

  data.forEach((row, index) => {
    const rowErrors = [];

    requiredFields.forEach((field) => {
      if (!row[field] || row[field].trim() === "") {
        rowErrors.push(`${field} is required`);
      }
    });

    // Price validation
    if (row.Price && isNaN(parseFloat(row.Price.replace(/[UGX,]/g, "")))) {
      rowErrors.push("Invalid price format");
    }

    // Quantity validation
    if (
      row.Quantity &&
      (isNaN(parseInt(row.Quantity)) || parseInt(row.Quantity) < 0)
    ) {
      rowErrors.push("Invalid quantity - must be a positive number");
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: index + 2,
        errors: rowErrors,
      });
    }
  });

  return errors;
};

export const transformImportedCustomerData = (data) => {
  return data.map((row) => ({
    firstName: row["First Name"],
    lastName: row["Last Name"],
    email: row["Email"],
    phone: row["Phone"],
    address: row["Address"] || "",
    city: row["City"] || "",
    state: row["State"] || "",
    zipCode: row["ZIP Code"] || "",
    status: row["Status"] || "active",
    dateOfBirth: row["Date of Birth"] || "",
    gender: row["Gender"] || "",
  }));
};

export const transformImportedProductData = (data) => {
  return data.map((row) => ({
    name: row["Product Name"],
    category: row["Category"],
    price: parseFloat(row["Price"].replace(/[UGX,]/g, "")),
    costPrice: parseFloat(row["Cost Price"]?.replace(/[UGX,]/g, "") || 0),
    quantity: parseInt(row["Quantity"]),
    minStockLevel: parseInt(row["Min Stock Level"] || 10),
    status: row["Status"] || "active",
    manufacturer: row["Manufacturer"] || "",
    batchNumber: row["Batch Number"] || "",
    barcode: row["Barcode"] || "",
    description: row["Description"] || "",
  }));
};
