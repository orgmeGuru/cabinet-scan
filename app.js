/* Cabinet Scan landing — progressive enhancement only.
   The page is fully readable with JS disabled; this just adds motion. */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* `.reveal-on` / `.anim-ready` are set by the inline <head> script before
     first paint. Re-assert here in case that didn't run (and motion is fine). */
  if (!reduce) root.classList.add("anim-ready", "reveal-on");

  /* ---- sticky header + scroll progress -------------------------------- */
  var header = document.getElementById("siteHeader");
  var bar = document.getElementById("progressBar");
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle("scrolled", y > 8);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (reduce || !("IntersectionObserver" in window)) {
    document.querySelectorAll("[data-reveal], .mock-graph, .mock-chat")
      .forEach(function (el) { el.classList.add("is-visible"); });
    runCounts(document);
    return;
  }

  /* ---- scroll reveal ------------------------------------------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-visible");
      runCounts(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll("[data-reveal], .mock-graph, .mock-chat")
    .forEach(function (el) { io.observe(el); });

  /* ---- count-up ---------------------------------------------------- */
  function runCounts(scope) {
    scope.querySelectorAll("[data-count], .tick[data-to]").forEach(function (el) {
      if (el._counted) return;
      el._counted = true;
      var to = parseFloat(el.getAttribute("data-count") || el.getAttribute("data-to"));
      var from = parseFloat(el.getAttribute("data-from") || "0");
      if (isNaN(to)) return;
      var start = performance.now(), dur = 1100;
      (function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(from + (to - from) * eased).toString();
        if (t < 1) requestAnimationFrame(step);
      })(start);
    });
  }

  /* ---- pointer spotlight on cards --------------------------------- */
  var spotEls = document.querySelectorAll(".card, .priv, .steps li");
  window.addEventListener("pointermove", function (ev) {
    for (var i = 0; i < spotEls.length; i++) {
      var el = spotEls[i], r = el.getBoundingClientRect();
      if (ev.clientX < r.left - 40 || ev.clientX > r.right + 40 ||
          ev.clientY < r.top - 40 || ev.clientY > r.bottom + 40) continue;
      el.style.setProperty("--mx", ((ev.clientX - r.left) / r.width) * 100 + "%");
      el.style.setProperty("--my", ((ev.clientY - r.top) / r.height) * 100 + "%");
    }
  }, { passive: true });

  /* ---- hero pointer parallax ------------------------------------- */
  var hero = document.querySelector(".hero");
  var phone = document.getElementById("heroPhone");
  var ghosts = document.querySelector(".hero-ghosts");
  if (hero && phone && window.matchMedia("(pointer:fine)").matches) {
    hero.addEventListener("pointermove", function (ev) {
      var r = hero.getBoundingClientRect();
      var px = (ev.clientX - r.left) / r.width - 0.5;
      var py = (ev.clientY - r.top) / r.height - 0.5;
      phone.style.setProperty("--px", px.toFixed(3));
      phone.style.setProperty("--py", py.toFixed(3));
      if (ghosts) {
        ghosts.style.setProperty("--px", px.toFixed(3));
        ghosts.style.setProperty("--py", py.toFixed(3));
      }
    }, { passive: true });
    hero.addEventListener("pointerleave", function () {
      phone.style.setProperty("--px", 0); phone.style.setProperty("--py", 0);
      if (ghosts) { ghosts.style.setProperty("--px", 0); ghosts.style.setProperty("--py", 0); }
    });
  }

  /* ---- feature visuals: gentle scroll parallax ------------------ */
  var visuals = [].slice.call(document.querySelectorAll(".feature-visual .card"));
  var ticking = false;
  function parallax() {
    var vh = window.innerHeight;
    visuals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var center = r.top + r.height / 2;
      var off = (center - vh / 2) / vh;               // -0.5 .. 0.5-ish
      el.style.setProperty("--sy", Math.round(Math.max(-1, Math.min(1, off)) * -12) + "px");
    });
    ticking = false;
  }
  if (visuals.length) {
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
    }, { passive: true });
    parallax();
  }

  /* ---- scrollspy nav ------------------------------------------- */
  var links = [].slice.call(document.querySelectorAll(".site-nav a"));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);
  if (sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }
})();
