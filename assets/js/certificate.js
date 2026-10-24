(function () {
  var params = new URLSearchParams(window.location.search);
  var date = params.get("date") || "";
  var address = params.get("address") || "";
  var record = document.getElementById("cert-record");
  var issue = document.getElementById("cert-issue");

  if (date && address) {
    showRecord(date, address, params.get("name") || "", params.get("ref") || "");
    return;
  }

  var form = document.getElementById("cert-form");
  var errorEl = document.getElementById("cert-error");
  var linkEl = document.getElementById("cert-link");
  var wa = document.getElementById("cert-wa");
  var copyBtn = document.getElementById("cert-copy");
  var readyUrl = "";

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    errorEl.hidden = true;
    var jobDate = form.elements.date.value;
    var jobAddress = form.elements.address.value.trim();
    var name = form.elements.name.value.trim();
    var phone = form.elements.phone.value.trim();
    var ref = form.elements.ref.value.trim();
    if (!jobDate || !jobAddress) {
      errorEl.hidden = false;
      errorEl.textContent = "Add the job date and the address.";
      return;
    }
    var query = new URLSearchParams();
    query.set("date", jobDate);
    query.set("address", jobAddress);
    if (name) query.set("name", name);
    if (ref) query.set("ref", ref);
    readyUrl = new URL("certificate.html?" + query.toString(), window.location.href).href;
    linkEl.hidden = false;
    linkEl.textContent = readyUrl;
    copyBtn.hidden = false;
    var text = [
      "JVGas Certificate of Conformity issued.",
      "Job date: " + formatDate(jobDate),
      "Address: " + jobAddress,
      "SAQCC 5295/R",
      readyUrl
    ].join("\n");
    var digits = waDigits(phone);
    wa.hidden = false;
    wa.href = "https://wa.me/" + (digits || "27721057941") + "?text=" + encodeURIComponent(text);
    wa.textContent = digits ? "Send on WhatsApp" : "Send from Joseph's WhatsApp";
  });

  copyBtn.addEventListener("click", function () {
    if (!readyUrl) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(readyUrl);
    }
    copyBtn.textContent = "Copied";
  });

  function showRecord(jobDate, jobAddress, name, ref) {
    issue.hidden = true;
    record.hidden = false;
    document.getElementById("cert-date").textContent = formatDate(jobDate);
    document.getElementById("cert-address").textContent = jobAddress;
    if (name) {
      document.getElementById("cert-name").textContent = name;
      document.getElementById("cert-name-row").hidden = false;
    }
    if (ref) {
      document.getElementById("cert-ref").textContent = ref;
      document.getElementById("cert-ref-row").hidden = false;
    }
  }

  function formatDate(value) {
    var parts = value.split("-");
    if (parts.length !== 3) return value;
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var month = months[Number(parts[1]) - 1];
    if (!month) return value;
    return Number(parts[2]) + " " + month + " " + parts[0];
  }

  function waDigits(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (digits.charAt(0) === "0") digits = "27" + digits.slice(1);
    if (digits.length < 10) return "";
    return digits;
  }
})();
