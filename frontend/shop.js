// ===================================
// SHOP CONFIGURATION
// ===================================
const API_BASE     = "http://127.0.0.1:8000";
const WHATSAPP_NUM = "254XXXXXXXXX"; // ← replace with real number

// ===================================
// STATE
// ===================================
let shopProducts = []; // populated from API on load
let cart         = JSON.parse(localStorage.getItem("cart")) || [];
let currentPage  = 1;
const itemsPerPage = 8;

// ===================================
// PRODUCT LOADING (from API)
// ===================================

async function fetchProducts() {
  const brand    = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(cb => cb.value);
  const category = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
  const type     = Array.from(document.querySelectorAll('input[name="type"]:checked')).map(cb => cb.value);
  const maxPrice = document.querySelector(".price-range")?.value || 50000;

  let params = `?page=${currentPage}&per_page=${itemsPerPage}`;
  if (brand.length    === 1) params += `&brand=${brand[0]}`;       // only filter if one selected
  if (category.length === 1) params += `&category=${category[0]}`;
  if (type.length     === 1) params += `&type=${type[0]}`;
  params += `&max_price=${maxPrice}`;

  const sortBy = document.getElementById("sort-by")?.value || "featured";
  if (sortBy === "price-low")  params += "&sort=price_asc";
  if (sortBy === "price-high") params += "&sort=price_desc";
  if (sortBy === "newest")     params += "&sort=newest";

  const response = await fetch(`${API_BASE}/api/products${params}`);
  if (!response.ok) throw new Error("Failed to fetch products");

  const data = await response.json();
  return data; // { products: [...], total: N, page: N, total_pages: N }
}

async function loadProducts() {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#999;">
    <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i>
    <p style="margin-top:1rem;">Loading products...</p>
  </div>`;

  try {
    const data   = await fetchProducts();
    shopProducts = data.products || [];

    grid.innerHTML = "";

    if (!shopProducts.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#999;">
        No products found matching your filters.
      </div>`;
    } else {
      shopProducts.forEach(product => grid.appendChild(createProductCard(product)));
    }

    updateResultsCount(data.total || shopProducts.length);
    updatePagination(data.total || shopProducts.length, data.total_pages || 1);

  } catch (err) {
    console.error("Failed to load products:", err);
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#999;">
      <p>⚠️ Could not load products. Please refresh the page.</p>
    </div>`;
  }
}

// ===================================
// PRODUCT CARD
// ===================================

function createProductCard(product) {
  const card   = document.createElement("div");
  card.className = "product-card";

  // Derive stock display — backend uses snake_case
  const stock    = product.stock    ?? product.stock    ?? 0;
  const minStock = product.min_stock ?? 5;
  const inStock  = stock > minStock;
  const badge    = product.badge || null;

  card.innerHTML = `
    ${badge ? `<span class="product-badge">${badge}</span>` : ""}
    <div class="product-image">
      ${product.brand === "mercedes" ? "🚗" : "🏎️"}
    </div>
    <div class="product-brand">${product.brand.toUpperCase()}</div>
    <h4>${product.name}</h4>
    <p class="product-desc">${product.description || ""}</p>
    <div class="product-price">
      KES ${product.price.toLocaleString()}
      ${product.old_price ? `<span>KES ${product.old_price.toLocaleString()}</span>` : ""}
    </div>
    <div class="product-stock" style="font-size:0.8rem;color:${inStock ? "#4caf50" : "#f44336"};margin-bottom:1rem;">
      ${stock === 0 ? "Out of Stock" : stock <= minStock ? `Only ${stock} left` : "In Stock"}
    </div>
    <div class="product-actions">
      <button class="quick-view-btn" onclick="quickView('${product.id}')" ${stock === 0 ? "disabled" : ""}>
        Quick View
      </button>
      <button class="add-to-cart-btn" onclick="addToCart('${product.id}')" ${stock === 0 ? "disabled style='opacity:0.5;cursor:not-allowed;'" : ""}>
      
        ${stock === 0 ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>`;

  return card;
}

// ===================================
// FILTERS & SORT
// ===================================

function applyFilters() {
  currentPage = 1;
  loadProducts();
}

function resetFilters() {
  document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = true);
  document.querySelector(".price-range").value = 50000;
  applyFilters();
}

// ===================================
// PAGINATION
// ===================================

function changePage(direction) {
  currentPage += direction;
  if (currentPage < 1) currentPage = 1;
  loadProducts();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updatePagination(total, totalPages) {
  document.querySelector(".current-page").textContent = currentPage;
  document.querySelector(".total-pages").textContent  = totalPages;
}

function updateResultsCount(count) {
  const el = document.getElementById("results-count");
  if (el) el.textContent = count;
}

// ===================================
// VIN CHECKER
// Uses the local shopProducts cache — compatible field from API
// ===================================

function checkVin() {
  const vin       = document.getElementById("vin-input").value.trim().toUpperCase();
  const resultDiv = document.getElementById("vin-result");

  if (vin.length !== 17) {
    resultDiv.className   = "vin-result error";
    resultDiv.textContent = "VIN must be 17 characters long";
    return;
  }

  const compatibleCount = shopProducts.filter(p =>
    (p.compatibility || []).some(prefix => vin.startsWith(prefix))
  ).length;

  resultDiv.className = "vin-result success";
  resultDiv.innerHTML = `
    ✅ VIN verified!<br>
    <strong>${compatibleCount}</strong> compatible parts found in our store.`;
}

// ===================================
// CART FUNCTIONS
// Cart stays in localStorage — it's temporary session state, not order data.
// The order is only committed to the backend when the customer checks out.
// ===================================

function addToCart(productId) {
  const product = shopProducts.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);

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
      stock:    product.stock, // keep for quantity validation
    });
  }

  saveCart();
  updateCartCount();
  if (document.getElementById("cart-sidebar").classList.contains("open")) {
    updateCartDisplay();
  }
  showNotification(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartCount();
  updateCartDisplay();
}

function updateCartItemQuantity(productId, change) {
  const item = cart.find(item => item.id === productId);
  if (!item) return;

  const newQty = item.quantity + change;

  if (newQty < 1) {
    removeFromCart(productId);
    return;
  }

  if (newQty > item.stock) {
    alert(`Only ${item.stock} units available in stock`);
    return;
  }

  item.quantity = newQty;
  saveCart();
  updateCartCount();
  updateCartDisplay();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cart-count").textContent = total;
}

function updateCartDisplay() {
  const cartItems = document.getElementById("cart-items");
  const subtotal  = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping  = subtotal > 15000 ? 0 : 500;
  const total     = subtotal + shipping;

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-image">
          ${item.brand === "mercedes" ? "🚗" : "🏎️"}
        </div>
        <div class="cart-item-details">
          <h5>${item.name}</h5>
          <div class="cart-item-price">KES ${item.price.toLocaleString()}</div>
          <div class="cart-item-controls">
            <div class="cart-item-quantity">
              <button onclick="updateCartItemQuantity(${item.id}, -1)">-</button>
              <input type="text" value="${item.quantity}" readonly>
              <button onclick="updateCartItemQuantity(${item.id}, 1)">+</button>
            </div>
            <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
          </div>
        </div>
      </div>`).join("");
  }

  document.getElementById("cart-subtotal").textContent    = `KES ${subtotal.toLocaleString()}`;
  document.getElementById("cart-shipping").textContent    = shipping === 0 ? "FREE" : `KES ${shipping.toLocaleString()}`;
  document.getElementById("cart-grand-total").textContent = `KES ${total.toLocaleString()}`;
}

function toggleCart() {
  const sidebar = document.getElementById("cart-sidebar");
  sidebar.classList.toggle("open");
  if (sidebar.classList.contains("open")) updateCartDisplay();
}

// ===================================
// CHECKOUT — POSTs to /api/orders
// ===================================

function proceedToCheckout() {
  if (cart.length === 0) {
    alert("Your cart is empty");
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 15000 ? 0 : 500;
  const total    = subtotal + shipping;

  // Show checkout modal to collect customer info
  const existing = document.getElementById("checkout-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "checkout-modal";
  modal.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.6);
    display:flex; align-items:center; justify-content:center;
    z-index:1010; padding:1rem;`;

  modal.innerHTML = `
    <div style="background:white; border-radius:8px; padding:2rem;
                width:100%; max-width:480px; max-height:90vh; overflow-y:auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h3 style="font-family:'Oswald',sans-serif; font-size:1.3rem;">Complete Your Order</h3>
        <button onclick="document.getElementById('checkout-modal').remove()"
                style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
      </div>

      <!-- Order summary -->
      <div style="background:#f9f9f9; padding:1rem; border-radius:4px; margin-bottom:1.5rem; font-size:0.9rem;">
        ${cart.map(item => `
          <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
            <span>${item.name} × ${item.quantity}</span>
            <span>KES ${(item.price * item.quantity).toLocaleString()}</span>
          </div>`).join("")}
        <hr style="margin:0.5rem 0;">
        <div style="display:flex; justify-content:space-between;">
          <span>Shipping</span>
          <span>${shipping === 0 ? "FREE" : `KES ${shipping.toLocaleString()}`}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-weight:700; margin-top:0.5rem;">
          <span>Total</span>
          <span>KES ${total.toLocaleString()}</span>
        </div>
      </div>

      <!-- Customer form -->
      <form id="checkout-form" onsubmit="submitOrder(event, ${shipping}, ${total})">
        <div style="margin-bottom:1rem;">
          <label style="display:block; font-weight:500; margin-bottom:0.3rem;">Full Name *</label>
          <input type="text" name="customer_name" required placeholder="John Doe"
                 style="width:100%; padding:0.7rem; border:1px solid #ddd; border-radius:4px;">
        </div>
        <div style="margin-bottom:1rem;">
          <label style="display:block; font-weight:500; margin-bottom:0.3rem;">Phone Number *</label>
          <input type="tel" name="customer_phone" required placeholder="+254712345678"
                 style="width:100%; padding:0.7rem; border:1px solid #ddd; border-radius:4px;">
        </div>
        <div style="margin-bottom:1rem;">
          <label style="display:block; font-weight:500; margin-bottom:0.3rem;">Email (optional)</label>
          <input type="email" name="customer_email" placeholder="john@example.com"
                 style="width:100%; padding:0.7rem; border:1px solid #ddd; border-radius:4px;">
        </div>
        <div style="margin-bottom:1rem;">
          <label style="display:block; font-weight:500; margin-bottom:0.3rem;">Delivery Method *</label>
          <select name="delivery_method" required
                  style="width:100%; padding:0.7rem; border:1px solid #ddd; border-radius:4px;">
            <option value="pickup">Pickup from Garage (Free)</option>
            <option value="nairobi">Delivery within Nairobi (KES 500)</option>
            <option value="outside">Outside Nairobi (KES 1,500+)</option>
          </select>
        </div>
        <div style="margin-bottom:1.5rem;">
          <label style="display:block; font-weight:500; margin-bottom:0.3rem;">Payment Method *</label>
          <select name="payment_method" required
                  style="width:100%; padding:0.7rem; border:1px solid #ddd; border-radius:4px;">
            <option value="mpesa">M-Pesa</option>
            <option value="cash">Cash on Pickup</option>
          </select>
        </div>

        <div id="checkout-error" style="display:none; background:#ffebee; color:#c62828;
             padding:0.7rem; border-radius:4px; margin-bottom:1rem; font-size:0.9rem;"></div>

        <button type="submit" id="place-order-btn"
                style="width:100%; padding:1rem; background:#c40000; color:white; border:none;
                       border-radius:4px; font-family:'Oswald',sans-serif; font-size:1rem;
                       letter-spacing:1px; text-transform:uppercase; cursor:pointer;">
          Place Order
        </button>
      </form>
    </div>`;

  document.body.appendChild(modal);

  // Close on backdrop click
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });
}

async function submitOrder(event, shippingFee, total) {
  event.preventDefault();

  const form      = event.target;
  const formData  = new FormData(form);
  const errorDiv  = document.getElementById("checkout-error");
  const submitBtn = document.getElementById("place-order-btn");

  // Build order payload matching the backend OrderCreate schema
  const payload = {
    customer_name:    formData.get("customer_name"),
    customer_phone:   formData.get("customer_phone"),
    customer_email:   formData.get("customer_email") || null,
    delivery_method:  formData.get("delivery_method"),
    payment_method:   formData.get("payment_method"),
    shipping_fee:     shippingFee,
    total:            total,
    items: cart.map(item => ({
      product_id: item.id,
      name:       item.name,
      price:      item.price,
      quantity:   item.quantity,
    })),
  };

  // Loading state
  submitBtn.disabled    = true;
  submitBtn.textContent = "Placing Order...";
  errorDiv.style.display = "none";

  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to place order");
    }

    // Success — clear cart, close modal, show confirmation
    cart = [];
    saveCart();
    updateCartCount();
    document.getElementById("checkout-modal").remove();
    toggleCart(); // close cart sidebar if open

    showOrderConfirmation(data.order_number, payload);

  } catch (err) {
    errorDiv.textContent   = err.message || "Something went wrong. Please try again.";
    errorDiv.style.display = "block";
    submitBtn.disabled     = false;
    submitBtn.textContent  = "Place Order";
  }
}

function showOrderConfirmation(orderNumber, payload) {
  const subtotal = payload.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const modal = document.createElement("div");
  modal.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.6);
    display:flex; align-items:center; justify-content:center;
    z-index:1010; padding:1rem;`;

  modal.innerHTML = `
    <div style="background:white; border-radius:8px; padding:2rem;
                width:100%; max-width:420px; text-align:center;">
      <div style="font-size:3rem; margin-bottom:1rem;">✅</div>
      <h3 style="font-family:'Oswald',sans-serif; font-size:1.5rem; margin-bottom:0.5rem;">
        Order Placed!
      </h3>
      <p style="color:#555; margin-bottom:1rem;">
        Your order <strong>${orderNumber}</strong> has been received.<br>
        We'll contact you on <strong>${payload.customer_phone}</strong> to confirm.
      </p>
      <div style="background:#f9f9f9; padding:1rem; border-radius:4px; margin-bottom:1.5rem;
                  font-size:0.9rem; text-align:left;">
        <p><strong>Total:</strong> KES ${payload.total.toLocaleString()}</p>
        <p><strong>Payment:</strong> ${payload.payment_method === "mpesa" ? "M-Pesa" : "Cash on Pickup"}</p>
        <p><strong>Delivery:</strong> ${payload.delivery_method}</p>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <button onclick="this.closest('div[style]').remove()"
                style="flex:1; padding:0.8rem; background:#f0f0f0; border:none;
                       border-radius:4px; cursor:pointer; font-family:'Work Sans',sans-serif;">
          Close
        </button>
        <button onclick="sendWhatsAppConfirmation('${orderNumber}', '${payload.customer_phone}', ${payload.total})"
                style="flex:1; padding:0.8rem; background:#25D366; color:white; border:none;
                       border-radius:4px; cursor:pointer; font-family:'Work Sans',sans-serif;">
          📱 WhatsApp Us
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
}

function sendWhatsAppConfirmation(orderNumber, phone, total) {
  const message = `Hi! I just placed order ${orderNumber} on your website.%0ATotal: KES ${total.toLocaleString()}%0APlease confirm my order. Thank you!`;
  window.open(`https://wa.me/${WHATSAPP_NUM}?text=${message}`, "_blank");
}

// ===================================
// QUICK VIEW MODAL
// ===================================

let currentProductId = null;

function quickView(productId) {
  const product = shopProducts.find(p => p.id === productId);
  if (!product) return;

  currentProductId = productId;

  document.getElementById("modal-part-name").textContent  = product.name;
  document.getElementById("modal-part-desc").textContent  = product.description || "";
  document.getElementById("modal-part-price").textContent = `KES ${product.price.toLocaleString()}`;
  document.getElementById("modal-part-stock").textContent = product.stock > 5
    ? `${product.stock} units available`
    : `Only ${product.stock} left — order soon!`;
  document.getElementById("order-quantity").value = 1;
  document.getElementById("order-quantity").max   = product.stock;

  updateOrderSummary();
  document.getElementById("quick-order-modal").classList.add("open");
}

function closeModal() {
  document.getElementById("quick-order-modal").classList.remove("open");
  currentProductId = null;
}

function updateQuantity(change) {
  const input   = document.getElementById("order-quantity");
  const product = shopProducts.find(p => p.id === currentProductId);
  if (!product) return;

  const newValue = parseInt(input.value) + change;
  if (newValue >= 1 && newValue <= product.stock) {
    input.value = newValue;
    updateOrderSummary();
  }
}

function updateOrderSummary() {
  const product        = shopProducts.find(p => p.id === currentProductId);
  if (!product) return;

  const quantity       = parseInt(document.getElementById("order-quantity").value);
  const deliveryOption = document.getElementById("delivery-option").value;
  const partsTotal     = product.price * quantity;

  const shippingMap = { pickup: 0, nairobi: 500, outside: 1500 };
  const shipping    = shippingMap[deliveryOption] ?? 0;
  const total       = partsTotal + shipping;

  document.getElementById("summary-parts").textContent    = `KES ${partsTotal.toLocaleString()}`;
  document.getElementById("summary-shipping").textContent = shipping === 0 ? "FREE" : `KES ${shipping.toLocaleString()}`;
  document.getElementById("summary-total").textContent    = `KES ${total.toLocaleString()}`;
}

function addToCartFromModal() {
  const quantity    = parseInt(document.getElementById("order-quantity").value);
  const product     = shopProducts.find(p => p.id === currentProductId);
  if (!product) return;

  const existingItem   = cart.find(item => item.id === currentProductId);
  const newTotalQty    = (existingItem?.quantity || 0) + quantity;

  if (newTotalQty > product.stock) {
    alert(`Only ${product.stock} units available. You already have ${existingItem?.quantity || 0} in cart.`);
    return;
  }

  for (let i = 0; i < quantity; i++) addToCart(currentProductId);
  closeModal();
}

function orderViaWhatsApp() {
  const product        = shopProducts.find(p => p.id === currentProductId);
  const quantity       = parseInt(document.getElementById("order-quantity").value);
  const deliveryOption = document.getElementById("delivery-option").value;
  const vin            = document.getElementById("order-vin")?.value || "";

  const deliveryText = {
    pickup:  "Pickup from garage",
    nairobi: "Delivery within Nairobi (KES 500)",
    outside: "Delivery outside Nairobi (KES 1,500+)",
  }[deliveryOption] || deliveryOption;

  const message = `QUICK ORDER REQUEST%0A%0AProduct: ${product.name}%0AQuantity: ${quantity}%0APrice: KES ${product.price.toLocaleString()}%0ATotal: KES ${(product.price * quantity).toLocaleString()}%0A%0ADelivery: ${deliveryText}%0A${vin ? `VIN: ${vin}%0A` : ""}%0APlease contact me to complete this order.`;
  window.open(`https://wa.me/${WHATSAPP_NUM}?text=${message}`, "_blank");
}

// ===================================
// NOTIFICATION
// ===================================

function showNotification(message) {
  const n = document.createElement("div");
  n.className   = "notification";
  n.textContent = message;
  n.style.cssText = `
    position:fixed; top:20px; right:20px;
    background:var(--primary-red); color:white;
    padding:1rem 2rem; border-radius:4px; z-index:1003;
    animation:slideIn 0.3s ease; font-family:'Work Sans',sans-serif;`;

  document.body.appendChild(n);
  setTimeout(() => {
    n.style.animation = "slideOut 0.3s ease";
    setTimeout(() => n.remove(), 300);
  }, 3000);
}

// ===================================
// INIT
// ===================================

document.addEventListener("DOMContentLoaded", function () {
  // Wire up event listeners
  document.getElementById("delivery-option")?.addEventListener("change", updateOrderSummary);
  document.getElementById("order-quantity")?.addEventListener("input",  updateOrderSummary);
  document.getElementById("sort-by")?.addEventListener("change", loadProducts);

  document.querySelectorAll("input[type='checkbox']").forEach(cb => {
    cb.addEventListener("change", applyFilters);
  });

  document.querySelector(".price-range")?.addEventListener("input", applyFilters);

  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  document.getElementById("quick-order-modal")?.addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });

  // Load products from API
  loadProducts();
  updateCartCount();
});

// Inject CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
  @keyframes slideOut { from { transform:translateX(0); opacity:1; } to { transform:translateX(100%); opacity:0; } }
`;
document.head.appendChild(style);