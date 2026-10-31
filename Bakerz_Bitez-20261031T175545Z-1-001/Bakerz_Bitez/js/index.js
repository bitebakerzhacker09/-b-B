
(function () {
  // ---- Macaron SVG generator ----
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return "rgb(" + r + "," + g + "," + b + ")";
  }
  function macaron(color) {
    var d = shade(color, -28), l = shade(color, 22);
    return '<path d="M10 34C10 10 90 10 90 34Z" fill="' + color + '" stroke="' + d + '" stroke-width="1.5"/>' +
      '<path d="M16 28C22 18 40 14 52 15" stroke="' + l + '" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M12 36h76v6c0 3-76 3-76 0z" fill="#fffdf8" stroke="' + d + '" stroke-width="1" opacity=".95"/>' +
      '<path d="M10 44C10 66 90 66 90 44Z" fill="' + color + '" stroke="' + d + '" stroke-width="1.5"/>' +
      '<path d="M14 34h72" stroke="' + d + '" stroke-width="1" opacity=".5"/>';
  }
  function drawAll() {
    document.querySelectorAll("svg.mac").forEach(function (s) {
      s.setAttribute("viewBox", "0 0 100 70");
      s.innerHTML = macaron(s.getAttribute("data-c"));
    });
  }
  drawAll();

  // ---- Box builder ----
  var PRICE = 2.8;
  var FLAVOURS = [
    { n: "Pistachio", d: "Green nut cream", c: "#b9d6a8" },
    { n: "Rose", d: "Petal and lychee", c: "#f1c0cb" },
    { n: "Salted caramel", d: "Buttery, golden", c: "#e3b676" },
    { n: "Dark chocolate", d: "Bitter, 70% cocoa", c: "#9a6a52" },
    { n: "Vanilla bourbon", d: "Madagascan pods", c: "#f3e7c1" },
    { n: "Raspberry", d: "Tart red fruit", c: "#e8808f" },
    { n: "Lemon", d: "Bright and zesty", c: "#f2e07a" },
    { n: "Coffee", d: "Roasted espresso", c: "#c6a285" },
    { n: "Orange blossom", d: "Soft and floral", c: "#f4c79a" },
    { n: "Blackcurrant violet", d: "Deep and fragrant", c: "#b7a1d3" }
  ];
  var SIZES = [6, 12, 24];
  var size = 12;
  var counts = {};
  var orders = 0;

  var elSizes = document.getElementById("sizes");
  var elFl = document.getElementById("flavours");
  var elSlots = document.getElementById("slots");
  var elMsg = document.getElementById("msg");

  function total() { return Object.keys(counts).reduce(function (a, k) { return a + counts[k]; }, 0); }
  function money(n) { return window.BBCurrency ? window.BBCurrency.format(n, "USD") : "$" + n.toFixed(2); }

  function renderSizes() {
    elSizes.innerHTML = "";
    SIZES.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = "Box of " + s;
      b.setAttribute("aria-pressed", s === size);
      b.addEventListener("click", function () {
        size = s;
        // trim if box now smaller
        var over = total() - size;
        if (over > 0) {
          Object.keys(counts).reverse().forEach(function (k) {
            while (over > 0 && counts[k] > 0) { counts[k]--; over--; }
          });
        }
        update();
      });
      elSizes.appendChild(b);
    });
  }

  function renderFlavours() {
    elFl.innerHTML = "";
    FLAVOURS.forEach(function (f) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "fl";
      b.setAttribute("aria-label", "Add " + f.n);
      b.innerHTML = '<svg viewBox="0 0 100 70" aria-hidden="true">' + macaron(f.c) + '</svg><span>' + f.n + '</span><em>' + f.d + '</em><br><span class="qty" hidden></span>';
      b.addEventListener("click", function () {
        if (total() >= size) { elMsg.textContent = "Your box is full. Remove a macaron or choose a larger box."; return; }
        counts[f.n] = (counts[f.n] || 0) + 1;
        elMsg.textContent = "";
        update();
      });
      b.addEventListener("contextmenu", function (e) { e.preventDefault(); remove(f.n); });
      b.dataset.name = f.n;
      elFl.appendChild(b);
    });
  }

  function remove(name) {
    if (counts[name] > 0) { counts[name]--; update(); }
  }

  function update() {
    var t = total();
    Array.prototype.forEach.call(elSizes.children, function (b, i) { b.setAttribute("aria-pressed", SIZES[i] === size); });
    Array.prototype.forEach.call(elFl.children, function (b) {
      var q = b.querySelector(".qty"), n = counts[b.dataset.name] || 0;
      q.hidden = n === 0; q.textContent = n;
    });
    // slots
    elSlots.innerHTML = "";
    var list = [];
    FLAVOURS.forEach(function (f) { for (var i = 0; i < (counts[f.n] || 0); i++) list.push(f); });
    var show = Math.min(size, 24);
    for (var i = 0; i < show; i++) {
      var s = document.createElement("button");
      s.type = "button";
      s.className = "slot";
      if (list[i]) {
        s.setAttribute("aria-label", "Remove " + list[i].n);
        s.title = "Remove " + list[i].n;
        s.innerHTML = '<svg viewBox="0 0 100 70" aria-hidden="true">' + macaron(list[i].c) + '</svg>';
        (function (name) { s.addEventListener("click", function () { remove(name); }); })(list[i].n);
      } else { s.disabled = true; s.setAttribute("aria-label", "Empty slot"); s.style.cursor = "default"; }
      s.style.background = "none";
      s.style.padding = "0";
      elSlots.appendChild(s);
    }
    document.getElementById("sizeLabel").textContent = "Box of " + size;
    document.getElementById("fillLabel").textContent = t + " of " + size + " chosen";
    document.getElementById("unitLine").textContent = t + " × " + money(PRICE);
    document.getElementById("total").textContent = money(t * PRICE);
    var add = document.getElementById("addbox");
    add.disabled = t !== size;
    add.textContent = t === size ? "Add box to order" : "Choose " + (size - t) + " more";
  }

  document.getElementById("addbox").addEventListener("click", function () {
    window.BB.addItem({ id: "box-" + size + "-" + Date.now(), name: "Macaron box of " + size, detail: FLAVOURS.map(function (f) { return counts[f.n] ? counts[f.n] + " " + f.n : ""; }).filter(Boolean).join(", "), price: size * PRICE });
    
    elMsg.textContent = "Added. Your box of " + size + " is in your order.";
    counts = {};
    update();
  });
  document.getElementById("clear").addEventListener("click", function () { counts = {}; elMsg.textContent = ""; update(); });
  document.getElementById("cartbtn").addEventListener("click", function () {
    window.BB.open();
    
  });

  renderSizes(); renderFlavours(); update();
  window.addEventListener("bbcurrencychange", update);

  // ---- Mobile menu ----
  var mb = document.getElementById("menubtn"), nav = document.getElementById("nav");
  mb.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    mb.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") { nav.classList.remove("open"); mb.setAttribute("aria-expanded", "false"); } });

  // ---- Newsletter ----
  document.getElementById("newsform").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = document.getElementById("email").value.trim();
    var ok = document.getElementById("newsok");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { ok.textContent = "Enter a valid email address, like name@example.com."; return; }
    ok.textContent = "Subscribed. Watch your inbox for the next flavour.";
    document.getElementById("email").value = "";
  });
})();



(function () {
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return window.BBCurrency ? window.BBCurrency.format(n, "USD") : "$" + n.toFixed(2); }

  /* ---- theme toggle ---- */
  var root = document.documentElement, tb = $("themebtn");
  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    tb.textContent = t === "dark" ? "☀" : "☾";
    tb.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    try { localStorage.setItem("bb-theme", t); } catch (e) {}
  }
  var savedTheme = null;
  try { savedTheme = localStorage.getItem("bb-theme"); } catch (e) {}
  setTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : (isDark() ? "dark" : "light"));
  tb.addEventListener("click", function () { setTheme(isDark() ? "light" : "dark"); });

  /* ---- toast ---- */
  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("on"); }, 2200);
  }

  /* ---- cart state ---- */
  var KEY = "bb-cart", DELIVERY = 4;
  var cart = [];
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (Array.isArray(raw)) {
      cart = raw.filter(function (i) { return i && typeof i.name === "string" && isFinite(i.price) && i.qty > 0; });
    }
  } catch (e) { cart = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function count() { return cart.reduce(function (a, i) { return a + i.qty; }, 0); }
  function currencyOf(item) { return item && item.currency === "PKR" ? "PKR" : "USD"; }
  function formatAmount(amount, currency) {
    return window.BBCurrency ? window.BBCurrency.format(amount, currency) :
      (currency === "PKR" ? "Rs. " + Math.round(amount).toLocaleString("en-PK") : money(amount));
  }
  function cartCurrencies() {
    var found = [];
    cart.forEach(function (item) {
      var currency = currencyOf(item);
      if (found.indexOf(currency) === -1) found.push(currency);
    });
    return found;
  }
  function sub(currency) {
    return cart.reduce(function (sum, item) {
      return sum + (currencyOf(item) === currency ? Number(item.qty) * Number(item.price) : 0);
    }, 0);
  }
  function formatSubtotal() {
    if (window.BBCurrency && window.BBCurrency.hasRates()) {
      var localTotal = 0;
      var converted = true;
      cart.forEach(function (item) {
        var amount = window.BBCurrency.convert(Number(item.qty) * Number(item.price), currencyOf(item));
        if (amount === null) converted = false;
        else localTotal += amount;
      });
      if (converted) return formatAmount(localTotal, window.BBCurrency.getCurrency());
    }
    return cartCurrencies().map(function (currency) {
      return formatAmount(sub(currency), currency);
    }).join(" + ");
  }
  function singleCurrency() {
    var currencies = cartCurrencies();
    return currencies.length === 1 ? currencies[0] : null;
  }

  var CART_SUGGESTIONS = [
    { id: "menu-chocolate-fudge-cake", name: "Chocolate Fudge Cake", detail: "Rich chocolate layers with silky fudge frosting.", price: 650, currency: "PKR", image: "assets/images/cakes-and-bakes.jpg" },
    { id: "menu-butter-croissant", name: "Butter Croissant", detail: "Flaky, golden layers with a buttery finish.", price: 280, currency: "PKR", image: "assets/images/butter-croissant.jpg" },
    { id: "menu-assorted-donuts", name: "Assorted Donuts", detail: "Soft donuts with playful glazes and toppings.", price: 220, currency: "PKR", image: "assets/images/assorted-donut.jpg" },
    { id: "menu-hand-scooped-ice-cream", name: "Hand-scooped Ice Cream", detail: "Choose creamy classics and seasonal flavours.", price: 350, currency: "PKR", image: "assets/images/ice-cream-scoops.jpg" },
    { id: "menu-french-macarons", name: "French Macarons", detail: "Pastel almond shells with smooth, sweet fillings.", price: 300, currency: "PKR", image: "assets/images/macrons.jpg" },
    { id: "menu-espresso", name: "Espresso", detail: "A bold, smooth shot of freshly brewed coffee.", price: 250, currency: "PKR", image: "assets/images/espresso.jpg" },
    { id: "c-choc-0", name: "Chocolate truffle cake (Slice)", detail: "Dark chocolate sponge, silky ganache and cocoa dust.", price: 5.5, currency: "USD", image: "assets/images/truffle-cake.jpg" },
    { id: "p-cro-0", name: "Croissant au beurre (Each)", detail: "Butter, flaky, still warm from the oven.", price: 3.5, currency: "USD", image: "assets/images/croissant-au-beurre.jpg" },
    { id: "w-nyc-0", name: "New York cheesecake (Per slice)", detail: "Baked cheesecake with strawberry sauce.", price: 7.5, currency: "USD", image: "assets/images/nem-york-cheese-cake.jpg" }
  ];
  var cartSuggestion = null;
  function chooseCartSuggestion() {
    var available = CART_SUGGESTIONS.filter(function (item) {
      return !cart.some(function (current) { return current.id === item.id; });
    });
    if (!available.length) return null;

    var lastId = "";
    try { lastId = sessionStorage.getItem("bb-last-cart-suggestion") || ""; } catch (e) {}
    var fresh = available.filter(function (item) { return item.id !== lastId; });
    var preferredCurrency = singleCurrency();
    if (preferredCurrency) {
      var matching = fresh.filter(function (item) { return item.currency === preferredCurrency; });
      if (matching.length) fresh = matching;
    }
    var choices = fresh.length ? fresh : available;
    var suggestion = choices[Math.floor(Math.random() * choices.length)];
    try { sessionStorage.setItem("bb-last-cart-suggestion", suggestion.id); } catch (e) {}
    return suggestion;
  }
  function suggestionMarkup() {
    if (!cartSuggestion) cartSuggestion = chooseCartSuggestion();
    if (!cartSuggestion) return "";
    return '<aside class="cart-recommendation" aria-label="A product suggestion">' +
      '<div class="cart-recommendation-copy"><span class="cart-recommendation-kicker">A little something extra</span><h4>You might like</h4>' +
      '<p>' + esc(cartSuggestion.name) + ' · ' + formatAmount(cartSuggestion.price, cartSuggestion.currency) + '</p>' +
      '<button class="cart-recommendation-add" type="button" data-rec-add="' + esc(cartSuggestion.id) + '">Add to cart</button></div>' +
      '<img src="' + esc(cartSuggestion.image) + '" alt="' + esc(cartSuggestion.name) + '" loading="lazy"></aside>';
  }

  var view = "cart", lastOrder = null, lastFocus = null;
  var chk = { mode: "pickup", name: "", phone: "", addr: "", day: 0, time: 1, gift: "" };
  var drawer = $("drawer"), scrim = $("scrim"), body = $("dbody"), foot = $("dfoot");
  var bgEls = document.querySelectorAll(".bar, header.site, main, footer, .totop");
  drawer.inert = true;

  function setBg(on) { bgEls.forEach(function (el) { el.inert = on; }); }
  function open() {
    lastFocus = document.activeElement;
    if (view === "done") view = "cart";
    cartSuggestion = chooseCartSuggestion();
    render();
    drawer.inert = false;
    setBg(true);
    drawer.classList.add("on");
    scrim.classList.add("on");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $("dclose").focus();
  }
  function close() {
    drawer.classList.remove("on");
    scrim.classList.remove("on");
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    setBg(false);
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function addItem(it) {
    var f = cart.filter(function (c) { return c.id === it.id; })[0];
    if (f) f.qty += 1;
    else cart.push({ id: it.id, name: it.name, detail: it.detail || "", price: Number(it.price), currency: it.currency === "PKR" ? "PKR" : "USD", qty: 1 });
    save(); render();
    toast(it.name + " added to your order");
  }
  window.BB = { addItem: addItem, open: open, toast: toast, setAddr: function (t) { if (!chk.addr) chk.addr = t; } };

  /* ---- views ---- */
  function render() {
    $("cartcount").textContent = count();
    if (view === "cart") renderCart();
    else if (view === "checkout") renderCheckout();
    else renderDone();
  }
  window.addEventListener("bbcurrencychange", render);

  function renderCart() {
    $("dtitle").textContent = "Your order";
    if (!cart.length) {
      body.innerHTML = '<div class="empty"><p style="margin:0 auto 20px">Your order is empty.</p><a class="btn ghost" href="#box" data-close>Build a macaron box</a></div>' + suggestionMarkup();
      foot.innerHTML = "";
      return;
    }
    body.innerHTML = cart.map(function (it, i) {
      return '<div class="li"><b>' + esc(it.name) + '</b><span>' + formatAmount(it.price * it.qty, currencyOf(it)) + '</span>' +
        (it.detail ? '<small>' + esc(it.detail) + '</small>' : '') +
        '<div class="qtyrow"><button type="button" data-dec="' + i + '" aria-label="Decrease quantity of ' + esc(it.name) + '">−</button><span>' + it.qty + '</span><button type="button" data-inc="' + i + '" aria-label="Increase quantity of ' + esc(it.name) + '">+</button></div>' +
        '<button class="rm" type="button" data-rm="' + i + '" aria-label="Remove ' + esc(it.name) + '">Remove</button></div>';
    }).join("") + suggestionMarkup();
    foot.innerHTML = '<div class="row total"><span>Subtotal</span><span>' + formatSubtotal() + '</span></div>' +
      '<button class="btn" type="button" data-go="checkout" style="margin-top:12px">Continue to checkout</button>';
  }

  var TIMES = ["9:00 am", "10:00 am", "11:00 am", "12:00 pm", "1:00 pm", "2:00 pm", "3:00 pm", "4:00 pm", "5:00 pm", "6:00 pm", "7:00 pm"];
  function dayLabels() {
    var out = [];
    for (var i = 1; i <= 6; i++) {
      var d = new Date();
      d.setDate(d.getDate() + i);
      out.push(d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }));
    }
    return out;
  }
  function opts(list, sel) {
    return list.map(function (l, i) { return '<option value="' + i + '"' + (i === sel ? " selected" : "") + '>' + esc(l) + '</option>'; }).join("");
  }
  function readForm() {
    if (!$("coform")) return;
    var m = document.querySelector('#coform input[name="mode"]:checked');
    if (m) chk.mode = m.value;
    chk.name = $("cn").value;
    chk.phone = $("cp").value;
    if ($("ca")) chk.addr = $("ca").value;
    chk.day = +$("cd").value;
    chk.time = +$("ct").value;
    chk.gift = $("cg").value;
  }
  function fee() { return chk.mode === "delivery" && singleCurrency() === "USD" ? DELIVERY : 0; }
  function feeDisplay() {
    if (chk.mode !== "delivery") return "Free";
    return singleCurrency() === "USD" ? money(DELIVERY) : "To be confirmed by bakery";
  }
  function totalDisplay() {
    if (chk.mode === "delivery" && singleCurrency() !== "USD") {
      return formatSubtotal() + " + delivery fee to be confirmed";
    }
    if (singleCurrency() === "USD") return formatAmount(sub("USD") + fee(), "USD");
    return formatSubtotal();
  }

  function renderCheckout() {
    $("dtitle").textContent = "Checkout";
    var dl = chk.mode === "delivery";
    var deliveryOption = singleCurrency() === "USD" ? "Delivery (+" + formatAmount(DELIVERY, "USD") + ")" : "Delivery (fee confirmed by bakery)";
    body.innerHTML = '<form class="co" id="coform" novalidate>' +
      '<div class="opts"><label><input type="radio" name="mode" value="pickup"' + (dl ? "" : " checked") + '>Pickup</label>' +
      '<label><input type="radio" name="mode" value="delivery"' + (dl ? " checked" : "") + '>' + esc(deliveryOption) + '</label></div>' +
      '<label for="cn">Full name</label><input id="cn" autocomplete="name" value="' + esc(chk.name) + '">' +
      '<label for="cp">Phone number</label><input id="cp" type="tel" autocomplete="tel" value="' + esc(chk.phone) + '">' +
      (dl ? '<label for="ca">Delivery address</label><input id="ca" autocomplete="street-address" value="' + esc(chk.addr) + '">' : '') +
      '<label for="cd">' + (dl ? "Delivery day" : "Pickup day") + '</label><select id="cd">' + opts(dayLabels(), chk.day) + '</select>' +
      '<label for="ct">' + (dl ? "Delivery time" : "Pickup time") + '</label><select id="ct">' + opts(TIMES, chk.time) + '</select>' +
      '<label for="cg">Gift message (optional)</label><textarea id="cg" rows="2" maxlength="140">' + esc(chk.gift) + '</textarea>' +
      '<p class="note">You pay when you collect or receive your order. For same-day orders, please call us.</p>' +
      '<div class="err" id="cerr" role="alert"></div></form>';
    foot.innerHTML = '<div class="row"><span>Subtotal</span><span>' + formatSubtotal() + '</span></div>' +
      '<div class="row"><span>' + (dl ? "Delivery" : "Pickup") + '</span><span>' + feeDisplay() + '</span></div>' +
      '<div class="row total"><span>Total</span><span>' + totalDisplay() + '</span></div>' +
      '<button class="btn" type="button" data-go="place" style="margin-top:10px">Place order</button>' +
      '<button class="clear" type="button" data-go="cart" style="display:block;margin:10px auto 0">Back to your order</button>';
  }

  function place() {
    readForm();
    var err = $("cerr");
    if (chk.name.trim().length < 2) { err.textContent = "Enter your full name."; $("cn").focus(); return; }
    if (!/^[+\d][\d\s()-]{6,}$/.test(chk.phone.trim())) { err.textContent = "Enter a phone number we can reach you on."; $("cp").focus(); return; }
    if (chk.mode === "delivery" && chk.addr.trim().length < 6) { err.textContent = "Enter your delivery address."; $("ca").focus(); return; }
    var orderId = "BB-" + Math.floor(1000 + Math.random() * 9000);
    var total = totalDisplay();
    var lines = cart.map(function (it) {
      return "• " + it.name + " × " + it.qty + " — " + formatAmount(it.price * it.qty, currencyOf(it)) + (it.detail ? "\n  " + it.detail : "");
    });
    var message = [
      "Hello Bakerz & Bitez! I'd like to place an order.",
      "Order reference: " + orderId,
      "",
      "ITEMS:", lines.join("\n"),
      "",
      "Subtotal: " + formatSubtotal(),
      "Delivery: " + (chk.mode === "delivery" ? feeDisplay() : "Pickup / free"),
      "TOTAL: " + total,
      "",
      "Customer name: " + chk.name.trim(),
      "Customer phone: " + chk.phone.trim(),
      "Order type: " + (chk.mode === "delivery" ? "Delivery" : "Pickup"),
      (chk.mode === "delivery" ? "Delivery address: " + chk.addr.trim() : ""),
      "Requested date/time: " + dayLabels()[chk.day] + " at " + TIMES[chk.time],
      (chk.gift.trim() ? "Gift message: " + chk.gift.trim() : ""),
      "\nWhere smiles are served daily!"
    ].filter(Boolean).join("\n");
    var waUrl = "https://wa.me/923351374417?text=" + encodeURIComponent(message);
    // Keep this page open; if the popup is blocked, the confirmation includes a manual link.
    var waWindow = window.open(waUrl, "_blank");
    lastOrder = {
      id: orderId,
      name: chk.name.trim().split(/\s+/)[0],
      mode: chk.mode,
      when: dayLabels()[chk.day] + " at " + TIMES[chk.time],
      total: total,
      whatsappUrl: waUrl,
      whatsappOpened: !!waWindow
    };
    if (waWindow) { cart = []; save(); }
    view = "done";
    render();
  }

  function renderDone() {
    var o = lastOrder;
    $("dtitle").textContent = "Thank you";
    if (!o) { view = "cart"; renderCart(); return; }
    body.innerHTML = '<div class="conf"><div class="orn2" aria-hidden="true">❦</div><h3>Order request ' + esc(o.id) + ' is ready</h3>' +
      '<p style="margin:0 auto 12px">Thank you, ' + esc(o.name) + '. You requested ' + (o.mode === "delivery" ? "delivery" : "pickup") + ' for ' + esc(o.when) + '. Total: ' + esc(o.total) + '.</p>' +
      '<p style="margin:0 auto 12px;font-size:.88rem;opacity:.8">' + (o.whatsappOpened ? "WhatsApp opened in a new tab with your order details. Tap Send there to submit the request." : "WhatsApp could not be opened automatically. Use the link below to send your order request.") + ' The bakery must confirm availability and timing; this page cannot confirm that an order will arrive.</p>' +
      '<a class="btn" href="' + esc(o.whatsappUrl) + '" target="_blank" rel="noopener noreferrer">Open WhatsApp message</a></div>';
    foot.innerHTML = '<button class="btn" type="button" data-close>Continue browsing</button>';
  }

  /* ---- events ---- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-add],[data-rec-add],[data-inc],[data-dec],[data-rm],[data-go],[data-close]");
    if (!t) return;
    var d;
    if (t.hasAttribute("data-add")) {
      try { addItem(JSON.parse(t.getAttribute("data-add"))); } catch (err) {}
      return;
    }
    if (t.hasAttribute("data-rec-add")) {
      var rec = CART_SUGGESTIONS.filter(function (item) { return item.id === t.getAttribute("data-rec-add"); })[0];
      if (rec) {
        cartSuggestion = null;
        addItem(rec);
      }
      return;
    }
    if ((d = t.getAttribute("data-inc")) !== null) { cart[+d].qty++; save(); render(); return; }
    if ((d = t.getAttribute("data-dec")) !== null) { cart[+d].qty--; if (cart[+d].qty <= 0) cart.splice(+d, 1); save(); render(); return; }
    if ((d = t.getAttribute("data-rm")) !== null) { cart.splice(+d, 1); save(); render(); return; }
    if ((d = t.getAttribute("data-go")) !== null) {
      if (d === "checkout" && cart.length) { view = "checkout"; render(); }
      else if (d === "cart") { readForm(); view = "cart"; render(); }
      else if (d === "place") { place(); }
      return;
    }
    if (t.hasAttribute("data-close")) close();
  });
  body.addEventListener("change", function (e) {
    if (e.target.name === "mode") {
      readForm();
      renderCheckout();
      var r = document.querySelector('#coform input[name="mode"]:checked');
      if (r) r.focus();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("on")) close();
  });

  /* ---- back to top ---- */
  var tt = $("totop");
  window.addEventListener("scroll", function () { tt.classList.toggle("on", window.scrollY > 700); }, { passive: true });
  tt.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  render();
  if (new URLSearchParams(window.location.search).get("cart") === "open") open();
})();



(function () {
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return window.BBCurrency ? window.BBCurrency.format(n, "USD") : "$" + n.toFixed(2); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return "rgb(" + r + "," + g + "," + b + ")";
  }
  var S = 'stroke="#a98746" stroke-width="1.8"';

  /* ================= ticker clock ================= */
  var track = $("ttrack");
  var clone = track.firstElementChild.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  track.appendChild(clone);
  function tick() {
    var n = new Date();
    $("tdate").textContent = n.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    $("ttime").textContent = n.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
  }
  tick();
  setInterval(tick, 1000);

  /* ================= illustrations ================= */
  function cake(a, b, c, d) {
    return '<ellipse cx="50" cy="60" rx="38" ry="6" fill="#e8dcc0" opacity=".7"/>' +
      '<path d="M16 34v20c0 6 68 6 68 0V34z" fill="' + a + '" ' + S + '/>' +
      '<path d="M16 42c0 6 68 6 68 0M16 49c0 6 68 6 68 0" fill="none" stroke="' + b + '" stroke-width="3"/>' +
      '<ellipse cx="50" cy="34" rx="34" ry="9" fill="' + c + '" ' + S + '/>' + (d || "");
  }
  var ART = {
    cakeChoc: cake("#5a3a2c", "#f3e7c1", "#3d2a22", '<path d="M30 33c6-3 10 3 16 0s10 3 16 0" stroke="#d9c08b" stroke-width="2" fill="none" stroke-linecap="round"/>'),
    cakeRv: cake("#b23a48", "#fffdf8", "#fffdf8", '<circle cx="40" cy="33" r="2" fill="#b23a48"/><circle cx="52" cy="35" r="2" fill="#b23a48"/><circle cx="62" cy="32" r="2" fill="#b23a48"/><circle cx="48" cy="31" r="2" fill="#b23a48"/>'),
    cakeBf: cake("#5a3a2c", "#fffdf8", "#fffdf8", '<circle cx="38" cy="30" r="4.5" fill="#b0122b"/><circle cx="52" cy="28" r="4.5" fill="#b0122b"/><circle cx="64" cy="31" r="4.5" fill="#b0122b"/><path d="M52 24c1-4 4-6 7-6" stroke="#2c4838" stroke-width="1.5" fill="none"/>'),
    cakeRm: cake("#f6e7c4", "#fffdf8", "#fbf3dd", '<circle cx="40" cy="32" r="2" fill="#7aa874"/><circle cx="50" cy="35" r="2" fill="#7aa874"/><circle cx="60" cy="31" r="2" fill="#7aa874"/><path d="M44 30l3 3M56 33l3-3" stroke="#e08a1e" stroke-width="1.6" stroke-linecap="round"/>'),
    cakeLb: cake("#f3e7a0", "#fffdf8", "#fffdf8", '<circle cx="40" cy="32" r="3.5" fill="#4f5fa3"/><circle cx="50" cy="30" r="3.5" fill="#d94f64"/><circle cx="60" cy="33" r="3.5" fill="#4f5fa3"/><path d="M48 26l3-4 3 4z" fill="#7aa874"/>'),

    jamun: '<circle cx="34" cy="34" r="12" fill="#7a3b1e"/><circle cx="56" cy="31" r="13" fill="#6b3017"/><circle cx="73" cy="35" r="10" fill="#7a3b1e"/><path d="M28 30c3-3 6-3 8-2M50 26c3-3 7-3 9-1" stroke="#c98a5a" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M12 36h76c0 18-14 26-38 26S12 54 12 36z" fill="#fffdf8" ' + S + '/>',
    barfi: '<path d="M18 34L30 22l12 12-12 12z" fill="#e7d6a0" ' + S + '/><path d="M48 34L60 22l12 12-12 12z" fill="#c8dcae" ' + S + '/><path d="M33 50l12-12 12 12-12 12z" fill="#f4e3c0" ' + S + '/><circle cx="30" cy="34" r="2" fill="#dcdcdc"/><circle cx="60" cy="34" r="2" fill="#dcdcdc"/><circle cx="45" cy="50" r="2" fill="#dcdcdc"/>',
    rasmalai: '<path d="M10 34h80c0 20-16 28-40 28S10 54 10 34z" fill="#fbf3dd" ' + S + '/><ellipse cx="33" cy="33" rx="17" ry="8" fill="#fffdf8" stroke="#d8c9a0" stroke-width="1.5"/><ellipse cx="65" cy="32" rx="17" ry="8" fill="#fffdf8" stroke="#d8c9a0" stroke-width="1.5"/><circle cx="33" cy="32" r="1.8" fill="#7aa874"/><circle cx="65" cy="31" r="1.8" fill="#7aa874"/><path d="M26 33l3 2M60 31l3 2" stroke="#e08a1e" stroke-width="1.4" stroke-linecap="round"/>',
    jalebi: '<ellipse cx="50" cy="58" rx="36" ry="6" fill="#e8dcc0" opacity=".7"/><path d="M50 35a4 4 0 1 1 4 4a8 8 0 1 1-8-8a12 12 0 1 1 12 12a16 16 0 1 1-16-16" fill="none" stroke="#b9560f" stroke-width="7" stroke-linecap="round"/><path d="M50 35a4 4 0 1 1 4 4a8 8 0 1 1-8-8a12 12 0 1 1 12 12a16 16 0 1 1-16-16" fill="none" stroke="#f0953a" stroke-width="4" stroke-linecap="round"/>',
    ladoo: '<ellipse cx="50" cy="56" rx="38" ry="8" fill="#fffdf8" ' + S + '/><circle cx="32" cy="42" r="13" fill="#f0b43c"/><circle cx="68" cy="42" r="13" fill="#e9a62c"/><circle cx="50" cy="28" r="14" fill="#f2bc4a"/><g fill="#c98a1c"><circle cx="28" cy="40" r="1.5"/><circle cx="35" cy="46" r="1.5"/><circle cx="64" cy="40" r="1.5"/><circle cx="72" cy="46" r="1.5"/><circle cx="46" cy="25" r="1.5"/><circle cx="55" cy="31" r="1.5"/></g>',
    halwa: '<path d="M14 40h72c0 16-14 24-36 24S14 56 14 40z" fill="#fffdf8" ' + S + '/><path d="M20 40c4-16 16-22 30-22s26 6 30 22z" fill="#e36a1f"/><path d="M34 30l4 6M50 24l2 8M64 30l-2 7M44 34l6 3" stroke="#f5deb0" stroke-width="2" stroke-linecap="round"/>',
    kheer: '<path d="M12 36h76c0 18-14 26-38 26S12 54 12 36z" fill="#fffdf8" ' + S + '/><ellipse cx="50" cy="36" rx="38" ry="8" fill="#f5ecd6" ' + S + '/><circle cx="36" cy="35" r="2" fill="#7aa874"/><circle cx="48" cy="38" r="2" fill="#7aa874"/><circle cx="60" cy="34" r="2" fill="#7aa874"/><circle cx="68" cy="38" r="2" fill="#b03a48"/><circle cx="42" cy="33" r="1.5" fill="#e08a1e"/>',

    tiramisu: '<rect x="16" y="20" width="68" height="8" fill="#5a3a2c"/><rect x="16" y="28" width="68" height="8" fill="#b88a5a"/><rect x="16" y="36" width="68" height="9" fill="#fbf3dd"/><rect x="16" y="45" width="68" height="8" fill="#b88a5a"/><rect x="16" y="53" width="68" height="6" fill="#fbf3dd"/><rect x="16" y="20" width="68" height="39" fill="none" ' + S + '/>',
    baklava: '<path d="M12 48L50 28l38 20-38 20z" fill="#c9892a" ' + S + '/><path d="M12 42L50 22l38 20-38 20z" fill="#e8b64c" ' + S + '/><path d="M31 32l38 20M69 32L31 52M50 22v40" stroke="#c9892a" stroke-width="1.5"/><circle cx="50" cy="42" r="3" fill="#7aa874"/><circle cx="42" cy="38" r="1.8" fill="#7aa874"/><circle cx="58" cy="46" r="1.8" fill="#7aa874"/>',
    churros: '<g stroke="#d99a3d" stroke-width="8" stroke-linecap="round"><path d="M20 54L38 16"/><path d="M32 56L50 18"/><path d="M44 58L62 20"/></g><g stroke="#b97a22" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round"><path d="M20 54L38 16"/><path d="M32 56L50 18"/><path d="M44 58L62 20"/></g><path d="M62 38h26v14c0 7-26 7-26 0z" fill="#5a3a2c" ' + S + '/><ellipse cx="75" cy="38" rx="13" ry="3.5" fill="#7a4a36"/>',
    brulee: '<path d="M16 36h68v10c0 12-68 12-68 0z" fill="#fffdf8" ' + S + '/><ellipse cx="50" cy="36" rx="34" ry="9" fill="#d9a04a" ' + S + '/><ellipse cx="42" cy="34" rx="14" ry="3" fill="#f2c877" opacity=".85"/>',
    cheesecake: '<rect x="14" y="46" width="72" height="9" fill="#b8864f" ' + S + '/><path d="M14 46V30l72-5v21z" fill="#f8ecc9" ' + S + '/><path d="M14 30l72-5v6c-6 4-10 4-14 1-4 5-8 5-12 1-4 5-10 5-14 1-5 4-9 4-14 0-6 3-10 2-18-3z" fill="#d94f64"/><circle cx="50" cy="26" r="5" fill="#c4263d"/><path d="M50 21l2-3" stroke="#2c4838" stroke-width="1.5"/>',
    mochi: '<circle cx="30" cy="42" r="14" fill="#f4c0cc" ' + S + '/><circle cx="64" cy="42" r="14" fill="#cfe3d3" ' + S + '/><circle cx="47" cy="26" r="13" fill="#f6efe0" ' + S + '/><path d="M24 36c3-3 7-4 11-3M58 36c3-3 7-4 11-3M41 21c3-2 6-3 9-2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>',
    brigadeiro: '<g fill="#e8dcc0" ' + S + '><path d="M12 48l3 12h18l3-12z"/><path d="M38 48l3 12h18l3-12z"/><path d="M64 48l3 12h18l3-12z"/></g><circle cx="24" cy="42" r="12" fill="#4a2c20"/><circle cx="50" cy="42" r="12" fill="#4a2c20"/><circle cx="76" cy="42" r="12" fill="#4a2c20"/><g fill="#fffdf8"><circle cx="20" cy="38" r="1.2"/><circle cx="27" cy="44" r="1.2"/><circle cx="46" cy="37" r="1.2"/><circle cx="53" cy="45" r="1.2"/><circle cx="73" cy="39" r="1.2"/><circle cx="80" cy="44" r="1.2"/></g>',
    pavlova: '<path d="M14 54c0-18 16-26 36-26s36 8 36 26z" fill="#fffdf8" ' + S + '/><ellipse cx="50" cy="32" rx="26" ry="7" fill="#fbf3dd"/><circle cx="38" cy="29" r="4" fill="#d94f64"/><circle cx="50" cy="26" r="4" fill="#4f5fa3"/><circle cx="62" cy="29" r="4" fill="#d94f64"/><circle cx="50" cy="32" r="3.5" fill="#c4263d"/><path d="M45 22l5-5 5 5z" fill="#7aa874"/>',
    kunafa: '<rect x="16" y="28" width="68" height="30" rx="5" fill="#e8a53a" ' + S + '/><rect x="16" y="40" width="68" height="6" fill="#fbf3dd"/><path d="M24 30v8M32 30v8M40 30v8M48 30v8M56 30v8M64 30v8M72 30v8M24 48v8M32 48v8M40 48v8M48 48v8M56 48v8M64 48v8M72 48v8" stroke="#c9892a" stroke-width="1.5"/><circle cx="36" cy="43" r="2" fill="#7aa874"/><circle cx="50" cy="43" r="2" fill="#7aa874"/><circle cx="64" cy="43" r="2" fill="#7aa874"/>',

    croissant: '<path d="M8 50c0-24 18-36 42-36s42 12 42 36c0 5-5 7-10 7-8 0-10-7-20-7s-12 7-12 7-2-7-12-7-12 7-20 7c-5 0-10-2-10-7z" fill="#e2b66f" ' + S + '/><path d="M30 22l7 26M50 17l3 31M70 22l-5 26" stroke="#a98746" stroke-width="2" fill="none" stroke-linecap="round"/>',
    painchoc: '<rect x="14" y="18" width="72" height="36" rx="18" fill="#d9a35f" ' + S + '/><path d="M32 20v32M50 18v36M68 20v32" stroke="#a98746" stroke-width="2"/><rect x="28" y="33" width="44" height="6" rx="3" fill="#5a3a2c"/>',
    eclair: '<rect x="10" y="24" width="80" height="28" rx="14" fill="#e8c88f" ' + S + '/><path d="M12 33c0-9 76-9 76 0 0 9-76 9-76 0z" fill="#b9d6a8" stroke="#6f9a78" stroke-width="1.5"/><circle cx="30" cy="33" r="2" fill="#2c4838"/><circle cx="48" cy="32" r="2" fill="#2c4838"/><circle cx="66" cy="33" r="2" fill="#2c4838"/>',
    tarte: '<path d="M12 40h76l-8 16H20z" fill="#e2b66f" ' + S + '/><ellipse cx="50" cy="40" rx="38" ry="12" fill="#f2e07a" ' + S + '/><path d="M22 38c5-8 10-8 14 0 4-8 10-8 14 0 4-8 10-8 14 0 4-8 8-6 12 0" fill="#fffdf8" stroke="#d9c08b" stroke-width="1.5"/>',
    opera: '<rect x="14" y="48" width="72" height="8" fill="#6b4535"/><rect x="14" y="41" width="72" height="7" fill="#f3e7c1"/><rect x="14" y="33" width="72" height="8" fill="#a8764f"/><rect x="14" y="26" width="72" height="7" fill="#f3e7c1"/><rect x="14" y="16" width="72" height="10" fill="#3d2a22"/><path d="M40 21h20" stroke="#d9c08b" stroke-width="2" stroke-linecap="round"/><rect x="14" y="16" width="72" height="40" fill="none" ' + S + '/>',
    hamper: '<rect x="14" y="32" width="72" height="28" rx="3" fill="#cfe3d3" ' + S + '/><rect x="10" y="24" width="80" height="10" rx="2" fill="#fffdf8" ' + S + '/><path d="M50 24v36" stroke="#d98a99" stroke-width="6"/><path d="M50 24c-12-14-24-6-14 0M50 24c12-14 24-6 14 0" fill="none" stroke="#d98a99" stroke-width="3" stroke-linecap="round"/>',

    conemini: '<path d="M36 40h28L50 68z" fill="#dba762" ' + S + '/><ellipse cx="50" cy="44" rx="20" ry="5" fill="#d99aaa"/><circle cx="50" cy="28" r="19" fill="#f2a2b4" ' + S + '/><path d="M38 22c3-6 9-9 15-8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>'
  };
  document.querySelectorAll("svg[data-art]").forEach(function (el) { el.innerHTML = ART[el.getAttribute("data-art")] || ""; });

  /* ================= menu ================= */
  var CATS = [["all", "All"], ["cakes", "Cakes"], ["mithai", "Mithai"], ["world", "World desserts"], ["pastry", "Pastries and gifts"]];
  function one(l, p) { return [[l, p]]; }
  var MENU = [
    { id: "c-choc", cat: "cakes", name: "Chocolate truffle cake", desc: "Dark chocolate sponge, silky ganache and cocoa dust.", art: "cakeChoc", tag: "Best seller", opts: [["Slice", 5.5], ["1 lb", 18], ["2 lb", 34], ["3 lb", 50]] },
    { id: "c-rv", cat: "cakes", name: "Red velvet cake", desc: "Soft crimson crumb under cream-cheese frosting.", art: "cakeRv", opts: [["Slice", 6], ["1 lb", 20], ["2 lb", 38], ["3 lb", 56]] },
    { id: "c-bf", cat: "cakes", name: "Black forest cake", desc: "Chocolate sponge, whipped cream and dark cherries.", art: "cakeBf", opts: [["Slice", 5.5], ["1 lb", 18], ["2 lb", 34], ["3 lb", 50]] },
    { id: "c-rm", cat: "cakes", name: "Rasmalai cake", desc: "Saffron milk sponge layered with rasmalai cream.", art: "cakeRm", tag: "Fusion", opts: [["Slice", 6.5], ["1 lb", 22], ["2 lb", 42], ["3 lb", 62]] },
    { id: "c-lb", cat: "cakes", name: "Lemon berry cake", desc: "Lemon sponge, mascarpone cream and fresh berries.", art: "cakeLb", opts: [["Slice", 6], ["1 lb", 20], ["2 lb", 38], ["3 lb", 56]] },

    { id: "m-gj", cat: "mithai", name: "Gulab jamun", desc: "Soft milk dumplings soaked in rose and cardamom syrup.", art: "jamun", tag: "Best seller", opts: [["Box of 6", 7], ["Box of 12", 13]] },
    { id: "m-kb", cat: "mithai", name: "Kaju barfi", desc: "Cashew fudge finished with silver leaf.", art: "barfi", opts: [["250 g", 9], ["500 g", 17], ["1 kg", 32]] },
    { id: "m-rm", cat: "mithai", name: "Rasmalai", desc: "Soft milk discs in chilled saffron cream and pistachio.", art: "rasmalai", opts: [["Box of 4", 8], ["Box of 8", 15]] },
    { id: "m-jl", cat: "mithai", name: "Jalebi", desc: "Crisp saffron spirals, dipped warm in syrup.", art: "jalebi", tag: "Served warm", opts: [["250 g", 5], ["500 g", 9]] },
    { id: "m-ld", cat: "mithai", name: "Motichoor ladoo", desc: "Tiny gram-flour pearls with ghee and cardamom.", art: "ladoo", opts: [["Box of 6", 7], ["Box of 12", 13]] },
    { id: "m-gh", cat: "mithai", name: "Gajar ka halwa", desc: "Carrot slow-cooked in milk and ghee, topped with almonds.", art: "halwa", tag: "Seasonal", opts: [["250 g", 7], ["500 g", 13]] },
    { id: "m-kh", cat: "mithai", name: "Kheer", desc: "Rice pudding simmered with milk, cardamom and pistachio.", art: "kheer", opts: [["Cup", 4.5], ["Family tub", 16]] },

    { id: "w-tir", cat: "world", name: "Tiramisu", desc: "Espresso-soaked sponge, mascarpone cream and cocoa.", art: "tiramisu", tag: "Italy", opts: one("Per portion", 7.5) },
    { id: "w-bak", cat: "world", name: "Baklava", desc: "Layers of filo, pistachio and honey syrup.", art: "baklava", tag: "Turkey", opts: [["Box of 4", 8], ["Box of 8", 15]] },
    { id: "w-chu", cat: "world", name: "Churros with chocolate", desc: "Cinnamon sugar churros with hot chocolate for dipping.", art: "churros", tag: "Spain", opts: one("Per portion", 6.5) },
    { id: "w-bru", cat: "world", name: "Crème brûlée", desc: "Vanilla custard under a cracked caramel crust.", art: "brulee", tag: "France", opts: one("Per portion", 7) },
    { id: "w-nyc", cat: "world", name: "New York cheesecake", desc: "Baked cheesecake with strawberry sauce.", art: "cheesecake", tag: "USA", opts: one("Per slice", 7.5) },
    { id: "w-moc", cat: "world", name: "Ice cream mochi", desc: "Chewy rice cakes with ice cream centres.", art: "mochi", tag: "Japan", opts: [["Box of 3", 7], ["Box of 6", 13]] },
    { id: "w-bri", cat: "world", name: "Brigadeiro", desc: "Chocolate condensed-milk truffles rolled in sprinkles.", art: "brigadeiro", tag: "Brazil", opts: one("Box of 6", 8) },
    { id: "w-pav", cat: "world", name: "Pavlova", desc: "Crisp meringue, whipped cream and fresh berries.", art: "pavlova", tag: "Australia", opts: one("Per portion", 7) },
    { id: "w-kun", cat: "world", name: "Kunafa", desc: "Crisp pastry strands, melted cheese and sweet syrup.", art: "kunafa", tag: "Middle East", opts: one("Per portion", 8) },

    { id: "p-cro", cat: "pastry", name: "Croissant au beurre", desc: "Butter, flaky, still warm from the oven.", art: "croissant", opts: one("Each", 3.5) },
    { id: "p-pdc", cat: "pastry", name: "Pain au chocolat", desc: "Two bars of dark chocolate in laminated dough.", art: "painchoc", opts: one("Each", 4) },
    { id: "p-ecl", cat: "pastry", name: "Éclair pistache", desc: "Pistachio cream, green glaze and crushed nuts.", art: "eclair", opts: one("Each", 6) },
    { id: "p-tar", cat: "pastry", name: "Tarte au citron", desc: "Lemon curd under toasted meringue.", art: "tarte", opts: one("Per slice", 6.5) },
    { id: "p-ope", cat: "pastry", name: "Opéra slice", desc: "Almond sponge, coffee buttercream and dark ganache.", art: "opera", opts: one("Per slice", 7) },
    { id: "p-ham", cat: "pastry", name: "Gift hamper", desc: "Twelve macarons, a tin of rose bergamot tea and a ribbon.", art: "hamper", tag: "Gift", detail: "12 assorted macarons, 1 tin of rose bergamot tea", opts: one("Gift box", 54) }
  ];
  var mcat = "all", mq = "";
  var tabs = $("tabs");
  CATS.forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = c[1];
    b.dataset.cat = c[0];
    b.setAttribute("aria-pressed", c[0] === "all");
    b.addEventListener("click", function () {
      mcat = c[0];
      Array.prototype.forEach.call(tabs.children, function (x) { x.setAttribute("aria-pressed", x.dataset.cat === mcat); });
      renderMenu();
    });
    tabs.appendChild(b);
  });
  $("msearch").addEventListener("input", function (e) { mq = e.target.value.trim().toLowerCase(); renderMenu(); });

  /* real photos for the menu grid (files live in assets/images); items without a photo keep their drawn art */
  var MENU_IMG = {"c-choc": "assets/images/truffle-cake.jpg", "c-rv": "assets/images/red-velvit.jpg", "c-bf": "assets/images/black-forest-cake.jpg", "c-rm": "assets/images/rasmalai-cake.jpg", "c-lb": "assets/images/lemon-berry-cake.jpg", "m-gj": "assets/images/gulab-jamun.jpg", "m-kb": "assets/images/kaju-barfi.jpg", "m-rm": "assets/images/rasmalai.jpg", "m-jl": "assets/images/jalebi.jpg", "m-ld": "assets/images/moti-chor-ky-laddo.jpg", "m-kh": "assets/images/kheer.jpg", "w-tir": "assets/images/tiramisu.jpg", "w-bak": "assets/images/image-952c308.jpg", "w-chu": "assets/images/churros-with-chocolate.jpg", "m-gh": "assets/images/gajar-halwa.jpg", "p-ham": "assets/images/macrons.jpg", "w-bru": "assets/images/creme-brulee.jpg", "w-nyc": "assets/images/nem-york-cheese-cake.jpg", "w-moc": "assets/images/ice-cream-mochi.jpg", "w-bri": "assets/images/brigadeiro.jpg", "w-pav": "assets/images/pavlova.jpg", "w-kun": "assets/images/kunafa.jpg", "p-cro": "assets/images/croissant-au-beurre.jpg", "p-pdc": "assets/images/pain-au-chocolat.jpg", "p-ecl": "assets/images/eclair-pistache.jpg", "p-tar": "assets/images/tarte-au-citron.jpg", "p-ope": "assets/images/opera-slice.jpg"};
  function renderMenu() {
    var grid = $("pgrid");
    grid.innerHTML = "";
    var list = MENU.filter(function (p) {
      return (mcat === "all" || p.cat === mcat) && (!mq || (p.name + " " + p.desc + " " + (p.tag || "")).toLowerCase().indexOf(mq) > -1);
    });
    $("mcount").textContent = "Showing " + list.length + (list.length === 1 ? " item" : " items");
    if (!list.length) { grid.innerHTML = '<p class="empty-menu">Nothing matches that search. Try cake, barfi or tiramisu.</p>'; return; }
    list.forEach(function (p) {
      var multi = p.opts.length > 1;
      var el = document.createElement("article");
      el.className = "prod";
      el.innerHTML = '<div class="pic">' + (MENU_IMG[p.id] ? '<img src="' + MENU_IMG[p.id] + '" alt="' + esc(p.name) + '" loading="lazy">' : '<svg viewBox="0 0 100 70" aria-hidden="true">' + ART[p.art] + '</svg>') + '</div>' +
        (p.tag ? '<div><span class="chip">' + esc(p.tag) + '</span></div>' : '') +
        '<h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p>' +
        (multi ? '<select aria-label="Choose an option for ' + esc(p.name) + '">' + p.opts.map(function (o, i) { return '<option value="' + i + '">' + esc(o[0]) + ' (' + money(o[1]) + ')</option>'; }).join("") + '</select>' : '') +
        '<div class="buy"><span><span class="price">' + money(p.opts[0][1]) + '</span>' + (multi ? '' : '<small class="unit">' + esc(p.opts[0][0]) + '</small>') + '</span>' +
        '<button class="addbtn" type="button" aria-label="Add ' + esc(p.name) + ' to order">Add to order</button></div>';
      var pimg = el.querySelector(".pic img");
      if (pimg) pimg.addEventListener("error", function () { pimg.parentNode.innerHTML = '<svg viewBox="0 0 100 70" aria-hidden="true">' + ART[p.art] + '</svg>'; });
      var sel = el.querySelector("select");
      if (sel) sel.addEventListener("change", function () { el.querySelector(".price").textContent = money(p.opts[+sel.value][1]); });
      el.querySelector(".addbtn").addEventListener("click", function () {
        var i = sel ? +sel.value : 0, o = p.opts[i];
        window.BB.addItem({ id: p.id + "-" + i, name: p.name + (multi ? " (" + o[0] + ")" : ""), detail: p.detail || "", price: o[1] });
      });
      grid.appendChild(el);
    });
  }
  renderMenu();
  window.addEventListener("bbcurrencychange", renderMenu);

  /* ================= ice cream studio ================= */
  var SWIRLS = [
    { id: "vanilla", n: "Vanilla", c: ["#f6e9c6", "#f6e9c6"] },
    { id: "chocolate", n: "Chocolate", c: ["#6b4535", "#6b4535"] },
    { id: "twist", n: "Twist", c: ["#f6e9c6", "#6b4535"] },
    { id: "strawberry", n: "Strawberry", c: ["#f2a2b4", "#f2a2b4"] },
    { id: "mango", n: "Mango", c: ["#f6b94a", "#f6b94a"] },
    { id: "pistachio", n: "Pistachio", c: ["#b9d6a8", "#b9d6a8"] }
  ];
  var SCOOPS = [
    { id: "vanilla", n: "Vanilla bean", c: ["#f6e9c6", "#f6e9c6"] },
    { id: "chocolate", n: "Dark chocolate", c: ["#6b4535", "#6b4535"] },
    { id: "strawberry", n: "Strawberry", c: ["#f2a2b4", "#f2a2b4"] },
    { id: "pistachio", n: "Pistachio", c: ["#b9d6a8", "#b9d6a8"] },
    { id: "mango", n: "Mango", c: ["#f6b94a", "#f6b94a"] },
    { id: "caramel", n: "Salted caramel", c: ["#c98a45", "#c98a45"] },
    { id: "kulfi", n: "Malai kulfi", c: ["#efdca8", "#efdca8"] },
    { id: "cookies", n: "Cookies and cream", c: ["#d6cfc3", "#d6cfc3"] }
  ];
  var TOPS = [["sprinkles", "Rainbow sprinkles"], ["caramel", "Caramel drizzle"], ["pistachio", "Crushed pistachio"], ["chips", "Chocolate chips"], ["cherry", "Cherry on top"]];
  var PR = { swirlRegular: 3.5, swirlLarge: 5, scoop: 2.8, cone: 0.6, top: 0.5 };
  var st = { mode: "swirl", cont: "cone", size: "regular", swirl: "twist", scoops: [], tops: [] };
  var MAXSCOOPS = 3;

  function find(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function bg(c) { return c[0] === c[1] ? c[0] : "linear-gradient(90deg," + c[0] + " 50%," + c[1] + " 50%)"; }
  function topName(id) { return TOPS.filter(function (t) { return t[0] === id; })[0][1]; }

  function price() {
    if (st.mode === "scoop" && !st.scoops.length) return 0;
    var p = st.mode === "swirl" ? (st.size === "large" ? PR.swirlLarge : PR.swirlRegular) : st.scoops.length * PR.scoop;
    if (st.cont === "cone") p += PR.cone;
    return p + st.tops.length * PR.top;
  }
  function scoopCounts() {
    var m = {}, order = [];
    st.scoops.forEach(function (id) { if (!m[id]) { m[id] = 0; order.push(id); } m[id]++; });
    return order.map(function (id) { return m[id] + " " + find(SCOOPS, id).n; });
  }
  function detail() {
    var d = [];
    if (st.mode === "swirl") d.push(find(SWIRLS, st.swirl).n, st.size);
    else d.push(scoopCounts().join(", ") || "No scoops yet");
    d.push(st.cont === "cone" ? "cone" : "cup");
    st.tops.forEach(function (t) { d.push(topName(t).toLowerCase()); });
    return d.join(", ");
  }

  function dots(n, ax, ay, spread, fn) {
    var o = "";
    for (var i = 0; i < n; i++) {
      var a = i * 2.39996, r = spread * Math.sqrt((i + 0.5) / n);
      o += fn(ax + r * Math.cos(a), ay + r * Math.sin(a) * 0.8, i);
    }
    return o;
  }
  function coneArt() {
    return '<clipPath id="conecl"><path d="M66 160h68L100 270z"/></clipPath><path d="M66 160h68L100 270z" fill="#dba762" stroke="#a98746" stroke-width="2"/>' +
      '<g clip-path="url(#conecl)" stroke="#a98746" stroke-width="1.5" opacity=".7"><path d="M56 168l90 44M56 192l90 44M56 216l90 44M144 168l-90 44M144 192l-90 44M144 216l-90 44"/></g>';
  }
  function cupArt() {
    return '<path d="M52 162h96l-12 96c-1 9-71 9-72 0z" fill="#fffdf8" stroke="#a98746" stroke-width="2"/><path d="M58 190h84M62 220h76" stroke="#cfe3d3" stroke-width="12" opacity=".8"/>';
  }
  function scoopArt(cy, col) {
    return '<ellipse cx="100" cy="' + (cy + 30) + '" rx="42" ry="11" fill="' + shade(col, -26) + '"/><circle cx="100" cy="' + cy + '" r="38" fill="' + col + '"/>' +
      '<path d="M76 ' + (cy - 14) + 'c6-12 18-18 30-18" stroke="' + shade(col, 26) + '" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>';
  }
  function swirlArt(c1, c2) {
    var tiers = [{ cy: 138, rx: 46, ry: 18 }, { cy: 112, rx: 38, ry: 16 }, { cy: 88, rx: 29, ry: 14 }, { cy: 66, rx: 19, ry: 12 }];
    var o = "";
    tiers.forEach(function (e, i) {
      var c = i % 2 ? c2 : c1;
      o += '<ellipse cx="100" cy="' + e.cy + '" rx="' + e.rx + '" ry="' + e.ry + '" fill="' + c + '" stroke="' + shade(c, -30) + '" stroke-width="1.5"/>';
    });
    o += '<path d="M90 60c0-10 8-14 12-24 3 9 10 13 8 24z" fill="' + c1 + '" stroke="' + shade(c1, -30) + '" stroke-width="1.5"/>';
    return o;
  }
  function toppingArt(topY, ax, ay, spread) {
    var o = "", cols = ["#d94f64", "#f2c94c", "#4f9d7a", "#4f5fa3", "#ffffff"];
    if (st.tops.indexOf("caramel") > -1) o += '<path d="M' + (ax - 30) + ' ' + (ay - 2) + 'q10 12 20 2t20-2t20 4" fill="none" stroke="#b8681f" stroke-width="4" stroke-linecap="round"/>';
    if (st.tops.indexOf("pistachio") > -1) o += dots(18, ax, ay, spread, function (x, y) { return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2" fill="#6f9a5c"/>'; });
    if (st.tops.indexOf("chips") > -1) o += dots(12, ax, ay, spread, function (x, y, i) { return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="5" height="3.5" rx="1" fill="#3a2218" transform="rotate(' + ((i * 53) % 180) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>'; });
    if (st.tops.indexOf("sprinkles") > -1) o += dots(18, ax, ay, spread, function (x, y, i) { return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="7" height="2.4" rx="1.2" fill="' + cols[i % 5] + '" transform="rotate(' + ((i * 47) % 180) + ' ' + (x + 3.5).toFixed(1) + ' ' + (y + 1.2).toFixed(1) + ')"/>'; });
    if (st.tops.indexOf("cherry") > -1) o += '<circle cx="100" cy="' + (topY - 2) + '" r="7.5" fill="#c4263d"/><path d="M100 ' + (topY - 8) + 'c2-6 6-8 11-9" stroke="#2c4838" stroke-width="1.6" fill="none"/>';
    return o;
  }
  function previewSVG() {
    var o = st.cont === "cup" ? cupArt() : coneArt(), topY, ax, ay, sp;
    if (st.mode === "swirl") {
      var f = find(SWIRLS, st.swirl);
      o += swirlArt(f.c[0], f.c[1]);
      topY = 38; ax = 100; ay = 100; sp = 22;
    } else {
      var n = st.scoops.length;
      if (!n) {
        o += '<circle cx="100" cy="140" r="38" fill="none" stroke="#a98746" stroke-width="2" stroke-dasharray="6 6"/>';
        topY = 100; ax = 100; ay = 140; sp = 0;
      } else {
        st.scoops.forEach(function (id, i) { o += scoopArt(140 - 42 * i, find(SCOOPS, id).c[0]); });
        var topCy = 140 - 42 * (n - 1);
        topY = topCy - 38; ax = 100; ay = topCy - 4; sp = 26;
      }
    }
    if (st.mode === "swirl" || st.scoops.length) o += toppingArt(topY, ax, ay, sp);
    return o;
  }

  var sc = $("sControls");
  function seg(k, items, cur) {
    return '<div class="seg" role="group" aria-label="' + esc(k) + '">' + items.map(function (it) {
      return '<button type="button" data-k="' + it[0] + '" data-v="' + it[1] + '" aria-pressed="' + (cur(it) ? "true" : "false") + '">' + esc(it[2]) + '</button>';
    }).join("") + '</div>';
  }
  function renderStudio() {
    var h = seg("Ice cream style", [["mode", "swirl", "Swirl"], ["mode", "scoop", "Scoops"]], function (it) { return st.mode === it[1]; });
    if (st.mode === "swirl") {
      h += '<h3>Flavour</h3><div class="sflav">' + SWIRLS.map(function (f) {
        return '<button type="button" class="sf" data-k="swirl" data-v="' + f.id + '" aria-pressed="' + (st.swirl === f.id) + '"><i style="--c:' + bg(f.c) + '"></i>' + esc(f.n) + '</button>';
      }).join("") + '</div>';
      h += '<h3>Size</h3>' + seg("Size", [["size", "regular", "Regular " + money(PR.swirlRegular)], ["size", "large", "Large " + money(PR.swirlLarge)]], function (it) { return st.size === it[1]; });
    } else {
      var counts = {};
      st.scoops.forEach(function (id) { counts[id] = (counts[id] || 0) + 1; });
      h += '<h3>Pick up to ' + MAXSCOOPS + ' scoops (' + money(PR.scoop) + ' each)</h3><div class="sflav">' + SCOOPS.map(function (f) {
        return '<button type="button" class="sf" data-k="scoop" data-v="' + f.id + '" aria-label="Add a scoop of ' + esc(f.n) + '"><i style="--c:' + bg(f.c) + '"></i>' + esc(f.n) + (counts[f.id] ? '<span class="n">' + counts[f.id] + '</span>' : '') + '</button>';
      }).join("") + '</div>';
      h += '<div class="mine" aria-label="Your scoops">' + st.scoops.map(function (id, i) {
        var f = find(SCOOPS, id);
        return '<button type="button" data-k="unscoop" data-v="' + i + '" aria-label="Remove ' + esc(f.n) + '"><i style="--c:' + bg(f.c) + '"></i>' + esc(f.n) + ' <em>×</em></button>';
      }).join("") + '</div>';
    }
    h += '<h3>Serve it in</h3>' + seg("Container", [["cont", "cone", "Cone (+" + money(PR.cone) + ")"], ["cont", "cup", "Cup"]], function (it) { return st.cont === it[1]; });
    h += '<h3>Toppings (' + money(PR.top) + ' each)</h3>' + seg("Toppings", TOPS.map(function (t) { return ["top", t[0], t[1]]; }), function (it) { return st.tops.indexOf(it[1]) > -1; });
    sc.innerHTML = h;

    $("sSvg").innerHTML = previewSVG();
    $("sName").textContent = st.mode === "swirl" ? "Swirl, " + st.size : (st.scoops.length ? st.scoops.length + (st.scoops.length === 1 ? " scoop" : " scoops") : "Your scoops");
    $("sDetail").textContent = detail();
    $("sTotal").textContent = money(price());
    var add = $("sAdd"), can = st.mode === "swirl" || st.scoops.length > 0;
    add.disabled = !can;
    add.style.opacity = can ? "" : ".45";
    add.textContent = can ? "Add to order" : "Pick your first scoop";
  }
  sc.addEventListener("click", function (e) {
    var b = e.target.closest("[data-k]");
    if (!b) return;
    var k = b.getAttribute("data-k"), v = b.getAttribute("data-v");
    if (k === "mode") st.mode = v;
    else if (k === "swirl") st.swirl = v;
    else if (k === "size") st.size = v;
    else if (k === "cont") st.cont = v;
    else if (k === "scoop") { if (st.scoops.length < MAXSCOOPS) st.scoops.push(v); else window.BB.toast("Three scoops is the limit. Remove one to swap."); }
    else if (k === "unscoop") st.scoops.splice(+v, 1);
    else if (k === "top") { var i = st.tops.indexOf(v); if (i > -1) st.tops.splice(i, 1); else st.tops.push(v); }
    renderStudio();
    var again = sc.querySelector('[data-k="' + k + '"][data-v="' + v + '"]') || sc.querySelector('[data-k="' + k + '"]');
    if (again) again.focus();
  });
  $("sAdd").addEventListener("click", function () {
    if (st.mode === "scoop" && !st.scoops.length) return;
    var name = st.mode === "swirl" ? "Swirl ice cream (" + st.size + ")" : st.scoops.length + (st.scoops.length === 1 ? " scoop" : " scoops") + " of ice cream";
    window.BB.addItem({ id: "ice-" + Date.now(), name: name, detail: detail(), price: price() });
  });
  $("sClear").addEventListener("click", function () { st = { mode: st.mode, cont: "cone", size: "regular", swirl: "twist", scoops: [], tops: [] }; renderStudio(); });
  renderStudio();
  window.addEventListener("bbcurrencychange", renderStudio);

  /* ================= location ================= */
  var LOCKEY = "bb-loc", loc = null;
  var pendingCountryCode = "";
  try { loc = JSON.parse(localStorage.getItem(LOCKEY) || "null"); } catch (e) { loc = null; }
  function saveLoc() { try { localStorage.setItem(LOCKEY, JSON.stringify(loc)); } catch (e) {} }
  function addressFields() {
    return {
      houseNo: $("lochouse").value.trim(),
      street: $("locstreet").value.trim(),
      area: $("locarea").value.trim(),
      city: $("loccity").value.trim(),
      country: $("loccountry").value.trim()
    };
  }
  function addressText(fields) {
    var parts = [
      fields.houseNo ? "House/Building No. " + fields.houseNo : "",
      fields.street,
      fields.area,
      fields.city,
      fields.country
    ].filter(Boolean);
    return parts.filter(function (part, index, all) {
      return all.findIndex(function (other) { return other.toLowerCase() === part.toLowerCase(); }) === index;
    }).join(", ");
  }
  async function findCountryCode(fields) {
    var query = new URLSearchParams({
      format: "jsonv2",
      addressdetails: "1",
      limit: "1",
      q: [fields.city, fields.country].filter(Boolean).join(", ")
    });
    var response = await fetch("https://nominatim.openstreetmap.org/search?" + query.toString(), {
      headers: { "Accept-Language": "en" }
    });
    if (!response.ok) throw new Error("Country lookup failed");
    var results = await response.json();
    return results[0] && results[0].address && results[0].address.country_code
      ? results[0].address.country_code.toUpperCase()
      : "";
  }
  function fillAddressFields(address) {
    $("lochouse").value = address.house_number || "";
    $("locstreet").value = address.road || address.pedestrian || address.residential || address.footway || address.path || address.neighbourhood || address.suburb || "";
    $("locarea").value = address.neighbourhood || address.suburb || address.quarter || address.residential || address.city_district || address.hamlet || "";
    $("loccity").value = address.city || address.town || address.village || address.municipality || address.city_district || address.county || "";
    $("loccountry").value = address.country || "";
  }
  function showLoc() {
    var has = loc && loc.text;
    $("loclabel").textContent = has ? loc.text : "Set location";
    $("locbtn").setAttribute("aria-label", has ? "Delivering to " + loc.text + ". Change location" : "Set your location");
    $("infoloc").textContent = has ? loc.text : "No location set yet. Add one to see delivery options.";
    $("infolocbtn").textContent = has ? "Change location" : "Set location";
    $("currencyhint").textContent = "Prices display in " + (window.BBCurrency ? window.BBCurrency.getCurrency() : "PKR") + " as an estimate; final totals are confirmed by the bakery.";
    if (has) window.BB.setAddr(loc.text);
  }
  var dlg = $("locdlg");
  function openLoc() {
    $("lochouse").value = (loc && loc.houseNo) || "";
    $("locstreet").value = (loc && loc.street) || "";
    $("locarea").value = (loc && loc.area) || (!(loc && loc.street) && loc && loc.text) || "";
    $("loccity").value = (loc && loc.city) || "";
    $("loccountry").value = (loc && loc.country) || "";
    pendingCountryCode = (loc && loc.countryCode) || "";
    $("locmsg").textContent = "";
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
    $("lochouse").focus();
  }
  $("locbtn").addEventListener("click", openLoc);
  $("infolocbtn").addEventListener("click", openLoc);
  $("loccountry").addEventListener("input", function () { pendingCountryCode = ""; });
  $("locsave").addEventListener("click", async function () {
    var fields = addressFields();
    var required = [
      ["locstreet", fields.street, "Enter your street or neighborhood."],
      ["loccity", fields.city, "Enter your city."],
      ["loccountry", fields.country, "Enter your country."]
    ];
    for (var i = 0; i < required.length; i++) {
      if (!required[i][1]) {
        $("locmsg").textContent = required[i][2];
        $(required[i][0]).focus();
        return;
      }
    }
    var button = $("locsave"), message = $("locmsg"), countryCode = pendingCountryCode;
    button.disabled = true;
    message.textContent = "Checking the address country for local pricing";
    try {
      if (!countryCode) countryCode = await findCountryCode(fields);
      var currency = countryCode && window.BBCurrency
        ? await window.BBCurrency.setCountryCode(countryCode)
        : (window.BBCurrency ? window.BBCurrency.getCurrency() : "PKR");
      loc = {
        text: addressText(fields),
        houseNo: fields.houseNo,
        street: fields.street,
        area: fields.area,
        city: fields.city,
        country: fields.country,
        countryCode: countryCode || "",
        currency: currency
      };
      saveLoc();
      showLoc();
      dlg.close();
      window.BB.toast(countryCode ? "Location saved · prices in " + currency : "Location saved · current currency kept");
    } catch (e) {
      message.textContent = "We couldn't verify the country right now. Your address is saved with the current currency; you can try again later.";
      // Save the structured address even if the lookup service is unavailable.
      var fallbackCurrency = window.BBCurrency ? window.BBCurrency.getCurrency() : "PKR";
      loc = {
        text: addressText(fields),
        houseNo: fields.houseNo,
        street: fields.street,
        area: fields.area,
        city: fields.city,
        country: fields.country,
        countryCode: "",
        currency: fallbackCurrency
      };
      saveLoc();
      showLoc();
      dlg.close();
      window.BB.toast("Address saved; current currency kept");
    } finally {
      button.disabled = false;
    }
  });
  $("locskip").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("close", function () {
    if (!loc) { loc = { skipped: true }; saveLoc(); }
  });
  $("locgeo").addEventListener("click", function () {
    var m = $("locmsg");
    if (!navigator.geolocation) { m.textContent = "This browser can't share its location. Type your area instead."; return; }
    var button = $("locgeo");
    button.disabled = true;
    m.textContent = "Finding your location and looking up its address";
    navigator.geolocation.getCurrentPosition(async function (p) {
      try {
        var query = new URLSearchParams({
          format: "jsonv2",
          lat: String(p.coords.latitude),
          lon: String(p.coords.longitude),
          zoom: "18",
          addressdetails: "1"
        });
        var response = await fetch("https://nominatim.openstreetmap.org/reverse?" + query.toString(), {
          headers: { "Accept-Language": "en" }
        });
        if (!response.ok) throw new Error("Address lookup failed");
        var result = await response.json();
        var a = result.address || {};
        // Never put latitude/longitude into any visible field; only use the reverse-geocoded address.
        fillAddressFields(a);
        pendingCountryCode = a.country_code ? a.country_code.toUpperCase() : "";
        if (!$("locstreet").value || !$("locarea").value) {
          m.textContent = "Address found. Fill in any missing street, area or house number, then save.";
        } else {
          m.textContent = "Address found. Add the house number if it is missing, review the fields, then save.";
        }
      } catch (e) {
        m.textContent = "We found your location, but couldn't look up an address. Enter your house number, street, area, city and country.";
      } finally {
        button.disabled = false;
      }
    }, function () {
      m.textContent = "We couldn't get your location. Type your area or street instead.";
      button.disabled = false;
    }, { timeout: 9000 });
  });
  showLoc();
  if (!loc) setTimeout(openLoc, 1200);

  /* ================= reservation ================= */
  var rd = $("rd"), rt = $("rt"), rg = $("rg");
  var now0 = new Date();
  var todayStr = now0.getFullYear() + "-" + pad(now0.getMonth() + 1) + "-" + pad(now0.getDate());
  var maxD = new Date(now0.getTime() + 60 * 86400000);
  rd.min = todayStr;
  rd.max = maxD.getFullYear() + "-" + pad(maxD.getMonth() + 1) + "-" + pad(maxD.getDate());
  for (var g = 1; g <= 10; g++) { var og = document.createElement("option"); og.value = g; og.textContent = g + (g === 1 ? " guest" : " guests"); if (g === 2) og.selected = true; rg.appendChild(og); }

  function slots(isToday) {
    var out = [], n = new Date(), minMin = n.getHours() * 60 + n.getMinutes() + 60;
    for (var m = 9 * 60; m <= 20 * 60 + 30; m += 30) {
      if (isToday && m < minMin) continue;
      var h = Math.floor(m / 60), mm = m % 60;
      out.push({ v: pad(h) + ":" + pad(mm), l: (h % 12 || 12) + ":" + pad(mm) + " " + (h >= 12 ? "pm" : "am") });
    }
    return out;
  }
  function buildTimes() {
    var keep = rt.value, list = slots(rd.value === todayStr);
    rt.innerHTML = '<option value="">' + (list.length ? "Choose a time" : "No slots left today") + '</option>' + list.map(function (s) { return '<option value="' + s.v + '">' + s.l + '</option>'; }).join("");
    if (keep && list.some(function (s) { return s.v === keep; })) rt.value = keep;
  }
  buildTimes();

  var confirmed = false;
  function longDate(v) { return new Date(v + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
  function updateTicket(reset) {
    if (reset && confirmed) {
      confirmed = false;
      $("stamp").hidden = true;
      $("tref").textContent = "";
      $("rnote").textContent = "Your ticket fills in as you type.";
    }
    $("tn").textContent = $("rn").value.trim() || "Your name";
    $("td").textContent = rd.value ? longDate(rd.value) : "Pick a date";
    $("tt").textContent = rt.value ? rt.options[rt.selectedIndex].text : "Pick a time";
    $("tg").textContent = rg.value;
    $("ticket").querySelector("small").textContent = rg.value === "1" ? "guest" : "guests";
  }
  rd.addEventListener("change", function () { buildTimes(); updateTicket(true); });
  ["rn", "rt", "rg"].forEach(function (id) { $(id).addEventListener("input", function () { updateTicket(true); }); });
  $("rform").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("rerr"); err.textContent = "";
    if ($("rn").value.trim().length < 2) { err.textContent = "Enter your name."; $("rn").focus(); return; }
    if (!/^[+\d][\d\s()-]{6,}$/.test($("rp").value.trim())) { err.textContent = "Enter a phone number we can reach you on."; $("rp").focus(); return; }
    if (!rd.value || rd.value < todayStr) { err.textContent = "Choose a date from today onwards."; rd.focus(); return; }
    if (!rt.value) { err.textContent = "Choose a time for your table."; rt.focus(); return; }
    confirmed = true;
    updateTicket(false);
    $("stamp").hidden = false;
    $("tref").textContent = "Ref BB-R" + Math.floor(1000 + Math.random() * 9000);
    $("rnote").textContent = "Reservation confirmed. Show this ticket when you arrive. This is a demo, so nothing has been sent to the bakery.";
  });
  updateTicket(false);
})();



(function () {
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return window.BBCurrency ? window.BBCurrency.format(n, "USD") : "$" + n.toFixed(2); }
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return "rgb(" + r + "," + g + "," + b + ")";
  }
  function lum(hex) { var n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); }
  function ink(c) { return lum(c) < 120 ? "#f4ead2" : "#2c4838"; }
  function mono(x, y, size, c) { return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-size="' + size + '" fill="' + ink(c) + '">B&amp;B</text>'; }
  var S = 'stroke="#a98746" stroke-width="1.8"';

  /* ================= merchandise ================= */
  var COLORS = { mint: ["Mint", "#cfe3d3"], cream: ["Cream", "#f4ead2"], rose: ["Rose", "#ecbcc4"], forest: ["Forest", "#2c4838"] };
  var MART = {
    tote: function (c) { return '<path d="M36 26c0-18 28-18 28 0" fill="none" stroke="#a98746" stroke-width="2.4" stroke-linecap="round"/><path d="M22 24h56l4 42H18z" fill="' + c + '" ' + S + '/>' + mono(50, 50, 15, c); },
    mug: function (c) { return '<path d="M68 28h5c9 0 9 18 0 18h-5" fill="none" stroke="#a98746" stroke-width="3"/><path d="M26 20h42v28c0 11-8 18-21 18S26 59 26 48z" fill="' + c + '" ' + S + '/><ellipse cx="47" cy="20" rx="21" ry="5" fill="' + shade(c, -18) + '" ' + S + '/>' + mono(47, 46, 14, c); },
    tee: function (c) { return '<path d="M34 10L14 20l6 12 8-4v36h44V28l8 4 6-12L66 10c-3 6-8 8-16 8s-13-2-16-8z" fill="' + c + '" ' + S + '/>' + mono(50, 40, 14, c); },
    cap: function (c) { return '<path d="M20 46c0-20 14-28 30-28s30 8 30 28z" fill="' + c + '" ' + S + '/><path d="M36 22c-4 8-6 16-6 24M64 22c4 8 6 16 6 24" fill="none" stroke="' + shade(c, -25) + '" stroke-width="1.2"/><path d="M26 46h66c0 6-12 9-28 9H34c-6 0-8-3-8-9z" fill="' + shade(c, -18) + '" ' + S + '/><circle cx="50" cy="17" r="3" fill="' + shade(c, -25) + '"/>' + mono(50, 38, 11, c); },
    apron: function (c) { return '<path d="M42 6c2 7 14 7 16 0" fill="none" stroke="#a98746" stroke-width="2"/><path d="M40 8h20l3 18 13 6-5 34H29l-5-34 13-6z" fill="' + c + '" ' + S + '/><rect x="38" y="42" width="24" height="13" rx="2" fill="' + shade(c, -14) + '" stroke="#a98746" stroke-width="1.2"/>' + mono(50, 36, 11, c); },
    tin: function (c) { return '<path d="M24 22v36c0 6 52 6 52 0V22" fill="' + c + '" ' + S + '/><ellipse cx="50" cy="22" rx="26" ry="7" fill="' + shade(c, -16) + '" ' + S + '/><rect x="34" y="32" width="32" height="18" rx="2" fill="#fffdf8" opacity=".92"/>' + mono(50, 45, 11, "#fffdf8"); },
    stickers: function () { return '<g stroke="#fff" stroke-width="3"><circle cx="22" cy="24" r="12" fill="#ecbcc4"/><circle cx="50" cy="22" r="12" fill="#7a3b1e"/><circle cx="78" cy="24" r="12" fill="#cfe3d3"/><circle cx="22" cy="50" r="12" fill="#f6e08a"/><circle cx="50" cy="52" r="12" fill="#d94f64"/><circle cx="78" cy="50" r="12" fill="#2c4838"/></g><g fill="#fff" opacity=".7"><circle cx="19" cy="21" r="2"/><circle cx="47" cy="19" r="2"/><circle cx="75" cy="21" r="2"/><circle cx="19" cy="47" r="2"/><circle cx="47" cy="49" r="2"/><circle cx="75" cy="47" r="2"/></g>'; },
    giftbox: function (c) { return '<path d="M18 30h64v34H18z" fill="' + c + '" ' + S + '/><path d="M14 20h72v12H14z" fill="' + shade(c, -14) + '" ' + S + '/><path d="M50 20v44" stroke="#d9c08b" stroke-width="5"/>' + mono(33, 53, 11, c); }
  };
  var MERCH = [
    { id: "tote", name: "Canvas tote bag", desc: "Heavy cotton canvas with long handles. Fits two cake boxes.", price: 14, art: "tote", colors: ["cream", "mint", "forest"] },
    { id: "mug", name: "Ceramic mug", desc: "350 ml, glazed inside and out. Made for chai and hot chocolate.", price: 12, art: "mug", colors: ["mint", "cream", "rose"] },
    { id: "tee", name: "Smile tee", desc: "Soft cotton in a relaxed fit, with our mark on the chest.", price: 22, art: "tee", colors: ["cream", "mint", "rose"], sizes: ["S", "M", "L", "XL"] },
    { id: "cap", name: "Baker's cap", desc: "Adjustable cotton cap with an embroidered monogram.", price: 18, art: "cap", colors: ["forest", "cream", "rose"] },
    { id: "apron", name: "Baker's apron", desc: "Cross-back apron with a deep front pocket, for home bakers.", price: 26, art: "apron", colors: ["cream", "forest"] },
    { id: "tin", name: "Tea tin", desc: "Reusable tin of our rose bergamot blend, 50 g.", price: 15, art: "tin", colors: ["mint", "rose"] },
    { id: "stick", name: "Sticker pack", desc: "Six waterproof stickers for laptops, bottles and notebooks.", price: 5, art: "stickers" },
    { id: "gbox", name: "Gift box set", desc: "Five flat-pack boxes in our mint and gold, for your own bakes.", price: 18, art: "giftbox", colors: ["mint", "rose"] }
  ];
  var mgrid = $("mgrid");
  MERCH.forEach(function (m) {
    var col = m.colors ? m.colors[0] : null, size = m.sizes ? m.sizes[0] : null;
    function art() { return MART[m.art](col ? COLORS[col][1] : null); }
    var el = document.createElement("article");
    el.className = "prod";
    el.innerHTML = '<div class="pic"><svg viewBox="0 0 100 70" aria-hidden="true"></svg></div>' +
      '<h3>' + esc(m.name) + '</h3><p>' + esc(m.desc) + '</p>' +
      (m.colors ? '<div class="swatches" role="group" aria-label="Colour for ' + esc(m.name) + '">' + m.colors.map(function (k) {
        return '<button type="button" data-c="' + k + '" aria-label="' + esc(COLORS[k][0]) + '" style="--c:' + COLORS[k][1] + '" aria-pressed="' + (k === col) + '"></button>';
      }).join("") + '<span class="cname">' + esc(COLORS[col][0]) + '</span></div>' : '') +
      (m.sizes ? '<select aria-label="Size for ' + esc(m.name) + '">' + m.sizes.map(function (z) { return '<option>' + z + '</option>'; }).join("") + '</select>' : '') +
      '<div class="buy"><span class="price" data-bb-money="' + m.price + '" data-bb-currency="USD">' + money(m.price) + '</span><button class="addbtn" type="button" aria-label="Add ' + esc(m.name) + ' to order">Add to order</button></div>';
    var svg = el.querySelector(".pic svg");
    svg.innerHTML = art();
    var sw = el.querySelector(".swatches");
    if (sw) sw.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-c]");
      if (!b) return;
      col = b.getAttribute("data-c");
      Array.prototype.forEach.call(sw.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", x === b); });
      sw.querySelector(".cname").textContent = COLORS[col][0];
      svg.innerHTML = art();
    });
    var sel = el.querySelector("select");
    if (sel) sel.addEventListener("change", function () { size = sel.value; });
    el.querySelector(".addbtn").addEventListener("click", function () {
      var bits = [col ? COLORS[col][0] : "", size || ""].filter(Boolean).join(", ");
      window.BB.addItem({ id: "merch-" + m.id + "-" + (col || "x") + "-" + (size || "x"), name: m.name + (bits ? " (" + bits + ")" : ""), detail: "", price: m.price });
    });
    mgrid.appendChild(el);
  });

  /* ================= contents bar: scroll-spy + progress ================= */
  var ids = ["menu", "icecream", "box", "merch", "story", "salon", "reserve", "reviews", "faq", "visit"];
  var secs = ids.map($);
  var toc = $("toc"), prog = $("prog"), hdr = document.querySelector("header.site");
  var links = ids.map(function (id) { return toc.querySelector('a[href="#' + id + '"]'); });
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cur = -2, ticking = false;
  function update() {
    ticking = false;
    var line = hdr.offsetHeight + 24, idx = -1;
    secs.forEach(function (sec, i) { if (sec && sec.getBoundingClientRect().top <= line) idx = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = secs.length - 1;
    if (idx !== cur) {
      cur = idx;
      links.forEach(function (a, i) { if (a) { if (i === idx) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); } });
      if (idx > -1 && links[idx]) {
        var a = links[idx];
        toc.scrollTo({ left: a.offsetLeft - (toc.clientWidth - a.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
      }
    }
    var max = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + "%";
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

