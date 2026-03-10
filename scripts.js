(() => {
  const root = document.documentElement;

  // -------- Theme (dark mode toggle) --------
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme === "dark" || storedTheme === "light") {
    root.setAttribute("data-theme", storedTheme);
  } else {
    // Follow system by default: do nothing (CSS uses prefers-color-scheme)
    root.removeAttribute("data-theme");
  }

  const themeBtn = document.querySelector("[data-mode-toggle]");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme"); // "dark" | "light" | null
      const next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  // -------- Mobile nav --------
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // close after click
    navLinks.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  }

  // -------- Back to top --------
  const toTopBtn = document.querySelector("[data-to-top]");
  const onScrollTop = () => {
    if (!toTopBtn) return;
    const show = window.scrollY > 650;
    toTopBtn.classList.toggle("show", show);
  };
  window.addEventListener("scroll", onScrollTop, { passive: true });
  onScrollTop();

  if (toTopBtn) {
    toTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // -------- Scroll progress bar --------
  const prog = document.querySelector(".scroll-progress span");
  const updateProgress = () => {
    if (!prog) return;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    prog.style.width = `${pct}%`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // -------- Reveal animations (IntersectionObserver) --------
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) {
    const reveals = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((ent) => {
        if (ent.isIntersecting) {
          ent.target.classList.add("in");
          io.unobserve(ent.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  // -------- Scroll spy --------
  const sections = [...document.querySelectorAll("main section[id]")];
  const navAnchors = [...document.querySelectorAll(".nav-links a[href^='#']")];

  const setActive = (id) => {
    navAnchors.forEach((a) => {
      const match = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("active", match);
    });
  };

  const spy = () => {
    const y = window.scrollY + 120; // header offset
    let current = sections[0]?.id || "home";
    for (const sec of sections) {
      const top = sec.offsetTop;
      if (top <= y) current = sec.id;
    }
    setActive(current);
  };

  window.addEventListener("scroll", spy, { passive: true });
  spy();

  // -------- Tabs (Program) --------
  const tabsRoot = document.querySelector("[data-tabs]");
  if (tabsRoot) {
    const tabs = [...tabsRoot.querySelectorAll("[role='tab']")];
    const panels = [...tabsRoot.querySelectorAll("[role='tabpanel']")];

    const activate = (tab) => {
      tabs.forEach((t) => t.setAttribute("aria-selected", t === tab ? "true" : "false"));
      panels.forEach((p) => (p.hidden = p.id !== tab.getAttribute("aria-controls")));
      tab.focus({ preventScroll: true });
    };

    tabs.forEach((t) => {
      t.addEventListener("click", () => activate(t));
      t.addEventListener("keydown", (e) => {
        const idx = tabs.indexOf(t);
        if (e.key === "ArrowRight") activate(tabs[(idx + 1) % tabs.length]);
        if (e.key === "ArrowLeft") activate(tabs[(idx - 1 + tabs.length) % tabs.length]);
      });
    });
  }


  // -------- Dismissible announcement banner --------
  const announcementBar = document.getElementById("announcementBar");
  const announcementText = document.getElementById("announcementText");
  const announcementTrack = document.getElementById("announcementTrack");
  const announcementClose = document.getElementById("announcementClose");
  const announcementReopen = document.getElementById("announcementReopen");

  const announcementVersion = "2026-general-v1";
  const announcements = [
    "The paper submission portal is now open.",
    "Please use the official IEEE conference paper template before submission.",
    "Review the Important Dates section for submission, notification, and registration deadlines."
  ];

  if (announcementBar && announcementText && announcementTrack && announcementClose && announcementReopen && announcements.length) {
    const storageKey = `icece-announcement-dismissed-${announcementVersion}`;
    const reduceAnnouncementMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rotationDelay = reduceAnnouncementMotion ? 5000 : 7000;
    let messageIndex = 0;
    let rotationTimer = null;

    const renderAnnouncement = () => {
      announcementText.textContent = announcements[messageIndex];

      if (!reduceAnnouncementMotion) {
        announcementTrack.classList.remove("is-animating");
        void announcementTrack.offsetWidth;
        announcementTrack.classList.add("is-animating");
      }
    };

    const stopRotation = () => {
      if (rotationTimer) {
        window.clearInterval(rotationTimer);
        rotationTimer = null;
      }
    };

    const startRotation = () => {
      stopRotation();
      if (announcements.length > 1) {
        rotationTimer = window.setInterval(() => {
          messageIndex = (messageIndex + 1) % announcements.length;
          renderAnnouncement();
        }, rotationDelay);
      }
    };

    const showAnnouncement = () => {
      announcementBar.hidden = false;
      announcementReopen.hidden = true;
      announcementReopen.setAttribute("aria-expanded", "true");
      renderAnnouncement();
      startRotation();
      localStorage.removeItem(storageKey);
    };

    const hideAnnouncement = () => {
      announcementBar.hidden = true;
      announcementReopen.hidden = false;
      announcementReopen.setAttribute("aria-expanded", "false");
      stopRotation();
      localStorage.setItem(storageKey, "1");
    };

    if (localStorage.getItem(storageKey) === "1") {
      hideAnnouncement();
    } else {
      showAnnouncement();
    }

    announcementClose.addEventListener("click", hideAnnouncement);
    announcementReopen.addEventListener("click", showAnnouncement);
  }

  // Contact form -> open user's email client (no backend)
const contact = document.getElementById("contactForm");
if (contact) {
  contact.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = contact.querySelector("input[name='name']")?.value?.trim() || "";
    const email = contact.querySelector("input[name='email']")?.value?.trim() || "";
    const msg = contact.querySelector("textarea[name='message']")?.value?.trim() || "";

    // Build subject/body
    const to = "iceceorg@eee.buet.ac.bd";
    const subject = `ICECE 2026 Inquiry${name ? " — " + name : ""}`;
    const body =
`Hello ICECE Organizing Committee,

${msg || "[Write your message here]"}

—
Name: ${name || "[Your name]"}
Email: ${email || "[Your email]"}`;

    const mailto =
      `mailto:${encodeURIComponent(to)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    // Open default email app
    window.location.href = mailto;
  });
}

})();