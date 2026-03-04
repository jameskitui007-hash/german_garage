// ===================================
// API BASE CONFIGURATION
// ===================================
const API_BASE = "http://127.0.0.1:8000";

// ── Token helpers ─────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("adminToken");
}

function setToken(token) {
  localStorage.setItem("adminToken", token);
}

function clearToken() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminSession");
  localStorage.removeItem("adminLoggedIn");
}

// ── Core fetch wrapper ────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Session expired — redirect to login
  if (response.status === 401) {
    clearToken();
    window.location.href = "admin-login.html";
    return;
  }

  // No content response (DELETE)
  if (response.status === 204) return null;

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Something went wrong");
  }

  return data;
}

// ── Convenience methods ───────────────────────────────────────
const api = {
  get:    (url)          => apiFetch(url),
  post:   (url, body)    => apiFetch(url, { method: "POST",   body: JSON.stringify(body) }),
  put:    (url, body)    => apiFetch(url, { method: "PUT",    body: JSON.stringify(body) }),
  delete: (url)          => apiFetch(url, { method: "DELETE" }),

  // ── Auth ────────────────────────────────────────────────────
  async login(username, password) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (data?.access_token) {
      setToken(data.access_token);
      // Store session info for admin panel header
      localStorage.setItem("adminSession", JSON.stringify({
        name:      data.admin_name,
        role:      data.admin_role,
        username,
        loginTime: new Date().toISOString(),
      }));
      localStorage.setItem("adminLoggedIn", "true");
    }
    return data;
  },

  logout() {
    clearToken();
    window.location.href = "admin-login.html";
  },

  // ── Products ────────────────────────────────────────────────
  getProducts:  (params = "") => api.get(`/api/products${params}`),
  getProduct:   (id)          => api.get(`/api/products/${id}`),
  createProduct:(body)        => api.post("/api/products", body),
  updateProduct:(id, body)    => api.put(`/api/products/${id}`, body),
  deleteProduct:(id)          => api.delete(`/api/products/${id}`),

  // ── Orders ──────────────────────────────────────────────────
  getOrders:    (params = "") => api.get(`/api/orders${params}`),
  getOrder:     (num)         => api.get(`/api/orders/${num}`),
  createOrder:  (body)        => api.post("/api/orders", body),
  updateOrder:  (num, body)   => api.put(`/api/orders/${num}`, body),
  deleteOrder:  (num)         => api.delete(`/api/orders/${num}`),

  // ── Customers ───────────────────────────────────────────────
  getCustomers: (params = "") => api.get(`/api/customers${params}`),
  getCustomer:  (id)          => api.get(`/api/customers/${id}`),
  updateCustomer:(id, body)   => api.put(`/api/customers/${id}`, body),
  deleteCustomer:(id)         => api.delete(`/api/customers/${id}`),

  // ── Suppliers ───────────────────────────────────────────────
  getSuppliers:  (params = "") => api.get(`/api/suppliers${params}`),
  getSupplier:   (id)          => api.get(`/api/suppliers/${id}`),
  createSupplier:(body)        => api.post("/api/suppliers", body),
  updateSupplier:(id, body)    => api.put(`/api/suppliers/${id}`, body),
  deleteSupplier:(id)          => api.delete(`/api/suppliers/${id}`),

  // ── Settings ────────────────────────────────────────────────
  getSettings:   (group = "") => api.get(`/api/settings${group ? `?group=${group}` : ""}`),
  updateSettings:(body)       => api.put("/api/settings", body),

  // ── Dashboard ───────────────────────────────────────────────
  getDashboardStats:     () => api.get("/api/dashboard/stats"),
  getSalesChart:         () => api.get("/api/dashboard/sales-chart"),
  getInventoryChart:     () => api.get("/api/dashboard/inventory-chart"),
  getRecentOrders:       () => api.get("/api/dashboard/recent-orders"),
  getStockAlerts:        () => api.get("/api/dashboard/stock-alerts"),

  // ── Reports ─────────────────────────────────────────────────
  getReport: (params = "")   => api.get(`/api/reports${params}`),

  // ── Logs ────────────────────────────────────────────────────
  getLogs:   (params = "")   => api.get(`/api/logs${params}`),
  clearLogs: ()               => api.delete("/api/logs"),
};