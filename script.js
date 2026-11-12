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

  // Every external link opens in a new tab
  document.querySelectorAll('a[href^="http"]').forEach(function (a) {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
  });

  // Resume preview on hover (pointer devices only); click still opens Drive in a new tab
  (function () {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var links = document.querySelectorAll('a[href*="drive.google.com/file/d/"]');
    if (!links.length) return;
    var m = links[0].href.match(/\/file\/d\/([^/]+)/);
    if (!m) return;
    var src = "https://drive.google.com/file/d/" + m[1] + "/preview";
    var pop = document.createElement("div");
    pop.className = "resume-pop";
    pop.setAttribute("aria-hidden", "true");
    pop.innerHTML = '<div class="resume-pop-bar mono"><span>Resume preview</span><span>Click to open ↗</span></div>' +
      '<div class="resume-pop-body"><div class="resume-pop-loading mono">Loading…</div></div>';
    document.body.appendChild(pop);
    var body = pop.querySelector(".resume-pop-body");
    var iframe = null, showT, hideT;

    function place(link) {
      var r = link.getBoundingClientRect();
      var w = pop.offsetWidth, h = pop.offsetHeight, gap = 10;
      var left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12);
      var top = r.bottom + gap;
      if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - gap);
      pop.style.left = left + "px";
      pop.style.top = top + "px";
    }
    function show(link) {
      clearTimeout(hideT);
      showT = setTimeout(function () {
        if (!iframe) {
          iframe = document.createElement("iframe");
          iframe.src = src;
          iframe.title = "Resume preview";
          iframe.loading = "eager";
          iframe.addEventListener("load", function () { pop.classList.add("loaded"); });
          body.appendChild(iframe);
        }
        pop.classList.add("show");
        place(link);
      }, 220);
    }
    function hide() {
      clearTimeout(showT);
      hideT = setTimeout(function () { pop.classList.remove("show"); }, 180);
    }
    links.forEach(function (a) {
      a.addEventListener("mouseenter", function () { show(a); });
      a.addEventListener("mouseleave", hide);
      a.addEventListener("click", function () { pop.classList.remove("show"); });
    });
    pop.addEventListener("mouseenter", function () { clearTimeout(hideT); });
    pop.addEventListener("mouseleave", hide);
    window.addEventListener("scroll", function () { pop.classList.remove("show"); }, { passive: true });
  })();

  // Copy email to clipboard
  document.querySelectorAll(".copy-btn, .copy-email").forEach(function (btn) {
    var label = btn.querySelector(".copy-label") || btn;
    var original = label.textContent;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var text = btn.getAttribute("data-copy");
      function done(ok) {
        label.textContent = ok ? "Copied!" : "Copy failed";
        btn.classList.toggle("done", ok);
        clearTimeout(btn._t);
        btn._t = setTimeout(function () { label.textContent = original; btn.classList.remove("done"); }, 1600);
      }
      function legacyCopy() {
        var ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        return ok;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(legacyCopy()); });
      } else {
        done(legacyCopy());
      }
    });
  });

  // Contact pop-up: pre-filled email draft and LinkedIn note
  (function () {
    var modal = document.getElementById("contact-modal");
    if (!modal || typeof modal.showModal !== "function") return; // old browsers keep plain links

    var TO = "mandal678@gmail.com";
    var PROFILE = "https://www.linkedin.com/in/iamsushank/";
    var NOTE_LIMIT = 200;
    var form = document.getElementById("contact-form");
    var f = form.elements;
    var toast = document.getElementById("modal-toast");
    var count = document.getElementById("li-count");
    var gmail = document.getElementById("send-gmail");
    var roleOnly = form.querySelector(".role-only");

    function val(name) { return (f[name].value || "").trim(); }

    function templates() {
      var name = val("name"), from = val("from"), company = val("company"), role = val("role");
      var reason = f.reason.value;
      var at = company ? " at " + company : "";
      var subject, opener, middle, ask, note;

      if (reason === "role") {
        subject = (role || "Software engineering") + " opportunity" + at;
        opener = "I came across your portfolio and would like to talk with you about " +
          (role ? "the " + role + " role" : "a software engineering role") + at + ".";
        middle = "[A few lines about the role, team, tech stack, location and compensation range]";
        ask = "Would you be open to a quick call this week?";
        note = "Hi Sushank, I'm " + (name || "[your name]") + (company ? " from " + company : "") +
          ". I saw your portfolio and would like to talk about " + (role ? "a " + role + " role" : "an engineering role") + ". Happy to connect!";
      } else if (reason === "freelance") {
        subject = "Project collaboration" + (company ? " with " + company : "");
        opener = "I came across your portfolio and have a project I'd like to discuss with you.";
        middle = "[What you're building, the timeline, and how you'd like Sushank to help]";
        ask = "Would you be up for a short call to talk it through?";
        note = "Hi Sushank, I'm " + (name || "[your name]") + (company ? " from " + company : "") +
          ". I have a project I'd like to discuss with you. Would love to connect!";
      } else {
        subject = "Hello from " + (name || "a visitor to your portfolio");
        opener = "I came across your portfolio and wanted to say hello.";
        middle = "[Your message]";
        ask = "";
        note = "Hi Sushank, I'm " + (name || "[your name]") + (company ? " from " + company : "") +
          ". I enjoyed your portfolio and would love to connect!";
      }

      var sign = [name || "[Your name]", company, from].filter(Boolean).join("\n");
      var body = "Hi Sushank,\n\n" + opener + "\n\n" + middle + "\n\n" + (ask ? ask + "\n\n" : "") +
        (reason === "chat" ? "Cheers,\n" : "Best regards,\n") + sign;
      return { subject: subject, body: body, note: note };
    }

    function refresh() {
      roleOnly.hidden = f.reason.value !== "role";
      var t = templates();
      if (!f.subject.dataset.edited) f.subject.value = t.subject;
      if (!f.body.dataset.edited) f.body.value = t.body;
      if (!f.note.dataset.edited) f.note.value = t.note;
      updateLinks();
    }

    function updateLinks() {
      var s = encodeURIComponent(f.subject.value);
      var b = encodeURIComponent(f.body.value);
      gmail.href = "https://mail.google.com/mail/?view=cm&fs=1&to=" + TO + "&su=" + s + "&body=" + b;
      var n = f.note.value.length;
      count.textContent = n + "/" + NOTE_LIMIT;
      count.classList.toggle("over", n > NOTE_LIMIT);
    }

    function say(msg) {
      toast.textContent = msg;
      clearTimeout(say.t);
      say.t = setTimeout(function () { toast.textContent = ""; }, 3500);
    }

    function copy(text, okMsg, syncFirst) {
      function legacyCopy() {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        modal.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) {}
        modal.removeChild(ta);
        return ok;
      }
      function legacy() {
        say(legacyCopy() ? okMsg : "Couldn't copy automatically. Select the text and copy it.");
      }
      // Copy synchronously when a new tab is about to take focus.
      if (syncFirst && legacyCopy()) { say(okMsg); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { say(okMsg); }, legacy);
      } else {
        legacy();
      }
    }

    function setTab(name) {
      form.querySelectorAll("[data-tab]").forEach(function (b) {
        b.setAttribute("aria-selected", String(b.getAttribute("data-tab") === name));
      });
      document.getElementById("pane-email").hidden = name !== "email";
      document.getElementById("pane-linkedin").hidden = name !== "linkedin";
    }

    function open(tab) {
      setTab(tab || "email");
      refresh();
      modal.showModal();
      document.body.classList.add("modal-open");
      f.name.focus();
    }

    document.querySelectorAll("[data-open-contact]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        open(el.getAttribute("data-open-contact"));
      });
    });

    form.querySelectorAll("[data-tab]").forEach(function (b) {
      b.addEventListener("click", function () { setTab(b.getAttribute("data-tab")); });
    });

    ["name", "from", "company", "role"].forEach(function (n) { f[n].addEventListener("input", refresh); });
    f.reason.addEventListener("change", function () {
      delete f.subject.dataset.edited; delete f.body.dataset.edited; delete f.note.dataset.edited;
      refresh();
    });
    ["subject", "body", "note"].forEach(function (n) {
      f[n].addEventListener("input", function () { f[n].dataset.edited = "1"; updateLinks(); });
    });

    gmail.addEventListener("click", function () { say("Draft opened. Review it and press Send."); });
    document.getElementById("send-linkedin").addEventListener("click", function () {
      copy(f.note.value, "Note copied. On LinkedIn choose Connect, then Add a note, and paste.", true);
      window.open(PROFILE, "_blank", "noopener");
    });

    form.addEventListener("submit", function (e) { e.preventDefault(); });
    modal.querySelector("[data-close]").addEventListener("click", function () { modal.close(); });
    modal.addEventListener("click", function (e) { if (e.target === modal) modal.close(); });
    modal.addEventListener("close", function () { document.body.classList.remove("modal-open"); });
  })();

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
