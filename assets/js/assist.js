(function () {
  var WHATSAPP = "27721057941";
  var TYPES = [
    ["hob", "Hob"],
    ["stove", "Stove"],
    ["geyser", "Geyser"],
    ["braai", "Braai"],
    ["commercial", "Commercial kitchen"]
  ];

  bindPanel("gas", "data-gas-open", "data-gas-close");
  setupQuote();

  function bindPanel(id, openAttr, closeAttr) {
    var root = document.getElementById(id);
    if (!root) return;
    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      root.hidden = false;
      document.body.classList.add("book-open");
      var closeBtn = root.querySelector(".book__close");
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      root.hidden = true;
      if (!document.querySelector(".book:not([hidden]), .remind:not([hidden])")) {
        document.body.classList.remove("book-open");
      }
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.querySelectorAll("[" + openAttr + "]").forEach(function (button) {
      button.addEventListener("click", open);
    });
    root.querySelectorAll("[" + closeAttr + "]").forEach(function (button) {
      button.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !root.hidden) close();
    });
    root.openPanel = open;
    root.closePanel = close;
  }

  function setupQuote() {
    var root = document.getElementById("quote");
    if (!root) return;
    var typesEl = document.getElementById("quote-types");
    var form = document.getElementById("quote-form");
    var previews = document.getElementById("quote-previews");
    var errorEl = document.getElementById("quote-error");
    var flow = document.getElementById("quote-flow");
    var done = document.getElementById("quote-done");
    var selected = {};
    var lastFocus = null;

    TYPES.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "quote__type";
      button.textContent = item[1];
      button.dataset.type = item[0];
      button.addEventListener("click", function () {
        selected[item[0]] = !selected[item[0]];
        button.classList.toggle("is-selected", selected[item[0]]);
        button.setAttribute("aria-pressed", selected[item[0]] ? "true" : "false");
        showError("");
      });
      typesEl.appendChild(button);
    });

    document.querySelectorAll("[data-quote-open]").forEach(function (button) {
      button.addEventListener("click", function () {
        reset(button.getAttribute("data-quote-type"));
        lastFocus = document.activeElement;
        root.hidden = false;
        document.body.classList.add("book-open");
        var closeBtn = root.querySelector(".book__close");
        if (closeBtn) closeBtn.focus();
      });
    });
    root.querySelectorAll("[data-quote-close]").forEach(function (button) {
      button.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !root.hidden) close();
    });
    form.elements.photos.addEventListener("change", renderPreviews);
    form.addEventListener("submit", onSubmit);

    function close() {
      root.hidden = true;
      if (!document.querySelector(".book:not([hidden]), .remind:not([hidden])")) {
        document.body.classList.remove("book-open");
      }
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function reset(preferred) {
      selected = {};
      if (preferred) selected[preferred] = true;
      typesEl.querySelectorAll(".quote__type").forEach(function (button) {
        var on = !!selected[button.dataset.type];
        button.classList.toggle("is-selected", on);
        button.setAttribute("aria-pressed", on ? "true" : "false");
      });
      form.reset();
      previews.textContent = "";
      showError("");
      flow.hidden = false;
      done.hidden = true;
    }

    function renderPreviews() {
      previews.textContent = "";
      files().forEach(function (file) {
        var frame = document.createElement("span");
        frame.className = "quote__preview";
        var img = document.createElement("img");
        img.alt = "";
        img.src = URL.createObjectURL(file);
        frame.appendChild(img);
        previews.appendChild(frame);
      });
    }

    function files() {
      return Array.prototype.slice.call(form.elements.photos.files || []).slice(0, 4);
    }

    function chosenLabels() {
      return TYPES.filter(function (item) { return selected[item[0]]; }).map(function (item) { return item[1]; });
    }

    function message(name, phone, area) {
      var lines = [
        "JVGas quote request",
        "Appliances: " + chosenLabels().join(", "),
        "Name: " + name,
        "Phone: " + phone
      ];
      if (area) lines.push("Area: " + area);
      var count = files().length;
      lines.push(count ? "Photos: " + count : "Photos: none yet");
      return lines.join("\n");
    }

    function onSubmit(event) {
      event.preventDefault();
      showError("");
      var labels = chosenLabels();
      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.trim();
      var area = form.elements.area.value.trim();
      var chosenFiles = files();
      if (!labels.length) {
        showError("Choose at least one appliance.");
        return;
      }
      if (!name || !phone) {
        showError("Add a name and a phone number.");
        return;
      }
      if (chosenFiles.some(function (file) { return file.size > 3 * 1024 * 1024; })) {
        showError("Each photo needs to be under 3 MB.");
        return;
      }
      var text = message(name, phone, area);
      send(text, chosenFiles);
    }

    function send(text, chosenFiles) {
      var payload = { text: text };
      if (chosenFiles.length) payload.files = chosenFiles;
      var canShareFiles = false;
      try {
        canShareFiles = !!(navigator.canShare && navigator.share && navigator.canShare(payload));
      } catch (error) {
        canShareFiles = false;
      }
      if (canShareFiles) {
        navigator.share(payload).then(finish).catch(function (error) {
          if (error && error.name === "AbortError") return;
          openWhatsApp(text);
        });
        return;
      }
      openWhatsApp(text);
    }

    function openWhatsApp(text) {
      var url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(text);
      window.open(url, "_blank", "noopener");
      finish();
    }

    function finish() {
      var summary = document.getElementById("quote-summary");
      summary.textContent = chosenLabels().join(", ") + " · " + files().length + " photo" + (files().length === 1 ? "" : "s");
      flow.hidden = true;
      done.hidden = false;
    }

    function showError(message) {
      errorEl.hidden = !message;
      errorEl.textContent = message;
    }
  }
})();
