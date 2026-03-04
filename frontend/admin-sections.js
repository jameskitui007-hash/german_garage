// ===================================
// CUSTOMER MANAGEMENT
// ===================================

function getCustomersHTML() {
  return `
    <div class="customers-content">
      <div class="content-header">
        <div>
          <h2><i class="fas fa-users"></i> Customer Management</h2>
          <p>View customer information, order history, and communication</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" onclick="window.open(API_BASE + '/api/customers/export/csv')">
            <i class="fas fa-download"></i> Export CSV
          </button>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="customersSearch" placeholder="Search customers..."
                 onkeyup="searchCustomers()">
        </div>
        <div class="filter-controls">
          <select id="customerTypeFilter" onchange="filterCustomers()">
            <option value="">All Customers</option>
            <option value="vip">VIP</option>
            <option value="regular">Regular</option>
          </select>
        </div>
      </div>

      <div class="admin-table-container">
        <table class="admin-table" id="customersTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Total Orders</th>
              <th>Total Spent</th>
              <th>Last Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="customersTableBody">
            <tr><td colspan="8" style="text-align:center">
              <i class="fas fa-spinner fa-spin"></i> Loading...
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

async function loadCustomersTable(params = "") {
  try {
    const res   = await api.getCustomers(params);
    const tbody = document.getElementById("customersTableBody");

    // API may return { customers: [...], total: N } or just an array
    const customers = Array.isArray(res) ? res : (res.customers || []);

    if (!customers.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">No customers found</td></tr>`;
      return;
    }

    tbody.innerHTML = customers.map(c => `
      <tr>
        <td><code>${c.id}</code></td>
        <td>
          <strong>${c.name}</strong>
          ${c.is_vip ? '<span class="vip-badge">VIP</span>' : ""}
        </td>
        <td>${c.phone || "N/A"}</td>
        <td>${c.email || "N/A"}</td>
        <td>${c.total_orders || 0}</td>
        <td>KES ${(c.total_spent || 0).toLocaleString()}</td>
        <td>${c.last_order ? formatDate(c.last_order) : "Never"}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" onclick="messageCustomer('${c.phone}')"
                    style="background:#25D366;color:white;" title="WhatsApp">
              <i class="fab fa-whatsapp"></i>
            </button>
            <button class="btn-icon" onclick="emailCustomer('${c.email}')"
                    style="background:#ea4335;color:white;" title="Email">
              <i class="fas fa-envelope"></i>
            </button>
          </div>
        </td>
      </tr>`).join("");
  } catch (err) {
    showNotification("Failed to load customers", "error");
  }
}

async function searchCustomers() {
  const search = document.getElementById("customersSearch").value;
  await loadCustomersTable(`?search=${encodeURIComponent(search)}`);
}

async function filterCustomers() {
  const type = document.getElementById("customerTypeFilter").value;
  await loadCustomersTable(type ? `?is_vip=${type === "vip"}` : "");
}

function messageCustomer(phone) {
  if (phone) window.open(`https://wa.me/${phone.replace("+", "")}`, "_blank");
}

function emailCustomer(email) {
  if (email) window.open(`mailto:${email}`, "_blank");
}

// ===================================
// REPORTS SECTION
// ===================================

function getReportsHTML() {
  return `
    <div class="reports-content">
      <div class="content-header">
        <div>
          <h2><i class="fas fa-chart-bar"></i> Sales Reports</h2>
          <p>Analyze sales performance, inventory trends, and business metrics</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" id="exportReportBtn" onclick="exportReportCSV()">
            <i class="fas fa-download"></i> Export Data
          </button>
        </div>
      </div>

      <div class="reports-filters">
        <div class="filter-group">
          <label>Date Range:</label>
          <div class="date-range">
            <input type="date" id="reportStartDate" onchange="loadReports()">
            <span>to</span>
            <input type="date" id="reportEndDate" onchange="loadReports()">
          </div>
        </div>
        <div class="filter-group">
          <label>Brand:</label>
          <select id="reportBrand" onchange="loadReports()">
            <option value="">All Brands</option>
            <option value="mercedes">Mercedes-Benz</option>
            <option value="bmw">BMW</option>
          </select>
        </div>
      </div>

      <div class="reports-dashboard">
        <div class="report-summary">
          <div class="summary-card">
            <h4><i class="fas fa-money-bill-wave"></i> Total Revenue</h4>
            <div class="summary-value" id="reportRevenue">KES 0</div>
          </div>
          <div class="summary-card">
            <h4><i class="fas fa-shopping-cart"></i> Total Orders</h4>
            <div class="summary-value" id="reportOrders">0</div>
          </div>
          <div class="summary-card">
            <h4><i class="fas fa-box"></i> Items Sold</h4>
            <div class="summary-value" id="reportItems">0</div>
          </div>
          <div class="summary-card">
            <h4><i class="fas fa-chart-line"></i> Avg Order Value</h4>
            <div class="summary-value" id="reportAOV">KES 0</div>
          </div>
        </div>

        <div class="report-table">
          <h4><i class="fas fa-table"></i> Order Details</h4>
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="reportTableBody">
                <tr><td colspan="6" style="text-align:center">
                  <i class="fas fa-spinner fa-spin"></i> Loading...
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
}

async function loadReports() {
  const startDate = document.getElementById("reportStartDate")?.value || "";
  const endDate   = document.getElementById("reportEndDate")?.value   || "";
  const brand     = document.getElementById("reportBrand")?.value     || "";

  let params = "?";
  if (startDate) params += `start_date=${startDate}&`;
  if (endDate)   params += `end_date=${endDate}&`;
  if (brand)     params += `brand=${brand}&`;

  try {
    const data  = await api.getReport(params);
    const tbody = document.getElementById("reportTableBody");

    // Update summary cards
    document.getElementById("reportRevenue").textContent = `KES ${(data.total_revenue || 0).toLocaleString()}`;
    document.getElementById("reportOrders").textContent  = data.total_orders || 0;
    document.getElementById("reportItems").textContent   = data.total_items  || 0;
    document.getElementById("reportAOV").textContent     = `KES ${(data.average_order_value || 0).toLocaleString()}`;

    // Populate table
    const orders = data.orders || [];
    tbody.innerHTML = orders.length === 0
      ? `<tr><td colspan="6" style="text-align:center">No data for selected filters</td></tr>`
      : orders.map(o => `
          <tr>
            <td><strong>${o.order_number}</strong></td>
            <td>${o.customer_name || "Guest"}</td>
            <td>${formatDate(o.date)}</td>
            <td>${o.item_count || 0}</td>
            <td>KES ${(o.total || 0).toLocaleString()}</td>
            <td><span class="status-badge status-${o.status}">${o.status}</span></td>
          </tr>`).join("");
  } catch (err) {
    showNotification("Failed to load report", "error");
  }
}

function exportReportCSV() {
  const startDate = document.getElementById("reportStartDate")?.value || "";
  const endDate   = document.getElementById("reportEndDate")?.value   || "";
  const brand     = document.getElementById("reportBrand")?.value     || "";

  let url = `${API_BASE}/api/reports/export/csv?`;
  if (startDate) url += `start_date=${startDate}&`;
  if (endDate)   url += `end_date=${endDate}&`;
  if (brand)     url += `brand=${brand}`;

  window.open(url);
}

// ===================================
// SUPPLIERS SECTION
// ===================================

function getSuppliersHTML() {
  return `
    <div class="suppliers-content">
      <div class="content-header">
        <div>
          <h2><i class="fas fa-truck"></i> Supplier Management</h2>
          <p>Manage supplier information, orders, and communications</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" onclick="showAddSupplierModal()">
            <i class="fas fa-plus"></i> Add Supplier
          </button>
        </div>
      </div>

      <div class="admin-table-container">
        <table class="admin-table" id="suppliersTable">
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Products Supplied</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="suppliersTableBody">
            <tr><td colspan="7" style="text-align:center">
              <i class="fas fa-spinner fa-spin"></i> Loading...
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

async function loadSuppliersTable() {
  try {
    const res       = await api.getSuppliers();
    const suppliers = Array.isArray(res) ? res : (res.suppliers || []);
    const tbody     = document.getElementById("suppliersTableBody");

    if (!suppliers.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center">No suppliers found</td></tr>`;
      return;
    }

    tbody.innerHTML = suppliers.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td>${s.contact || "N/A"}</td>
        <td>${s.phone  || "N/A"}</td>
        <td>${s.email  || "N/A"}</td>
        <td>${s.products_supplied || "Various"}</td>
        <td>
          <span class="status-badge ${s.status === "active" ? "status-good" : "status-pending"}">
            ${s.status}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" onclick="callSupplier('${s.phone}')"
                    style="background:#4caf50;color:white;" title="Call">
              <i class="fas fa-phone"></i>
            </button>
            <button class="btn-icon" onclick="emailSupplier('${s.email}')"
                    style="background:#ea4335;color:white;" title="Email">
              <i class="fas fa-envelope"></i>
            </button>
            <button class="btn-icon btn-edit" onclick="editSupplier(${s.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-delete" onclick="deleteSupplier(${s.id})" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`).join("");
  } catch (err) {
    showNotification("Failed to load suppliers", "error");
  }
}

function showAddSupplierModal() {
  document.getElementById("modal-container").innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-plus"></i> Add Supplier</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="addSupplierForm" onsubmit="saveNewSupplier(event)">
            <div class="form-group">
              <label>Supplier Name *</label>
              <input type="text" class="form-control" name="name" required placeholder="Mercedes-Benz Kenya">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Contact Person</label>
                <input type="text" class="form-control" name="contact" placeholder="John Mwangi">
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" class="form-control" name="phone" placeholder="+254712345678">
              </div>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-control" name="email" placeholder="parts@supplier.co.ke">
            </div>
            <div class="form-group">
              <label>Products Supplied</label>
              <input type="text" class="form-control" name="products_supplied"
                     placeholder="Oil Filters, Brake Pads, Air Filters">
            </div>
            <div class="form-group">
              <label>Status</label>
              <select class="form-control" name="status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Save Supplier</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
}

async function saveNewSupplier(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const payload = {
    name:              formData.get("name"),
    contact:           formData.get("contact"),
    phone:             formData.get("phone"),
    email:             formData.get("email"),
    products_supplied: formData.get("products_supplied"),
    status:            formData.get("status"),
  };

  try {
    await api.createSupplier(payload);
    closeModal();
    loadSuppliersTable();
    showNotification("Supplier added successfully!", "success");
  } catch (err) {
    showNotification(err.message || "Failed to save supplier", "error");
  }
}

async function editSupplier(supplierId) {
  try {
    const s = await api.getSupplier(supplierId);
    document.getElementById("modal-container").innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="fas fa-edit"></i> Edit Supplier</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="editSupplierForm" onsubmit="updateSupplier(event, ${s.id})">
              <div class="form-group">
                <label>Supplier Name *</label>
                <input type="text" class="form-control" name="name" required value="${s.name}">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Contact Person</label>
                  <input type="text" class="form-control" name="contact" value="${s.contact || ""}">
                </div>
                <div class="form-group">
                  <label>Phone</label>
                  <input type="tel" class="form-control" name="phone" value="${s.phone || ""}">
                </div>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" class="form-control" name="email" value="${s.email || ""}">
              </div>
              <div class="form-group">
                <label>Products Supplied</label>
                <input type="text" class="form-control" name="products_supplied"
                       value="${s.products_supplied || ""}">
              </div>
              <div class="form-group">
                <label>Status</label>
                <select class="form-control" name="status">
                  <option value="active"   ${s.status === "active"   ? "selected" : ""}>Active</option>
                  <option value="inactive" ${s.status === "inactive" ? "selected" : ""}>Inactive</option>
                </select>
              </div>
              <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Update Supplier</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;
  } catch (err) {
    showNotification("Failed to load supplier", "error");
  }
}

async function updateSupplier(event, supplierId) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const payload = {
    name:              formData.get("name"),
    contact:           formData.get("contact"),
    phone:             formData.get("phone"),
    email:             formData.get("email"),
    products_supplied: formData.get("products_supplied"),
    status:            formData.get("status"),
  };

  try {
    await api.updateSupplier(supplierId, payload);
    closeModal();
    loadSuppliersTable();
    showNotification("Supplier updated successfully!", "success");
  } catch (err) {
    showNotification(err.message || "Failed to update supplier", "error");
  }
}

async function deleteSupplier(supplierId) {
  if (!confirm("Delete this supplier? This cannot be undone.")) return;
  try {
    await api.deleteSupplier(supplierId);
    loadSuppliersTable();
    showNotification("Supplier deleted successfully!", "success");
  } catch (err) {
    showNotification(err.message || "Delete failed", "error");
  }
}

function callSupplier(phone) {
  if (phone) window.open(`tel:${phone}`);
}

function emailSupplier(email) {
  if (email) window.open(`mailto:${email}`);
}

// ===================================
// SETTINGS SECTION
// ===================================

function getSettingsHTML() {
  return `
    <div class="settings-content">
      <div class="content-header">
        <h2><i class="fas fa-cog"></i> System Settings</h2>
      </div>

      <div class="settings-grid">
        <div class="settings-card">
          <h3><i class="fas fa-store"></i> Store Settings</h3>
          <form id="storeSettingsForm" onsubmit="saveSettingsGroup(event, 'store')">
            <div class="form-group">
              <label>Store Name</label>
              <input type="text" class="form-control" name="store_name"
                     value="Mercedes & BMW Parts Shop">
            </div>
            <div class="form-group">
              <label>Contact Phone</label>
              <input type="tel" class="form-control" name="contact_phone" value="+254712345678">
            </div>
            <div class="form-group">
              <label>Contact Email</label>
              <input type="email" class="form-control" name="contact_email"
                     value="info@mercedesbmwspecialist.co.ke">
            </div>
            <div class="form-group">
              <label>Business Address</label>
              <textarea class="form-control" name="address" rows="3">Nairobi, Kenya</textarea>
            </div>
            <button type="submit" class="btn-primary">Save Store Settings</button>
          </form>
        </div>

        <div class="settings-card">
          <h3><i class="fas fa-percentage"></i> Pricing Settings</h3>
          <form id="pricingSettingsForm" onsubmit="saveSettingsGroup(event, 'pricing')">
            <div class="form-group">
              <label>Default Markup Percentage</label>
              <input type="number" class="form-control" name="default_markup"
                     value="35" step="1" min="0" max="100">
            </div>
            <div class="form-group">
              <label>Minimum Profit Margin (KES)</label>
              <input type="number" class="form-control" name="min_profit"
                     value="1000" step="100" min="0">
            </div>
            <button type="submit" class="btn-primary">Save Pricing Settings</button>
          </form>
        </div>

        <div class="settings-card">
          <h3><i class="fas fa-shipping-fast"></i> Delivery Settings</h3>
          <form id="deliverySettingsForm" onsubmit="saveSettingsGroup(event, 'delivery')">
            <div class="form-group">
              <label>Nairobi Delivery Fee (KES)</label>
              <input type="number" class="form-control" name="nairobi_fee" value="500" step="100" min="0">
            </div>
            <div class="form-group">
              <label>Outside Nairobi Fee (KES)</label>
              <input type="number" class="form-control" name="outside_fee" value="1500" step="100" min="0">
            </div>
            <div class="form-group">
              <label>Free Shipping Threshold (KES)</label>
              <input type="number" class="form-control" name="free_shipping" value="15000" step="1000" min="0">
            </div>
            <button type="submit" class="btn-primary">Save Delivery Settings</button>
          </form>
        </div>

        <div class="settings-card">
          <h3><i class="fas fa-money-check-alt"></i> Payment Settings</h3>
          <form id="paymentSettingsForm" onsubmit="saveSettingsGroup(event, 'payment')">
            <div class="form-group">
              <label>M-Pesa Paybill Number</label>
              <input type="text" class="form-control" name="paybill" value="123456">
            </div>
            <div class="form-group">
              <label>M-Pesa Account Name</label>
              <input type="text" class="form-control" name="account_name" value="MERCEDES BMW PARTS">
            </div>
            <button type="submit" class="btn-primary">Save Payment Settings</button>
          </form>
        </div>

        <div class="settings-card">
          <h3><i class="fas fa-user-shield"></i> Admin Settings</h3>
          <div class="admin-actions">
            <button class="btn-secondary" onclick="viewAdminLogs()">
              <i class="fas fa-clipboard-list"></i> View Activity Logs
            </button>
            <button class="btn-secondary" onclick="backupDatabase()">
              <i class="fas fa-database"></i> Backup Database
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

async function loadSettingsData() {
  // Load settings from API and populate form fields
  try {
    const settings = await api.getSettings();
    if (!settings || !Array.isArray(settings)) return;

    settings.forEach(setting => {
      // settings are stored as {key, value} pairs in the DB
      const input = document.querySelector(`[name="${setting.key}"]`);
      if (input) input.value = setting.value;
    });
  } catch (err) {
    // Non-critical — forms have sensible defaults baked in
    console.warn("Could not load settings from API:", err.message);
  }
}

async function saveSettingsGroup(event, group) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload  = {};

  // Convert FormData entries to key/value pairs, prefixed with group
  for (const [key, value] of formData.entries()) {
    payload[key] = value;
  }

  try {
    await api.updateSettings({ group, settings: payload });
    showNotification("Settings saved!", "success");
  } catch (err) {
    showNotification(err.message || "Failed to save settings", "error");
  }
}

// ===================================
// ACTIVITY LOGS
// ===================================

async function viewAdminLogs() {
  try {
    const res  = await api.getLogs();
    const logs = Array.isArray(res) ? res : (res.logs || []);

    document.getElementById("modal-container").innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width:700px">
          <div class="modal-header">
            <h3><i class="fas fa-clipboard-list"></i> Activity Logs</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="logs-container" style="max-height:400px;overflow-y:auto;">
              ${logs.length === 0
                ? "<p class='empty-state'>No activity logs found</p>"
                : logs.map(log => `
                    <div class="log-entry" style="padding:0.75rem 0;border-bottom:1px solid #f0f0f0;">
                      <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
                        <strong>${log.action}</strong>
                        <small style="color:#999;">${new Date(log.timestamp).toLocaleString()}</small>
                      </div>
                      <div style="color:#555;">${log.details || ""}</div>
                      <small style="color:#aaa;">by ${log.user || "system"}</small>
                    </div>`).join("")}
            </div>
            <div class="modal-actions" style="margin-top:1rem;display:flex;gap:0.5rem;">
              <button class="btn-secondary" onclick="clearAdminLogs()">
                <i class="fas fa-trash"></i> Clear Logs
              </button>
            </div>
          </div>
        </div>
      </div>`;
  } catch (err) {
    showNotification("Failed to load logs", "error");
  }
}

async function clearAdminLogs() {
  if (!confirm("Clear all activity logs? This cannot be undone.")) return;
  try {
    await api.clearLogs();
    closeModal();
    showNotification("Logs cleared successfully!", "success");
  } catch (err) {
    showNotification(err.message || "Failed to clear logs", "error");
  }
}

// ===================================
// DATABASE BACKUP
// ===================================

async function backupDatabase() {
  try {
    showNotification("Generating backup...", "info");
    // Fetch all data in parallel
    const [productsRes, ordersRes, customersRes, suppliersRes] = await Promise.all([
      api.getProducts("?per_page=9999"),
      api.getOrders("?per_page=9999"),
      api.getCustomers("?per_page=9999"),
      api.getSuppliers(),
    ]);

    const backup = {
      timestamp: new Date().toISOString(),
      products:  productsRes.products  || productsRes,
      orders:    ordersRes.orders      || ordersRes,
      customers: customersRes.customers || customersRes,
      suppliers: Array.isArray(suppliersRes) ? suppliersRes : (suppliersRes.suppliers || []),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showNotification("Backup downloaded successfully!", "success");
  } catch (err) {
    showNotification("Backup failed: " + err.message, "error");
  }
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener("DOMContentLoaded", function () {
  // Verify JWT session is still valid before rendering
  const token = localStorage.getItem("adminToken");
  if (!token) {
    window.location.href = "admin-login.html";
    return;
  }

  // Check session age (8 hours)
  const session = JSON.parse(localStorage.getItem("adminSession") || "{}");
  if (session.loginTime) {
    const hoursElapsed = (Date.now() - new Date(session.loginTime)) / (1000 * 60 * 60);
    if (hoursElapsed > 8) {
      alert("Session expired. Please login again.");
      api.logout();
      return;
    }
  }

  // Boot the panel
  loadSection("dashboard");

  // Auto-refresh nav stats every 5 minutes
  setInterval(updateQuickStats, 300_000);
});