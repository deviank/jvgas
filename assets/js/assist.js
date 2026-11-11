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
    var sendBtn = form.querySelector("button[type='submit']");
    if (sendBtn) {
      sendBtn.addEventListener("click", function (event) {
        event.preventDefault();
        beginSend();
      });
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      beginSend();
    });

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
      picked = [];
      previews.textContent = "";
      updateAddButton();
      showError("");
      flow.hidden = false;
      done.hidden = true;
    }

    var MAX_BYTES = 10 * 1024 * 1024;
    var picked = [];
    var addBtn = document.getElementById("quote-add");

    form.elements.photos.addEventListener("change", onFilesChosen);
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        form.elements.photos.click();
      });
    }

    function isVideo(file) {
      return file.type.indexOf("video/") === 0;
    }

    function mediaCounts(list) {
      var photos = 0;
      var videos = 0;
      list.forEach(function (file) {
        if (isVideo(file)) videos += 1;
        else photos += 1;
      });
      return { photos: photos, videos: videos };
    }

    function mediaLine(counts) {
      var parts = [];
      if (counts.photos) parts.push(counts.photos + " photo" + (counts.photos === 1 ? "" : "s"));
      if (counts.videos) parts.push(counts.videos + " video" + (counts.videos === 1 ? "" : "s"));
      return parts.join(" · ");
    }

    function onFilesChosen() {
      var incoming = Array.prototype.slice.call(form.elements.photos.files || []);
      incoming.forEach(function (file) {
        if (picked.length >= 4) return;
        var same = picked.some(function (have) {
          return have.name === file.name && have.size === file.size && have.lastModified === file.lastModified;
        });
        if (!same) picked.push(file);
      });
      form.elements.photos.value = "";
      renderPreviews();
    }

    function updateAddButton() {
      if (!addBtn) return;
      var count = picked.length;
      addBtn.hidden = count >= 4;
      addBtn.textContent = count ? "Add another" : "Add a photo or video";
    }

    function renderPreviews() {
      previews.textContent = "";
      files().forEach(function (file, index) {
        var frame = document.createElement("span");
        frame.className = "quote__preview";
        var url = URL.createObjectURL(file);
        if (isVideo(file)) {
          var video = document.createElement("video");
          video.muted = true;
          video.defaultMuted = true;
          video.playsInline = true;
          video.setAttribute("muted", "");
          video.src = url;
          frame.appendChild(video);
        } else {
          var img = document.createElement("img");
          img.alt = "";
          img.src = url;
          frame.appendChild(img);
        }
        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "quote__remove";
        remove.setAttribute("aria-label", "Remove " + file.name);
        remove.textContent = "×";
        remove.addEventListener("click", function () {
          picked.splice(index, 1);
          renderPreviews();
        });
        frame.appendChild(remove);
        previews.appendChild(frame);
      });
      updateAddButton();
    }

    function files() {
      return picked.slice(0, 4);
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
      var counts = mediaCounts(files());
      if (!counts.photos && !counts.videos) {
        lines.push("Photos: none yet");
      } else {
        lines.push("Photos: " + counts.photos);
        if (counts.videos) lines.push("Video: " + counts.videos);
      }
      return lines.join("\n");
    }

    function beginSend() {
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
      if (chosenFiles.some(function (file) { return file.size > MAX_BYTES; })) {
        showError("Each file needs to be under 10 MB.");
        return;
      }
      send(message(name, phone, area), chosenFiles);
    }

    function asShareFile(file) {
      var type = file.type || "";
      if (type.indexOf("image/") === 0 || type.indexOf("video/") === 0) return file;
      var name = file.name || "photo.jpg";
      var lower = name.toLowerCase();
      var next = "image/jpeg";
      if (/\.(mp4|mov|m4v|webm)$/.test(lower)) next = "video/mp4";
      else if (/\.png$/.test(lower)) next = "image/png";
      else if (/\.gif$/.test(lower)) next = "image/gif";
      else if (/\.webp$/.test(lower)) next = "image/webp";
      else if (!/\.jpe?g$/.test(lower)) name = name.replace(/\.[^.]+$/, "") + ".jpg";
      try {
        return new File([file], name, { type: next, lastModified: file.lastModified });
      } catch (error) {
        return file;
      }
    }

    function canShare(payload) {
      if (!navigator.canShare) return true;
      try {
        return navigator.canShare(payload);
      } catch (error) {
        return false;
      }
    }

    function send(text, chosenFiles) {
      if (!chosenFiles.length) {
        openWhatsApp(text);
        return;
      }
      if (typeof navigator.share !== "function") {
        showError("Open this page on your phone and tap Send to Joseph. Choose WhatsApp in the share sheet so the photos are attached.");
        return;
      }
      var ready = chosenFiles.map(asShareFile);
      var withText = { files: ready, text: text };
      var filesOnly = { files: ready };
      var payload = canShare(withText) ? withText : (canShare(filesOnly) ? filesOnly : withText);
      var includeText = !!payload.text;
      function afterShare() {
        if (!includeText) openWhatsApp(text);
        else finish();
      }
      function failed(error) {
        if (error && error.name === "AbortError") return;
        showError("The photos are on the form. Tap Send to Joseph again and choose WhatsApp in the share sheet.");
      }
      try {
        var pending = navigator.share(payload);
        if (!pending || !pending.then) throw new Error("share");
        pending.then(afterShare).catch(function (error) {
          if (error && error.name === "AbortError") return;
          if (!includeText) {
            failed(error);
            return;
          }
          try {
            includeText = false;
            navigator.share(filesOnly).then(afterShare).catch(failed);
          } catch (second) {
            failed(second);
          }
        });
      } catch (error) {
        if (error && error.name === "AbortError") return;
        if (!includeText) {
          failed(error);
          return;
        }
        try {
          includeText = false;
          navigator.share(filesOnly).then(afterShare).catch(failed);
        } catch (second) {
          failed(second);
        }
      }
    }

    function openWhatsApp(text) {
      var url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(text);
      window.open(url, "_blank", "noopener");
      finish();
    }

    function finish() {
      var summary = document.getElementById("quote-summary");
      var detail = mediaLine(mediaCounts(files())) || "0 photos";
      summary.textContent = chosenLabels().join(", ") + " · " + detail;
      flow.hidden = true;
      done.hidden = false;
    }

    function showError(message) {
      errorEl.hidden = !message;
      errorEl.textContent = message;
    }
  }
})();
