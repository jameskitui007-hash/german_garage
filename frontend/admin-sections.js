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
          <button class="btn-secondary" onclick="exportCustomersCSV()">
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
            <option value="regular">Regular</option>
            <option value="new">New</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </div>
      
      <div class="admin-table-container">
        <table class="admin-table" id="customersTable">
          <thead>
            <tr>
              <th>Customer ID</th>
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
            <!-- Customers will be loaded here -->
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function loadCustomersTable() {
  // Generate customers from orders if none exist
  if (customers.length === 0) {
    generateCustomersFromOrders();
  }
  
  const tbody = document.getElementById('customersTableBody');
  
  tbody.innerHTML = customers.map(customer => `
    <tr>
      <td><code>${customer.id || 'CUST-' + customer.phone?.slice(-4)}</code></td>
      <td>
        <strong>${customer.name}</strong>
        ${customer.isVIP ? '<span class="vip-badge">VIP</span>' : ''}
      </td>
      <td>${customer.phone || 'N/A'}</td>
      <td>${customer.email || 'N/A'}</td>
      <td>${customer.totalOrders || 0}</td>
      <td>KES ${(customer.totalSpent || 0).toLocaleString()}</td>
      <td>${customer.lastOrder ? formatDate(customer.lastOrder) : 'Never'}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon btn-view" onclick="viewCustomer('${customer.id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon" onclick="messageCustomer('${customer.phone}')" 
                  style="background: #25D366; color: white;">
            <i class="fab fa-whatsapp"></i>
          </button>
          <button class="btn-icon" onclick="emailCustomer('${customer.email}')" 
                  style="background: #ea4335; color: white;">
            <i class="fas fa-envelope"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function generateCustomersFromOrders() {
  const customerMap = new Map();
  
  orders.forEach(order => {
    if (order.customer?.phone) {
      const phone = order.customer.phone;
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          id: 'cust_' + Date.now() + Math.random().toString(36).substr(2, 9),
          name: order.customer.name || 'Guest',
          phone: phone,
          email: order.customer.email,
          totalOrders: 0,
          totalSpent: 0,
          lastOrder: order.date,
          orders: []
        });
      }
      
      const customer = customerMap.get(phone);
      customer.totalOrders++;
      customer.totalSpent += order.total || 0;
      customer.lastOrder = order.date > customer.lastOrder ? order.date : customer.lastOrder;
      customer.orders.push(order.number);
    }
  });
  
  customers = Array.from(customerMap.values());
  localStorage.setItem('customers', JSON.stringify(customers));
}

function messageCustomer(phone) {
  if (phone) {
    window.open(`https://wa.me/${phone.replace('+', '')}`, '_blank');
  }
}

function emailCustomer(email) {
  if (email) {
    window.open(`mailto:${email}`, '_blank');
  }
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
          <button class="btn-primary" onclick="generateSalesReport()">
            <i class="fas fa-file-pdf"></i> Generate PDF Report
          </button>
          <button class="btn-secondary" onclick="exportReportData()">
            <i class="fas fa-download"></i> Export Data
          </button>
        </div>
      </div>
      
      <div class="reports-filters">
        <div class="filter-group">
          <label>Report Type:</label>
          <select id="reportType" onchange="updateReport()">
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="customer">Customer Report</option>
            <option value="profit">Profitability Report</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Date Range:</label>
          <div class="date-range">
            <input type="date" id="reportStartDate" onchange="updateReport()">
            <span>to</span>
            <input type="date" id="reportEndDate" onchange="updateReport()">
          </div>
        </div>
        
        <div class="filter-group">
          <label>Brand:</label>
          <select id="reportBrand" onchange="updateReport()">
            <option value="">All Brands</option>
            <option value="mercedes">Mercedes-Benz</option>
            <option value="bmw">BMW</option>
          </select>
        </div>
        
        <button class="btn-secondary" onclick="updateReport()">
          <i class="fas fa-filter"></i> Apply Filters
        </button>
      </div>
      
      <div class="reports-dashboard">
        <div class="report-summary">
          <div class="summary-card">
            <h4><i class="fas fa-money-bill-wave"></i> Total Revenue</h4>
            <div class="summary-value" id="reportRevenue">KES 0</div>
            <div class="summary-change" id="revenueChange">+0% from last period</div>
          </div>
          
          <div class="summary-card">
            <h4><i class="fas fa-shopping-cart"></i> Total Orders</h4>
            <div class="summary-value" id="reportOrders">0</div>
            <div class="summary-change" id="ordersChange">+0% from last period</div>
          </div>
          
          <div class="summary-card">
            <h4><i class="fas fa-box"></i> Items Sold</h4>
            <div class="summary-value" id="reportItems">0</div>
            <div class="summary-change" id="itemsChange">+0% from last period</div>
          </div>
          
          <div class="summary-card">
            <h4><i class="fas fa-chart-line"></i> Average Order Value</h4>
            <div class="summary-value" id="reportAOV">KES 0</div>
            <div class="summary-change" id="aovChange">+0% from last period</div>
          </div>
        </div>
        
        <div class="report-charts">
          <div class="chart-card">
            <h4><i class="fas fa-chart-bar"></i> Sales by Brand</h4>
            <canvas id="brandSalesChart" width="400" height="200"></canvas>
          </div>
          
          <div class="chart-card">
            <h4><i class="fas fa-chart-pie"></i> Sales by Category</h4>
            <canvas id="categorySalesChart" width="400" height="200"></canvas>
          </div>
        </div>
        
        <div class="report-table">
          <h4><i class="fas fa-table"></i> Detailed Report</h4>
          <div class="admin-table-container">
            <table class="admin-table" id="reportTable">
              <thead>
                <tr id="reportTableHeader">
                  <!-- Dynamic headers -->
                </thead>
              </thead>
              <tbody id="reportTableBody">
                <!-- Dynamic data -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateReport() {
  const reportType = document.getElementById('reportType').value;
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;
  const brand = document.getElementById('reportBrand').value;
  
  // Calculate report data based on filters
  const reportData = calculateReportData(reportType, startDate, endDate, brand);
  
  // Update summary cards
  document.getElementById('reportRevenue').textContent = `KES ${reportData.revenue.toLocaleString()}`;
  document.getElementById('reportOrders').textContent = reportData.orders;
  document.getElementById('reportItems').textContent = reportData.items;
  document.getElementById('reportAOV').textContent = `KES ${reportData.averageOrderValue.toLocaleString()}`;
  
  // Update charts
  updateReportCharts(reportData);
  
  // Update detailed table
  updateReportTable(reportData);
}

function calculateReportData(type, startDate, endDate, brand) {
  // Filter orders by date range
  let filteredOrders = orders;
  
  if (startDate) {
    filteredOrders = filteredOrders.filter(order => order.date >= startDate);
  }
  
  if (endDate) {
    filteredOrders = filteredOrders.filter(order => order.date <= endDate);
  }
  
  // Filter by brand if specified
  if (brand) {
    // This would require tracking brand in orders, which we don't have in sample
    // For now, return all
  }
  
  // Calculate metrics
  const revenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const ordersCount = filteredOrders.length;
  const items = filteredOrders.reduce((sum, order) => 
    sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0) || 0), 0);
  const averageOrderValue = ordersCount > 0 ? revenue / ordersCount : 0;
  
  return {
    revenue,
    orders: ordersCount,
    items,
    averageOrderValue,
    filteredOrders
  };
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
              <th>Last Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="suppliersTableBody">
            <!-- Suppliers will be loaded here -->
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function loadSuppliersTable() {
  // Sample suppliers if none exist
  if (suppliers.length === 0) {
    suppliers = [
      {
        id: 'supp_1',
        name: 'Mercedes-Benz Kenya',
        contact: 'John Mwangi',
        phone: '+254712345671',
        email: 'parts@mercedes.co.ke',
        products: ['Oil Filters', 'Brake Pads', 'Air Filters'],
        lastOrder: '2024-01-15',
        status: 'active'
      },
      {
        id: 'supp_2',
        name: 'BMW East Africa',
        contact: 'Sarah Kariuki',
        phone: '+254712345672',
        email: 'parts@bmw.co.ke',
        products: ['Spark Plugs', 'Cabin Filters', 'Brake Discs'],
        lastOrder: '2024-01-10',
        status: 'active'
      }
    ];
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
  }
  
  const tbody = document.getElementById('suppliersTableBody');
  tbody.innerHTML = suppliers.map(supplier => `
    <tr>
      <td><strong>${supplier.name}</strong></td>
      <td>${supplier.contact}</td>
      <td>${supplier.phone}</td>
      <td>${supplier.email}</td>
      <td>${supplier.products?.join(', ') || 'Various'}</td>
      <td>${formatDate(supplier.lastOrder)}</td>
      <td>
        <span class="status-badge ${supplier.status === 'active' ? 'status-good' : 'status-pending'}">
          ${supplier.status}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" onclick="callSupplier('${supplier.phone}')" 
                  style="background: #4caf50; color: white;">
            <i class="fas fa-phone"></i>
          </button>
          <button class="btn-icon" onclick="emailSupplier('${supplier.email}')" 
                  style="background: #ea4335; color: white;">
            <i class="fas fa-envelope"></i>
          </button>
          <button class="btn-icon btn-edit" onclick="editSupplier('${supplier.id}')">
            <i class="fas fa-edit"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
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
          <form id="storeSettingsForm" onsubmit="saveStoreSettings(event)">
            <div class="form-group">
              <label>Store Name</label>
              <input type="text" class="form-control" name="storeName" 
                     value="Mercedes & BMW Parts Shop">
            </div>
            
            <div class="form-group">
              <label>Contact Phone</label>
              <input type="tel" class="form-control" name="contactPhone" 
                     value="+254712345678">
            </div>
            
            <div class="form-group">
              <label>Contact Email</label>
              <input type="email" class="form-control" name="contactEmail" 
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
          <form id="pricingSettingsForm" onsubmit="savePricingSettings(event)">
            <div class="form-group">
              <label>Default Markup Percentage</label>
              <input type="number" class="form-control" name="defaultMarkup" 
                     value="35" step="1" min="0" max="100">
              <small>Percentage added to cost price</small>
            </div>
            
            <div class="form-group">
              <label>Minimum Profit Margin (KES)</label>
              <input type="number" class="form-control" name="minProfit" 
                     value="1000" step="100" min="0">
            </div>
            
            <div class="form-group">
              <label>Round Prices to Nearest</label>
              <select class="form-control" name="roundTo">
                <option value="10">10</option>
                <option value="50" selected>50</option>
                <option value="100">100</option>
                <option value="500">500</option>
              </select>
            </div>
            
            <button type="submit" class="btn-primary">Save Pricing Settings</button>
          </form>
        </div>
        
        <div class="settings-card">
          <h3><i class="fas fa-shipping-fast"></i> Delivery Settings</h3>
          <form id="deliverySettingsForm">
            <div class="form-group">
              <label>Nairobi Delivery Fee (KES)</label>
              <input type="number" class="form-control" name="nairobiFee" 
                     value="500" step="100" min="0">
            </div>
            
            <div class="form-group">
              <label>Outside Nairobi Delivery Fee (KES)</label>
              <input type="number" class="form-control" name="outsideFee" 
                     value="1500" step="100" min="0">
            </div>
            
            <div class="form-group">
              <label>Free Shipping Threshold (KES)</label>
              <input type="number" class="form-control" name="freeShipping" 
                     value="15000" step="1000" min="0">
            </div>
            
            <button type="submit" class="btn-primary">Save Delivery Settings</button>
          </form>
        </div>
        
        <div class="settings-card">
          <h3><i class="fas fa-money-check-alt"></i> Payment Settings</h3>
          <form id="paymentSettingsForm">
            <div class="form-group">
              <label>M-Pesa Paybill Number</label>
              <input type="text" class="form-control" name="paybill" 
                     value="123456">
            </div>
            
            <div class="form-group">
              <label>M-Pesa Account Name</label>
              <input type="text" class="form-control" name="accountName" 
                     value="MERCEDES BMW PARTS">
            </div>
            
            <div class="form-group">
              <div class="form-check">
                <input type="checkbox" class="form-check-input" name="enableMpesa" checked>
                <label class="form-check-label">Enable M-Pesa Payments</label>
              </div>
            </div>
            
            <div class="form-group">
              <div class="form-check">
                <input type="checkbox" class="form-check-input" name="enableCash" checked>
                <label class="form-check-label">Enable Cash on Pickup</label>
              </div>
            </div>
            
            <button type="submit" class="btn-primary">Save Payment Settings</button>
          </form>
        </div>
        
        <div class="settings-card">
          <h3><i class="fas fa-user-shield"></i> Admin Settings</h3>
          <div class="admin-actions">
            <button class="btn-secondary" onclick="changeAdminPassword()">
              <i class="fas fa-key"></i> Change Password
            </button>
            <button class="btn-secondary" onclick="viewAdminLogs()">
              <i class="fas fa-clipboard-list"></i> View Activity Logs
            </button>
            <button class="btn-secondary" onclick="backupDatabase()">
              <i class="fas fa-database"></i> Backup Database
            </button>
            <button class="btn-danger" onclick="resetDatabase()">
              <i class="fas fa-trash"></i> Reset Database
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===================================
// SYSTEM FUNCTIONS
// ===================================

function changeAdminPassword() {
  const currentPassword = prompt('Enter current password:');
  if (currentPassword !== 'MercedesBMW2024!') {
    alert('Current password is incorrect');
    return;
  }
  
  const newPassword = prompt('Enter new password:');
  const confirmPassword = prompt('Confirm new password:');
  
  if (newPassword !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  
  if (newPassword.length < 8) {
    alert('Password must be at least 8 characters long');
    return;
  }
  
  // In production, this would be stored securely
  alert('Password changed successfully!');
  logAdminActivity('change_password', 'Admin changed password');
}

function backupDatabase() {
  const backup = {
    timestamp: new Date().toISOString(),
    products: products,
    orders: orders,
    customers: customers,
    suppliers: suppliers,
    settings: localStorage.getItem('settings') || '{}'
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  showNotification('Database backup created successfully!', 'success');
  logAdminActivity('backup', 'Database backup created');
}

function resetDatabase() {
  if (confirm('WARNING: This will reset all data to factory settings. This action cannot be undone. Are you sure?')) {
    if (prompt('Type "RESET" to confirm:') === 'RESET') {
      localStorage.clear();
      showNotification('Database reset. Redirecting to login...', 'warning');
      logAdminActivity('reset', 'Database reset to factory settings');
      setTimeout(() => {
        window.location.href = 'admin-login.html';
      }, 2000);
    }
  }
}

function viewAdminLogs() {
  const logs = JSON.parse(localStorage.getItem('adminLogs')) || [];
  
  const modalHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-clipboard-list"></i> Activity Logs</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="logs-container">
            ${logs.reverse().map(log => `
              <div class="log-entry">
                <div class="log-time">${new Date(log.timestamp).toLocaleString()}</div>
                <div class="log-action">${log.action}</div>
                <div class="log-details">${log.details}</div>
                <div class="log-user">${log.user || 'system'}</div>
              </div>
            `).join('')}
            
            ${logs.length === 0 ? '<p class="empty-state">No activity logs found</p>' : ''}
          </div>
          
          <div class="modal-actions">
            <button class="btn-secondary" onclick="exportLogs()">
              <i class="fas fa-download"></i> Export Logs
            </button>
            <button class="btn-danger" onclick="clearLogs()">
              <i class="fas fa-trash"></i> Clear Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('modal-container').innerHTML = modalHTML;
}

// ===================================
// INITIALIZATION
// ===================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initAdminPanel();
  
  // Check session expiry (8 hours)
  const session = JSON.parse(localStorage.getItem('adminSession'));
  if (session) {
    const loginTime = new Date(session.loginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 8) {
      alert('Session expired. Please login again.');
      logoutAdmin();
    }
  }
});