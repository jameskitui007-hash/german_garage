// ===================================
// PRODUCT PAGE
// ===================================

let product      = null;
let quantity     = 1;
let cart         = JSON.parse(localStorage.getItem("cart") || "[]");

// ===================================
// INIT
// ===================================

document.addEventListener("DOMContentLoaded", async function () {
  const params    = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    window.location.href = "parts-shop.html";
    return;
  }

  await loadProduct(productId);
});

// ===================================
// LOAD PRODUCT
// ===================================

async function loadProduct(productId) {
  try {
    const res = await fetch(`${API_BASE}/api/shop/products/${productId}`);
    if (!res.ok) throw new Error("Product not found");
    product = await res.json();

    renderProduct();
    updateMetaTags();
    loadRelatedProducts();

  } catch (err) {
    document.getElementById("productPage").innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem;color:#999;">
        <i class="fas fa-exclamation-circle" style="font-size:3rem;color:#f44336;"></i>
        <p style="margin-top:1rem;">Product not found or unavailable.</p>
        <a href="parts-shop.html"
           style="display:inline-block;margin-top:1rem;
                  padding:0.75rem 2rem;background:var(--primary-red);
                  color:white;text-decoration:none;">
          Back to Shop
        </a>
      </div>`;
  }
}

// ===================================
// RENDER PRODUCT
// ===================================

function getImageUrl(image) {
  if (!image) return null;
  if (typeof image === "object" && image.url) return image.url;
  if (typeof image === "string" && image.startsWith("http")) return image;
  return `${API_BASE}/uploads/products/${image}`;
}

function renderProduct() {
  const hasImages  = product.images && product.images.length > 0;
  const firstUrl   = hasImages ? getImageUrl(product.images[0]) : null;

  // ── Gallery ────────────────────────────────────────────────
  const galleryHTML = firstUrl
    ? `<div class="product-gallery-main">
         <img id="mainProductImg" src="${firstUrl}" alt="${product.name}">
       </div>
       ${product.images.length > 1
         ? `<div class="product-thumbs">
              ${product.images.map((img, i) => `
                <img src="${getImageUrl(img)}"
                     alt="View ${i+1}"
                     class="product-thumb ${i === 0 ? "active" : ""}"
                     onclick="switchImage('${getImageUrl(img)}', this)">
              `).join("")}
            </div>`
         : ""}`
    : `<div class="placeholder-img">
         ${product.brand === "mercedes" ? "🚗" : "🏎️"}
       </div>`;

  // ── Compatibility block ────────────────────────────────────
  const compatHTML = (product.model_type || product.year_min || product.engine_type)
    ? `<div class="compat-box">
         <h4><i class="fas fa-car"></i> Vehicle Compatibility</h4>
         ${product.model_type
           ? `<div class="compat-row">
                <i class="fas fa-car"></i>
                <span>Model: <strong>${product.model_type}</strong></span>
              </div>` : ""}
         ${product.year_min && product.year_max
           ? `<div class="compat-row">
                <i class="fas fa-calendar"></i>
                <span>Years: <strong>${product.year_min} – ${product.year_max}</strong></span>
              </div>` : ""}
         ${product.engine_type
           ? `<div class="compat-row">
                <i class="fas fa-cog"></i>
                <span>Engine: <strong>${product.engine_type.charAt(0).toUpperCase() + product.engine_type.slice(1)}</strong></span>
              </div>` : ""}
       </div>`
    : "";

  // ── Stock status ───────────────────────────────────────────
  const stockHTML = product.stock > 5
    ? `<div class="product-stock-status in-stock">
         <i class="fas fa-check-circle"></i> In Stock (${product.stock} available)
       </div>`
    : `<div class="product-stock-status low-stock">
         <i class="fas fa-exclamation-circle"></i> Only ${product.stock} left
       </div>`;

  // ── Render page ────────────────────────────────────────────
  document.getElementById("productPage").innerHTML = `
    <!-- Gallery -->
    <div>${galleryHTML}</div>

    <!-- Details -->
    <div class="product-details">
      <div class="product-badges">
        <span class="badge badge-${product.brand}">
          ${product.brand.toUpperCase()}
        </span>
        ${product.category
          ? `<span class="badge badge-category">${product.category.name}</span>`
          : ""}
        ${product.type
          ? `<span class="badge badge-type">${product.type}</span>`
          : ""}
      </div>

      <h1>${product.name}</h1>

      ${product.oem_number
        ? `<p style="color:#888;font-size:0.85rem;margin-bottom:1rem;">
             OEM: ${product.oem_number}
           </p>`
        : ""}

      <div class="product-price-block">
        <div class="product-price">KES ${product.price.toLocaleString()}</div>
        ${stockHTML}
      </div>

      ${compatHTML}

      <!-- Quantity + Add to Cart -->
      <div class="qty-row">
        <div class="qty-selector">
          <button onclick="changeQty(-1)">−</button>
          <input type="number" id="qtyInput" value="1"
                 min="1" max="${product.stock}" readonly>
          <button onclick="changeQty(1)">+</button>
        </div>
        <button class="btn-add-cart" onclick="addToCart()">
          <i class="fas fa-cart-plus"></i> Add to Cart
        </button>
      </div>

      <!-- WhatsApp Inquiry -->
      <button class="btn-whatsapp" onclick="inquireWhatsApp()">
        <i class="fab fa-whatsapp"></i> Inquire on WhatsApp
      </button>

      <!-- Share -->
      <button class="btn-share" onclick="shareProduct()">
        <i class="fas fa-share-alt"></i> Share this part
      </button>

      <!-- Specs -->
      <div class="product-description">
        <h3>Product Details</h3>
        ${product.description
          ? `<p style="color:#555;line-height:1.7;">${product.description}</p>`
          : ""}

        <table class="spec-table">
          <tr><td>SKU</td><td>${product.sku}</td></tr>
          ${product.oem_number
            ? `<tr><td>OEM Number</td><td>${product.oem_number}</td></tr>`
            : ""}
          <tr><td>Brand</td><td>${product.brand.toUpperCase()}</td></tr>
          ${product.category
            ? `<tr><td>Category</td><td>${product.category.name}</td></tr>`
            : ""}
          <tr><td>Type</td><td>${product.type || "—"}</td></tr>
          ${product.model_type
            ? `<tr><td>Compatible Model</td><td>${product.model_type}</td></tr>`
            : ""}
          ${product.year_min
            ? `<tr><td>Year Range</td><td>${product.year_min} – ${product.year_max}</td></tr>`
            : ""}
          ${product.engine_type
            ? `<tr><td>Engine Type</td><td>${product.engine_type}</td></tr>`
            : ""}
        </table>
      </div>
    </div>`;

  // Update breadcrumb
  document.getElementById("breadcrumbName").textContent = product.name;
}

// ===================================
// GALLERY
// ===================================

function switchImage(url, thumbEl) {
  const mainImg = document.getElementById("mainProductImg");
  if (mainImg) mainImg.src = url;
  document.querySelectorAll(".product-thumb").forEach(t =>
    t.classList.remove("active")
  );
  thumbEl.classList.add("active");
}

// ===================================
// QUANTITY
// ===================================

function changeQty(change) {
  const input = document.getElementById("qtyInput");
  const newVal = parseInt(input.value) + change;
  if (newVal >= 1 && newVal <= product.stock) {
    input.value = newVal;
    quantity    = newVal;
  }
}

// ===================================
// CART
// ===================================

function addToCart() {
  const qty          = parseInt(document.getElementById("qtyInput").value);
  const existingItem = cart.find(i => String(i.id) === String(product.id));

  if (existingItem) {
    const newQty = existingItem.quantity + qty;
    if (newQty > product.stock) {
      alert(`Only ${product.stock} units available`);
      return;
    }
    existingItem.quantity = newQty;
  } else {
    cart.push({
      id:       product.id,
      name:     product.name,
      price:    product.price,
      brand:    product.brand,
      quantity: qty,
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  // Show confirmation
  const btn       = document.querySelector(".btn-add-cart");
  const original  = btn.innerHTML;
  btn.innerHTML   = `<i class="fas fa-check"></i> Added to Cart!`;
  btn.style.background = "#4caf50";
  setTimeout(() => {
    btn.innerHTML        = original;
    btn.style.background = "";
  }, 2000);
}

// ===================================
// WHATSAPP INQUIRY
// ===================================

function inquireWhatsApp() {
  const message =
    `Hi! I'm interested in:%0A%0A` +
    `*${product.name}*%0A` +
    `SKU: ${product.sku}%0A` +
    `Price: KES ${product.price.toLocaleString()}%0A` +
    `${product.oem_number ? `OEM: ${product.oem_number}%0A` : ""}` +
    `%0APlease confirm availability. Thank you!`;

  window.open(`https://wa.me/${WHATSAPP_NUM}?text=${message}`, "_blank");
}

// ===================================
// SHARE
// ===================================

function shareProduct() {
  const url   = window.location.href;
  const title = `${product.name} — KES ${product.price.toLocaleString()}`;

  if (navigator.share) {
    // Native share (mobile)
    navigator.share({ title, url })
      .catch(() => copyToClipboard(url));
  } else {
    copyToClipboard(url);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const btn      = document.querySelector(".btn-share");
    const original = btn.innerHTML;
    btn.innerHTML  = `<i class="fas fa-check"></i> Link copied!`;
    setTimeout(() => { btn.innerHTML = original; }, 2000);
  });
}

// ===================================
// RELATED PRODUCTS
// ===================================

async function loadRelatedProducts() {
  if (!product.category_id) return;

  try {
    const res  = await fetch(
      `${API_BASE}/api/shop/products?category_id=${product.category_id}&per_page=4`
    );
    const data = await res.json();

    // Exclude current product
    const related = (data.products || []).filter(
      p => String(p.id) !== String(product.id)
    ).slice(0, 3);

    if (!related.length) return;

    document.getElementById("relatedProducts").innerHTML = `
      <h2>Related Parts</h2>
      <div class="related-grid">
        ${related.map(p => {
          const imgUrl = p.images && p.images.length > 0
            ? getImageUrl(p.images[0])
            : null;
          return `
            <a href="product.html?id=${p.id}"
               style="text-decoration:none;color:inherit;">
              <div class="product-card" style="cursor:pointer;">
                <div class="product-image">
                  ${imgUrl
                    ? `<img src="${imgUrl}" alt="${p.name}"
                            class="product-card-img">`
                    : `<div class="product-card-placeholder">
                         ${p.brand === "mercedes" ? "🚗" : "🏎️"}
                       </div>`}
                </div>
                <div class="product-brand">${p.brand.toUpperCase()}</div>
                <h4>${p.name}</h4>
                <div class="product-price">
                  KES ${p.price.toLocaleString()}
                </div>
              </div>
            </a>`;
        }).join("")}
      </div>`;

  } catch (err) {
    console.warn("Could not load related products:", err);
  }
}

// ===================================
// META TAGS (SEO)
// ===================================

function updateMetaTags() {
  const imgUrl = product.images && product.images.length > 0
    ? getImageUrl(product.images[0])
    : "";

  document.getElementById("pageTitle").textContent =
    `${product.name} | Mercedes & BMW Parts Nairobi`;

  document.getElementById("metaDesc").setAttribute("content",
    `${product.name} — KES ${product.price.toLocaleString()}. ` +
    `Genuine Mercedes & BMW parts in Nairobi. SKU: ${product.sku}`
  );

  document.getElementById("ogTitle").setAttribute("content", product.name);
  document.getElementById("ogDesc").setAttribute("content",
    `KES ${product.price.toLocaleString()} — ${product.description || "Genuine part"}`
  );
  document.getElementById("ogImage").setAttribute("content", imgUrl);
  document.getElementById("ogUrl").setAttribute("content", window.location.href);
}
