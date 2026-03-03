// ===================================
// ADMIN PANEL CORE FUNCTIONS
// ===================================

// Global variables
let currentSection = 'dashboard';
let products = JSON.parse(localStorage.getItem('inventory')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let customers = JSON.parse(localStorage.getItem('customers')) || [];
let suppliers = JSON.parse(localStorage.getItem('suppliers')) || [];

// Initialize admin panel
function initAdminPanel() {
  loadSection('dashboard');
  updateQuickStats();
  
  // Load data from localStorage
  loadAllData();
  
  // Set up auto-refresh every 5 minutes
  setInterval(updateQuickStats, 300000);
}

// Load section content
function loadSection(section) {
  currentSection = section;
  
  // Update navigation
  document.querySelectorAll('.admin-nav-menu a').forEach(link => {
    link.classList.remove('nav-active');
  });
  document.querySelector(`a[href="#${section}"]`).classList.add('nav-active');
  
  // Load section content
  const contentArea = document.getElementById('content-area');
  
  switch(section) {
    case 'dashboard':
      contentArea.innerHTML = getDashboardHTML();
      loadDashboardCharts();
      break;
    case 'inventory':
      contentArea.innerHTML = getInventoryHTML();
      loadInventoryTable();
      break;
    case 'orders':
      contentArea.innerHTML = getOrdersHTML();
      loadOrdersTable();
      break;
    case 'customers':
      contentArea.innerHTML = getCustomersHTML();
      loadCustomersTable();
      break;
    case 'reports':
      contentArea.innerHTML = getReportsHTML();
      loadReports();
      break;
    case 'suppliers':
      contentArea.innerHTML = getSuppliersHTML();
      loadSuppliersTable();
      break;
    case 'settings':
      contentArea.innerHTML = getSettingsHTML();
      break;
  }
  
  // Update page title
  document.title = `${section.charAt(0).toUpperCase() + section.slice(1)} | Admin Panel`;
}

// ===================================
// DASHBOARD FUNCTIONS
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
          <div class="stat-trend trend-up" id="revenueTrend">+0% from yesterday</div>
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
          <h3><i class="fas fa-box"></i> Inventory Status</h3>
          <div class="chart-container">
            <canvas id="inventoryChart" width="400" height="200"></canvas>
          </div>
        </div>
        
        <div class="dashboard-card">
          <h3><i class="fas fa-clock"></i> Recent Orders</h3>
          <div id="recentOrdersList" class="orders-list">
            <!-- Recent orders will be loaded here -->
          </div>
        </div>
        
        <div class="dashboard-card">
          <h3><i class="fas fa-exclamation-triangle"></i> Stock Alerts</h3>
          <div id="stockAlertsList" class="alerts-list">
            <!-- Stock alerts will be loaded here -->
          </div>
        </div>
      </div>
      
      <div class="dashboard-card">
        <h3><i class="fas fa-truck"></i> Recent Supplier Orders</h3>
        <div id="supplierOrdersList">
          <!-- Supplier orders will be loaded here -->
        </div>
      </div>
    </div>
  `;
}

function updateQuickStats() {
  // Calculate totals
  const totalRevenue = orders.reduce((sum, order) => {
    return order.status === 'completed' ? sum + order.total : sum;
  }, 0);
  
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock <= p.minStock).length;
  const totalCustomers = customers.length;
  
  // Update quick stats in nav
  document.getElementById('lowStockCount').textContent = lowStockProducts;
  document.getElementById('pendingOrdersCount').textContent = pendingOrders;
  document.getElementById('todayRevenue').textContent = `KES ${getTodayRevenue().toLocaleString()}`;
  
  // Update dashboard stats if on dashboard
  if (currentSection === 'dashboard') {
    document.getElementById('totalRevenue').textContent = `KES ${totalRevenue.toLocaleString()}`;
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalCustomers').textContent = totalCustomers;
    document.getElementById('ordersTrend').textContent = `${pendingOrders} pending`;
    document.getElementById('stockAlert').textContent = `${lowStockProducts} low stock`;
  }
}

function getTodayRevenue() {
  const today = new Date().toISOString().split('T')[0];
  return orders.reduce((sum, order) => {
    if (order.status === 'completed' && order.date.startsWith(today)) {
      return sum + order.total;
    }
    return sum;
  }, 0);
}

function loadDashboardCharts() {
  // Sales Chart
  const salesCtx = document.getElementById('salesChart')?.getContext('2d');
  if (salesCtx) {
    const last7Days = getLast7Days();
    const salesData = last7Days.map(day => getSalesForDay(day));
    
    new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: last7Days.map(d => d.split('-')[2]), // Just show day number
        datasets: [{
          label: 'Daily Sales (KES)',
          data: salesData,
          borderColor: '#c40000',
          backgroundColor: 'rgba(196, 0, 0, 0.1)',
          borderWidth: 2,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
  
  // Inventory Chart
  const inventoryCtx = document.getElementById('inventoryChart')?.getContext('2d');
  if (inventoryCtx) {
    const categories = ['Brakes', 'Filters', 'Engine', 'Suspension', 'Electrical'];
    const counts = categories.map(cat => 
      products.filter(p => p.category === cat.toLowerCase()).length
    );
    
    new Chart(inventoryCtx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: counts,
          backgroundColor: [
            '#c40000',
            '#ff9800',
            '#2196f3',
            '#4caf50',
            '#9c27b0'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
}

function getSalesForDay(date) {
  return orders.reduce((sum, order) => {
    if (order.status === 'completed' && order.date === date) {
      return sum + order.total;
    }
    return sum;
  }, 0);
}

// ===================================
// INVENTORY MANAGEMENT
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
          <button class="btn-secondary" onclick="exportInventoryCSV()">
            <i class="fas fa-download"></i> Export CSV
          </button>
          <button class="btn-secondary" onclick="importInventoryModal()">
            <i class="fas fa-upload"></i> Import CSV
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
              <!-- Inventory rows will be loaded here -->
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
    </div>
  `;
}

let inventoryPage = 1;
const inventoryPerPage = 10;
let filteredInventory = [];

function loadInventoryTable() {
  filteredInventory = [...products];
  renderInventoryTable();
}

function renderInventoryTable() {
  const tbody = document.getElementById('inventoryTableBody');
  const start = (inventoryPage - 1) * inventoryPerPage;
  const end = start + inventoryPerPage;
  const pageProducts = filteredInventory.slice(start, end);
  
  tbody.innerHTML = pageProducts.map(product => `
    <tr>
      <td><strong>${product.sku || product.id}</strong></td>
      <td>
        <div class="product-info">
          <strong>${product.name}</strong>
          <small>${product.oemNumber || ''}</small>
        </div>
      </td>
      <td>
        <span class="brand-badge ${product.brand}">
          ${product.brand.toUpperCase()}
        </span>
      </td>
      <td>${product.category}</td>
      <td>
        <div class="stock-info">
          <span class="stock-quantity">${product.stock}</span>
          <small>Min: ${product.minStock || 5}</small>
        </div>
      </td>
      <td>KES ${product.price.toLocaleString()}</td>
      <td>
        ${getStockStatusBadge(product.stock, product.minStock)}
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon btn-view" onclick="viewProduct('${product.id}')" 
                  title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon btn-edit" onclick="editProduct('${product.id}')" 
                  title="Edit Product">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon btn-delete" onclick="deleteProduct('${product.id}')" 
                  title="Delete Product">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // Update pagination info
  document.getElementById('inventoryCount').textContent = filteredInventory.length;
  document.getElementById('inventoryPage').textContent = inventoryPage;
  document.getElementById('inventoryTotalPages').textContent = 
    Math.ceil(filteredInventory.length / inventoryPerPage);
}

function getStockStatusBadge(stock, minStock) {
  if (stock === 0) {
    return '<span class="status-badge status-cancelled">Out of Stock</span>';
  } else if (stock <= minStock) {
    return '<span class="status-badge status-low">Low Stock</span>';
  } else if (stock <= minStock * 2) {
    return '<span class="status-badge status-medium">Medium</span>';
  } else {
    return '<span class="status-badge status-good">In Stock</span>';
  }
}

function searchInventory() {
  const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
  filteredInventory = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm)) ||
    (product.oemNumber && product.oemNumber.toLowerCase().includes(searchTerm))
  );
  inventoryPage = 1;
  renderInventoryTable();
}

function filterInventory() {
  const category = document.getElementById('categoryFilter').value;
  const brand = document.getElementById('brandFilter').value;
  const stock = document.getElementById('stockFilter').value;
  
  filteredInventory = products.filter(product => {
    if (category && product.category !== category) return false;
    if (brand && product.brand !== brand) return false;
    
    if (stock === 'low' && product.stock > product.minStock) return false;
    if (stock === 'out' && product.stock > 0) return false;
    if (stock === 'good' && product.stock <= product.minStock * 2) return false;
    
    return true;
  });
  
  inventoryPage = 1;
  renderInventoryTable();
}

function changeInventoryPage(direction) {
  const totalPages = Math.ceil(filteredInventory.length / inventoryPerPage);
  inventoryPage += direction;
  
  if (inventoryPage < 1) inventoryPage = 1;
  if (inventoryPage > totalPages) inventoryPage = totalPages;
  
  renderInventoryTable();
}

// ===================================
// PRODUCT MODAL FUNCTIONS
// ===================================

function showAddProductModal() {
  const modalHTML = `
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
                <input type="text" class="form-control" name="sku" required 
                       placeholder="MB-OF-001">
              </div>
              <div class="form-group">
                <label>Product Name *</label>
                <input type="text" class="form-control" name="name" required 
                       placeholder="Mercedes Oil Filter">
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
                <input type="text" class="form-control" name="oemNumber" 
                       placeholder="A 642 180 02 00">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Cost Price (KES) *</label>
                <input type="number" class="form-control" name="cost" required 
                       step="100" min="0" placeholder="3800">
              </div>
              <div class="form-group">
                <label>Selling Price (KES) *</label>
                <input type="number" class="form-control" name="price" required 
                       step="100" min="0" placeholder="5200">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Current Stock *</label>
                <input type="number" class="form-control" name="stock" required 
                       min="0" placeholder="12">
              </div>
              <div class="form-group">
                <label>Minimum Stock *</label>
                <input type="number" class="form-control" name="minStock" required 
                       min="1" value="5">
              </div>
            </div>
            
            <div class="form-group">
              <label>Description</label>
              <textarea class="form-control" name="description" rows="3" 
                        placeholder="Product description..."></textarea>
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
            
            <div class="form-actions">
              <button type="button" class="btn-secondary" onclick="closeModal()">
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-save"></i> Save Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('modal-container').innerHTML = modalHTML;
}

function saveNewProduct(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const product = {
    id: 'prod_' + Date.now(),
    sku: formData.get('sku'),
    name: formData.get('name'),
    brand: formData.get('brand'),
    category: formData.get('category'),
    type: formData.get('type'),
    oemNumber: formData.get('oemNumber'),
    cost: parseInt(formData.get('cost')),
    price: parseInt(formData.get('price')),
    stock: parseInt(formData.get('stock')),
    minStock: parseInt(formData.get('minStock')),
    description: formData.get('description'),
    supplier: formData.get('supplier'),
    location: formData.get('location'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  products.push(product);
  localStorage.setItem('inventory', JSON.stringify(products));
  
  // Log activity
  logAdminActivity('add_product', `Added product: ${product.name} (${product.sku})`);
  
  closeModal();
  loadInventoryTable();
  updateQuickStats();
  
  showNotification('Product added successfully!', 'success');
}

function editProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const modalHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-edit"></i> Edit Product</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="editProductForm" onsubmit="updateProduct(event, '${productId}')">
            <!-- Similar form to add product, but pre-filled -->
            <div class="form-row">
              <div class="form-group">
                <label>SKU *</label>
                <input type="text" class="form-control" name="sku" required 
                       value="${product.sku || ''}">
              </div>
              <div class="form-group">
                <label>Product Name *</label>
                <input type="text" class="form-control" name="name" required 
                       value="${product.name}">
              </div>
            </div>
            
            <!-- Add all other fields similarly -->
            
            <div class="form-actions">
              <button type="button" class="btn-secondary" onclick="closeModal()">
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-save"></i> Update Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('modal-container').innerHTML = modalHTML;
}

function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
    return;
  }
  
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) return;
  
  const productName = products[productIndex].name;
  products.splice(productIndex, 1);
  localStorage.setItem('inventory', JSON.stringify(products));
  
  logAdminActivity('delete_product', `Deleted product: ${productName}`);
  
  loadInventoryTable();
  updateQuickStats();
  showNotification('Product deleted successfully!', 'success');
}

// ===================================
// ORDER MANAGEMENT
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
          <button class="btn-secondary" onclick="exportOrdersCSV()">
            <i class="fas fa-download"></i> Export Orders
          </button>
        </div>
      </div>
      
      <div class="filters-bar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="ordersSearch" placeholder="Search orders..." 
                 onkeyup="searchOrders()">
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
        <table class="admin-table" id="ordersTable">
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
            <!-- Orders will be loaded here -->
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function loadOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  
  // Sort orders by date (newest first)
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  tbody.innerHTML = sortedOrders.map(order => `
    <tr>
      <td><strong>${order.number}</strong></td>
      <td>${order.customer?.name || 'Guest'}</td>
      <td>${formatDate(order.date)}</td>
      <td>${order.items?.length || 0} items</td>
      <td>KES ${order.total?.toLocaleString() || '0'}</td>
      <td>
        <span class="payment-status ${order.paymentStatus || 'pending'}">
          ${order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
        </span>
      </td>
      <td>
        <select class="status-select" onchange="updateOrderStatus('${order.number}', this.value)" 
                value="${order.status}">
          <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
          <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
          <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon btn-view" onclick="viewOrderDetails('${order.number}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon btn-edit" onclick="editOrder('${order.number}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon" onclick="printOrder('${order.number}')" 
                  style="background: #e0e0e0; color: #333;">
            <i class="fas fa-print"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
}

function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.querySelector('.admin-notification');
  if (existing) existing.remove();
  
  // Create notification
  const notification = document.createElement('div');
  notification.className = `admin-notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         'info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">
      &times;
    </button>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'success' ? '#4caf50' : 
                 type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-width: 300px;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    animation: slideInRight 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function loadAllData() {
  // Load from localStorage
  products = JSON.parse(localStorage.getItem('inventory')) || [];
  orders = JSON.parse(localStorage.getItem('orders')) || [];
  customers = JSON.parse(localStorage.getItem('customers')) || [];
  suppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
  
  // Initialize if empty
  if (products.length === 0) {
    initializeSampleData();
  }
}

function initializeSampleData() {
  // Sample products
  products = [
    {
      id: 'prod_1',
      sku: 'MB-OF-001',
      name: 'Mercedes Oil Filter',
      brand: 'mercedes',
      category: 'filters',
      type: 'genuine',
      oemNumber: 'A 642 180 02 00',
      price: 5200,
      cost: 3800,
      stock: 12,
      minStock: 5,
      description: 'Genuine Mercedes oil filter',
      supplier: 'Mercedes-Benz Kenya',
      location: 'Shelf A-12',
      createdAt: '2024-01-15T10:00:00Z'
    }
  ];
  
  // Sample order
  orders = [{
    number: 'ORD-202401-001',
    customer: {
      name: 'John Doe',
      phone: '+254712345678',
      email: 'john@example.com'
    },
    date: '2024-01-20',
    items: [
      { productId: 'prod_1', name: 'Mercedes Oil Filter', price: 5200, quantity: 2 }
    ],
    total: 10400,
    status: 'pending',
    paymentStatus: 'paid',
    delivery: {
      method: 'pickup',
      address: 'Nairobi CBD'
    }
  }];
  
  // Save to localStorage
  localStorage.setItem('inventory', JSON.stringify(products));
  localStorage.setItem('orders', JSON.stringify(orders));
  localStorage.setItem('customers', JSON.stringify(customers));
  localStorage.setItem('suppliers', JSON.stringify(suppliers));
}

// Export functions
function exportInventoryCSV() {
  const headers = ['SKU', 'Name', 'Brand', 'Category', 'OEM Number', 'Price', 'Cost', 'Stock', 'Min Stock', 'Location'];
  const csvRows = [headers.join(',')];
  
  products.forEach(product => {
    const row = [
      product.sku || '',
      `"${product.name}"`,
      product.brand,
      product.category,
      product.oemNumber || '',
      product.price,
      product.cost || '',
      product.stock,
      product.minStock || 5,
      product.location || ''
    ];
    csvRows.push(row.join(','));
  });
  
  downloadCSV(csvRows.join('\n'), 'inventory-export.csv');
}

function exportOrdersCSV() {
  const headers = ['Order Number', 'Customer', 'Date', 'Items', 'Total', 'Status', 'Payment Status'];
  const csvRows = [headers.join(',')];
  
  orders.forEach(order => {
    const row = [
      order.number,
      `"${order.customer?.name || 'Guest'}"`,
      order.date,
      order.items?.length || 0,
      order.total || 0,
      order.status,
      order.paymentStatus || 'pending'
    ];
    csvRows.push(row.join(','));
  });
  
  downloadCSV(csvRows.join('\n'), 'orders-export.csv');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .brand-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .brand-badge.mercedes {
    background: #e6f7ff;
    color: #1890ff;
    border: 1px solid #91d5ff;
  }
  
  .brand-badge.bmw {
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }
  
  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .header-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn-primary {
    background: var(--primary-red);
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 4px;
    font-family: 'Work Sans', sans-serif;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .btn-secondary {
    background: white;
    color: var(--text-primary);
    border: 1px solid #ddd;
    padding: 0.8rem 1.5rem;
    border-radius: 4px;
    font-family: 'Work Sans', sans-serif;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .filters-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .search-box {
    position: relative;
    flex: 1;
    max-width: 300px;
  }
  
  .search-box i {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
  }
  
  .search-box input {
    width: 100%;
    padding: 0.8rem 1rem 0.8rem 2.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: 'Work Sans', sans-serif;
  }
  
  .filter-controls {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .filter-controls select,
  .filter-controls input {
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: 'Work Sans', sans-serif;
  }
  
  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    padding: 1rem;
    background: white;
    border-radius: 0 0 8px 8px;
    border-top: 1px solid #e9ecef;
  }
  
  .pagination {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .page-btn {
    padding: 0.5rem 1rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .page-btn:hover {
    background: #f5f5f5;
  }
`;
document.head.appendChild(style);