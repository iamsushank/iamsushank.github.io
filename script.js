(function () {
  var root = document.documentElement;

  try {
    var saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  } catch (e) {}

  // Theme toggle
  document.getElementById("theme-toggle").addEventListener("click", function () {
    var current = root.getAttribute("data-theme");
    if (!current) {
      current = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    var next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  // Mobile menu
  var menuBtn = document.getElementById("menu-toggle");
  var links = document.getElementById("nav-links");
  function setMenu(open) {
    links.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () {
    setMenu(!links.classList.contains("open"));
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") setMenu(false);
  });

  // Copy email to clipboard
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      function done(ok) {
        btn.textContent = ok ? "Copied" : "Press ⌘C";
        btn.classList.toggle("done", ok);
        setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        done(ok);
      }
    });
  });

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  if (!("IntersectionObserver" in window)) return;

  // Reveal on scroll
  root.classList.add("js");
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObs.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  document.querySelectorAll(".reveal").forEach(function (el, i) {
    el.style.transitionDelay = (i % 4) * 60 + "ms";
    revealObs.observe(el);
  });

  // Highlight the nav link for the section in view
  var navMap = {};
  links.querySelectorAll("a").forEach(function (a) { navMap[a.getAttribute("href").slice(1)] = a; });
  var navObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      Object.keys(navMap).forEach(function (id) { navMap[id].classList.remove("active"); });
      var link = navMap[entry.target.id];
      if (link) link.classList.add("active");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  Object.keys(navMap).forEach(function (id) {
    var section = document.getElementById(id);
    if (section) navObs.observe(section);
  });
})();
