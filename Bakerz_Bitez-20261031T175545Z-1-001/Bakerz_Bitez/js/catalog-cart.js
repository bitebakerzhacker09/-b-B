/* Cart bridge for the menu and deals pages. Uses the same browser cart as index.html. */
(function () {
  "use strict";

  var KEY = "bb-cart";
  var countNodes = document.querySelectorAll("[data-cart-count]");
  var toast = document.getElementById("menuToast");
  var toastTimer;
  var cart = readCart();

  function readCart() {
    try {
      var stored = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(stored)) return [];
      return stored.filter(function (item) {
        return item && typeof item.name === "string" &&
          Number.isFinite(Number(item.price)) && Number(item.qty) > 0;
      });
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch (error) {
      showToast("Your browser could not save the cart.");
    }
    updateCount();
  }

  function updateCount() {
    var count = cart.reduce(function (sum, item) {
      return sum + Number(item.qty || 0);
    }, 0);
    countNodes.forEach(function (node) { node.textContent = String(count); });
    var link = document.querySelector("[data-catalog-cart]");
    if (link) link.setAttribute("aria-label", "Open cart with " + count + (count === 1 ? " item" : " items"));
  }

  function showToast(message) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "menu-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("show"); }, 2000);
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-cart-id]");
    if (!button) return;

    var product = button.closest(".menu-item, .cafe-item, .combo-photo-card");
    var title = product && product.querySelector("h3");
    if (!product || !title) return;

    var item = {
      id: button.getAttribute("data-cart-id"),
      name: title.textContent.trim(),
      detail: (product.querySelector("p") || {}).textContent || "",
      price: Number(button.getAttribute("data-cart-price")),
      currency: button.getAttribute("data-cart-currency") || "PKR",
      qty: 1
    };
    if (!item.id || !Number.isFinite(item.price) || item.price < 0) {
      showToast("This item could not be added. Please try again.");
      return;
    }

    var existing = cart.find(function (entry) {
      return entry.id === item.id && (entry.currency || "USD") === item.currency;
    });
    if (existing) existing.qty = Number(existing.qty) + 1;
    else cart.push(item);

    saveCart();
    showToast(item.name + " added to your cart.");
  });

  window.addEventListener("storage", function (event) {
    if (event.key === KEY) {
      cart = readCart();
      updateCount();
    }
  });

  updateCount();
})();
