/* Apply the theme chosen on index.html to every page in the site. */
(function () {
  try {
    var savedTheme = localStorage.getItem("bb-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  } catch (e) { /* localStorage may be unavailable in private browsing */ }
})();

/* Small shared interactions for Bakerz & Bitez */
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-ready");
  // Show a different sweet discovery on each page load.
  const isHomePage = document.body.dataset.page === "index" || location.pathname.endsWith("index.html") || location.pathname === "/";
  const root = isHomePage ? "" : "../";
  const sweetIdeas = [
    {title:"Build your macaron box",text:"Choose flavours and create a colourful box just for you.",href:root + "index.html#box",image:root + "assets/images/macrons.jpg"},
    {title:"Build a scoop",text:"Mix your favourite ice-cream flavours and toppings.",href:root + "index.html#icecream",image:root + "assets/images/ice-cream-scoops.jpg"},
    {title:"Try a café treat",text:"Pair a fresh pastry with coffee or karak chai.",href:root + "html/menu.html#cafe-menu",image:root + "assets/images/cafe-treat.jpg"},
    {title:"Find your sweet combo",text:"Explore a shareable deal for your next treat.",href:root + "html/deals.html",image:root + "assets/images/bakerz-and-bitez-combo-deals.jpg"}
  ];
  let lastSweetIdea = "";
  try { lastSweetIdea = sessionStorage.getItem("bb-last-sweet-idea") || ""; } catch (e) {}
  const freshIdeas = sweetIdeas.filter(item => item.title !== lastSweetIdea);
  const suggestion = freshIdeas[Math.floor(Math.random() * freshIdeas.length)] || sweetIdeas[0];
  try { sessionStorage.setItem("bb-last-sweet-idea", suggestion.title); } catch (e) {}
  const suggestionBox = document.createElement("aside");
  suggestionBox.className = "bb-suggestion";
  suggestionBox.setAttribute("aria-label", "Suggestion of the visit");
  suggestionBox.innerHTML = '<button class="bb-suggestion-close" type="button" aria-label="Close suggestion">×</button><img src="' + suggestion.image + '" alt=""><div><small>TRY SOMETHING NEW</small><strong>' + suggestion.title + '</strong><p>' + suggestion.text + '</p><a href="' + suggestion.href + '">Explore suggestion →</a></div>';
  document.body.appendChild(suggestionBox);
  suggestionBox.querySelector(".bb-suggestion-close").addEventListener("click", () => suggestionBox.remove());
  const revealItems = Array.from(document.querySelectorAll("main section, .deal-card, .menu-card, .feature-card, .product-card"))
    .filter(item => !item.querySelector("img, svg"));
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealItems.forEach(item => {
      item.classList.add("reveal-on-scroll");
      observer.observe(item);
    });
  }
});

/* ===== Visitor counter + customer feedback (all pages) ===== */
(function () {
  var WHATSAPP_NUMBER = "923351374417"; // feedback is sent to the bakery on WhatsApp
  var KEY_VISITS = "bb_visits", KEY_SESSION = "bb_session_counted", KEY_FEEDBACK = "bb_my_feedback", KEY_FEEDBACK_SUBMITTED = "bb_feedback_submitted_once";

  function store(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }

  /* ---- Visitor counter ---- */
  function countVisit() {
    var total = store(function () { return parseInt(localStorage.getItem(KEY_VISITS), 10) || 0; }, 0);
    var counted = store(function () { return sessionStorage.getItem(KEY_SESSION); }, "1");
    if (!counted) {
      total += 1;
      store(function () { localStorage.setItem(KEY_VISITS, total); sessionStorage.setItem(KEY_SESSION, "1"); });
    }
    return Math.max(total, 1);
  }

  /* ---- Feedback section ---- */
  function buildFeedback() {
    var sec = document.createElement("section");
    sec.className = "bb-feedback";
    sec.id = "feedback";
    sec.innerHTML =
      '<div class="wrap"><div class="bb-fb-grid">' +
      '<div class="bb-fb-intro"><span class="eyebrow">Customer feedback</span>' +
      '<h2>How did we do?</h2><p>Share your experience once. After submitting, you can browse feedback saved in this browser.</p>' +
      '<div class="bb-fb-community"><h3>Customer feedback from this browser</h3><ul id="bbCommunityList"></ul><p id="bbNoFeedback">No feedback has been submitted here yet.</p></div></div>' +
      '<form class="bb-fb-form" id="bbFeedbackForm" novalidate>' +
      '<fieldset class="bb-stars" aria-label="Rating"><legend>Your rating</legend>' +
      [5, 4, 3, 2, 1].map(function (n) {
        return '<input type="radio" name="bbRating" id="bbStar' + n + '" value="' + n + '"><label for="bbStar' + n + '" title="' + n + ' star' + (n > 1 ? 's' : '') + '">★</label>';
      }).join("") +
      '</fieldset>' +
      '<label for="bbName">Your name</label><input id="bbName" type="text" maxlength="60" autocomplete="name" placeholder="e.g. Ayesha" required>' +
      '<label for="bbComment">Your feedback</label><textarea id="bbComment" rows="4" maxlength="600" placeholder="What did you enjoy? What could be better?" required></textarea>' +
      '<button class="btn" type="submit">Submit feedback</button>' +
      '<p class="bb-fb-status" id="bbFbStatus" role="status" aria-live="polite"></p>' +
      '</form></div><p class="bb-fb-note">Note: without a website backend, feedback is saved only in this browser and is not shared across different visitors or devices.</p></div>';
    return sec;
  }

  function readFeedback() {
    return store(function () { return JSON.parse(localStorage.getItem(KEY_FEEDBACK) || "[]"); }, []);
  }

  function renderFeedback() {
    var list = readFeedback();
    var ul = document.getElementById("bbCommunityList");
    var empty = document.getElementById("bbNoFeedback");
    if (!ul || !empty) return;
    ul.innerHTML = "";
    list.slice().reverse().forEach(function (f) {
      var li = document.createElement("li");
      var head = document.createElement("strong");
      head.textContent = "★".repeat(Number(f.rating) || 0) + "☆".repeat(5 - (Number(f.rating) || 0)) + "  " + (f.name || "Customer");
      var p = document.createElement("span");
      p.textContent = f.comment || "";
      li.appendChild(head); li.appendChild(p); ul.appendChild(li);
    });
    empty.hidden = list.length > 0;
  }

  function lockFeedbackForm(whatsappUrl) {
    var form = document.getElementById("bbFeedbackForm");
    if (!form) return;
    var alreadySubmitted = store(function () { return localStorage.getItem(KEY_FEEDBACK_SUBMITTED) === "1"; }, false);
    if (alreadySubmitted) {
      form.innerHTML = '<h3>Feedback submitted on this device</h3><p>Your feedback is saved in this browser and appears in the list beside this form. It reaches the bakery only after you send the prepared WhatsApp message.</p>';
      if (whatsappUrl) {
        var waLink = document.createElement("a");
        waLink.className = "btn";
        waLink.href = whatsappUrl;
        waLink.target = "_blank";
        waLink.rel = "noopener noreferrer";
        waLink.textContent = "Open WhatsApp message";
        form.appendChild(waLink);
      }
    }
  }

  function wireForm() {
    var form = document.getElementById("bbFeedbackForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("bbFbStatus");
      if (store(function () { return localStorage.getItem(KEY_FEEDBACK_SUBMITTED) === "1"; }, false)) {
        form.innerHTML = '<h3>Thank you for your feedback!</h3><p>Only one feedback submission is allowed per browser.</p>';
        return;
      }
      var rated = form.querySelector('input[name="bbRating"]:checked');
      var name = document.getElementById("bbName").value.trim();
      var comment = document.getElementById("bbComment").value.trim();
      if (!rated || !name || !comment) {
        status.className = "bb-fb-status error";
        status.textContent = "Please add a rating, your name and a few words of feedback.";
        return;
      }
      var rating = parseInt(rated.value, 10);
      var list = readFeedback();
      list.push({ rating: rating, name: name, comment: comment, at: Date.now() });
      var saved = store(function () {
        localStorage.setItem(KEY_FEEDBACK, JSON.stringify(list.slice(-50)));
        localStorage.setItem(KEY_FEEDBACK_SUBMITTED, "1");
        return true;
      }, false);
      if (!saved) {
        status.className = "bb-fb-status error";
        status.textContent = "Your browser could not save feedback. Please check browser storage settings.";
        return;
      }
      var msg = ["Customer feedback — Bakerz & Bitez", "Rating: " + rating + "/5 " + "★".repeat(rating), "Name: " + name, "Page: " + document.title, "Feedback: " + comment].join("\n");
      var waUrl = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg);
      window.open(waUrl, "_blank");
      status.className = "bb-fb-status ok";
      status.textContent = "Thank you, " + name + "! Feedback is saved on this device. Send the prepared WhatsApp message to share it with the bakery.";
      renderFeedback();
      lockFeedbackForm(waUrl);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var footer = document.querySelector("footer");
    if (!footer) return;
    footer.parentNode.insertBefore(buildFeedback(), footer);
    wireForm();
    renderFeedback();
    lockFeedbackForm();

    var total = countVisit();
    var wrap = footer.querySelector(".wrap") || footer;
    var v = document.createElement("p");
    v.className = "bb-visitors";
    v.innerHTML = '<span aria-hidden="true">👋</span> Visitor count: <b id="bbVisitCount">' + total.toLocaleString() + '</b>';
    wrap.appendChild(v);
  });
})();

/* ===== Live date & time in the ticker (all pages) ===== */
(function () {
  function setupClock() {
    var ticker = document.querySelector(".ticker");
    if (!ticker || ticker.querySelector(".tclock")) return; // homepage already has its own clock
    var clock = document.createElement("div");
    clock.className = "tclock";
    clock.setAttribute("aria-hidden", "true");
    clock.innerHTML = '<span class="bb-cdate"></span><b class="bb-ctime"></b>';
    ticker.insertBefore(clock, ticker.firstChild);
    var d = clock.querySelector(".bb-cdate"), t = clock.querySelector(".bb-ctime");
    function tick() {
      var n = new Date();
      d.textContent = n.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      t.textContent = n.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
    }
    tick();
    setInterval(tick, 1000);
  }

  document.addEventListener("DOMContentLoaded", setupClock);
})();

/* ===== Footer Instagram line (all pages) ===== */
document.addEventListener("DOMContentLoaded", function () {
  var wrap = document.querySelector("footer .wrap");
  if (!wrap || wrap.querySelector(".bb-foot-ig")) return;
  var p = document.createElement("p");
  p.style.margin = "0";
  p.innerHTML = '<a class="bb-foot-ig" href="https://www.instagram.com/bakers.and.bites_01/" target="_blank" rel="noopener noreferrer"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5.2"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>@bakers.and.bites_01</a>';
  var fine = wrap.querySelector(".fine");
  wrap.insertBefore(p, fine || null);
});
