(function () {
  var root = document.getElementById("book");
  if (!root) return;

  var WHATSAPP = "27721057941";
  var SLOTS = ["08:00", "09:30", "11:00", "13:00", "14:30", "16:00"];
  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var STORAGE = "jvgas-visits";

  var cal = document.getElementById("book-cal");
  var slotsEl = document.getElementById("book-slots");
  var form = document.getElementById("book-form");
  var errorEl = document.getElementById("book-error");
  var flow = document.getElementById("book-flow");
  var done = document.getElementById("book-done");
  var panel = root.querySelector(".book__panel");

  var today = startOfDay(new Date());
  var maxMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var selectedDate = null;
  var selectedTime = "";
  var lastFocus = null;

  document.querySelectorAll("[data-book-open]").forEach(function (button) {
    button.addEventListener("click", open);
  });
  root.querySelectorAll("[data-book-close]").forEach(function (button) {
    button.addEventListener("click", close);
  });
  document.addEventListener("keydown", function (event) {
    if (root.hidden) return;
    if (event.key === "Escape") close();
  });
  form.addEventListener("submit", onSubmit);
  document.getElementById("book-ics").addEventListener("click", downloadIcs);

  function open() {
    lastFocus = document.activeElement;
    resetFlow();
    root.hidden = false;
    document.body.classList.add("book-open");
    var closeBtn = root.querySelector(".book__close");
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    root.hidden = true;
    document.body.classList.remove("book-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function resetFlow() {
    selectedDate = null;
    selectedTime = "";
    flow.hidden = false;
    done.hidden = true;
    form.hidden = true;
    form.reset();
    showError("");
    view = new Date(today.getFullYear(), today.getMonth(), 1);
    render();
  }

  function render() {
    renderCalendar();
    renderSlots();
    form.hidden = !selectedTime;
  }

  function renderCalendar() {
    cal.textContent = "";
    var head = document.createElement("div");
    head.className = "book__month";
    var prev = document.createElement("button");
    prev.type = "button";
    prev.className = "book__nav";
    prev.textContent = "Prev";
    prev.disabled = view.getTime() <= new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    prev.addEventListener("click", function () {
      view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
      render();
    });
    var label = document.createElement("p");
    label.textContent = MONTHS[view.getMonth()] + " " + view.getFullYear();
    var next = document.createElement("button");
    next.type = "button";
    next.className = "book__nav";
    next.textContent = "Next";
    next.disabled = view.getTime() >= maxMonth.getTime();
    next.addEventListener("click", function () {
      view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
      render();
    });
    head.appendChild(prev);
    head.appendChild(label);
    head.appendChild(next);
    cal.appendChild(head);

    var grid = document.createElement("div");
    grid.className = "book__grid";
    WEEKDAYS.forEach(function (name) {
      var cell = document.createElement("span");
      cell.className = "book__dow";
      cell.textContent = name;
      grid.appendChild(cell);
    });

    var first = new Date(view.getFullYear(), view.getMonth(), 1);
    var count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (var pad = 0; pad < first.getDay(); pad++) {
      var blank = document.createElement("span");
      blank.className = "book__day book__day--empty";
      grid.appendChild(blank);
    }
    for (var day = 1; day <= count; day++) {
      var date = new Date(view.getFullYear(), view.getMonth(), day);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "book__day";
      button.textContent = String(day);
      var closed = date.getDay() === 0;
      var past = date < today;
      button.disabled = closed || past;
      if (sameDay(date, today)) button.classList.add("is-today");
      if (selectedDate && sameDay(date, selectedDate)) {
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      }
      button.setAttribute("aria-label", formatLong(date) + (closed ? ", closed" : ""));
      button.addEventListener("click", function (picked) {
        return function () {
          selectedDate = picked;
          selectedTime = "";
          showError("");
          render();
        };
      }(date));
      grid.appendChild(button);
    }
    cal.appendChild(grid);
  }

  function renderSlots() {
    slotsEl.textContent = "";
    if (!selectedDate) {
      var hint = document.createElement("p");
      hint.className = "book__hint";
      hint.textContent = "Select a day to see open times. Sundays are closed.";
      slotsEl.appendChild(hint);
      return;
    }
    var title = document.createElement("p");
    title.className = "book__hint";
    title.textContent = "Times on " + formatLong(selectedDate);
    slotsEl.appendChild(title);
    var list = document.createElement("div");
    list.className = "book__slotlist";
    SLOTS.forEach(function (time) {
      var taken = isTaken(selectedDate, time);
      var passed = isPastSlot(selectedDate, time);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "book__slot";
      button.textContent = taken ? time + " taken" : time;
      button.disabled = taken || passed;
      if (time === selectedTime) {
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      }
      button.addEventListener("click", function () {
        selectedTime = time;
        showError("");
        render();
        form.hidden = false;
        var name = form.elements.name;
        if (name) name.focus();
      });
      list.appendChild(button);
    });
    slotsEl.appendChild(list);
  }

  function onSubmit(event) {
    event.preventDefault();
    showError("");
    if (!selectedDate || !selectedTime) {
      showError("Choose a day and a time first.");
      return;
    }
    if (isTaken(selectedDate, selectedTime) || isPastSlot(selectedDate, selectedTime)) {
      showError("That time has just gone. Choose another.");
      selectedTime = "";
      render();
      return;
    }
    var name = form.elements.name.value.trim();
    var phone = form.elements.phone.value.trim();
    var note = form.elements.note.value.trim();
    if (!name || !phone) {
      showError("Add a name and a phone number.");
      return;
    }
    var entry = {
      date: iso(selectedDate),
      time: selectedTime,
      name: name,
      phone: phone,
      note: note
    };
    var all = load();
    all.push(entry);
    localStorage.setItem(STORAGE, JSON.stringify(all));
    showDone(entry);
  }

  function showDone(entry) {
    flow.hidden = true;
    done.hidden = false;
    var when = document.getElementById("book-when");
    var who = document.getElementById("book-who");
    when.textContent = formatLong(fromIso(entry.date)) + " at " + entry.time;
    who.textContent = entry.name + (entry.note ? " · " + entry.note : "");
    var message = "JVGas visit: " + when.textContent + ". " + entry.name + ", " + entry.phone + (entry.note ? ". " + entry.note : "");
    var wa = document.getElementById("book-wa");
    wa.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(message);
    done.dataset.date = entry.date;
    done.dataset.time = entry.time;
    done.dataset.note = entry.note || "";
    done.dataset.name = entry.name;
    var ics = document.getElementById("book-ics");
    if (ics) ics.focus();
  }

  function downloadIcs() {
    var date = done.dataset.date;
    var time = done.dataset.time;
    if (!date || !time) return;
    var start = stamp(date, time);
    var end = stamp(date, addMinutes(time, 90));
    var summary = "JVGas site visit";
    var description = "Visit with " + (done.dataset.name || "JVGas") + (done.dataset.note ? ". " + done.dataset.note : "");
    var ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//JVGas//Visit//EN",
      "BEGIN:VEVENT",
      "DTSTART:" + start,
      "DTEND:" + end,
      "SUMMARY:" + summary,
      "DESCRIPTION:" + description.replace(/\n/g, " "),
      "LOCATION:Cape Town",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
    var blob = new Blob([ics], { type: "text/calendar" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "jvgas-visit-" + date + ".ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function showError(message) {
    errorEl.hidden = !message;
    errorEl.textContent = message;
  }

  function load() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function isTaken(date, time) {
    var key = iso(date) + "|" + time;
    return load().some(function (entry) {
      return entry.date + "|" + entry.time === key;
    });
  }

  function isPastSlot(date, time) {
    var parts = time.split(":");
    var when = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number(parts[0]), Number(parts[1]));
    return when.getTime() < Date.now() + 2 * 60 * 60 * 1000;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function sameDay(a, b) {
    return iso(a) === iso(b);
  }

  function iso(date) {
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function fromIso(value) {
    var parts = value.split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function formatLong(date) {
    return WEEKDAYS[date.getDay()] + " " + date.getDate() + " " + MONTHS[date.getMonth()] + " " + date.getFullYear();
  }

  function addMinutes(time, minutes) {
    var parts = time.split(":");
    var total = Number(parts[0]) * 60 + Number(parts[1]) + minutes;
    var hour = String(Math.floor(total / 60)).padStart(2, "0");
    var minute = String(total % 60).padStart(2, "0");
    return hour + ":" + minute;
  }

  function stamp(date, time) {
    return date.replace(/-/g, "") + "T" + time.replace(":", "") + "00";
  }
})();
