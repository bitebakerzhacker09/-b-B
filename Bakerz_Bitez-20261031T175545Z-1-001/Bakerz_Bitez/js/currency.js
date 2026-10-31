(function () {
  "use strict";

  var LOCATION_KEY = "bb-loc";
  var RATE_KEY = "bb-usd-rates";
  var FALLBACK_CURRENCY = {
    PK: "PKR", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD",
    IN: "INR", AE: "AED", SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD",
    OM: "OMR", BD: "BDT", LK: "LKR", NP: "NPR", MY: "MYR", SG: "SGD",
    JP: "JPY", CN: "CNY", HK: "HKD", KR: "KRW", TH: "THB", ID: "IDR",
    PH: "PHP", TR: "TRY", CH: "CHF", DE: "EUR", FR: "EUR", IT: "EUR",
    ES: "EUR", NL: "EUR", BE: "EUR", IE: "EUR", PT: "EUR", AT: "EUR",
    ZA: "ZAR", NG: "NGN", KE: "KES", EG: "EGP", MX: "MXN", BR: "BRL"
  };
  var locationData = readLocation();
  var currentCurrency = validCurrency(locationData.currency) ? locationData.currency : "PKR";
  var rates = readRates();

  function readLocation() {
    try { return JSON.parse(localStorage.getItem(LOCATION_KEY) || "{}") || {}; } catch (e) { return {}; }
  }

  function validCurrency(code) {
    return typeof code === "string" && /^[A-Z]{3}$/.test(code);
  }

  function readRates() {
    try {
      var saved = JSON.parse(localStorage.getItem(RATE_KEY) || "null");
      return saved && saved.rates && saved.rates.PKR ? saved.rates : null;
    } catch (e) { return null; }
  }

  function convert(amount, sourceCurrency) {
    amount = Number(amount);
    sourceCurrency = validCurrency(sourceCurrency) ? sourceCurrency : "USD";
    if (!Number.isFinite(amount)) return null;
    if (sourceCurrency === currentCurrency) return amount;
    if (!rates || !rates[sourceCurrency] || !rates[currentCurrency] || !rates.PKR) return null;
    var amountInUsd = sourceCurrency === "USD" ? amount : amount / rates[sourceCurrency];
    return amountInUsd * rates[currentCurrency];
  }

  function format(amount, sourceCurrency) {
    sourceCurrency = validCurrency(sourceCurrency) ? sourceCurrency : "USD";
    var converted = convert(amount, sourceCurrency);
    var displayCurrency = converted === null ? sourceCurrency : currentCurrency;
    var value = converted === null ? Number(amount) : converted;
    if (!Number.isFinite(value)) value = 0;
    if (displayCurrency === "PKR") return "Rs. " + Math.round(value).toLocaleString("en-PK");
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: displayCurrency,
        maximumFractionDigits: ["JPY", "KRW"].indexOf(displayCurrency) !== -1 ? 0 : 2
      }).format(value);
    } catch (e) {
      return displayCurrency + " " + value.toFixed(2);
    }
  }

  function currencyFromToken(token) {
    return token.indexOf("$") !== -1 || /USD/i.test(token) ? "USD" : "PKR";
  }

  function renderStaticPrices() {
    document.querySelectorAll(".combo-photo-card .price, .menu-card-bottom strong, .cafe-item > strong, .tset span").forEach(function (node) {
      if (!node.dataset.bbOriginalPriceHtml) {
        var html = node.innerHTML;
        if (!/(?:\$|USD|Rs\.?|PKR)\s*[\d,]+(?:\.\d{1,2})?/i.test(html)) return;
        node.dataset.bbOriginalPriceHtml = html;
      }
      node.innerHTML = node.dataset.bbOriginalPriceHtml.replace(
        /(\$|USD|Rs\.?|PKR)\s*([\d,]+(?:\.\d{1,2})?)/gi,
        function (match, token, amount) {
          return format(Number(amount.replace(/,/g, "")), currencyFromToken(token));
        }
      );
    });

    document.querySelectorAll("[data-bb-money][data-bb-currency]").forEach(function (node) {
      node.textContent = format(node.getAttribute("data-bb-money"), node.getAttribute("data-bb-currency"));
    });

    var hint = document.getElementById("currencyhint");
    if (hint) hint.textContent = "Prices display in " + currentCurrency + (rates ? " using indicative exchange rates." : " when exchange rates are available.");
    var note = document.querySelector(".bb-currency-note");
    if (!note) {
      var header = document.querySelector("header");
      if (header) {
        note = document.createElement("p");
        note.className = "bb-currency-note";
        note.setAttribute("aria-live", "polite");
        header.insertAdjacentElement("afterend", note);
      }
    }
    if (note) {
      note.textContent = rates
        ? "Prices shown in " + currentCurrency + " · converted estimates; the bakery confirms the final total."
        : "Exchange rates are unavailable, so prices may remain in their listed currencies.";
    }
    window.dispatchEvent(new CustomEvent("bbcurrencychange", {
      detail: { currency: currentCurrency, ratesAvailable: !!rates }
    }));
  }

  async function currencyForCountry(code) {
    code = String(code || "").toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return null;
    try {
      var response = await fetch("https://restcountries.com/v3.1/alpha/" + encodeURIComponent(code) + "?fields=currencies");
      if (!response.ok) throw new Error("Country lookup unavailable");
      var data = await response.json();
      var currencies = data && data.currencies;
      if (Array.isArray(data) && data[0]) currencies = data[0].currencies;
      var codes = currencies ? Object.keys(currencies) : [];
      if (codes.length && validCurrency(codes[0])) return codes[0];
    } catch (e) { /* use the small built-in fallback list when the lookup is unavailable */ }
    return FALLBACK_CURRENCY[code] || null;
  }

  async function setCountryCode(code) {
    var resolved = await currencyForCountry(code);
    if (!resolved) return currentCurrency;
    currentCurrency = resolved;
    renderStaticPrices();
    return currentCurrency;
  }

  async function loadRates() {
    try {
      var response = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
      if (!response.ok) throw new Error("Rates unavailable");
      var data = await response.json();
      if (data.result !== "success" || !data.rates || !data.rates.PKR) throw new Error("Rates unavailable");
      rates = data.rates;
      try { localStorage.setItem(RATE_KEY, JSON.stringify({ fetchedAt: Date.now(), rates: rates })); } catch (e) {}
      renderStaticPrices();
    } catch (e) {
      // A previously cached rate remains available when the service is temporarily offline.
    }
  }

  window.BBCurrency = {
    format: format,
    convert: convert,
    getCurrency: function () { return currentCurrency; },
    setCountryCode: setCountryCode,
    hasRates: function () { return !!rates; }
  };

  document.addEventListener("DOMContentLoaded", renderStaticPrices);

  if (locationData.countryCode && !validCurrency(locationData.currency)) {
    setCountryCode(locationData.countryCode);
  }
  loadRates();
})();
