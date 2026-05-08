// ===================================
// ADMIN PANEL CORE FUNCTIONS
// ===================================

// Global state
let currentSection   = "dashboard";
let inventoryPage    = 1;
let filteredInventory = [];
const inventoryPerPage = 10;

// ===================================
// CATEGORY MANAGEMENT
// ===================================

function getCategoriesHTML() {
  return `
    <div class="categories-content">
      <div class="content-header">
        <div>
          <h2><i class="fas fa-tags"></i> Category Management</h2>
          <p>Manage the 14 standard part categories used for filtering</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" onclick="showAddCategoryModal()">
            <i class="fas fa-plus"></i> Add Category
          </button>
        </div>
      </div>

      <div class="admin-table-container">
        <table class="admin-table" id="categoriesTable">
          <thead>
            <tr>
              <th style="width:60px;">Order</th>
              <th>Category Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th style="width:100px;">Products</th>
              <th style="width:120px;">Actions</th>
            </tr>
          </thead>
          <tbody id="categoriesTableBody">
            <tr>
              <td colspan="6" style="text-align:center;padding:2rem;">
                <i class="fas fa-spinner fa-spin"></i> Loading...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top:1.5rem;padding:1rem;
                  background:#fff8f0;border-left:4px solid #ff9800;
                  border-radius:4px;">
        <p style="margin:0;font-size:0.85rem;color:#666;">
          <i class="fas fa-info-circle" style="color:#ff9800;"></i>
          <strong>Note:</strong> Categories with products cannot be deleted.
          Reassign or delete the products first.
          The 14 standard categories are pre-seeded and cover all common
          Mercedes & BMW part types.
        </p>
      </div>
    </div>`;
}


async function loadCategoriesTable() {
  const tbody = document.getElementById("categoriesTableBody");

  try {
    const categories = await api.getCategories();

    if (!categories.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:2rem;color:#999;">
            No categories found.
            <button onclick="showAddCategoryModal()"
                    style="margin-left:1rem;padding:0.4rem 1rem;
                           background:var(--primary-red);color:white;
                           border:none;cursor:pointer;border-radius:4px;">
              Add First Category
            </button>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = categories.map(cat => `
      <tr>
        <td>
          <span style="display:inline-flex;align-items:center;
                       justify-content:center;width:28px;height:28px;
                       background:#f0f0f0;border-radius:50%;
                       font-size:0.8rem;font-weight:600;color:#666;">
            ${cat.sort_order}
          </span>
        </td>
        <td>
          <strong>${cat.name}</strong>
        </td>
        <td>
          <code style="background:#f5f5f5;padding:0.2rem 0.5rem;
                       border-radius:3px;font-size:0.8rem;color:#666;">
            ${cat.slug}
          </code>
        </td>
        <td>
          <span style="font-size:0.85rem;color:#666;">
            ${cat.description
              ? cat.description.length > 60
                ? cat.description.substring(0, 60) + "..."
                : cat.description
              : "<em style='color:#bbb;'>No description</em>"}
          </span>
        </td>
        <td style="text-align:center;">
          <span style="
            display:inline-block;
            padding:0.2rem 0.7rem;
            border-radius:12px;
            font-size:0.82rem;
            font-weight:600;
            background:${cat.product_count > 0 ? "#e6f7ff" : "#f5f5f5"};
            color:${cat.product_count > 0 ? "#1890ff" : "#bbb"};
            border:1px solid ${cat.product_count > 0 ? "#91d5ff" : "#e8e8e8"};
          ">
            ${cat.product_count}
            ${cat.product_count === 1 ? "product" : "products"}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon btn-edit"
                    onclick="showEditCategoryModal(${cat.id})"
                    title="Edit Category">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-delete"
                    onclick="deleteCategoryById(${cat.id}, '${cat.name}', ${cat.product_count})"
                    title="${cat.product_count > 0
                      ? "Cannot delete — has products"
                      : "Delete Category"}"
                    ${cat.product_count > 0 ? "disabled" : ""}
                    style="${cat.product_count > 0
                      ? "opacity:0.3;cursor:not-allowed;"
                      : ""}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`).join("");

  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:2rem;color:#f44336;">
          <i class="fas fa-exclamation-circle"></i>
          Failed to load categories. Please refresh.
        </td>
      </tr>`;
    showNotification("Failed to load categories", "error");
  }
}


// ── ADD CATEGORY MODAL ────────────────────────────────────────
function showAddCategoryModal() {
  document.getElementById("modal-container").innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content" style="max-width:500px;">
        <div class="modal-header">
          <h3><i class="fas fa-plus"></i> Add New Category</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="addCategoryForm" onsubmit="saveNewCategory(event)">

            <div class="form-group">
              <label>Category Name *</label>
              <input type="text"
                     class="form-control"
                     name="name"
                     required
                     placeholder="e.g. Engine Components"
                     oninput="autoGenerateSlug(this.value)">
            </div>

            <div class="form-group">
              <label>
                Slug
                <small style="color:#999;font-weight:400;">
                  (auto-generated — edit if needed)
                </small>
              </label>
              <input type="text"
                     class="form-control"
                     name="slug"
                     id="categorySlugInput"
                     placeholder="engine-components"
                     style="font-family:monospace;">
              <small style="color:#aaa;font-size:0.78rem;">
                Lowercase letters, numbers, and hyphens only
              </small>
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea class="form-control"
                        name="description"
                        rows="3"
                        placeholder="Brief description of what parts this category covers...">
              </textarea>
            </div>

            <div class="form-group">
              <label>Sort Order</label>
              <input type="number"
                     class="form-control"
                     name="sort_order"
                     value="15"
                     min="1"
                     max="999"
                     style="width:120px;">
              <small style="color:#aaa;font-size:0.78rem;">
                Lower number = shown first in filter sidebar
              </small>
            </div>

            <div class="form-actions">
              <button type="button"
                      class="btn-secondary"
                      onclick="closeModal()">
                Cancel
              </button>
              <button type="submit"
                      class="btn-primary"
                      id="addCategorySubmitBtn">
                <i class="fas fa-save"></i> Save Category
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>`;
}


/**
 * Auto-generates a slug from the category name as the user types.
 * Mirrors the backend slugify() logic.
 */
function autoGenerateSlug(name) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[&/\\]/g, " ")      // replace special chars with space
    .replace(/[^a-z0-9]+/g, "-")  // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, "");     // strip leading/trailing hyphens

  const slugInput = document.getElementById("categorySlugInput");
  if (slugInput) slugInput.value = slug;
}


async function saveNewCategory(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const payload = {
    name:        formData.get("name").trim(),
    slug:        formData.get("slug").trim() || null,
    description: formData.get("description").trim() || null,
    sort_order:  parseInt(formData.get("sort_order")) || 15,
  };

  const submitBtn    = document.getElementById("addCategorySubmitBtn");
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled  = true;
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;

  try {
    await api.createCategory(payload);
    closeModal();
    loadCategoriesTable();
    showNotification(`Category "${payload.name}" added successfully!`, "success");
  } catch (err) {
    submitBtn.disabled  = false;
    submitBtn.innerHTML = originalText;
    showNotification(err.message || "Failed to save category", "error");
  }
}


// ── EDIT CATEGORY MODAL ───────────────────────────────────────
async function showEditCategoryModal(categoryId) {
  try {
    const cat = await api.getCategory(categoryId);

    document.getElementById("modal-container").innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width:500px;">
          <div class="modal-header">
            <h3><i class="fas fa-edit"></i> Edit Category</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="editCategoryForm"
                  onsubmit="updateCategory(event, ${cat.id})">

              <div class="form-group">
                <label>Category Name *</label>
                <input type="text"
                       class="form-control"
                       name="name"
                       required
                       value="${cat.name}">
              </div>

              <div class="form-group">
                <label>
                  Slug
                  <small style="color:#999;font-weight:400;">
                    (changing this may break existing filter URLs)
                  </small>
                </label>
                <input type="text"
                       class="form-control"
                       name="slug"
                       value="${cat.slug}"
                       style="font-family:monospace;">
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea class="form-control"
                          name="description"
                          rows="3">${cat.description || ""}</textarea>
              </div>

              <div class="form-group">
                <label>Sort Order</label>
                <input type="number"
                       class="form-control"
                       name="sort_order"
                       value="${cat.sort_order}"
                       min="1" max="999"
                       style="width:120px;">
              </div>

              ${cat.product_count > 0 ? `
                <div style="background:#fff8e1;border-left:4px solid #ffc107;
                            padding:0.75rem;margin-bottom:1rem;font-size:0.85rem;">
                  <i class="fas fa-info-circle" style="color:#ffc107;"></i>
                  This category has <strong>${cat.product_count} product(s)</strong>.
                  Renaming it will update the display immediately.
                </div>` : ""}

              <div class="form-actions">
                <button type="button"
                        class="btn-secondary"
                        onclick="closeModal()">
                  Cancel
                </button>
                <button type="submit"
                        class="btn-primary"
                        id="editCategorySubmitBtn">
                  <i class="fas fa-save"></i> Update Category
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>`;

  } catch (err) {
    showNotification("Failed to load category", "error");
  }
}


async function updateCategory(event, categoryId) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const payload = {
    name:        formData.get("name").trim(),
    slug:        formData.get("slug").trim() || null,
    description: formData.get("description").trim() || null,
    sort_order:  parseInt(formData.get("sort_order")) || 1,
  };

  const submitBtn    = document.getElementById("editCategorySubmitBtn");
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled  = true;
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;

  try {
    await api.updateCategory(categoryId, payload);
    closeModal();
    loadCategoriesTable();
    showNotification("Category updated successfully!", "success");
  } catch (err) {
    submitBtn.disabled  = false;
    submitBtn.innerHTML = originalText;
    showNotification(err.message || "Failed to update category", "error");
  }
}


// ── DELETE CATEGORY ───────────────────────────────────────────
async function deleteCategoryById(categoryId, categoryName, productCount) {
  // Hard block — should never reach here since button is disabled
  // but double-check for safety
  if (productCount > 0) {
    showNotification(
      `Cannot delete "${categoryName}" — it has ${productCount} product(s). ` +
      `Reassign them first.`,
      "error"
    );
    return;
  }

  if (!confirm(
    `Delete category "${categoryName}"?\n\n` +
    `This cannot be undone.`
  )) return;

  try {
    await api.deleteCategory(categoryId);
    loadCategoriesTable();
    showNotification(
      `Category "${categoryName}" deleted successfully!`,
      "success"
    );
  } catch (err) {
    showNotification(err.message || "Failed to delete category", "error");
  }
}

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
    case 'categories':
      contentArea.innerHTML = getCategoriesHTML();
      loadCategoriesTable();
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
          <button class="btn-secondary"
                  onclick="window.open(API_BASE + '/api/products/export/csv')">
            <i class="fas fa-download"></i> Export CSV
          </button>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="inventorySearch"
                 placeholder="Search by name, SKU, OEM number..."
                 onkeyup="searchInventory()">
        </div>
        <div class="filter-controls">
          <select id="brandFilter" onchange="filterInventory()">
            <option value="">All Brands</option>
            <option value="mercedes">Mercedes-Benz</option>
            <option value="bmw">BMW</option>
          </select>

          <!-- Category filter — populated dynamically from API -->
          <select id="categoryFilter" onchange="filterInventory()">
            <option value="">All Categories</option>
            <!-- Options injected by loadCategoryFilter() -->
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
              <tr>
                <td colspan="8" style="text-align:center;padding:2rem;">
                  <i class="fas fa-spinner fa-spin"></i> Loading...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="table-footer">
        <div class="table-info">
          Showing <span id="inventoryCount">0</span> products
        </div>
        <div class="pagination">
          <button class="page-btn" onclick="changeInventoryPage(-1)">
            ← Previous
          </button>
          <span class="page-numbers">
            Page <span id="inventoryPage">1</span>
            of <span id="inventoryTotalPages">1</span>
          </span>
          <button class="page-btn" onclick="changeInventoryPage(1)">
            Next →
          </button>
        </div>
      </div>
    </div>`;
}

async function loadInventoryTable() {
  try {
    // Load categories for the filter dropdown and products in parallel
    const [res] = await Promise.all([
      api.getProducts(
        `?page=${inventoryPage}&per_page=${inventoryPerPage}`
      ),
      loadCategoryFilter()   // populates category dropdown
    ]);

    renderInventoryTable(res);
  } catch (err) {
    showNotification("Failed to load inventory", "error");
  }
}

function renderInventoryTable(res) {
  const tbody = document.getElementById("inventoryTableBody");

  if (!res.products.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:2rem;color:#999;">
          <i class="fas fa-box-open" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>
          No products found
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = res.products.map(p => `
    <tr>
      <td><strong>${p.sku}</strong></td>
      <td>
        <div class="product-info">
          <strong>${p.name}</strong>
          <small style="color:#999;">${p.oem_number || ""}</small>
        </div>
      </td>
      <td>
        <span class="brand-badge ${p.brand}">
          ${p.brand.toUpperCase()}
        </span>
      </td>
      <td>
        <!-- Show category name from nested object, fallback to ID -->
        ${p.category
          ? `<span class="category-badge">${p.category.name}</span>`
          : `<span style="color:#bbb;font-size:0.8rem;">Uncategorised</span>`
        }
      </td>
      <td>
        <div class="stock-info">
          <span class="stock-quantity">${p.stock}</span>
          <small style="color:#999;">Min: ${p.min_stock}</small>
        </div>
      </td>
      <td>KES ${p.price.toLocaleString()}</td>
      <td>${getStockStatusBadge(p.stock, p.min_stock)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon btn-edit"
                  onclick="editProduct('${p.id}')"
                  title="Edit Product">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon btn-delete"
                  onclick="deleteProduct('${p.id}')"
                  title="Delete Product">
            <i class="fas fa-trash"></i>
          </button>
          <button class="btn-icon" 
              onclick="copyProductUrl('${p.id}')"
              title="Copy product URL"
              style="background:#667eea;color:white;">
            <i class="fas fa-link"></i>
          </button>
        </div>
      </td>
    </tr>`).join("");

  // Update pagination info
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
  const brand      = document.getElementById("brandFilter").value;
  const categoryId = document.getElementById("categoryFilter").value;
  const stock      = document.getElementById("stockFilter").value;
  inventoryPage    = 1;

  let params = `?page=1&per_page=${inventoryPerPage}`;
  if (brand)      params += `&brand=${brand}`;
  if (categoryId) params += `&category_id=${categoryId}`;
  if (stock)      params += `&stock_level=${stock}`;

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
/**
 * Populates the category filter dropdown in the inventory table
 * by fetching categories from the API.
 * Called once when the inventory section loads.
 */
async function loadCategoryFilter() {
  const select = document.getElementById("categoryFilter");
  if (!select) return;

  try {
    const categories = await api.getCategories();

    // Keep the "All Categories" option, append the rest
    const options = categories.map(cat =>
      `<option value="${cat.id}">
        ${cat.name}
        ${cat.product_count > 0
          ? `(${cat.product_count})`
          : ""}
      </option>`
    ).join("");

    select.innerHTML = `<option value="">All Categories</option>${options}`;

  } catch (err) {
    // Non-critical — filter just won't have categories
    console.warn("Could not load categories for filter:", err.message);
  }
}
// ===================================
// PRODUCT MODALS
// ===================================
async function showAddProductModal() {
  // ── Load categories from API before building the modal ─────
  let categoriesOptions = '<option value="">Loading...</option>';
  try {
    const categories = await api.getCategories();
    categoriesOptions = '<option value="">Select Category</option>' +
      categories.map(cat =>
        `<option value="${cat.id}">${cat.name}</option>`
      ).join("");
  } catch (err) {
    categoriesOptions = '<option value="">Failed to load categories</option>';
  }

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
                <input type="text" class="form-control" name="sku"
                       required placeholder="MB-OF-001">
              </div>
              <div class="form-group">
                <label>Product Name *</label>
                <input type="text" class="form-control" name="name"
                       required placeholder="Mercedes Oil Filter">
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
                <select class="form-control" name="category_id" required>
                  ${categoriesOptions}
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
                <input type="text" class="form-control" name="oem_number"
                       placeholder="A 642 180 02 00">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Cost Price (KES) *</label>
                <input type="number" class="form-control" name="cost"
                       required step="100" min="0">
              </div>
              <div class="form-group">
                <label>Selling Price (KES) *</label>
                <input type="number" class="form-control" name="price"
                       required step="100" min="0">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Current Stock *</label>
                <input type="number" class="form-control" name="stock"
                       required min="0">
              </div>
              <div class="form-group">
                <label>Minimum Stock *</label>
                <input type="number" class="form-control" name="min_stock"
                       required min="1" value="5">
              </div>
            </div>

            <!-- ── Vehicle Compatibility ──────────────────── -->
            <div class="form-section-label">
              <i class="fas fa-car"></i> Vehicle Compatibility
              <small style="color:#999;font-weight:400;">
                (optional — leave blank if part fits all)
              </small>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Model Type</label>
                <input type="text" class="form-control" name="model_type"
                       placeholder="e.g. E200, E350, 320i, X5">
              </div>
              <div class="form-group">
                <label>Engine Type</label>
                <select class="form-control" name="engine_type">
                  <option value="">Petrol & Diesel (both)</option>
                  <option value="petrol">Petrol only</option>
                  <option value="diesel">Diesel only</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Compatible From (Year)</label>
                <input type="number" class="form-control" name="year_min"
                       min="1980" max="2026" placeholder="e.g. 2015">
              </div>
              <div class="form-group">
                <label>Compatible To (Year)</label>
                <input type="number" class="form-control" name="year_max"
                       min="1980" max="2026" placeholder="e.g. 2022">
              </div>
            </div>
            <!-- ── End Vehicle Compatibility ─────────────── -->

            <div class="form-group">
              <label>Description</label>
              <textarea class="form-control" name="description"
                        rows="3"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Supplier</label>
                <input type="text" class="form-control" name="supplier"
                       placeholder="Mercedes-Benz Kenya">
              </div>
              <div class="form-group">
                <label>Location</label>
                <input type="text" class="form-control" name="location"
                       placeholder="Shelf A-12">
              </div>
            </div>

            <!-- ── Image Upload Section (unchanged) ──────── -->
            <div class="form-group" style="margin-top:1.5rem;">
              <label>
                Product Images
                <small style="color:#999;font-weight:400;">
                  (optional — max 6 images, 5MB each)
                </small>
              </label>
              <div class="image-drop-zone" id="addImageDropZone"
                onclick="document.getElementById('addImageInput').click()"
                ondragover="handleDragOver(event)"
                ondragleave="handleDragLeave(event)"
                ondrop="handleDrop(event, 'add')">
                <i class="fas fa-cloud-upload-alt"
                   style="font-size:2rem;color:#ccc;"></i>
                <p style="margin:0.5rem 0 0;color:#999;font-size:0.9rem;">
                  Drag & drop images here or <strong>click to browse</strong>
                </p>
                <p style="margin:0.25rem 0 0;color:#bbb;font-size:0.8rem;">
                  JPG, PNG, WEBP — max 5MB each
                </p>
              </div>
              <input type="file" id="addImageInput"
                     accept=".jpg,.jpeg,.png,.webp"
                     multiple style="display:none"
                     onchange="handleFileSelect(event, 'add')">
              <div class="image-preview-grid" id="addImagePreview"></div>
            </div>
            <!-- ── End Image Upload Section ───────────────── -->

            <div class="form-actions">
              <button type="button" class="btn-secondary"
                      onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary"
                      id="addProductSubmitBtn">
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

  // ── Build product payload with new fields ──────────────────
  const product = {
    sku:         formData.get("sku"),
    name:        formData.get("name"),
    brand:       formData.get("brand"),
    category_id: parseInt(formData.get("category_id")),
    type:        formData.get("type"),
    oem_number:  formData.get("oem_number") || null,
    cost:        parseFloat(formData.get("cost")),
    price:       parseFloat(formData.get("price")),
    stock:       parseInt(formData.get("stock")),
    min_stock:   parseInt(formData.get("min_stock")),
    description: formData.get("description") || null,
    supplier:    formData.get("supplier")    || null,
    location:    formData.get("location")    || null,

    // ── New vehicle compatibility fields ───────────────────
    model_type:  formData.get("model_type")  || null,
    engine_type: formData.get("engine_type") || null,

    // Only send year fields if they have values
    year_min: formData.get("year_min")
              ? parseInt(formData.get("year_min")) : null,
    year_max: formData.get("year_max")
              ? parseInt(formData.get("year_max")) : null,
  };

  // ── Disable submit button to prevent double submit ─────────
  const submitBtn      = document.getElementById("addProductSubmitBtn");
  const originalText   = submitBtn.innerHTML;
  submitBtn.disabled   = true;
  submitBtn.innerHTML  = `<i class="fas fa-spinner fa-spin"></i> Saving...`;

  try {
    // ── Step 1: Save the product ───────────────────────────
    const newProduct = await api.createProduct(product);

    // ── Step 2: Upload staged images if any ───────────────
    const stagedCount = (stagedFiles["add"] || []).length;

    if (stagedCount > 0) {
      submitBtn.innerHTML =
        `<i class="fas fa-spinner fa-spin"></i> Uploading images...`;

      const uploadedCount = await uploadStagedImages(newProduct.id, "add");

      if (uploadedCount < stagedCount) {
        showNotification(
          `Product saved. ${uploadedCount}/${stagedCount} images uploaded.`,
          "info"
        );
      } else {
        showNotification(
          `Product added with ${uploadedCount} image${uploadedCount !== 1 ? "s" : ""}!`,
          "success"
        );
      }
    } else {
      showNotification("Product added successfully!", "success");
    }

    closeModal();
    loadInventoryTable();
    updateQuickStats();

  } catch (err) {
    submitBtn.disabled  = false;
    submitBtn.innerHTML = originalText;
    showNotification(err.message || "Failed to save product", "error");
  }
}

async function editProduct(productId) {
  try {
    // ── Load product and categories in parallel ─────────────
    const [p, categories] = await Promise.all([
      api.getProduct(productId),
      api.getCategories()
    ]);

    // ── Build category dropdown with current value selected ─
    const categoriesOptions = categories.map(cat =>
      `<option value="${cat.id}"
        ${p.category_id === cat.id ? "selected" : ""}>
        ${cat.name}
      </option>`
    ).join("");

    // ── Build existing images HTML ──────────────────────────
    const existingImagesHTML = (p.images && p.images.length > 0)
      ? p.images.map( image,index => {
          const imageUrl = typeof image === "object"
            ? image.url
            : image.startsWith("http")
              ? image 
              : api.getImageUrl(image);
          return `
            <div class="image-preview-item" id="existing-img-${index}">
              <img src="${imageUrl}" alt="Product image">
              <button type="button" class="remove-preview-btn"
                      onclick="deleteExistingImage('${p.id}', '${index}')"
                      title="Delete image">
                &times;
              </button>
              <div class="preview-filename">saved</div>
            </div>`}).
          join("")
      : `<p style="color:#999;font-size:0.85rem;margin:0;">
           No images yet
         </p>`;

    document.getElementById("modal-container").innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width:700px">
          <div class="modal-header">
            <h3><i class="fas fa-edit"></i> Edit Product</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="editProductForm"
                  onsubmit="updateProduct(event, '${p.id}')">

              <div class="form-row">
                <div class="form-group">
                  <label>SKU *</label>
                  <input type="text" class="form-control" name="sku"
                         required value="${p.sku}">
                </div>
                <div class="form-group">
                  <label>Product Name *</label>
                  <input type="text" class="form-control" name="name"
                         required value="${p.name}">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Brand *</label>
                  <select class="form-control" name="brand" required>
                    <option value="mercedes"
                      ${p.brand === "mercedes" ? "selected" : ""}>
                      Mercedes-Benz
                    </option>
                    <option value="bmw"
                      ${p.brand === "bmw" ? "selected" : ""}>
                      BMW
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Category *</label>
                  <select class="form-control" name="category_id" required>
                    <option value="">Select Category</option>
                    ${categoriesOptions}
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Type</label>
                  <select class="form-control" name="type">
                    <option value="genuine"
                      ${p.type === "genuine" ? "selected" : ""}>
                      Genuine
                    </option>
                    <option value="oem"
                      ${p.type === "oem" ? "selected" : ""}>
                      OEM
                    </option>
                    <option value="aftermarket"
                      ${p.type === "aftermarket" ? "selected" : ""}>
                      Aftermarket
                    </option>
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
                  <input type="number" class="form-control" name="min_stock"
                         required min="1" value="${p.min_stock}">
                </div>
              </div>

              <!-- ── Vehicle Compatibility ──────────────── -->
              <div class="form-section-label">
                <i class="fas fa-car"></i> Vehicle Compatibility
                <small style="color:#999;font-weight:400;">
                  (leave blank if part fits all)
                </small>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Model Type</label>
                  <input type="text" class="form-control" name="model_type"
                         placeholder="e.g. E200, E350, 320i, X5"
                         value="${p.model_type || ""}">
                </div>
                <div class="form-group">
                  <label>Engine Type</label>
                  <select class="form-control" name="engine_type">
                    <option value=""
                      ${!p.engine_type ? "selected" : ""}>
                      Petrol & Diesel (both)
                    </option>
                    <option value="petrol"
                      ${p.engine_type === "petrol" ? "selected" : ""}>
                      Petrol only
                    </option>
                    <option value="diesel"
                      ${p.engine_type === "diesel" ? "selected" : ""}>
                      Diesel only
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Compatible From (Year)</label>
                  <input type="number" class="form-control" name="year_min"
                         min="1980" max="2026"
                         value="${p.year_min || ""}"
                         placeholder="e.g. 2015">
                </div>
                <div class="form-group">
                  <label>Compatible To (Year)</label>
                  <input type="number" class="form-control" name="year_max"
                         min="1980" max="2026"
                         value="${p.year_max || ""}"
                         placeholder="e.g. 2022">
                </div>
              </div>
              <!-- ── End Vehicle Compatibility ─────────── -->

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

              <!-- ── Image Management Section (unchanged) ── -->
              <div class="form-group" style="margin-top:1.5rem;">
                <label>
                  Product Images
                  <small style="color:#999;font-weight:400;">
                    (${p.images ? p.images.length : 0}/6 — click &times; to remove)
                  </small>
                </label>

                <div class="image-preview-grid" id="existingImagesGrid">
                  ${existingImagesHTML}
                </div>

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
                      Add more images — drag & drop or
                      <strong>click to browse</strong>
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
                <button type="button" class="btn-secondary"
                        onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary"
                        id="editProductSubmitBtn">
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
async function deleteExistingImage(productId, imageIndex) {
  if (!confirm("Delete this image? This cannot be undone.")) return;

  try {
    await api.deleteProductImage(productId, imageIndex);

    // Remove the thumbnail from the DOM without closing the modal
    const thumb = document.getElementById(`existing-img-${imageIndex}`);
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
    category_id: parseInt(formData.get("category_id")),
    type:        formData.get("type"),
    oem_number:  formData.get("oem_number")  || null,
    cost:        parseFloat(formData.get("cost")),
    price:       parseFloat(formData.get("price")),
    stock:       parseInt(formData.get("stock")),
    min_stock:   parseInt(formData.get("min_stock")),
    description: formData.get("description") || null,
    supplier:    formData.get("supplier")    || null,
    location:    formData.get("location")    || null,

    // ── Vehicle compatibility fields ───────────────────────
    model_type:  formData.get("model_type")  || null,
    engine_type: formData.get("engine_type") || null,
    year_min:    formData.get("year_min")
                 ? parseInt(formData.get("year_min")) : null,
    year_max:    formData.get("year_max")
                 ? parseInt(formData.get("year_max")) : null,
  };

  const submitBtn    = document.getElementById("editProductSubmitBtn");
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled  = true;
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;

  try {
    await api.updateProduct(productId, payload);

    // ── Upload any newly staged images ─────────────────────
    const stagedCount = (stagedFiles[productId] || []).length;

    if (stagedCount > 0) {
      submitBtn.innerHTML =
        `<i class="fas fa-spinner fa-spin"></i> Uploading images...`;
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

function copyProductUrl(productId) {
  const url = `https://germangarage.netlify.app/product.html?id=${productId}`;
  navigator.clipboard.writeText(url).then(() => {
    showNotification("Product URL copied!", "success");
  });
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
  .form-section-label {
    font-family: 'Oswald', sans-serif;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
    border-bottom: 2px solid var(--primary-red);
    padding-bottom: 0.4rem;
    margin: 1.5rem 0 1rem;
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

  .category-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    background: #f0f0f0;
    color: #555;
    border: 1px solid #ddd;
    white-space: nowrap;
  }

  /* ── Category table ─────────────────────────────── */
  .categories-content .admin-table code {
    background: #f5f5f5;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    font-size: 0.8rem;
    color: #666;
  }

  .btn-icon:disabled {
    opacity: 0.3;
    cursor: not-allowed !important;
  }

  .btn-icon:disabled:hover {
    transform: none;
  }
`;
document.head.appendChild(style);