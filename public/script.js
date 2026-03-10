// Firebase imports from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';
import SplitText from './SplitText.js';
import AnimatedList from './AnimatedList.js';
import LightRays from './LightRays.js';
import LightPillar from './LightPillar.js';
import BlurText from './BlurText.js';

// EmailJS function to send order email
function sendOrderEmail(orderData) {
  return emailjs.send(
    "service_v6hrys4",        // Service ID
    "template_98lcd9v",       // Template ID
    {
      name: orderData.name,
      email: orderData.email,
      phone: orderData.phone,
      address: orderData.address,
      total: orderData.total,
      orderId: orderData.orderId
    }
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = "Since 1990's";
}

const cart = JSON.parse(localStorage.getItem('iron_aura_cart') || '[]');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const cartToggle = document.getElementById('cartToggle');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartCountEl = document.getElementById('cartCount');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutOverlay = document.getElementById('checkoutOverlay');
const checkoutClose = document.getElementById('checkoutClose');

// Initialize Cart UI
const updateCartUI = () => {
  // Update count
  const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = totalCount;

  // Render Items
  if (cartItemsContainer) {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
    } else {
      cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
          <img src="${item.image || 'assets/logo.jpg'}" alt="${item.name}" class="cart-item-thumb" />
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p>₹${item.price} x ${item.qty}</p>
          </div>
          <button class="remove-btn" data-index="${index}">×</button>
        `;
        cartItemsContainer.appendChild(div);
      });
    }
  }

  // Update Total
  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  if (cartTotalEl) cartTotalEl.textContent = `₹${total.toLocaleString('en-IN')}`;

  // Bind remove buttons
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      removeFromCart(index);
    });
  });

  // Save to persistence
  localStorage.setItem('iron_aura_cart', JSON.stringify(cart));
};

const addToCart = (name, price, qty, image) => {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += parseInt(qty);
  } else {
    cart.push({ name, price: parseInt(price), qty: parseInt(qty), image });
  }
  updateCartUI();
  toggleCart(true);
};

const removeFromCart = (index) => {
  cart.splice(index, 1);
  updateCartUI();
};

const toggleCart = (show) => {
  if (cartOverlay) cartOverlay.setAttribute('aria-hidden', !show);
};

const toggleCheckout = (show) => {
  if (checkoutOverlay) checkoutOverlay.setAttribute('aria-hidden', !show);
  if (show) {
    toggleCart(false);

    // Initialize AnimatedList with cart items
    const listContainer = document.getElementById('checkoutItemsList');
    if (listContainer) {
      new AnimatedList(listContainer, {
        items: cart.length > 0 ? cart : ['Demo Item 1', 'Demo Item 2', 'Demo Item 3'],
        onItemSelect: (item, index) => console.log('Selected Item:', item, index),
        showGradients: true,
        enableArrowNavigation: true,
        displayScrollbar: true
      });
    }
  }
};

if (cartToggle) cartToggle.addEventListener('click', () => toggleCart(true));
if (cartClose) cartClose.addEventListener('click', () => toggleCart(false));
if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  toggleCheckout(true);
});
if (checkoutClose) checkoutClose.addEventListener('click', () => toggleCheckout(false));

// Close on outside click
window.addEventListener('click', (e) => {
  if (e.target === cartOverlay) toggleCart(false);
  if (e.target === checkoutOverlay) toggleCheckout(false);
});


document.querySelectorAll('.shop-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const stack = button.dataset.stack;
    const price = button.dataset.price;
    const qty = button.dataset.quantity || 1;
    const image = button.dataset.image;
    addToCart(stack, price, qty, image);
  });
});

const orderForm = document.getElementById('orderForm');
const setStatus = (msg, type = 'info') => {
  const statusEl = document.getElementById('formStatus');
  if (statusEl) {
    statusEl.textContent = msg;
    statusEl.style.color = type === 'error' ? 'var(--crimson)' : 'var(--gold)';
  }
};

if (orderForm) {
  orderForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Validate cart is not empty
    if (cart.length === 0) {
      setStatus("Your cart is empty! Add items before placing an order.", 'error');
      return;
    }

    // Get form values
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();

    // Validate form fields
    if (!name || !phone || !email || !address) {
      setStatus("Please fill in all required fields.", 'error');
      return;
    }

    // Get submit button and disable it during submission
    const submitBtn = document.getElementById('placeOrderBtn');
    const originalBtnText = submitBtn ? submitBtn.textContent : 'Place Order';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing Order...';
    }

    setStatus("Processing your order...", 'info');

    try {
      // Calculate order details
      const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
      const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

      // Prepare cart items for database
      const orderItems = cart.map(item => ({
        productName: item.name,
        quantity: item.qty,
        unitPrice: item.price,
        totalPrice: item.price * item.qty,
        image: item.image || 'assets/logo.jpg'
      }));

      // 1️⃣ Save customer information
      const customerRef = await addDoc(collection(db, "customers"), {
        name,
        phone,
        email,
        address,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // 2️⃣ Save complete order with all details
      const orderData = {
        // Customer Information (embedded for easy access)
        customerId: customerRef.id,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        shippingAddress: address,

        // Order Items
        items: orderItems,
        totalItems: totalItems,
        totalAmount: totalAmount,

        // Order Status
        status: "pending",

        // Timestamps
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const orderRef = await addDoc(collection(db, "orders"), orderData);

      console.log("Order saved successfully:", {
        orderId: orderRef.id,
        customerId: customerRef.id,
        totalAmount,
        items: orderItems.length
      });

      // Send order email via EmailJS
      try {
        await sendOrderEmail({
          name,
          email,
          phone,
          address,
          total: totalAmount,
          orderId: orderRef.id
        });
        console.log("Order email sent successfully");
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't block the order flow if email fails
      }

      // Clear Cart
      cart.length = 0;
      localStorage.removeItem('iron_aura_cart');
      updateCartUI();

      // Reset form
      orderForm.reset();

      // Re-enable button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }

      // Close checkout modal
      toggleCheckout(false);

      // Show success message
      setStatus(`✅ Order placed successfully! Order ID: ${orderRef.id}`, 'info');

      // Show success alert
      alert(`🎉 ORDER PLACED SUCCESSFULLY! 🎉\n\nOrder ID: ${orderRef.id}\nTotal Amount: ₹${totalAmount.toLocaleString('en-IN')}\nItems: ${totalItems} item(s)\n\nThank you for your order! 💪\nWe'll contact you soon for order confirmation.`);

      // Reload page after a short delay
      setTimeout(() => {
        location.reload();
      }, 2000);

    } catch (error) {
      console.error("Order error:", error);

      // Re-enable button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }

      // Show detailed error message
      let errorMessage = "Failed to place order. Please try again.";
      let alertMessage = errorMessage;

      if (error.code === 'permission-denied') {
        errorMessage = "❌ Permission denied. Please update Firebase security rules.";
        alertMessage = `❌ PERMISSION DENIED ERROR

Your Firebase security rules are blocking the order.

To fix this:
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: IRON AURA
3. Go to Firestore Database → Rules tab
4. Copy the rules from FIREBASE_SECURITY_RULES.md file
5. Paste and click "Publish"
6. Try placing the order again

Check the FIREBASE_SECURITY_RULES.md file in your project for detailed instructions.`;
      } else if (error.code === 'unavailable') {
        errorMessage = "❌ Service unavailable. Please check your internet connection.";
        alertMessage = errorMessage;
      } else if (error.code) {
        errorMessage = `❌ Error: ${error.code}`;
        alertMessage = `❌ ORDER FAILED

Error Code: ${error.code}
${error.message ? `Details: ${error.message}` : ''}

Please check your console for more details.`;
      } else if (error.message) {
        errorMessage = `❌ Error: ${error.message}`;
        alertMessage = `❌ ORDER FAILED

${error.message}

Please check your console for more details.`;
      }

      setStatus(errorMessage, 'error');
      alert(alertMessage);
    }
  });
}

// Simple reveal animation on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  },
  { threshold: 0.15 }
);

// Hero Text Split Animation
const heroTitle = document.querySelector('.hero-content h1');
if (heroTitle) {
  new SplitText(heroTitle, {
    delay: 100,
    duration: 0.6,
    ease: "power3.out",
    splitType: "chars",
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0 },
    threshold: 0.1,
    rootMargin: "-100px",
    onLetterAnimationComplete: () => {
      console.log('Hero text animation complete!');
    }
  });
}

document
  .querySelectorAll('.product-card, .section-heading, .gallery-grid figure')
  .forEach((el) => {
    observer.observe(el);
  });

// Interactive detail triggers
document.querySelectorAll('.detail-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const targetId = trigger.dataset.target;
    const content = document.getElementById(targetId);
    const isActive = trigger.classList.contains('active');

    // Close all other triggers
    document.querySelectorAll('.detail-trigger').forEach((t) => {
      if (t !== trigger) {
        t.classList.remove('active');
        const otherId = t.dataset.target;
        const otherContent = document.getElementById(otherId);
        if (otherContent) {
          otherContent.classList.remove('active');
        }
      }
    });

    // Toggle current
    if (isActive) {
      trigger.classList.remove('active');
      if (content) content.classList.remove('active');
    } else {
      trigger.classList.add('active');
      if (content) content.classList.add('active');
    }
  });
});

// Alpha items reveal on scroll
document.querySelectorAll('.alpha-item[data-reveal]').forEach((item) => {
  observer.observe(item);
});

// About Page Light Rays
const aboutRaysContainer = document.getElementById('aboutLightRays');
if (aboutRaysContainer) {
  new LightRays(aboutRaysContainer, {
    raysOrigin: 'top-center',
    raysColor: '#f5c261', // Use brand gold
    raysSpeed: 0.8,
    lightSpread: 1.2,
    rayLength: 2.5,
    pulsating: true,
    fadeDistance: 1.2,
    followMouse: true,
    mouseInfluence: 0.15,
    distortion: 0.1
  });
}

// About Page Text Animations
const aboutHeroTitle = document.querySelector('.about-hero h1');
if (aboutHeroTitle) {
  new BlurText(aboutHeroTitle, {
    delay: 150,
    animateBy: 'words',
    direction: 'top',
    easing: 'power3.out'
  });
}

const creedSubtexts = document.querySelectorAll('.creed-subtext');
creedSubtexts.forEach((el, index) => {
  new BlurText(el, {
    delay: 50,
    animateBy: 'words',
    direction: 'bottom',
    easing: 'power2.out'
  });
});
// Products Page Light Pillar
const productsPillarContainer = document.getElementById('productsLightPillar');
if (productsPillarContainer) {
  new LightPillar(productsPillarContainer, {
    topColor: '#f5c261', // Brand Gold
    bottomColor: '#000000',
    intensity: 1.2,
    rotationSpeed: 0.4,
    pillarWidth: 2.5,
    pillarHeight: 0.6,
    glowAmount: 0.008,
    interactive: true
  });
}

// Initial Render
updateCartUI();

