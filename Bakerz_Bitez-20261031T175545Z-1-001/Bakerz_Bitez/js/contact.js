// Front-end-only ordering: send contact/order details through WhatsApp, no backend needed.
(function () {
  var WHATSAPP_NUMBER = "923351374417"; // Pakistan country code +92, digits only
  var params = new URLSearchParams(window.location.search);
  var deal = params.get("deal");
  var item = params.get("item");
  var messageField = document.getElementById("message");
  var choiceField = document.getElementById("choice");
  if (deal || item) {
    var selected = deal ? "I would like to order this deal/combo: " + deal : "I would like to order: " + item;
    messageField.value = selected + "\nQuantity: 1\nPlease confirm availability.";
    if (choiceField) choiceField.value = "Order a deal or combo";
  }

  // Reverse-geocode the visitor's permitted current location into a human-readable address.
  var detectButton = document.getElementById("contactDetectLocation");
  if (detectButton) detectButton.addEventListener("click", function () {
    var status = document.getElementById("contactLocationStatus");
    if (!navigator.geolocation) {
      status.textContent = "Location detection is not supported. Please enter your address manually.";
      return;
    }
    detectButton.disabled = true;
    status.textContent = "Finding your street address...";
    navigator.geolocation.getCurrentPosition(async function (position) {
      try {
        var query = new URLSearchParams({
          format: "jsonv2",
          lat: String(position.coords.latitude),
          lon: String(position.coords.longitude),
          zoom: "18",
          addressdetails: "1"
        });
        var response = await fetch("https://nominatim.openstreetmap.org/reverse?" + query.toString(), {
          headers: { "Accept-Language": "en" }
        });
        if (!response.ok) throw new Error("Address lookup failed");
        var result = await response.json();
        var a = result.address || {};
        var street = [a.house_number, a.road || a.pedestrian || a.residential || a.footway].filter(Boolean).join(" ");
        document.getElementById("contactStreet").value = street || a.neighbourhood || a.suburb || "";
        document.getElementById("contactArea").value = a.neighbourhood || a.suburb || a.quarter || a.residential || a.city_district || "";
        document.getElementById("contactCity").value = a.city || a.town || a.village || a.municipality || a.county || "";
        document.getElementById("contactCountry").value = a.country || "";
        if (document.getElementById("contactStreet").value || document.getElementById("contactCity").value) {
          status.textContent = "Address filled in. Please review it and add any missing details.";
        } else {
          status.textContent = "A street address wasn't available here. Please enter your address manually.";
        }
      } catch (error) {
        status.textContent = "We couldn't look up your address. Please enter it manually.";
      } finally {
        detectButton.disabled = false;
      }
    }, function (error) {
      status.textContent = error.code === 1
        ? "Please allow location access in your browser, then try again."
        : "Unable to detect location. Please enter your address manually.";
      detectButton.disabled = false;
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });

  document.getElementById("contactForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("name").value.trim();
    var phone = document.getElementById("phone").value.trim();
    var choice = choiceField.value;
    var details = messageField.value.trim();
    var addressParts = [
      document.getElementById("contactStreet").value.trim(),
      document.getElementById("contactArea").value.trim(),
      document.getElementById("contactCity").value.trim(),
      document.getElementById("contactCountry").value.trim()
    ].filter(Boolean);
    var message = [
      "Hello Bakerz & Bitez!",
      "I'd like to contact you / place an order.",
      "Name: " + name,
      "Customer phone: " + phone,
      "Request: " + choice,
      "Location: " + (addressParts.join(", ") || "Not provided"),
      "Details: " + details,
      "\nWhere smiles are served daily."
    ].join("\n");
    var waUrl = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
    var waWindow = window.open(waUrl, "_blank");
    var status = document.getElementById("formStatus");
    status.textContent = waWindow
      ? "Your request is ready. WhatsApp opened in a new tab; press Send there to submit it to the bakery. "
      : "Your request is ready, but WhatsApp did not open automatically. Use this link to send it. ";
    var link = document.createElement("a");
    link.href = waUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open WhatsApp message";
    status.appendChild(link);
  });
})();
