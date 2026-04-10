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

// Track chart instances so we can destroy before re-creating
const chartInstances = {};

async function loadDashboardCharts() {
  try {
    const [salesData, inventoryData] = await Promise.all([
      api.getSalesChart(),
      api.getInventoryChart()
    ]);

    // Sales Chart — destroy existing instance first
    const salesCanvas = document.getElementById("salesChart");
    if (salesCanvas) {
      if (chartInstances.sales) chartInstances.sales.destroy();
      chartInstances.sales = new Chart(salesCanvas.getContext("2d"), {
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

    // Inventory Chart — destroy existing instance first
    const invCanvas = document.getElementById("inventoryChart");
    if (invCanvas) {
      if (chartInstances.inventory) chartInstances.inventory.destroy();
      chartInstances.inventory = new Chart(invCanvas.getContext("2d"), {
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
          <button class="btn-secondary" onclick="window.open(API_BASE + '/api/products/export/csv')">
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
          <button class="btn-icon btn-edit" onclick="editProduct('${p.id}')" title="Edit">        <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon btn-delete" onclick="deleteProduct('${p.id}')" title="Delete">            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`).join("");

  document.getElementById("inventoryCount").textContent      = res.total;
  document.getElementById("inventoryPage").textContent       = res.page;
  document.getElementById("inventoryTotalPages").textContent = res.total_pages;
}

function getStockStatusBadge(stock, minStock) {
  if (stock === 0)           return '<span class="status-badge status-cancelled">Out of Stock</span>';
  if (stock <= minStock)     return '<span class="status-badge status-low">Low Stock</span>';
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
      <div class="modal-content" style="max-width:700px">
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

            <!-- ── Image Upload Section ────────────────────── -->
            <div class="form-group" style="margin-top:1.5rem;">
              <label>
                Product Images 
                <small style="color:#999;font-weight:400;">(optional — max 6 images, 5MB each)</small>
              </label>

              <!-- Drop zone -->
              <div class="image-drop-zone" id="addImageDropZone"
                onclick="document.getElementById('addImageInput').click()"
                ondragover="handleDragOver(event)"
                ondragleave="handleDragLeave(event)"
                ondrop="handleDrop(event, 'add')">
                <i class="fas fa-cloud-upload-alt" style="font-size:2rem;color:#ccc;"></i>
                <p style="margin:0.5rem 0 0;color:#999;font-size:0.9rem;">
                  Drag & drop images here or <strong>click to browse</strong>
                </p>
                <p style="margin:0.25rem 0 0;color:#bbb;font-size:0.8rem;">
                  JPG, PNG, WEBP — max 5MB each
                </p>
              </div>

              <!-- Hidden file input — accepts multiple files -->
              <input type="file" id="addImageInput" accept=".jpg,.jpeg,.png,.webp"
                     multiple style="display:none"
                     onchange="handleFileSelect(event, 'add')">

              <!-- Preview grid — thumbnails appear here before upload -->
              <div class="image-preview-grid" id="addImagePreview"></div>
            </div>
            <!-- ── End Image Upload Section ───────────────── -->

            <div class="form-actions">
              <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" id="addProductSubmitBtn">
                <i class="fas fa-save"></i> Save Product
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>`;
}

async function saveNewProduct(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  // ── Step 1: Build product payload ─────────────────────────
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

  // ── Step 2: Disable submit button to prevent double submit ─
  const submitBtn = document.getElementById("addProductSubmitBtn");
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled  = true;
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;

  try {
    // ── Step 3: Save the product first ───────────────────────
    const newProduct = await api.createProduct(product);

    // ── Step 4: Upload staged images if any ──────────────────
    const stagedCount = (stagedFiles["add"] || []).length;

    if (stagedCount > 0) {
      // Update button to show upload progress
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading images...`;

      const uploadedCount = await uploadStagedImages(newProduct.id, "add");

      // Notify about partial failures if any images failed
      if (uploadedCount < stagedCount) {
        showNotification(
          `Product saved. ${uploadedCount}/${stagedCount} images uploaded successfully.`,
          "info"
        );
      } else {
        showNotification(
          `Product added with ${uploadedCount} image${uploadedCount !== 1 ? "s" : ""}!`,
          "success"
        );
      }
    } else {
      // No images — just show success
      showNotification("Product added successfully!", "success");
    }

    // ── Step 5: Close modal and refresh table ─────────────────
    closeModal();
    loadInventoryTable();
    updateQuickStats();

  } catch (err) {
    // ── Re-enable button on error so admin can try again ──────
    submitBtn.disabled  = false;
    submitBtn.innerHTML = originalBtnText;
    showNotification(err.message || "Failed to save product", "error");
  }
}

async function editProduct(productId) {
  try {
    const p = await api.getProduct(productId);

    // Build existing images HTML — show thumbnails with delete buttons
    const existingImagesHTML = (p.images && p.images.length > 0)
      ? p.images.map(filename => `
          <div class="image-preview-item" id="existing-${filename}">
            <img src="${api.getImageUrl(filename)}" alt="Product image">
            <button type="button" class="remove-preview-btn"
                    onclick="deleteExistingImage('${p.id}', '${filename}')"
                    title="Delete image">
              &times;
            </button>
            <div class="preview-filename">saved</div>
          </div>`).join("")
      : `<p style="color:#999;font-size:0.85rem;margin:0;">No images yet</p>`;

    document.getElementById("modal-container").innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width:700px">
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
                  <label>Type</label>
                  <select class="form-control" name="type">
                    <option value="genuine"     ${p.type === "genuine"     ? "selected" : ""}>Genuine</option>
                    <option value="oem"         ${p.type === "oem"         ? "selected" : ""}>OEM</option>
                    <option value="aftermarket" ${p.type === "aftermarket" ? "selected" : ""}>Aftermarket</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>OEM Number</label>
                  <input type="text" class="form-control" name="oem_number"
                         value="${p.oem_number || ""}">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Cost Price (KES)</label>
                  <input type="number" class="form-control" name="cost"
                         step="100" value="${p.cost || ""}">
                </div>
                <div class="form-group">
                  <label>Selling Price (KES) *</label>
                  <input type="number" class="form-control" name="price"
                         required step="100" value="${p.price}">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Stock *</label>
                  <input type="number" class="form-control" name="stock"
                         required min="0" value="${p.stock}">
                </div>
                <div class="form-group">
                  <label>Min Stock *</label>
                  <input type="number" class="form-control" name="minStock"
                         required min="1" value="${p.min_stock}">
                </div>
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea class="form-control" name="description"
                          rows="3">${p.description || ""}</textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Supplier</label>
                  <input type="text" class="form-control" name="supplier"
                         value="${p.supplier || ""}">
                </div>
                <div class="form-group">
                  <label>Location</label>
                  <input type="text" class="form-control" name="location"
                         value="${p.location || ""}">
                </div>
              </div>

              <!-- ── Image Management Section ──────────────── -->
              <div class="form-group" style="margin-top:1.5rem;">
                <label>
                  Product Images
                  <small style="color:#999;font-weight:400;">
                    (${p.images ? p.images.length : 0}/6 — click &times; to remove)
                  </small>
                </label>

                <!-- Existing saved images -->
                <div class="image-preview-grid" id="existingImagesGrid">
                  ${existingImagesHTML}
                </div>

                <!-- Only show upload zone if under the 6 image limit -->
                ${(!p.images || p.images.length < 6) ? `
                  <div class="image-drop-zone" id="editImageDropZone"
                       style="margin-top:1rem;"
                       onclick="document.getElementById('editImageInput').click()"
                       ondragover="handleDragOver(event)"
                       ondragleave="handleDragLeave(event)"
                       ondrop="handleDrop(event, '${p.id}')">
                    <i class="fas fa-cloud-upload-alt"
                       style="font-size:1.5rem;color:#ccc;"></i>
                    <p style="margin:0.5rem 0 0;color:#999;font-size:0.85rem;">
                      Add more images — drag & drop or <strong>click to browse</strong>
                    </p>
                  </div>
                  <input type="file" id="editImageInput"
                         accept=".jpg,.jpeg,.png,.webp" multiple
                         style="display:none"
                         onchange="handleFileSelect(event, '${p.id}')">
                  <div class="image-preview-grid" id="editImagePreview"></div>
                ` : `
                  <p style="color:#e67e22;font-size:0.85rem;margin-top:0.5rem;">
                    <i class="fas fa-info-circle"></i>
                    Maximum 6 images reached. Delete one to add more.
                  </p>
                `}
              </div>
              <!-- ── End Image Management Section ─────────── -->

              <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">
                  Cancel
                </button>
                <button type="submit" class="btn-primary" id="editProductSubmitBtn">
                  <i class="fas fa-save"></i> Update Product
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>`;

  } catch (err) {
    showNotification("Failed to load product", "error");
  }
}

/**
 * Delete an already-saved image from an existing product.
 * Called from the edit modal's × button on saved image thumbnails.
 */
async function deleteExistingImage(productId, filename) {
  if (!confirm("Delete this image? This cannot be undone.")) return;

  try {
    await api.deleteProductImage(productId, filename);

    // Remove the thumbnail from the DOM without closing the modal
    const thumb = document.getElementById(`existing-${filename}`);
    if (thumb) thumb.remove();

    showNotification("Image deleted successfully!", "success");

    // Update the image count label
    const grid  = document.getElementById("existingImagesGrid");
    const count = grid ? grid.querySelectorAll(".image-preview-item").length : 0;
    const label = document.querySelector(
      '#editProductForm .form-group label small'
    );
    if (label) {
      label.textContent = `(${count}/6 — click × to remove)`;
    }

    // Show upload zone if it was hidden due to image limit
    if (count < 6 && !document.getElementById("editImageDropZone")) {
      const zone = document.createElement("div");
      zone.innerHTML = `
        <div class="image-drop-zone" id="editImageDropZone"
             style="margin-top:1rem;"
             onclick="document.getElementById('editImageInput').click()"
             ondragover="handleDragOver(event)"
             ondragleave="handleDragLeave(event)"
             ondrop="handleDrop(event, '${productId}')">
          <i class="fas fa-cloud-upload-alt"
             style="font-size:1.5rem;color:#ccc;"></i>
          <p style="margin:0.5rem 0 0;color:#999;font-size:0.85rem;">
            Add more images — drag & drop or <strong>click to browse</strong>
          </p>
        </div>
        <input type="file" id="editImageInput"
               accept=".jpg,.jpeg,.png,.webp" multiple
               style="display:none"
               onchange="handleFileSelect(event, '${productId}')">
        <div class="image-preview-grid" id="editImagePreview"></div>`;
      grid.parentNode.insertBefore(zone, grid.nextSibling);
    }

  } catch (err) {
    showNotification(err.message || "Failed to delete image", "error");
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

  // ── Disable submit button ──────────────────────────────────
  const submitBtn      = document.getElementById("editProductSubmitBtn");
  const originalText   = submitBtn.innerHTML;
  submitBtn.disabled   = true;
  submitBtn.innerHTML  = `<i class="fas fa-spinner fa-spin"></i> Saving...`;

  try {
    // ── Save product details first ─────────────────────────
    await api.updateProduct(productId, payload);

    // ── Upload any newly staged images ─────────────────────
    const stagedCount = (stagedFiles[productId] || []).length;

    if (stagedCount > 0) {
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading images...`;
      const uploadedCount = await uploadStagedImages(productId, productId);

      if (uploadedCount < stagedCount) {
        showNotification(
          `Product updated. ${uploadedCount}/${stagedCount} images uploaded.`,
          "info"
        );
      } else {
        showNotification(
          `Product updated with ${uploadedCount} new image${uploadedCount !== 1 ? "s" : ""}!`,
          "success"
        );
      }
    } else {
      showNotification("Product updated successfully!", "success");
    }

    closeModal();
    loadInventoryTable();
    updateQuickStats();

  } catch (err) {
    submitBtn.disabled  = false;
    submitBtn.innerHTML = originalText;
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
          <button class="btn-secondary" onclick="window.open(API_BASE + '/api/orders/export/csv')">
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
              <strong>Shipping: KES ${o.shipping_fee?.toLocaleString() || "0"}</strong><br>
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


// ===================================
// IMAGE UPLOAD HELPERS
// ===================================

// Holds staged files waiting to be uploaded after product is saved
// Key: 'add' for add modal, or productId for edit modal
const stagedFiles = {};

/**
 * Handle file input change event.
 * Validates files and adds previews to the staging area.
 */
function handleFileSelect(event, context) {
  const files = Array.from(event.target.files);
  stageFiles(files, context);
  // Reset input so same file can be re-selected if removed
  event.target.value = "";
}

/**
 * Handle drag over — show drop zone as active
 */
function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drop-zone-active");
}

/**
 * Handle drag leave — remove active state
 */
function handleDragLeave(event) {
  event.currentTarget.classList.remove("drop-zone-active");
}

/**
 * Handle file drop onto drop zone
 */
function handleDrop(event, context) {
  event.preventDefault();
  event.currentTarget.classList.remove("drop-zone-active");
  const files = Array.from(event.dataTransfer.files);
  stageFiles(files, context);
}

/**
 * Validate and stage files for upload.
 * Shows preview thumbnails in the preview grid.
 */
function stageFiles(files, context) {
  if (!stagedFiles[context]) stagedFiles[context] = [];

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize      = 5 * 1024 * 1024; // 5MB
  const maxImages    = 6;

  for (const file of files) {
    // Validate type
    if (!allowedTypes.includes(file.type)) {
      showNotification(`${file.name}: Invalid file type. Use JPG, PNG, or WEBP.`, "error");
      continue;
    }

    // Validate size
    if (file.size > maxSize) {
      showNotification(`${file.name}: File too large. Maximum size is 5MB.`, "error");
      continue;
    }

    // Check total image limit
    if (stagedFiles[context].length >= maxImages) {
      showNotification(`Maximum ${maxImages} images allowed per product.`, "error");
      break;
    }

    // Add to staged list and show preview
    stagedFiles[context].push(file);
    addImagePreview(file, context, stagedFiles[context].length - 1);
  }
}

/**
 * Add a thumbnail preview for a staged file.
 */
function addImagePreview(file, context, index) {
  const previewGrid = document.getElementById(`${context === "add" ? "add" : "edit"}ImagePreview`);
  if (!previewGrid) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const div = document.createElement("div");
    div.className  = "image-preview-item";
    div.id         = `preview-${context}-${index}`;
    div.innerHTML  = `
      <img src="${e.target.result}" alt="Preview">
      <button type="button" class="remove-preview-btn"
              onclick="removeStagedFile('${context}', ${index})"
              title="Remove image">
        &times;
      </button>
      <div class="preview-filename">${file.name.length > 15 
        ? file.name.substring(0, 12) + "..." 
        : file.name}
      </div>`;
    previewGrid.appendChild(div);
  };
  reader.readAsDataURL(file);
}

/**
 * Remove a staged file from the list and its preview from the DOM.
 */
function removeStagedFile(context, index) {
  if (!stagedFiles[context]) return;
  stagedFiles[context].splice(index, 1);

  // Re-render all previews cleanly
  const previewGrid = document.getElementById(`${context === "add" ? "add" : "edit"}ImagePreview`);
  if (!previewGrid) return;
  previewGrid.innerHTML = "";
  stagedFiles[context].forEach((file, i) => addImagePreview(file, context, i));
}

/**
 * Upload all staged files for a given product ID.
 * Called after the product has been saved and we have its ID.
 * Returns count of successfully uploaded images.
 */
async function uploadStagedImages(productId, context) {
  const files = stagedFiles[context] || [];
  if (files.length === 0) return 0;

  let successCount = 0;
  for (const file of files) {
    try {
      await api.uploadProductImage(productId, file);
      successCount++;
    } catch (err) {
      showNotification(`Failed to upload ${file.name}: ${err.message}`, "error");
    }
  }

  // Clear staged files after upload attempt
  delete stagedFiles[context];
  return successCount;
}
// Inject shared styles
const style = document.createElement("style");
style.textContent = `
/* ── Image Upload Styles ── */
  .image-drop-zone {
    border: 2px dashed #ddd;
    border-radius: 6px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fafafa;
    margin-top: 0.5rem;
  }
  .image-drop-zone:hover,
  .drop-zone-active {
    border-color: var(--primary-red);
    background: #fff5f5;
  }
  .image-preview-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1rem;
  }
  .image-preview-item {
    position: relative;
    width: 100px;
    height: 100px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }
  .image-preview-item img {
    width: 100%;
    height: 80px;
    object-fit: cover;
    display: block;
  }
  .image-preview-item .preview-filename {
    font-size: 0.65rem;
    color: #666;
    text-align: center;
    padding: 2px 4px;
    white-space: nowrap;
    overflow: hidden;
  }
  .remove-preview-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    background: rgba(196,0,0,0.85);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
  .remove-preview-btn:hover { background: #c40000; }
`;
document.head.appendChild(style);