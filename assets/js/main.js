(function () {
  var nav = document.getElementById("nav");
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("nav-menu");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desktopNav = window.matchMedia("(min-width: 735px)");

  function setMenu(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(!nav.classList.contains("is-open"));
    });
  }

  if (menu) {
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });

  if (desktopNav.addEventListener) {
    desktopNav.addEventListener("change", function (event) {
      if (event.matches) setMenu(false);
    });
  }

  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion) {
    reveals.forEach(function (el) {
      el.classList.add("is-in");
    });
    return;
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  var heroImg = document.querySelector(".hero__image");
  var heroCopy = document.querySelector(".hero__copy");
  var heroVeil = document.querySelector(".hero__veil");
  var heroGlow = document.querySelector(".hero__glow");
  var pin = document.querySelector(".pin");
  var pinImg = document.querySelector(".pin__image");
  var pinCopy = document.querySelector(".pin__copy");
  var layers = document.querySelectorAll("[data-speed]");
  var ticking = false;

  function intensity() {
    if (window.matchMedia("(pointer: coarse)").matches) return 0.45;
    if (window.innerWidth < 735) return 0.55;
    if (window.innerWidth < 1025) return 0.75;
    return 1;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var force = intensity();
    var compact = window.innerWidth < 735;

    if (heroImg) {
      var shift = y * (compact ? 0.22 : 0.38) * force;
      var scale = 1.08 + Math.min(y / (vh * 4), 0.08);
      heroImg.style.transform = "translate3d(0," + shift + "px,0) scale(" + scale + ")";
    }

    if (heroCopy) {
      if (compact) {
        heroCopy.style.transform = "";
        heroCopy.style.opacity = "";
      } else {
        var fade = Math.max(0, 1 - y / (vh * 0.72));
        heroCopy.style.transform = "translate3d(0," + y * 0.22 * force + "px,0)";
        heroCopy.style.opacity = String(fade);
      }
    }

    if (heroVeil && !compact) {
      heroVeil.style.opacity = String(Math.min(1, 0.85 + y / (vh * 1.6)));
    }

    if (heroGlow) {
      heroGlow.style.transform =
        "translate3d(-50%," + y * -0.08 * force + "px,0)";
    }

    if (pin && pinImg) {
      var pinRect = pin.getBoundingClientRect();
      var travel = Math.max(pin.offsetHeight - vh, 1);
      var progress = Math.min(1, Math.max(0, -pinRect.top / travel));
      pinImg.style.transform =
        "translate3d(0," + progress * -80 * force + "px,0) scale(" + (compact ? 1.08 : 1.14) + ")";
      if (pinCopy) {
        pinCopy.style.transform =
          "translate3d(0," + progress * 36 * force + "px,0)";
        pinCopy.style.opacity = String(1 - progress * 0.35);
      }
    }

    for (var i = 0; i < layers.length; i++) {
      var el = layers[i];
      var parent = el.parentElement;
      if (!parent) continue;
      var box = parent.getBoundingClientRect();
      var speed = parseFloat(el.getAttribute("data-speed")) || 0.2;
      var p = (vh - box.top) / (vh + box.height);
      var offset = (p - 0.5) * (compact ? 72 : 140) * speed * force;
      el.style.transform = "translate3d(0," + offset + "px,0)";
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("orientationchange", function () {
    setMenu(false);
    onScroll();
  });
  update();
})();
