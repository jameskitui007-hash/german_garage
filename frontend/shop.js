// Product Data
const products = [
  {
    id: 1,
    name: "Mercedes Oil Filter",
    brand: "mercedes",
    category: "filters",
    type: "genuine",
    price: 4500,
    oldPrice: 5200,
    description: "Genuine Mercedes-Benz oil filter. Fits C-Class, E-Class, S-Class models 2015-2022.",
    stock: 15,
    compatibility: ["WDD205", "WDD213", "WDD222"],
    badge: "BEST SELLER"
  },
  {
    id: 2,
    name: "BMW Brake Pads Set",
    brand: "bmw",
    category: "brakes",
    type: "oem",
    price: 12500,
    oldPrice: 14500,
    description: "OEM brake pads for BMW 3 Series, 5 Series. Front & rear set. Ceramic compound.",
    stock: 8,
    compatibility: ["WBA3B", "WBA5F", "WBA7A"],
    badge: "FREE SHIPPING"
  },
  {
    id: 3,
    name: "Mercedes Air Filter",
    brand: "mercedes",
    category: "filters",
    type: "genuine",
    price: 3800,
    oldPrice: 4200,
    description: "Genuine Mercedes air filter. Improves engine performance and fuel efficiency.",
    stock: 22,
    compatibility: ["WDD205", "WDD253", "WDD166"],
    badge: null
  },
  {
    id: 4,
    name: "BMW Cabin Filter",
    brand: "bmw",
    category: "filters",
    type: "aftermarket",
    price: 3200,
    oldPrice: 3800,
    description: "High-quality cabin air filter with activated carbon. Fits most BMW models.",
    stock: 30,
    compatibility: ["WBA3B", "WBA5F", "WBA7A", "WBA8C"],
    badge: "NEW"
  },
  {
    id: 5,
    name: "Mercedes Spark Plugs Set",
    brand: "mercedes",
    category: "engine",
    type: "oem",
    price: 9800,
    oldPrice: 11500,
    description: "Set of 4 spark plugs for Mercedes 4-cylinder engines. Iridium tipped.",
    stock: 6,
    compatibility: ["WDD205", "WDD213"],
    badge: "LIMITED STOCK"
  },
  {
    id: 6,
    name: "BMW Engine Air Filter",
    brand: "bmw",
    category: "filters",
    type: "genuine",
    price: 5200,
    oldPrice: 5800,
    description: "Original BMW engine air filter. Maintains optimal air flow and filtration.",
    stock: 12,
    compatibility: ["WBA3B", "WBA5F"],
    badge: null
  },
  {
    id: 7,
    name: "Mercedes Brake Discs",
    brand: "mercedes",
    category: "brakes",
    type: "oem",
    price: 18500,
    oldPrice: 21500,
    description: "Front brake discs for Mercedes E-Class. Vented and cross-drilled.",
    stock: 4,
    compatibility: ["WDD213"],
    badge: "SALE"
  },
  {
    id: 8,
    name: "BMW Oil Filter Kit",
    brand: "bmw",
    category: "filters",
    type: "genuine",
    price: 6800,
    oldPrice: 7500,
    description: "Complete oil change kit with filter and O-rings. Fits N20, B48 engines.",
    stock: 10,
    compatibility: ["WBA3B", "WBA5F"],
    badge: "COMPLETE KIT"
  },
  {
    id: 9,
    name: "Mercedes Control Arm",
    brand: "mercedes",
    category: "suspension",
    type: "oem",
    price: 14200,
    oldPrice: 16500,
    description: "Front lower control arm with bushings. Improves handling and ride quality.",
    stock: 5,
    compatibility: ["WDD205", "WDD213"],
    badge: null
  },
  {
    id: 10,
    name: "BMW Suspension Strut",
    brand: "bmw",
    category: "suspension",
    type: "aftermarket",
    price: 22500,
    oldPrice: 25500,
    description: "Front suspension strut assembly for BMW 3 Series. Gas charged.",
    stock: 3,
    compatibility: ["WBA3B"],
    badge: "LAST UNITS"
  },
  {
    id: 11,
    name: "Mercedes Battery",
    brand: "mercedes",
    category: "electrical",
    type: "oem",
    price: 28500,
    oldPrice: 32000,
    description: "AGM battery for Mercedes models with Start-Stop function. 80Ah capacity.",
    stock: 7,
    compatibility: ["WDD205", "WDD213", "WDD222"],
    badge: "HEAVY DUTY"
  },
  {
    id: 12,
    name: "BMW Alternator",
    brand: "bmw",
    category: "electrical",
    type: "oem",
    price: 38500,
    oldPrice: 42500,
    description: "Reconditioned alternator for BMW 5 Series. 180A output. 12-month warranty.",
    stock: 2,
    compatibility: ["WBA5F"],
    badge: "RECONDITIONED"
  }
];

// Cart Management
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentPage = 1;
const itemsPerPage = 8;

// Load Products
function loadProducts() {
  const grid = document.getElementById('products-grid');
  const filteredProducts = getFilteredProducts();
  const sortedProducts = sortProducts(filteredProducts);
  const paginatedProducts = paginateProducts(sortedProducts);
  
  grid.innerHTML = '';
  paginatedProducts.forEach(product => {
    grid.appendChild(createProductCard(product));
  });
  
  updateResultsCount(filteredProducts.length);
  updatePagination(filteredProducts.length);
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
    <div class="product-image">
      ${product.brand === 'mercedes' ? '🚗' : '🏎️'}
    </div>
    <div class="product-brand">${product.brand.toUpperCase()}</div>
    <h4>${product.name}</h4>
    <p class="product-desc">${product.description}</p>
    <div class="product-price">
      KES ${product.price.toLocaleString()}
      ${product.oldPrice ? `<span>KES ${product.oldPrice.toLocaleString()}</span>` : ''}
    </div>
    <div class="product-stock" style="font-size: 0.8rem; color: ${product.stock > 5 ? '#4caf50' : '#f44336'}; margin-bottom: 1rem;">
      ${product.stock > 5 ? 'In Stock' : `Only ${product.stock} left`}
    </div>
    <div class="product-actions">
      <button class="quick-view-btn" onclick="quickView(${product.id})">Quick View</button>
      <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Add to Cart</button>
    </div>
  `;
  return card;
}

// Filter Functions
function getFilteredProducts() {
  const brandFilters = Array.from(document.querySelectorAll('input[name="brand"]:checked'))
    .map(cb => cb.value);
  const categoryFilters = Array.from(document.querySelectorAll('input[name="category"]:checked'))
    .map(cb => cb.value);
  const typeFilters = Array.from(document.querySelectorAll('input[name="type"]:checked'))
    .map(cb => cb.value);
  const priceRange = document.querySelector('.price-range').value;
  
  return products.filter(product => {
    // Brand filter
    if (brandFilters.length > 0 && !brandFilters.includes(product.brand)) return false;
    
    // Category filter
    if (categoryFilters.length > 0 && !categoryFilters.includes(product.category)) return false;
    
    // Type filter
    if (typeFilters.length > 0 && !typeFilters.includes(product.type)) return false;
    
    // Price filter
    if (product.price > priceRange) return false;
    
    return true;
  });
}

function applyFilters() {
  currentPage = 1;
  loadProducts();
}

function resetFilters() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
  document.querySelector('.price-range').value = 50000;
  applyFilters();
}

// Sort Functions
function sortProducts(productsArray) {
  const sortBy = document.getElementById('sort-by').value;
  
  switch(sortBy) {
    case 'price-low':
      return [...productsArray].sort((a, b) => a.price - b.price);
    case 'price-high':
      return [...productsArray].sort((a, b) => b.price - a.price);
    case 'newest':
      return [...productsArray].sort((a, b) => b.id - a.id);
    case 'popular':
      return [...productsArray]; // Would need sales data
    default:
      return productsArray;
  }
}

// Pagination
function paginateProducts(productsArray) {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return productsArray.slice(start, end);
}

function changePage(direction) {
  const totalProducts = getFilteredProducts().length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  
  currentPage += direction;
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;
  
  loadProducts();
  updatePagination(totalProducts);
}

function updatePagination(totalProducts) {
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  document.querySelector('.current-page').textContent = currentPage;
  document.querySelector('.total-pages').textContent = totalPages;
}

function updateResultsCount(count) {
  document.getElementById('results-count').textContent = count;
}

// VIN Checker
function checkVin() {
  const vin = document.getElementById('vin-input').value.trim().toUpperCase();
  const resultDiv = document.getElementById('vin-result');
  
  if (vin.length !== 17) {
    resultDiv.className = 'vin-result error';
    resultDiv.textContent = 'VIN must be 17 characters long';
    return;
  }
  
  // Simulate VIN check
  const compatibleProducts = products.filter(p => 
    p.compatibility.some(prefix => vin.startsWith(prefix))
  ).length;
  
  resultDiv.className = 'vin-result success';
  resultDiv.innerHTML = `
    ✅ VIN verified successfully!<br>
    <strong>${compatibleProducts}</strong> compatible parts found in our store.
  `;
}

// Cart Functions
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
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
      id: product.id,
      name: product.name,
      price: product.price,
      brand: product.brand,
      quantity: 1
    });
  }
  
  saveCart();
  updateCartCount();
  if (document.getElementById('cart-sidebar').classList.contains('open')) {
    updateCartDisplay();
  }
  
  // Show confirmation
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
  const product = products.find(p => p.id === productId);
  
  if (item) {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    if (newQuantity > product.stock) {
      alert(`Only ${product.stock} units available in stock`);
      return;
    }
    item.quantity = newQuantity;
  }
  
  saveCart();
  updateCartCount();
  updateCartDisplay();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cart-count').textContent = totalItems;
}

function updateCartDisplay() {
  const cartItems = document.getElementById('cart-items');
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 15000 ? 0 : 500;
  const total = subtotal + shipping;
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-image">
          ${item.brand === 'mercedes' ? '🚗' : '🏎️'}
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
      </div>
    `).join('');
  }
  
  document.getElementById('cart-subtotal').textContent = `KES ${subtotal.toLocaleString()}`;
  document.getElementById('cart-shipping').textContent = shipping === 0 ? 'FREE' : `KES ${shipping.toLocaleString()}`;
  document.getElementById('cart-grand-total').textContent = `KES ${total.toLocaleString()}`;
}

function toggleCart() {
  const sidebar = document.getElementById('cart-sidebar');
  sidebar.classList.toggle('open');
  if (sidebar.classList.contains('open')) {
    updateCartDisplay();
  }
}

function proceedToCheckout() {
  if (cart.length === 0) {
    alert('Your cart is empty');
    return;
  }
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = total > 15000 ? 0 : 500;
  const grandTotal = total + shipping;
  
  const message = `ORDER REQUEST%0A%0AItems:%0A${cart.map(item => 
    `• ${item.name} x${item.quantity} - KES ${item.price.toLocaleString()}`
  ).join('%0A')}%0A%0ASubtotal: KES ${total.toLocaleString()}%0AShipping: ${shipping === 0 ? 'FREE' : `KES ${shipping.toLocaleString()}`}%0ATotal: KES ${grandTotal.toLocaleString()}%0A%0APlease contact me to complete this order.`;
  
  window.open(`https://wa.me/254XXXXXXXXX?text=${message}`, '_blank');
}

// Quick View Modal
let currentProductId = null;

function quickView(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  currentProductId = productId;
  
  document.getElementById('modal-part-name').textContent = product.name;
  document.getElementById('modal-part-desc').textContent = product.description;
  document.getElementById('modal-part-price').textContent = `KES ${product.price.toLocaleString()}`;
  document.getElementById('modal-part-stock').textContent = product.stock > 5 ? 
    `${product.stock} units available` : `Only ${product.stock} left - Order soon!`;
  document.getElementById('order-quantity').value = 1;
  document.getElementById('order-quantity').max = product.stock;
  
  updateOrderSummary();
  
  document.getElementById('quick-order-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('quick-order-modal').classList.remove('open');
  currentProductId = null;
}

function updateQuantity(change) {
  const input = document.getElementById('order-quantity');
  const product = products.find(p => p.id === currentProductId);
  const newValue = parseInt(input.value) + change;
  
  if (newValue >= 1 && newValue <= product.stock) {
    input.value = newValue;
    updateOrderSummary();
  }
}

function updateOrderSummary() {
  const product = products.find(p => p.id === currentProductId);
  const quantity = parseInt(document.getElementById('order-quantity').value);
  const deliveryOption = document.getElementById('delivery-option').value;
  
  const partsTotal = product.price * quantity;
  let shipping = 0;
  
  switch(deliveryOption) {
    case 'pickup':
      shipping = 0;
      break;
    case 'nairobi':
      shipping = 500;
      break;
    case 'outside':
      shipping = 1500;
      break;
  }
  
  const total = partsTotal + shipping;
  
  document.getElementById('summary-parts').textContent = `KES ${partsTotal.toLocaleString()}`;
  document.getElementById('summary-shipping').textContent = shipping === 0 ? 'FREE' : `KES ${shipping.toLocaleString()}`;
  document.getElementById('summary-total').textContent = `KES ${total.toLocaleString()}`;
}

function addToCartFromModal() {
  const quantity = parseInt(document.getElementById('order-quantity').value);
  const product = products.find(p => p.id === currentProductId);
  
  if (!product) return;
  
  const existingItem = cart.find(item => item.id === currentProductId);
  const newTotalQuantity = (existingItem?.quantity || 0) + quantity;
  
  if (newTotalQuantity > product.stock) {
    alert(`Only ${product.stock} units available in stock. You already have ${existingItem?.quantity || 0} in cart.`);
    return;
  }
  
  for (let i = 0; i < quantity; i++) {
    addToCart(currentProductId);
  }
  
  closeModal();
}

function orderViaWhatsApp() {
  const product = products.find(p => p.id === currentProductId);
  const quantity = parseInt(document.getElementById('order-quantity').value);
  const deliveryOption = document.getElementById('delivery-option').value;
  const vin = document.getElementById('order-vin').value;
  
  let shippingText = '';
  switch(deliveryOption) {
    case 'pickup':
      shippingText = 'Pickup from garage';
      break;
    case 'nairobi':
      shippingText = 'Delivery within Nairobi (KES 500)';
      break;
    case 'outside':
      shippingText = 'Delivery outside Nairobi (KES 1,500+)';
      break;
  }
  
  const message = `QUICK ORDER REQUEST%0A%0AProduct: ${product.name}%0AQuantity: ${quantity}%0APrice: KES ${product.price.toLocaleString()}%0ATotal: KES ${(product.price * quantity).toLocaleString()}%0A%0ADelivery: ${shippingText}%0A${vin ? `VIN: ${vin}%0A` : ''}%0APlease contact me to complete this order.`;
  
  window.open(`https://wa.me/254XXXXXXXXX?text=${message}`, '_blank');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Update order summary when delivery option changes
  document.getElementById('delivery-option').addEventListener('change', updateOrderSummary);
  
  // Update order summary when quantity changes manually
  document.getElementById('order-quantity').addEventListener('input', updateOrderSummary);
  
  // Sort change
  document.getElementById('sort-by').addEventListener('change', loadProducts);
  
  // Filter changes
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });
  
  // Price range
  document.querySelector('.price-range').addEventListener('input', applyFilters);
  
  // Close modal on ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });
  
  // Close modal on outside click
  document.getElementById('quick-order-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
  
  // Initialize
  loadProducts();
  updateCartCount();
});

// Notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--primary-red);
    color: white;
    padding: 1rem 2rem;
    border-radius: 4px;
    z-index: 1003;
    animation: slideIn 0.3s ease;
    font-family: 'Work Sans', sans-serif;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animations for notification
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);