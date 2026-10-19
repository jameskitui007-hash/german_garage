// ===================================
// CHECKOUT PAGE
// ===================================

const DELIVERY_FEES = {
  pickup:  0,
  nairobi: 500,
  outside: 1500,
};

let cart             = [];
let selectedDelivery = "pickup";

// ===================================
// INIT
// ===================================

document.addEventListener("DOMContentLoaded", function () {
  cart = JSON.parse(sessionStorage.getItem("pendingCart") || "[]");

  if (cart.length === 0) {
    document.getElementById("checkoutContainer").innerHTML = `
      <div class="empty-cart-msg" style="grid-column:1/-1;">
        <i class="fas fa-shopping-cart" style="font-size:3rem;color:#ddd;"></i>
        <p style="margin-top:1rem;">Your cart is empty.</p>
        <a href="parts-shop.html"
           style="display:inline-block;margin-top:1rem;padding:0.75rem 2rem;
                  background:var(--primary-red);color:white;text-decoration:none;">
          Back to Shop
        </a>
      </div>`;
    return;
  }

  renderCheckout();
});

// ===================================
// RENDER
// ===================================

function renderCheckout() {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = DELIVERY_FEES[selectedDelivery];
  const total    = subtotal + shipping;

  document.getElementById("checkoutContainer").innerHTML = `

    <!-- ── Left: Customer Details Form ── -->
    <div class="checkout-card">
      <h3><i class="fas fa-user"></i> Your Details</h3>
      <form id="checkoutForm" onsubmit="placeOrder(event)">

        <div class="form-group">
          <label>Full Name *</label>
          <input type="text" id="customerName" required
                 placeholder="John Doe">
        </div>

        <div class="form-group">
          <label>Phone Number (WhatsApp) *</label>
          <input type="tel" id="customerPhone" required
                 placeholder="+254 7XX XXX XXX">
        </div>

        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="customerEmail"
                 placeholder="john@example.com">
        </div>

        <h3 style="margin-top:1.5rem;">
          <i class="fas fa-truck"></i> Delivery Method
        </h3>

        <div class="delivery-options">
          <label class="delivery-option selected" id="opt-pickup">
            <input type="radio" name="delivery"
                   value="pickup" checked
                   onchange="selectDelivery('pickup')">
            <div class="delivery-label">
              <strong>Pickup from Garage</strong>
              <div style="font-size:0.82rem;color:#666;">
                Collect from our Nairobi location
              </div>
            </div>
            <span class="delivery-price">FREE</span>
          </label>

          <label class="delivery-option" id="opt-nairobi">
            <input type="radio" name="delivery"
                   value="nairobi"
                   onchange="selectDelivery('nairobi')">
            <div class="delivery-label">
              <strong>Delivery within Nairobi</strong>
              <div style="font-size:0.82rem;color:#666;">
                1–2 business days
              </div>
            </div>
            <span class="delivery-price">KES 500</span>
          </label>

          <label class="delivery-option" id="opt-outside">
            <input type="radio" name="delivery"
                   value="outside"
                   onchange="selectDelivery('outside')">
            <div class="delivery-label">
              <strong>Outside Nairobi</strong>
              <div style="font-size:0.82rem;color:#666;">
                2–4 business days via courier
              </div>
            </div>
            <span class="delivery-price">KES 1,500+</span>
          </label>
        </div>

        <div class="form-group" id="addressGroup"
             style="display:none;margin-top:1rem;">
          <label>Delivery Address *</label>
          <textarea id="deliveryAddress" rows="3"
                    placeholder="Street, Estate, Town..."></textarea>
        </div>

        <div class="form-group" style="margin-top:1rem;">
          <label>Order Notes (optional)</label>
          <textarea id="orderNotes" rows="2"
                    placeholder="Any special instructions..."></textarea>
        </div>

        <button type="submit" class="place-order-btn"
                id="placeOrderBtn">
          <i class="fas fa-check-circle"></i> Place Order
        </button>

      </form>
    </div>

    <!-- ── Right: Order Summary ── -->
    <div>
      <div class="checkout-card">
        <h3><i class="fas fa-receipt"></i> Order Summary</h3>

        <div class="order-summary-items">
          ${cart.map(item => `
            <div class="summary-item">
              <div class="summary-item-name">
                ${item.name}
                <span style="color:#999;font-size:0.8rem;">
                  × ${item.quantity}
                </span>
              </div>
              <div>KES ${(item.price * item.quantity).toLocaleString()}</div>
            </div>`).join("")}
        </div>

        <div class="summary-totals">
          <div class="summary-line">
            <span>Subtotal</span>
            <span>KES ${subtotal.toLocaleString()}</span>
          </div>
          <div class="summary-line">
            <span>Shipping</span>
            <span id="shippingDisplay">
              ${shipping === 0 ? "FREE" : `KES ${shipping.toLocaleString()}`}
            </span>
          </div>
          <div class="summary-line grand-total">
            <span>Total</span>
            <span id="totalDisplay">
              KES ${total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <!-- M-Pesa Payment Info -->
      <div class="checkout-card" style="margin-top:1rem;">
        <h3><i class="fas fa-mobile-alt"></i> Payment via M-Pesa</h3>
        <div class="mpesa-box">
          <h4>📱 Lipa na M-Pesa</h4>
          <div class="mpesa-detail">
            <span>Paybill Number:</span>
            <strong>${PAYBILL}</strong>
          </div>
          <div class="mpesa-detail">
            <span>Account Number:</span>
            <strong>${ACCOUNT_NO}</strong>
          </div>
          <div class="mpesa-detail">
            <span>Amount:</span>
            <strong id="mpesaAmount">KES ${total.toLocaleString()}</strong>
          </div>
          <p style="font-size:0.8rem;color:#555;margin-top:0.75rem;">
            Pay after placing your order. Send M-Pesa confirmation
            via WhatsApp to complete your purchase.
          </p>
        </div>
      </div>
    </div>`;
}

// ===================================
// DELIVERY SELECTION
// ===================================

function selectDelivery(method) {
  selectedDelivery = method;

  // Update selected styles
  ["pickup", "nairobi", "outside"].forEach(m => {
    const el = document.getElementById(`opt-${m}`);
    if (el) el.classList.toggle("selected", m === method);
  });

  // Show/hide address field
  const addressGroup = document.getElementById("addressGroup");
  if (addressGroup) {
    addressGroup.style.display =
      (method === "nairobi" || method === "outside") ? "block" : "none";
  }

  // Update totals
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = DELIVERY_FEES[method];
  const total    = subtotal + shipping;

  const shippingEl = document.getElementById("shippingDisplay");
  const totalEl    = document.getElementById("totalDisplay");
  const mpesaEl    = document.getElementById("mpesaAmount");

  if (shippingEl) shippingEl.textContent =
    shipping === 0 ? "FREE" : `KES ${shipping.toLocaleString()}`;
  if (totalEl)    totalEl.textContent    = `KES ${total.toLocaleString()}`;
  if (mpesaEl)    mpesaEl.textContent    = `KES ${total.toLocaleString()}`;
}

// ===================================
// PLACE ORDER
// ===================================

async function placeOrder(event) {
  event.preventDefault();

  const name    = document.getElementById("customerName").value.trim();
  const phone   = document.getElementById("customerPhone").value.trim();
  const email   = document.getElementById("customerEmail").value.trim();
  const address = document.getElementById("deliveryAddress")?.value.trim();
  const notes   = document.getElementById("orderNotes")?.value.trim();

  // Validate address for delivery orders
  if (selectedDelivery !== "pickup" && !address) {
    alert("Please enter your delivery address.");
    document.getElementById("deliveryAddress").focus();
    return;
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = DELIVERY_FEES[selectedDelivery];

  // ── Build order payload ──────────────────────────────────
  const payload = {
    customer_name:    name,
    customer_phone:   phone,
    customer_email:   email || null,
    items:            cart.map(item => ({
      product_id: item.id,
      name:       item.name,
      price:      item.price,
      quantity:   item.quantity,
    })),
    shipping_fee:     shipping,
    delivery_method:  selectedDelivery,
    delivery_address: address || null,
    notes:            notes   || null,
    payment_status:   "pending_payment",
  };

  // ── Disable button ───────────────────────────────────────
  const btn          = document.getElementById("placeOrderBtn");
  btn.disabled       = true;
  btn.innerHTML      =
    `<i class="fas fa-spinner fa-spin"></i> Placing order...`;

  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to place order");
    }

    const order = await response.json();

    // ── Clear cart ───────────────────────────────────────
    localStorage.removeItem("cart");
    sessionStorage.removeItem("pendingCart");

    // ── Open WhatsApp notification to admin ──────────────
    sendWhatsAppNotification(order);

    // ── Redirect to confirmation page ────────────────────
    window.location.href =
      `order-confirmation.html?order=${order.order_number}`;

  } catch (err) {
    btn.disabled  = false;
    btn.innerHTML =
      `<i class="fas fa-check-circle"></i> Place Order`;
    alert(err.message || "Something went wrong. Please try again.");
  }
}

// ===================================
// WHATSAPP NOTIFICATION
// ===================================

function sendWhatsAppNotification(order) {
  const itemsList = cart.map(i =>
    `• ${i.name} x${i.quantity} @ KES ${i.price.toLocaleString()}`
  ).join("%0A");

  const shipping = DELIVERY_FEES[selectedDelivery];
  const total    = cart.reduce((sum, i) =>
    sum + i.price * i.quantity, 0) + shipping;

  const message =
    `🛒 *NEW ORDER — ${order.order_number}*%0A%0A` +
    `*Customer:* ${order.customer_name}%0A` +
    `*Phone:* ${order.customer_phone}%0A` +
    `*Delivery:* ${selectedDelivery}%0A%0A` +
    `*Items:*%0A${itemsList}%0A%0A` +
    `*Shipping:* ${shipping === 0 ? "FREE" : `KES ${shipping.toLocaleString()}`}%0A` +
    `*Total:* KES ${total.toLocaleString()}%0A%0A` +
    `*Payment:* Pending M-Pesa%0A` +
    `*Paybill:* ${PAYBILL} | Acc: ${ACCOUNT_NO}`;

  // Open WhatsApp in background tab
  window.open(
    `https://wa.me/${WHATSAPP_NUM}?text=${message}`,
    "_blank"
  );
}