// ===================================
// ADMIN PANEL CORE FUNCTIONS
// ===================================

// Global state
let currentSection   = "dashboard";
let inventoryPage    = 1;
let filteredInventory = [];
const inventoryPerPage = 10;

// ===================================
// SECTION LOADER
// ===================================
function loadSection(section) {
  currentSection = section;

  // Update nav active state
  document.querySelectorAll(".admin-nav-menu a").forEach(link => link.classList.remove("nav-active"));
  const activeLink = document.querySelector(`a[href="#${section}"]`);
  if (activeLink) activeLink.classList.add("nav-active");

  const contentArea = document.getElementById("content-area");

  switch (section) {
    case "dashboard":
      contentArea.innerHTML = getDashboardHTML();
      loadDashboardData();
      break;
    case "inventory":
      contentArea.innerHTML = getInventoryHTML();
      loadInventoryTable();
      break;
    case "orders":
      contentArea.innerHTML = getOrdersHTML();
      loadOrdersTable();
      break;
    case "customers":
      contentArea.innerHTML = getCustomersHTML();
      loadCustomersTable();
      break;
    case "reports":
      contentArea.innerHTML = getReportsHTML();
      loadReports();
      break;
    case "suppliers":
      contentArea.innerHTML = getSuppliersHTML();
      loadSuppliersTable();
      break;
    case "settings":
      contentArea.innerHTML = getSettingsHTML();
      loadSettingsData();
      break;
  }

  document.title = `${section.charAt(0).toUpperCase() + section.slice(1)} | Admin Panel`;
}

// ===================================
// DASHBOARD
// ===================================
function getDashboardHTML() {
  return `
    <div class="dashboard-content">
      <div class="dashboard-header">
        <h2><i class="fas fa-tachometer-alt"></i> Dashboard Overview</h2>
        <p>Welcome back! Here's what's happening with your store today.</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number" id="totalRevenue">KES 0</div>
          <div class="stat-label">Total Revenue</div>
          <div class="stat-trend trend-up" id="revenueTrend">Today: KES 0</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="totalOrders">0</div>
          <div class="stat-label">Total Orders</div>
          <div class="stat-trend" id="ordersTrend">0 pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="totalProducts">0</div>
          <div class="stat-label">Products</div>
          <div class="stat-trend trend-down" id="stockAlert">0 low stock</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="totalCustomers">0</div>
          <div class="stat-label">Customers</div>
          <div class="stat-trend trend-up" id="customersTrend">+0 new today</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-card">
          <h3><i class="fas fa-chart-line"></i> Sales Overview</h3>
          <div class="chart-container">
            <canvas id="salesChart" width="400" height="200"></canvas>
          </div>
        </div>
        <div class="dashboard-card">
          <h3><i class="fas fa-box"></i> Inventory by Category</h3>
          <div class="chart-container">
            <canvas id="inventoryChart" width="400" height="200"></canvas>
          </div>
        </div>
        <div class="dashboard-card">
          <h3><i class="fas fa-clock"></i> Recent Orders</h3>
          <div id="recentOrdersList" class="orders-list"></div>
        </div>
        <div class="dashboard-card">
          <h3><i class="fas fa-exclamation-triangle"></i> Stock Alerts</h3>
          <div id="stockAlertsList" class="alerts-list"></div>
        </div>
      </div>
    </div>`;
}

async function loadDashboardData() {
  await updateQuickStats();
  await loadDashboardCharts();
  await loadRecentOrders();
  await loadStockAlerts();
}

async function updateQuickStats() {
  try {
    const stats = await api.getDashboardStats();

    document.getElementById("lowStockCount").textContent      = stats.products.low_stock;
    document.getElementById("pendingOrdersCount").textContent  = stats.orders.pending;
    document.getElementById("todayRevenue").textContent        = `KES ${stats.revenue.today.toLocaleString()}`;

    if (currentSection === "dashboard") {
      document.getElementById("totalRevenue").textContent   = `KES ${stats.revenue.total.toLocaleString()}`;
      document.getElementById("totalOrders").textContent    = stats.orders.total;
      document.getElementById("totalProducts").textContent  = stats.products.total;
      document.getElementById("totalCustomers").textContent = stats.customers.total;
      document.getElementById("ordersTrend").textContent    = `${stats.orders.pending} pending`;
      document.getElementById("stockAlert").textContent     = `${stats.products.low_stock} low stock`;
      document.getElementById("revenueTrend").textContent   = `Today: KES ${stats.revenue.today.toLocaleString()}`;
      document.getElementById("customersTrend").textContent = `+${stats.customers.new_today} new today`;
    }
  } catch (err) {
    console.error("Failed to load stats:", err);
  }
}

async function loadDashboardCharts() {
  try {
    const [salesData, inventoryData] = await Promise.all([
      api.getSalesChart(),
      api.getInventoryChart()
    ]);

    // Sales Chart
    const salesCtx = document.getElementById("salesChart")?.getContext("2d");
    if (salesCtx) {
      new Chart(salesCtx, {
        type: "line",
        data: {
          labels: salesData.labels,
          datasets: [{
            label: "Daily Sales (KES)",
            data: salesData.data,
            borderColor: "#c40000",
            backgroundColor: "rgba(196,0,0,0.1)",
            borderWidth: 2,
            fill: true
          }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }

    // Inventory Chart
    const invCtx = document.getElementById("inventoryChart")?.getContext("2d");
    if (invCtx) {
      new Chart(invCtx, {
        type: "doughnut",
        data: {
          labels: inventoryData.labels,
          datasets: [{
            data: inventoryData.data,
            backgroundColor: ["#c40000","#ff9800","#2196f3","#4caf50","#9c27b0","#607d8b"]
          }]
        },
        options: { responsive: true, plugins: { legend: { position: "bottom" } } }
      });
    }
  } catch (err) {
    console.error("Failed to load charts:", err);
  }
}

async function loadRecentOrders() {
  try {
    const orders = await api.getRecentOrders();
    const list   = document.getElementById("recentOrdersList");
    if (!list) return;

    list.innerHTML = orders.length === 0
      ? "<p class='empty-state'>No recent orders</p>"
      : orders.map(o => `
          <div class="order-item">
            <div class="order-info">
              <strong>${o.order_number}</strong>
              <span>${o.customer_name || "Guest"}</span>
            </div>
            <div class="order-meta">
              <span>KES ${o.total.toLocaleString()}</span>
              <span class="status-badge status-${o.status}">${o.status}</span>
            </div>
          </div>`).join("");
  } catch (err) {
    console.error("Failed to load recent orders:", err);
  }
}

async function loadStockAlerts() {
  try {
    const alerts = await api.getStockAlerts();
    const list   = document.getElementById("stockAlertsList");
    if (!list) return;

    list.innerHTML = alerts.length === 0
      ? "<p class='empty-state'>All stock levels are good ✅</p>"
      : alerts.map(p => `
          <div class="alert-item">
            <div class="alert-info">
              <strong>${p.name}</strong>
              <span>${p.sku}</span>
            </div>
            <div class="alert-meta">
              <span class="stock-quantity">${p.stock} left</span>
              <span class="status-badge ${p.status === 'out_of_stock' ? 'status-cancelled' : 'status-low'}">
                ${p.status === "out_of_stock" ? "Out of Stock" : "Low Stock"}
              </span>
            </div>
          </div>`).join("");
  } catch (err) {
    console.error("Failed to load stock alerts:", err);
  }
}

// ===================================
// INVENTORY
// ===================================
function getInventoryHTML() {
  return `
    <div class="inventory-content">
      <div class="content-header">
        <div>
          <h2><i class="fas fa-boxes"></i> Inventory Management</h2>
          <p>Manage your product inventory, stock levels, and product information</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" onclick="showAddProductModal()">
            <i class="fas fa-plus"></i> Add New Product
          </button>
          <button class="btn-secondary" onclick="window.open('${API_BASE}/api/products/export/csv')">
            <i class="fas fa-download"></i> Export CSV
          </button>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="inventorySearch" placeholder="Search products..."
                 onkeyup="searchInventory()">
        </div>
        <div class="filter-controls">
          <select id="categoryFilter" onchange="filterInventory()">
            <option value="">All Categories</option>
            <option value="brakes">Brakes</option>
            <option value="filters">Filters</option>
            <option value="engine">Engine</option>
            <option value="suspension">Suspension</option>
            <option value="electrical">Electrical</option>
            <option value="body">Body</option>
          </select>
          <select id="brandFilter" onchange="filterInventory()">
            <option value="">All Brands</option>
            <option value="mercedes">Mercedes-Benz</option>
            <option value="bmw">BMW</option>
          </select>
          <select id="stockFilter" onchange="filterInventory()">
            <option value="">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="good">Good Stock</option>
          </select>
        </div>
      </div>

      <div class="admin-table-container">
        <div class="table-responsive">
          <table class="admin-table" id="inventoryTable">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="inventoryTableBody">
              <tr><td colspan="8" style="text-align:center">
                <i class="fas fa-spinner fa-spin"></i> Loading...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="table-footer">
        <div class="table-info">
          Showing <span id="inventoryCount">0</span> products
        </div>
        <div class="pagination">
          <button class="page-btn" onclick="changeInventoryPage(-1)">← Previous</button>
          <span class="page-numbers">
            Page <span id="inventoryPage">1</span> of <span id="inventoryTotalPages">1</span>
          </span>
          <button class="page-btn" onclick="changeInventoryPage(1)">Next →</button>
        </div>
      </div>
    </div>`;
}

async function loadInventoryTable() {
  try {
    const res = await api.getProducts(`?page=${inventoryPage}&per_page=${inventoryPerPage}`);
    filteredInventory = res.products;
    renderInventoryTable(res);
  } catch (err) {
    showNotification("Failed to load inventory", "error");
  }
}

function renderInventoryTable(res) {
  const tbody = document.getElementById("inventoryTableBody");
  if (!res.products.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">No products found</td></tr>`;
    return;
  }

  tbody.innerHTML = res.products.map(p => `
    <tr>
      <td><strong>${p.sku}</strong></td>
      <td>
        <div class="product-info">
          <strong>${p.name}</strong>
          <small>${p.oem_number || ""}</small>
        </div>
      </td>
      <td><span class="brand-badge ${p.brand}">${p.brand.toUpperCase()}</span></td>
      <td>${p.category}</td>
      <td>
        <div class="stock-info">
          <span class="stock-quantity">${p.stock}</span>
          <small>Min: ${p.min_stock}</small>
        </div>
      </td>
      <td>KES ${p.price.toLocaleString()}</td>
      <td>${getStockStatusBadge(p.stock, p.min_stock)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon btn-edit" onclick="editProduct('${p.id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon btn-delete" onclick="deleteProduct('${p.id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`).join("");

  document.getElementById("inventoryCount").textContent      = res.total;
  document.getElementById("inventoryPage").textContent       = res.page;
  document.getElementById("inventoryTotalPages").textContent = res.total_pages;
}

function getStockStatusBadge(stock, minStock) {
  if (stock === 0)          return '<span class="status-badge status-cancelled">Out of Stock</span>';
  if (stock <= minStock)    return '<span class="status-badge status-low">Low Stock</span>';
  if (stock <= minStock * 2) return '<span class="status-badge status-medium">Medium</span>';
  return '<span class="status-badge status-good">In Stock</span>';
}

async function searchInventory() {
  const search  = document.getElementById("inventorySearch").value;
  inventoryPage = 1;
  try {
    const res = await api.getProducts(`?search=${encodeURIComponent(search)}&page=1&per_page=${inventoryPerPage}`);
    renderInventoryTable(res);
  } catch (err) {
    showNotification("Search failed", "error");
  }
}

async function filterInventory() {
  const category = document.getElementById("categoryFilter").value;
  const brand    = document.getElementById("brandFilter").value;
  const stock    = document.getElementById("stockFilter").value;
  inventoryPage  = 1;

  let params = `?page=1&per_page=${inventoryPerPage}`;
  if (category) params += `&category=${category}`;
  if (brand)    params += `&brand=${brand}`;
  if (stock)    params += `&stock_level=${stock}`;

  try {
    const res = await api.getProducts(params);
    renderInventoryTable(res);
  } catch (err) {
    showNotification("Filter failed", "error");
  }
}

async function changeInventoryPage(direction) {
  inventoryPage += direction;
  if (inventoryPage < 1) inventoryPage = 1;
  await loadInventoryTable();
}

// ===================================
// PRODUCT MODALS
// ===================================
function showAddProductModal() {
  document.getElementById("modal-container").innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-plus"></i> Add New Product</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="addProductForm" onsubmit="saveNewProduct(event)">
            <div class="form-row">
              <div class="form-group">
                <label>SKU *</label>
                <input type="text" class="form-control" name="sku" required placeholder="MB-OF-001">
              </div>
              <div class="form-group">
                <label>Product Name *</label>
                <input type="text" class="form-control" name="name" required placeholder="Mercedes Oil Filter">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Brand *</label>
                <select class="form-control" name="brand" required>
                  <option value="">Select Brand</option>
                  <option value="mercedes">Mercedes-Benz</option>
                  <option value="bmw">BMW</option>
                </select>
              </div>
              <div class="form-group">
                <label>Category *</label>
                <select class="form-control" name="category" required>
                  <option value="">Select Category</option>
                  <option value="brakes">Brakes</option>
                  <option value="filters">Filters</option>
                  <option value="engine">Engine</option>
                  <option value="suspension">Suspension</option>
                  <option value="electrical">Electrical</option>
                  <option value="body">Body Parts</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Type</label>
                <select class="form-control" name="type">
                  <option value="genuine">Genuine</option>
                  <option value="oem">OEM</option>
                  <option value="aftermarket">Aftermarket</option>
                </select>
              </div>
              <div class="form-group">
                <label>OEM Number</label>
                <input type="text" class="form-control" name="oemNumber" placeholder="A 642 180 02 00">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Cost Price (KES) *</label>
                <input type="number" class="form-control" name="cost" required step="100" min="0">
              </div>
              <div class="form-group">
                <label>Selling Price (KES) *</label>
                <input type="number" class="form-control" name="price" required step="100" min="0">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Current Stock *</label>
                <input type="number" class="form-control" name="stock" required min="0">
              </div>
              <div class="form-group">
                <label>Minimum Stock *</label>
                <input type="number" class="form-control" name="minStock" required min="1" value="5">
              </div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea class="form-control" name="description" rows="3"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Supplier</label>
                <input type="text" class="form-control" name="supplier" placeholder="Mercedes-Benz Kenya">
              </div>
              <div class="form-group">
                <label>Location</label>
                <input type="text" class="form-control" name="location" placeholder="Shelf A-12">
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Save Product</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
}

async function saveNewProduct(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const product = {
    sku:         formData.get("sku"),
    name:        formData.get("name"),
    brand:       formData.get("brand"),
    category:    formData.get("category"),
    type:        formData.get("type"),
    oem_number:  formData.get("oemNumber"),
    cost:        parseFloat(formData.get("cost")),
    price:       parseFloat(formData.get("price")),
    stock:       parseInt(formData.get("stock")),
    min_stock:   parseInt(formData.get("minStock")),
    description: formData.get("description"),
    supplier:    formData.get("supplier"),
    location:    formData.get("location"),
  };

  try {
    await api.createProduct(product);
    closeModal();
    loadInventoryTable();
    updateQuickStats();
    showNotification("Product added successfully!", "success");
  } catch (err) {
    showNotification(err.message || "Failed to save product", "error");
  }
}

async function editProduct(productId) {
  try {
    const p = await api.getProduct(productId);
    document.getElementById("modal-container").innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="fas fa-edit"></i> Edit Product</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="editProductForm" onsubmit="updateProduct(event, '${p.id}')">
              <div class="form-row">
                <div class="form-group">
                  <label>SKU *</label>
                  <input type="text" class="form-control" name="sku" required value="${p.sku}">
                </div>
                <div class="form-group">
                  <label>Product Name *</label>
                  <input type="text" class="form-control" name="name" required value="${p.name}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Brand *</label>
                  <select class="form-control" name="brand" required>
                    <option value="mercedes" ${p.brand === "mercedes" ? "selected" : ""}>Mercedes-Benz</option>
                    <option value="bmw"      ${p.brand === "bmw"      ? "selected" : ""}>BMW</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Category *</label>
                  <select class="form-control" name="category" required>
                    <option value="brakes"     ${p.category === "brakes"     ? "selected" : ""}>Brakes</option>
                    <option value="filters"    ${p.category === "filters"    ? "selected" : ""}>Filters</option>
                    <option value="engine"     ${p.category === "engine"     ? "selected" : ""}>Engine</option>
                    <option value="suspension" ${p.category === "suspension" ? "selected" : ""}>Suspension</option>
                    <option value="electrical" ${p.category === "electrical" ? "selected" : ""}>Electrical</option>
                    <option value="body"       ${p.category === "body"       ? "selected" : ""}>Body Parts</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Cost Price (KES)</label>
                  <input type="number" class="form-control" name="cost" step="100" value="${p.cost || ""}">
                </div>
                <div class="form-group">
                  <label>Selling Price (KES) *</label>
                  <input type="number" class="form-control" name="price" required step="100" value="${p.price}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Stock *</label>
                  <input type="number" class="form-control" name="stock" required min="0" value="${p.stock}">
                </div>
                <div class="form-group">
                  <label>Min Stock *</label>
                  <input type="number" class="form-control" name="minStock" required min="1" value="${p.min_stock}">
                </div>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea class="form-control" name="description" rows="3">${p.description || ""}</textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Supplier</label>
                  <input type="text" class="form-control" name="supplier" value="${p.supplier || ""}">
                </div>
                <div class="form-group">
                  <label>Location</label>
                  <input type="text" class="form-control" name="location" value="${p.location || ""}">
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Update Product</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;
  } catch (err) {
    showNotification("Failed to load product", "error");
  }
}

async function updateProduct(event, productId) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const payload = {
    sku:         formData.get("sku"),
    name:        formData.get("name"),
    brand:       formData.get("brand"),
    category:    formData.get("category"),
    cost:        parseFloat(formData.get("cost")),
    price:       parseFloat(formData.get("price")),
    stock:       parseInt(formData.get("stock")),
    min_stock:   parseInt(formData.get("minStock")),
    description: formData.get("description"),
    supplier:    formData.get("supplier"),
    location:    formData.get("location"),
  };

  try {
    await api.updateProduct(productId, payload);
    closeModal();
    loadInventoryTable();
    updateQuickStats();
    showNotification("Product updated successfully!", "success");
  } catch (err) {
    showNotification(err.message || "Failed to update product", "error");
  }
}

async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
  try {
    await api.deleteProduct(productId);
    showNotification("Product deleted successfully!", "success");
    loadInventoryTable();
    updateQuickStats();
  } catch (err) {
    showNotification(err.message || "Delete failed", "error");
  }
}

// ===================================
// ORDERS
// ===================================
function getOrdersHTML() {
  return `
    <div class="orders-content">
      <div class="content-header">
        <div>
          <h2><i class="fas fa-shopping-cart"></i> Order Management</h2>
          <p>View and manage customer orders, update status, and process shipments</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" onclick="window.open('${API_BASE}/api/orders/export/csv')">
            <i class="fas fa-download"></i> Export Orders
          </button>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="ordersSearch" placeholder="Search orders..." onkeyup="searchOrders()">
        </div>
        <div class="filter-controls">
          <select id="statusFilter" onchange="filterOrders()">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select id="paymentFilter" onchange="filterOrders()">
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending_payment">Pending Payment</option>
          </select>
          <input type="date" id="dateFilter" onchange="filterOrders()">
        </div>
      </div>

      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="ordersTableBody">
            <tr><td colspan="8" style="text-align:center">
              <i class="fas fa-spinner fa-spin"></i> Loading...
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

async function loadOrdersTable(params = "?page=1&per_page=50") {
  try {
    const res   = await api.getOrders(params);
    const tbody = document.getElementById("ordersTableBody");

    if (!res.orders.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">No orders found</td></tr>`;
      return;
    }

    tbody.innerHTML = res.orders.map(o => `
      <tr>
        <td><strong>${o.order_number}</strong></td>
        <td>${o.customer_name || "Guest"}</td>
        <td>${formatDate(o.date)}</td>
        <td>${o.items.length} items</td>
        <td>KES ${o.total?.toLocaleString() || "0"}</td>
        <td>
          <span class="payment-status ${o.payment_status}">
            ${o.payment_status === "paid" ? "✅ Paid" : "⏳ Pending"}
          </span>
        </td>
        <td>
          <select class="status-select"
            onchange="updateOrderStatus('${o.order_number}', this.value)">
            <option value="pending"    ${o.status === "pending"    ? "selected" : ""}>Pending</option>
            <option value="processing" ${o.status === "processing" ? "selected" : ""}>Processing</option>
            <option value="shipped"    ${o.status === "shipped"    ? "selected" : ""}>Shipped</option>
            <option value="delivered"  ${o.status === "delivered"  ? "selected" : ""}>Delivered</option>
            <option value="cancelled"  ${o.status === "cancelled"  ? "selected" : ""}>Cancelled</option>
          </select>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon btn-view" onclick="viewOrderDetails('${o.order_number}')">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>`).join("");
  } catch (err) {
    showNotification("Failed to load orders", "error");
  }
}

async function searchOrders() {
  const search = document.getElementById("ordersSearch").value;
  await loadOrdersTable(`?search=${encodeURIComponent(search)}&page=1&per_page=50`);
}

async function filterOrders() {
  const status  = document.getElementById("statusFilter").value;
  const payment = document.getElementById("paymentFilter").value;
  const date    = document.getElementById("dateFilter").value;

  let params = "?page=1&per_page=50";
  if (status)  params += `&status=${status}`;
  if (payment) params += `&payment_status=${payment}`;
  if (date)    params += `&date=${date}`;

  await loadOrdersTable(params);
}

async function updateOrderStatus(orderNumber, status) {
  try {
    await api.updateOrder(orderNumber, { status });
    showNotification(`Order ${orderNumber} updated to ${status}`, "success");
    updateQuickStats();
  } catch (err) {
    showNotification(err.message || "Failed to update order", "error");
  }
}

async function viewOrderDetails(orderNumber) {
  try {
    const o = await api.getOrder(orderNumber);
    document.getElementById("modal-container").innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="fas fa-receipt"></i> Order ${o.order_number}</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <p><strong>Customer:</strong> ${o.customer_name || "Guest"}</p>
            <p><strong>Phone:</strong> ${o.customer_phone || "N/A"}</p>
            <p><strong>Email:</strong> ${o.customer_email || "N/A"}</p>
            <p><strong>Date:</strong> ${formatDate(o.date)}</p>
            <p><strong>Delivery:</strong> ${o.delivery_method}</p>
            <p><strong>Status:</strong> ${o.status}</p>
            <p><strong>Payment:</strong> ${o.payment_status}</p>
            <hr>
            <h4>Items</h4>
            <table class="admin-table">
              <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
              <tbody>
                ${o.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>KES ${item.price.toLocaleString()}</td>
                    <td>${item.quantity}</td>
                    <td>KES ${(item.price * item.quantity).toLocaleString()}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
            <p style="text-align:right; margin-top:1rem;">
              <strong>Shipping: KES ${o.shipping_fee.toLocaleString()}</strong><br>
              <strong>Total: KES ${o.total.toLocaleString()}</strong>
            </p>
          </div>
        </div>
      </div>`;
  } catch (err) {
    showNotification("Failed to load order details", "error");
  }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================
function closeModal() {
  document.getElementById("modal-container").innerHTML = "";
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-KE", {
    year: "numeric", month: "short", day: "numeric"
  });
}

function showNotification(message, type = "info") {
  const existing = document.querySelector(".admin-notification");
  if (existing) existing.remove();

  const n = document.createElement("div");
  n.className = `admin-notification notification-${type}`;
  n.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>`;

  n.style.cssText = `
    position:fixed; top:100px; right:20px;
    background:${type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#2196f3"};
    color:white; padding:1rem 1.5rem; border-radius:4px;
    display:flex; align-items:center; justify-content:space-between;
    gap:1rem; min-width:300px; max-width:400px;
    box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:9999;
    animation:slideInRight 0.3s ease;`;

  document.body.appendChild(n);
  setTimeout(() => { if (n.parentElement) n.remove(); }, 5000);
}

// Inject animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
  .brand-badge { display:inline-block; padding:0.2rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:600; text-transform:uppercase; }
  .brand-badge.mercedes { background:#e6f7ff; color:#1890ff; border:1px solid #91d5ff; }
  .brand-badge.bmw { background:#f6ffed; color:#52c41a; border:1px solid #b7eb8f; }
  .content-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
  .header-actions { display:flex; gap:0.5rem; }
  .btn-primary { background:var(--primary-red); color:white; border:none; padding:0.8rem 1.5rem; border-radius:4px; font-family:'Work Sans',sans-serif; font-weight:500; cursor:pointer; display:flex; align-items:center; gap:0.5rem; }
  .btn-secondary { background:white; color:var(--text-primary); border:1px solid #ddd; padding:0.8rem 1.5rem; border-radius:4px; font-family:'Work Sans',sans-serif; font-weight:500; cursor:pointer; display:flex; align-items:center; gap:0.5rem; }
  .filters-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; gap:1rem; flex-wrap:wrap; }
  .search-box { position:relative; flex:1; max-width:300px; }
  .search-box i { position:absolute; left:1rem; top:50%; transform:translateY(-50%); color:#999; }
  .search-box input { width:100%; padding:0.8rem 1rem 0.8rem 2.5rem; border:1px solid #ddd; border-radius:4px; }
  .filter-controls { display:flex; gap:0.5rem; flex-wrap:wrap; }
  .filter-controls select, .filter-controls input { padding:0.8rem; border:1px solid #ddd; border-radius:4px; font-family:'Work Sans',sans-serif; }
  .table-footer { display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem; padding:1rem; background:white; border-radius:0 0 8px 8px; border-top:1px solid #e9ecef; }
  .pagination { display:flex; align-items:center; gap:1rem; }
  .page-btn { padding:0.5rem 1rem; background:white; border:1px solid #ddd; border-radius:4px; cursor:pointer; }
  .order-item, .alert-item { display:flex; justify-content:space-between; align-items:center; padding:0.8rem 0; border-bottom:1px solid #f0f0f0; }
  .empty-state { text-align:center; color:#999; padding:2rem; font-style:italic; }
`;
document.head.appendChild(style);