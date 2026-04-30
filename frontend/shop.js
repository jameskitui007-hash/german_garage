// ===================================
// SHOP CONFIGURATION
// ===================================
const API_BASE    = "http://127.0.0.1:8000";
const WHATSAPP_NUM = "254XXXXXXXXX"; // ← replace with your number

// ===================================
// STATE
// ===================================
let shopProducts   = [];   // current page of products from API
let cart           = JSON.parse(localStorage.getItem("cart")) || [];
let currentPage    = 1;
const itemsPerPage = 12;
let totalProducts  = 0;
let totalPages     = 1;
let currentProductId = null;

// Active filters object — updated as user interacts with the sidebar
let activeFilters = {
  brand:       "",
  model_type:  "",
  year:        "",
  category_id: "",
  engine_type: "",
  min_price:   "",
  max_price:   "",
  search:      "",
  sort_by:     "featured",
};

// ===================================
// API CALLS
// ===================================

/**
 * Fetch products from the public shop API with current filters.
 */
async function fetchProducts() {
  const params = new URLSearchParams();

  if (activeFilters.brand)       params.set("brand",       activeFilters.brand);
  if (activeFilters.model_type)  params.set("model_type",  activeFilters.model_type);
  if (activeFilters.year)        params.set("year",        activeFilters.year);
  if (activeFilters.category_id) params.set("category_id", activeFilters.category_id);
  if (activeFilters.engine_type) params.set("engine_type", activeFilters.engine_type);
  if (activeFilters.min_price)   params.set("min_price",   activeFilters.min_price);
  if (activeFilters.max_price)   params.set("max_price",   activeFilters.max_price);
  if (activeFilters.search)      params.set("search",      activeFilters.search);
  if (activeFilters.sort_by)     params.set("sort_by",     activeFilters.sort_by);

  params.set("page",     currentPage);
  params.set("per_page", itemsPerPage);

  const res = await fetch(`${API_BASE}/api/shop/products?${params}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

/**
 * Fetch dynamic filter options — cascades based on brand selection.
 */
async function fetchFilterOptions() {
  const params = new URLSearchParams();
  if (activeFilters.brand) params.set("brand", activeFilters.brand);
  if (activeFilters.category_id) params.set("category_id", activeFilters.category_id);

  const res = await fetch(`${API_BASE}/api/shop/filters?${params}`);
  if (!res.ok) throw new Error("Failed to fetch filter options");
  return res.json();
}

/**
 * Fetch categories that have in-stock products.
 */
async function fetchShopCategories() {
  const res = await fetch(`${API_BASE}/api/shop/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

// ===================================
// SIDEBAR FILTER BUILDER
// ===================================

/**
 * Builds the entire filter sidebar dynamically.
 * Called on page load and after brand selection changes.
 *
 * Cascading UX:
 *   Step 1 — Brand selector always visible
 *   Step 2 — Model + Year appear after brand is selected
 *   Step 3 — Category, Engine, Price appear after brand is selected
 */
async function buildFilterSidebar() {
  const sidebar = document.getElementById("filter-sidebar");
  if (!sidebar) return;

  // Show loading state in sidebar
  sidebar.innerHTML = `
    <div style="text-align:center;padding:2rem;color:#999;">
      <i class="fas fa-spinner fa-spin"></i>
      <p style="margin-top:0.5rem;font-size:0.85rem;">Loading filters...</p>
    </div>`;

  try {
    // Fetch categories and dynamic options in parallel
    const [categories, filterOptions] = await Promise.all([
      fetchShopCategories(),
      fetchFilterOptions(),
    ]);

    const brandSelected = !!activeFilters.brand;

    sidebar.innerHTML = `
      <!-- ── Search ───────────────────────────────────── -->
      <div class="filter-section">
        <h3>Search Parts</h3>
        <div class="search-input-wrap">
          <i class="fas fa-search"></i>
          <input type="text"
                 id="shopSearch"
                 placeholder="Name, SKU, OEM number..."
                 value="${activeFilters.search}"
                 oninput="debounceSearch(this.value)">
        </div>
      </div>

      <!-- ── Step 1: Brand ─────────────────────────────── -->
      <div class="filter-section">
        <h3>Brand</h3>
        <div class="brand-buttons">
          <button class="brand-btn ${activeFilters.brand === "mercedes" ? "active" : ""}"
                  onclick="selectBrand('mercedes')">
            Mercedes-Benz
          </button>
          <button class="brand-btn ${activeFilters.brand === "bmw" ? "active" : ""}"
                  onclick="selectBrand('bmw')">
            BMW
          </button>
          ${activeFilters.brand ? `
            <button class="brand-btn brand-btn-clear"
                    onclick="selectBrand('')">
              <i class="fas fa-times"></i> Clear
            </button>` : ""}
        </div>
      </div>

      <!-- ── Step 2: Model + Year (shown after brand selected) ── -->
      ${brandSelected ? `
        <div class="filter-section cascade-section" id="modelSection">
          <h3>
            <i class="fas fa-car" style="color:var(--primary-red);font-size:0.85rem;"></i>
            Model
          </h3>
          ${filterOptions.models.length > 0 ? `
            <select class="filter-select" onchange="setFilter('model_type', this.value)">
              <option value="">All Models</option>
              ${filterOptions.models.map(m => `
                <option value="${m}"
                  ${activeFilters.model_type === m ? "selected" : ""}>
                  ${m}
                </option>`).join("")}
            </select>` : `
            <p class="filter-empty">No models found for this brand</p>`
          }
        </div>

        <div class="filter-section cascade-section" id="yearSection">
          <h3>
            <i class="fas fa-calendar" style="color:var(--primary-red);font-size:0.85rem;"></i>
            Year of Manufacture
          </h3>
          <div class="year-input-row">
            <input type="number"
                   class="filter-input-small"
                   placeholder="From"
                   min="1980" max="2026"
                   value="${activeFilters.year}"
                   onchange="setFilter('year', this.value)"
                   title="Enter your vehicle's year">
          </div>
          ${filterOptions.years.length > 0 ? `
            <div class="year-quick-picks">
              <small>Quick pick:</small>
              ${filterOptions.years
                .filter((_, i) => i % 3 === 0)  // show every 3rd year
                .slice(-6)                        // last 6 entries
                .map(y => `
                  <button class="year-pill ${activeFilters.year == y ? "active" : ""}"
                          onclick="setFilter('year', '${y}')">
                    ${y}
                  </button>`).join("")}
            </div>` : ""}
        </div>
      ` : `
        <!-- Hint when no brand selected -->
        <div class="filter-hint">
          <i class="fas fa-arrow-up" style="color:var(--primary-red);"></i>
          Select a brand to see model and year filters
        </div>
      `}

      <!-- ── Step 3: Category ───────────────────────────── -->
      ${brandSelected ? `
        <div class="filter-section cascade-section">
          <h3>Category</h3>
          <div class="category-list">
            <label class="category-option ${!activeFilters.category_id ? "active" : ""}"
                   onclick="setFilter('category_id', '')">
              <span>All Categories</span>
              <span class="cat-count">${totalProducts}</span>
            </label>
            ${categories.map(cat => `
              <label class="category-option
                     ${activeFilters.category_id == cat.id ? "active" : ""}"
                     onclick="setFilter('category_id', '${cat.id}')">
                <span>${cat.name}</span>
                <span class="cat-count">${cat.product_count}</span>
              </label>`).join("")}
          </div>
        </div>
      ` : ""}

      <!-- ── Step 3: Engine Type ────────────────────────── -->
      ${brandSelected ? `
        <div class="filter-section cascade-section">
          <h3>Engine Type</h3>
          <div class="engine-buttons">
            <button class="engine-btn ${!activeFilters.engine_type ? "active" : ""}"
                    onclick="setFilter('engine_type', '')">
              Both
            </button>
            ${filterOptions.engine_types.map(et => `
              <button class="engine-btn
                      ${activeFilters.engine_type === et ? "active" : ""}"
                      onclick="setFilter('engine_type', '${et}')">
                ${et.charAt(0).toUpperCase() + et.slice(1)}
              </button>`).join("")}
          </div>
        </div>
      ` : ""}

      <!-- ── Price Range (always visible) ──────────────── -->
      <div class="filter-section">
        <h3>Price Range (KES)</h3>
        <div class="price-inputs">
          <input type="number"
                 class="filter-input-small"
                 placeholder="Min"
                 value="${activeFilters.min_price}"
                 onchange="setFilter('min_price', this.value)"
                 step="500" min="0">
          <span style="color:#999;">—</span>
          <input type="number"
                 class="filter-input-small"
                 placeholder="Max"
                 value="${activeFilters.max_price}"
                 onchange="setFilter('max_price', this.value)"
                 step="500" min="0">
        </div>
        ${filterOptions.price_range.max > 0 ? `
          <small style="color:#999;font-size:0.75rem;">
            Available: KES ${filterOptions.price_range.min.toLocaleString()}
            – KES ${filterOptions.price_range.max.toLocaleString()}
          </small>` : ""}
      </div>

      <!-- ── VIN Checker ────────────────────────────────── -->
      <div class="filter-section vin-section">
        <h3>VIN Compatibility Check</h3>
        <p style="font-size:0.85rem;color:#666;margin-bottom:0.75rem;">
          Enter your VIN to verify part compatibility
        </p>
        <input type="text"
               id="vin-input"
               placeholder="WDD2050001A123456"
               maxlength="17"
               style="text-transform:uppercase;">
        <button onclick="checkVin()" class="vin-btn">
          Check Compatibility
        </button>
        <div id="vin-result" class="vin-result"></div>
      </div>

      <!-- ── Clear All Filters ─────────────────────────── -->
      ${hasActiveFilters() ? `
        <button class="clear-all-btn" onclick="clearAllFilters()">
          <i class="fas fa-times-circle"></i> Clear All Filters
        </button>
      ` : ""}
    `;

  } catch (err) {
    sidebar.innerHTML = `
      <div style="padding:1rem;color:#999;font-size:0.85rem;">
        <i class="fas fa-exclamation-circle"></i>
        Could not load filters. Please refresh.
      </div>`;
    console.error("Filter sidebar error:", err);
  }
}

// ===================================
// FILTER LOGIC
// ===================================

/**
 * Returns true if any filter is currently active.
 */
function hasActiveFilters() {
  return Object.entries(activeFilters).some(([key, val]) => {
    if (key === "sort_by") return false;  // sort is not a "filter"
    return val !== "" && val !== null;
  });
}

/**
 * Set a single filter value and reload products.
 * Resets to page 1 on every filter change.
 */
async function setFilter(key, value) {
  activeFilters[key] = value;
  currentPage = 1;

  // If brand changes, clear dependent filters and rebuild sidebar
  if (key === "brand") {
    activeFilters.model_type  = "";
    activeFilters.year        = "";
    activeFilters.engine_type = "";
    activeFilters.category_id = "";
    await buildFilterSidebar();
  }

  updateActiveFilterTags();
  await loadProducts();
}

/**
 * Select a brand — wraps setFilter for the brand buttons.
 */
async function selectBrand(brand) {
  await setFilter("brand", brand);
}
function onEngineChange(value) {
  setFilter('engine_type', value);
}
/**
 * Clear all active filters and reload.
 */
async function clearAllFilters() {
  activeFilters = {
    brand:       "",
    model_type:  "",
    year:        "",
    category_id: "",
    engine_type: "",
    min_price:   "",
    max_price:   "",
    search:      "",
    sort_by:     activeFilters.sort_by,  // keep sort preference
  };
  currentPage = 1;
  await buildFilterSidebar();
  updateActiveFilterTags();
  await loadProducts();
}

// ===================================
// ACTIVE FILTER TAGS
// ===================================

/**
 * Renders the active filter tags bar above the product grid.
 * Each tag has an × to remove that individual filter.
 */
function updateActiveFilterTags() {
  const container = document.getElementById("active-filter-tags");
  if (!container) return;

  const tagLabels = {
    brand:       v => v.charAt(0).toUpperCase() + v.slice(1),
    model_type:  v => `Model: ${v}`,
    year:        v => `Year: ${v}`,
    category_id: v => `Category ID: ${v}`,
    engine_type: v => v.charAt(0).toUpperCase() + v.slice(1),
    min_price:   v => `Min: KES ${parseInt(v).toLocaleString()}`,
    max_price:   v => `Max: KES ${parseInt(v).toLocaleString()}`,
    search:      v => `"${v}"`,
  };

  const tags = Object.entries(activeFilters)
    .filter(([key, val]) => key !== "sort_by" && val !== "" && val !== null)
    .map(([key, val]) => `
      <span class="filter-tag">
        ${tagLabels[key] ? tagLabels[key](val) : val}
        <button onclick="setFilter('${key}', '')"
                title="Remove filter">&times;</button>
      </span>`).join("");

  container.innerHTML = tags
    ? `<div class="filter-tags-wrap">
         <span style="color:#999;font-size:0.8rem;">Filters:</span>
         ${tags}
         <button class="clear-all-link" onclick="clearAllFilters()">
           Clear all
         </button>
       </div>`
    : "";
}

// ===================================
// PRODUCT LOADING
// ===================================

async function loadProducts() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#999;">
      <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i>
      <p style="margin-top:1rem;">Loading products...</p>
    </div>`;

  try {
    const data  = await fetchProducts();
    shopProducts = data.products || [];
    totalProducts = data.total  || 0;
    totalPages    = data.total_pages || 1;

    grid.innerHTML = "";

    if (!shopProducts.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#999;">
          <i class="fas fa-search" style="font-size:2rem;display:block;margin-bottom:1rem;"></i>
          <p>No parts found matching your filters.</p>
          ${hasActiveFilters() ? `
            <button onclick="clearAllFilters()"
                    style="margin-top:1rem;padding:0.5rem 1.5rem;
                           background:var(--primary-red);color:white;
                           border:none;cursor:pointer;border-radius:4px;">
              Clear filters
            </button>` : ""}
        </div>`;
    } else {
      shopProducts.forEach(product =>
        grid.appendChild(createProductCard(product))
      );
    }

    updateResultsCount(totalProducts);
    updatePagination(totalProducts, totalPages);

  } catch (err) {
    console.error("Failed to load products:", err);
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#999;">
        <p>⚠️ Could not load products. Please refresh the page.</p>
      </div>`;
  }
}

// ===================================
// PRODUCT CARD
// ===================================

function createProductCard(product) {
  const card      = document.createElement("div");
  card.className  = "product-card";
  card.dataset.productId = product.id;

  // Image — real photo or emoji fallback
  const hasImage  = product.images && product.images.length > 0;
  const imageHTML = hasImage
    ? `<img
         src="${API_BASE}/uploads/products/${product.images[0]}"
         alt="${product.name}"
         class="product-card-img"
         onerror="this.style.display='none';
                  this.nextElementSibling.style.display='flex';">
       <div class="product-card-placeholder" style="display:none;">
         ${product.brand === "mercedes" ? "🚗" : "🏎️"}
       </div>`
    : `<div class="product-card-placeholder">
         ${product.brand === "mercedes" ? "🚗" : "🏎️"}
       </div>`;

  // Category badge
  const categoryBadge = product.category
    ? `<span class="product-category-badge">${product.category.name}</span>`
    : "";

  // Compatibility badge
  const compatBadge = (product.year_min && product.year_max)
    ? `<span class="product-compat-badge">
         ${product.year_min}–${product.year_max}
         ${product.engine_type
           ? ` · ${product.engine_type.charAt(0).toUpperCase() + product.engine_type.slice(1)}`
           : ""}
       </span>`
    : "";

  card.innerHTML = `
    <div class="product-image">
      ${imageHTML}
    </div>

    <div class="product-meta-badges">
      <span class="product-brand-badge ${product.brand}">
        ${product.brand.toUpperCase()}
      </span>
      ${categoryBadge}
    </div>

    <h4>${product.name}</h4>

    ${compatBadge}

    <p class="product-desc">${product.description || ""}</p>

    <div class="product-price">
      KES ${product.price.toLocaleString()}
    </div>

    <div class="product-stock"
         style="font-size:0.8rem;
                color:${product.stock > 5 ? "#4caf50" : "#f44336"};
                margin-bottom:1rem;">
      ${product.stock > 5
        ? `<i class="fas fa-check-circle"></i> In Stock`
        : `<i class="fas fa-exclamation-circle"></i> Only ${product.stock} left`}
    </div>

    <div class="product-actions">
      <button class="quick-view-btn"
              onclick="quickView('${product.id}')">
        Quick View
      </button>
      <button class="add-to-cart-btn"
              onclick="addToCart('${product.id}')">
        Add to Cart
      </button>
    </div>`;

  return card;
}

// ===================================
// QUICK VIEW MODAL
// ===================================

function quickView(productId) {
  const product = shopProducts.find(p => String(p.id) === String(productId));
  if (!product) {
    console.error("Product not found:", productId);
    return;
  }

  currentProductId = product.id;

  // Image gallery
  const hasImages  = product.images && product.images.length > 0;
  const galleryHTML = hasImages
    ? `<div class="product-gallery">
         <div class="gallery-main">
           <img id="galleryMainImg"
                src="${API_BASE}/uploads/products/${product.images[0]}"
                alt="${product.name}"
                onerror="this.style.display='none'">
         </div>
         ${product.images.length > 1
           ? `<div class="gallery-thumbs">
                ${product.images.map((filename, index) => `
                  <img src="${API_BASE}/uploads/products/${filename}"
                       alt="View ${index + 1}"
                       class="gallery-thumb ${index === 0 ? "thumb-active" : ""}"
                       onclick="switchGalleryImage(
                         '${API_BASE}/uploads/products/${filename}', this)"
                       onerror="this.style.display='none'">
                `).join("")}
              </div>`
           : ""}
       </div>`
    : `<div class="gallery-placeholder">
         ${product.brand === "mercedes" ? "🚗" : "🏎️"}
       </div>`;

  // Compatibility info
  const compatInfo = (product.year_min || product.year_max || product.engine_type)
    ? `<p style="font-size:0.85rem;color:#666;margin-top:0.5rem;">
         <i class="fas fa-car" style="color:var(--primary-red);"></i>
         ${product.model_type ? `${product.model_type} · ` : ""}
         ${product.year_min && product.year_max
           ? `${product.year_min}–${product.year_max}`
           : ""}
         ${product.engine_type
           ? ` · ${product.engine_type.charAt(0).toUpperCase() + product.engine_type.slice(1)}`
           : ""}
       </p>`
    : "";

  // Populate modal
  document.getElementById("modal-part-name").textContent  = product.name;
  document.getElementById("modal-part-desc").textContent  = product.description || "";
  document.getElementById("modal-part-price").textContent =
    `KES ${product.price.toLocaleString()}`;
  document.getElementById("modal-part-stock").textContent = product.stock > 5
    ? `${product.stock} units available`
    : `Only ${product.stock} left — Order soon!`;

  // Inject gallery
  document.getElementById("modal-part-image-wrapper").innerHTML = galleryHTML;

  // Inject compat info after price if the element exists
  const priceEl = document.querySelector(
    "#quick-order-modal .modal-part-info > div > p:first-child"
  );
  if (priceEl && compatInfo) {
    const existing = document.getElementById("modal-compat-info");
    if (existing) existing.remove();
    const div = document.createElement("div");
    div.id        = "modal-compat-info";
    div.innerHTML = compatInfo;
    priceEl.parentNode.insertBefore(div, priceEl.nextSibling);
  }

  document.getElementById("order-quantity").value = 1;
  document.getElementById("order-quantity").max   = product.stock;

  updateOrderSummary();
  document.getElementById("quick-order-modal").classList.add("open");
}

function switchGalleryImage(src, thumbEl) {
  const mainImg = document.getElementById("galleryMainImg");
  if (mainImg) mainImg.src = src;
  document.querySelectorAll(".gallery-thumb").forEach(t =>
    t.classList.remove("thumb-active")
  );
  thumbEl.classList.add("thumb-active");
}

function closeModal() {
  document.getElementById("quick-order-modal").classList.remove("open");
  currentProductId = null;
}

// ===================================
// CART
// ===================================

function addToCart(productId) {
  const product = shopProducts.find(p => String(p.id) === String(productId));
  if (!product) return;

  const existingItem = cart.find(item => String(item.id) === String(productId));

  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity++;
    } else {
      alert(`Only ${product.stock} units available in stock`);
      return;
    }
  } else {
    cart.push({
      id:       product.id,
      name:     product.name,
      price:    product.price,
      brand:    product.brand,
      quantity: 1,
    });
  }

  saveCart();
  updateCartCount();
  if (document.getElementById("cart-sidebar").classList.contains("open")) {
    updateCartDisplay();
  }
  showNotification(`${product.name} added to cart!`);
}

function addToCartFromModal() {
  const quantity = parseInt(document.getElementById("order-quantity").value);
  const product  = shopProducts.find(
    p => String(p.id) === String(currentProductId)
  );
  if (!product) return;

  const existingItem    = cart.find(
    item => String(item.id) === String(currentProductId)
  );
  const newTotalQty     = (existingItem?.quantity || 0) + quantity;

  if (newTotalQty > product.stock) {
    alert(
      `Only ${product.stock} units available. ` +
      `You already have ${existingItem?.quantity || 0} in cart.`
    );
    return;
  }

  for (let i = 0; i < quantity; i++) addToCart(currentProductId);
  closeModal();
}

function removeFromCart(productId) {
  cart = cart.filter(item => String(item.id) !== String(productId));
  saveCart();
  updateCartCount();
  updateCartDisplay();
}

function updateCartItemQuantity(productId, change) {
  const item    = cart.find(item => String(item.id) === String(productId));
  const product = shopProducts.find(p => String(p.id) === String(productId));

  if (item) {
    const newQty = item.quantity + change;
    if (newQty < 1) { removeFromCart(productId); return; }
    if (product && newQty > product.stock) {
      alert(`Only ${product.stock} units available`);
      return;
    }
    item.quantity = newQty;
  }

  saveCart();
  updateCartCount();
  updateCartDisplay();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  const el    = document.getElementById("cart-count");
  if (el) el.textContent = total;
}

function updateCartDisplay() {
  const cartItems = document.getElementById("cart-items");
  const subtotal  = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping  = subtotal > 15000 ? 0 : 500;
  const total     = subtotal + shipping;

  if (!cartItems) return;

  cartItems.innerHTML = cart.length === 0
    ? `<div class="empty-cart">Your cart is empty</div>`
    : cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-image">
            ${item.brand === "mercedes" ? "🚗" : "🏎️"}
          </div>
          <div class="cart-item-details">
            <h5>${item.name}</h5>
            <div class="cart-item-price">
              KES ${item.price.toLocaleString()}
            </div>
            <div class="cart-item-controls">
              <div class="cart-item-quantity">
                <button onclick="updateCartItemQuantity('${item.id}', -1)">-</button>
                <input type="text" value="${item.quantity}" readonly>
                <button onclick="updateCartItemQuantity('${item.id}', 1)">+</button>
              </div>
              <button class="remove-item"
                      onclick="removeFromCart('${item.id}')">Remove</button>
            </div>
          </div>
        </div>`).join("");

  const subtotalEl = document.getElementById("cart-subtotal");
  const shippingEl = document.getElementById("cart-shipping");
  const totalEl    = document.getElementById("cart-grand-total");

  if (subtotalEl) subtotalEl.textContent = `KES ${subtotal.toLocaleString()}`;
  if (shippingEl) shippingEl.textContent =
    shipping === 0 ? "FREE" : `KES ${shipping.toLocaleString()}`;
  if (totalEl)    totalEl.textContent    = `KES ${total.toLocaleString()}`;
}

function toggleCart() {
  const sidebar = document.getElementById("cart-sidebar");
  sidebar.classList.toggle("open");
  if (sidebar.classList.contains("open")) updateCartDisplay();
}

function proceedToCheckout() {
  if (cart.length === 0) { alert("Your cart is empty"); return; }

  const total    = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = total > 15000 ? 0 : 500;
  const grand    = total + shipping;

  const message  = `ORDER REQUEST%0A%0AItems:%0A${
    cart.map(i =>
      `• ${i.name} x${i.quantity} - KES ${i.price.toLocaleString()}`
    ).join("%0A")
  }%0A%0ASubtotal: KES ${total.toLocaleString()}%0AShipping: ${
    shipping === 0 ? "FREE" : `KES ${shipping.toLocaleString()}`
  }%0ATotal: KES ${grand.toLocaleString()}%0A%0APlease contact me to complete this order.`;

  window.open(`https://wa.me/${WHATSAPP_NUM}?text=${message}`, "_blank");
}

// ===================================
// ORDER SUMMARY (QUICK VIEW MODAL)
// ===================================

function updateOrderSummary() {
  const product      = shopProducts.find(
    p => String(p.id) === String(currentProductId)
  );
  if (!product) return;

  const quantity     = parseInt(
    document.getElementById("order-quantity")?.value || 1
  );
  const deliveryOpt  = document.getElementById("delivery-option")?.value;

  const partsTotal   = product.price * quantity;
  const shipping     = deliveryOpt === "nairobi"
    ? 500 : deliveryOpt === "outside" ? 1500 : 0;
  const total        = partsTotal + shipping;

  const partsEl    = document.getElementById("summary-parts");
  const shippingEl = document.getElementById("summary-shipping");
  const totalEl    = document.getElementById("summary-total");

  if (partsEl)    partsEl.textContent    = `KES ${partsTotal.toLocaleString()}`;
  if (shippingEl) shippingEl.textContent =
    shipping === 0 ? "FREE" : `KES ${shipping.toLocaleString()}`;
  if (totalEl)    totalEl.textContent    = `KES ${total.toLocaleString()}`;
}

function updateQuantity(change) {
  const input   = document.getElementById("order-quantity");
  const product = shopProducts.find(
    p => String(p.id) === String(currentProductId)
  );
  if (!input || !product) return;

  const newVal  = parseInt(input.value) + change;
  if (newVal >= 1 && newVal <= product.stock) {
    input.value = newVal;
    updateOrderSummary();
  }
}

function orderViaWhatsApp() {
  const product     = shopProducts.find(
    p => String(p.id) === String(currentProductId)
  );
  const quantity    = parseInt(
    document.getElementById("order-quantity")?.value || 1
  );
  const deliveryOpt = document.getElementById("delivery-option")?.value;
  const vin         = document.getElementById("order-vin")?.value;

  const shippingText = deliveryOpt === "pickup"
    ? "Pickup from garage"
    : deliveryOpt === "nairobi"
      ? "Delivery within Nairobi (KES 500)"
      : "Delivery outside Nairobi (KES 1,500+)";

  const message = `QUICK ORDER REQUEST%0A%0AProduct: ${product.name}%0A` +
    `Quantity: ${quantity}%0APrice: KES ${product.price.toLocaleString()}%0A` +
    `Total: KES ${(product.price * quantity).toLocaleString()}%0A%0A` +
    `Delivery: ${shippingText}%0A` +
    `${vin ? `VIN: ${vin}%0A` : ""}` +
    `%0APlease contact me to complete this order.`;

  window.open(`https://wa.me/${WHATSAPP_NUM}?text=${message}`, "_blank");
}

// ===================================
// VIN CHECKER
// ===================================

function checkVin() {
  const vin       = document.getElementById("vin-input")?.value.trim().toUpperCase();
  const resultDiv = document.getElementById("vin-result");
  if (!resultDiv) return;

  if (!vin || vin.length !== 17) {
    resultDiv.className   = "vin-result error";
    resultDiv.textContent = "VIN must be exactly 17 characters";
    return;
  }

  const compatible = shopProducts.filter(p =>
    p.compatibility?.some(prefix => vin.startsWith(prefix))
  ).length;

  resultDiv.className = "vin-result success";
  resultDiv.innerHTML =
    `✅ VIN verified!<br>
     <strong>${compatible}</strong> compatible parts found.`;
}

// ===================================
// SEARCH (DEBOUNCED)
// ===================================

let searchTimeout = null;

function debounceSearch(value) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    activeFilters.search = value;
    currentPage = 1;
    updateActiveFilterTags();
    await loadProducts();
  }, 400);  // wait 400ms after user stops typing
}

// ===================================
// PAGINATION
// ===================================

function updateResultsCount(count) {
  const el = document.getElementById("results-count");
  if (el) el.textContent = count;
}

function updatePagination(total, pages) {
  const currentEl = document.querySelector(".current-page");
  const totalEl   = document.querySelector(".total-pages");
  if (currentEl) currentEl.textContent = currentPage;
  if (totalEl)   totalEl.textContent   = pages;
}

async function changePage(direction) {
  const newPage = currentPage + direction;
  if (newPage < 1 || newPage > totalPages) return;
  currentPage = newPage;
  await loadProducts();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===================================
// SORT
// ===================================

async function handleSortChange(value) {
  activeFilters.sort_by = value;
  currentPage = 1;
  await loadProducts();
}

// ===================================
// NOTIFICATION
// ===================================

function showNotification(message) {
  const n       = document.createElement("div");
  n.className   = "notification";
  n.textContent = message;
  n.style.cssText = `
    position:fixed; top:20px; right:20px;
    background:var(--primary-red); color:white;
    padding:1rem 2rem; border-radius:4px;
    z-index:1003; font-family:'Work Sans',sans-serif;
    animation:slideIn 0.3s ease;`;

  document.body.appendChild(n);
  setTimeout(() => {
    n.style.animation = "slideOut 0.3s ease";
    setTimeout(() => n.remove(), 300);
  }, 3000);
}

// ===================================
// STYLES (injected)
// ===================================

const shopStyle = document.createElement("style");
shopStyle.textContent = `
  @keyframes slideIn {
    from { transform:translateX(100%); opacity:0; }
    to   { transform:translateX(0);    opacity:1; }
  }
  @keyframes slideOut {
    from { transform:translateX(0);    opacity:1; }
    to   { transform:translateX(100%); opacity:0; }
  }

  /* ── Filter sidebar ──────────────────────────────── */
  .filter-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }
  .filter-section h3 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 0.75rem;
    color: var(--text-secondary);
  }
  .search-input-wrap {
    position: relative;
  }
  .search-input-wrap i {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #aaa;
  }
  .search-input-wrap input {
    width: 100%;
    padding: 0.6rem 0.75rem 0.6rem 2.2rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-family: 'Work Sans', sans-serif;
    font-size: 0.9rem;
  }

  /* Brand buttons */
  .brand-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .brand-btn {
    padding: 0.6rem 1rem;
    border: 2px solid var(--border-color);
    background: white;
    text-align: left;
    font-family: 'Work Sans', sans-serif;
    font-size: 0.85rem;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .brand-btn:hover { border-color: var(--primary-red); }
  .brand-btn.active {
    background: var(--primary-red);
    border-color: var(--primary-red);
    color: white;
    font-weight: 600;
  }
  .brand-btn-clear {
    border-color: #ddd;
    color: #999;
    font-size: 0.8rem;
  }

  /* Cascade hint */
  .filter-hint {
    background: #fff8f8;
    border: 1px dashed #ffcdd2;
    border-radius: 4px;
    padding: 0.75rem;
    font-size: 0.82rem;
    color: #999;
    text-align: center;
    margin-bottom: 1.5rem;
  }
  .cascade-section {
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Model / engine selects */
  .filter-select {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-family: 'Work Sans', sans-serif;
    font-size: 0.9rem;
    background: white;
  }
  .filter-empty {
    color: #bbb;
    font-size: 0.82rem;
    font-style: italic;
  }

  /* Year inputs */
  .year-input-row {
    margin-bottom: 0.5rem;
  }
  .filter-input-small {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-family: 'Work Sans', sans-serif;
    font-size: 0.9rem;
  }
  .year-quick-picks {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.5rem;
    align-items: center;
  }
  .year-quick-picks small {
    color: #aaa;
    font-size: 0.75rem;
    width: 100%;
  }
  .year-pill {
    padding: 0.2rem 0.6rem;
    border: 1px solid var(--border-color);
    background: white;
    border-radius: 12px;
    font-size: 0.78rem;
    cursor: pointer;
    font-family: 'Work Sans', sans-serif;
    transition: all 0.2s;
  }
  .year-pill:hover,
  .year-pill.active {
    background: var(--primary-red);
    border-color: var(--primary-red);
    color: white;
  }

  /* Category list */
  .category-list {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .category-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.15s;
  }
  .category-option:hover { background: #f5f5f5; }
  .category-option.active {
    background: #fff0f0;
    color: var(--primary-red);
    font-weight: 600;
  }
  .cat-count {
    font-size: 0.75rem;
    color: #aaa;
    background: #f0f0f0;
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
  }
  .category-option.active .cat-count {
    background: #ffd5d5;
    color: var(--primary-red);
  }

  /* Engine buttons */
  .engine-buttons {
    display: flex;
    gap: 0.4rem;
  }
  .engine-btn {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    background: white;
    border-radius: 4px;
    font-family: 'Work Sans', sans-serif;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .engine-btn:hover { border-color: var(--primary-red); }
  .engine-btn.active {
    background: var(--primary-red);
    border-color: var(--primary-red);
    color: white;
  }

  /* Price inputs */
  .price-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }
  .price-inputs .filter-input-small { width: auto; flex: 1; }

  /* Clear all button */
  .clear-all-btn {
    width: 100%;
    padding: 0.6rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    color: #999;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: 'Work Sans', sans-serif;
    transition: all 0.2s;
    margin-top: 0.5rem;
  }
  .clear-all-btn:hover {
    border-color: var(--primary-red);
    color: var(--primary-red);
  }

  /* ── Active filter tags ─────────────────────────── */
  .filter-tags-wrap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    padding: 0.75rem 0;
    margin-bottom: 1rem;
  }
  .filter-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.6rem;
    background: #fff0f0;
    border: 1px solid #ffcdd2;
    border-radius: 12px;
    font-size: 0.8rem;
    color: var(--primary-red);
  }
  .filter-tag button {
    background: none;
    border: none;
    color: var(--primary-red);
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0;
    line-height: 1;
  }
  .clear-all-link {
    background: none;
    border: none;
    color: #999;
    font-size: 0.78rem;
    cursor: pointer;
    text-decoration: underline;
    font-family: 'Work Sans', sans-serif;
  }

  /* ── Product card additions ──────────────────────── */
  .product-meta-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-bottom: 0.5rem;
  }
  .product-brand-badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .product-brand-badge.mercedes {
    background: #e6f7ff;
    color: #1890ff;
  }
  .product-brand-badge.bmw {
    background: #f6ffed;
    color: #52c41a;
  }
  .product-category-badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 3px;
    font-size: 0.7rem;
    background: #f5f5f5;
    color: #666;
    border: 1px solid #e8e8e8;
  }
  .product-compat-badge {
    display: inline-block;
    font-size: 0.75rem;
    color: #888;
    margin-bottom: 0.5rem;
  }
  .product-compat-badge::before {
    content: "🚗 ";
  }

  /* ── VIN section ─────────────────────────────────── */
  .vin-section input {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
`;
document.head.appendChild(shopStyle);

// ===================================
// INIT
// ===================================

document.addEventListener("DOMContentLoaded", async function () {
  // Build sidebar and load products in parallel
  await Promise.all([
    buildFilterSidebar(),
    loadProducts(),
  ]);

  updateCartCount();

  // Sort change handler
  const sortEl = document.getElementById("sort-by");
  if (sortEl) {
    sortEl.addEventListener("change", () =>
      handleSortChange(sortEl.value)
    );
  }

  // Close modal on ESC
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });

  // Close modal on outside click
  const modal = document.getElementById("quick-order-modal");
  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal();
    });
  }

  // Delivery option change
  const deliveryEl = document.getElementById("delivery-option");
  if (deliveryEl) {
    deliveryEl.addEventListener("change", updateOrderSummary);
  }

  // Quantity manual input
  const qtyEl = document.getElementById("order-quantity");
  if (qtyEl) {
    qtyEl.addEventListener("input", updateOrderSummary);
  }
});