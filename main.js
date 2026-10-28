(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  $("#yr").textContent = new Date().getFullYear();

  /* ---------- Smooth scroll (Lenis, as on the Vikings site) ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }
  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -70 });
    else (typeof target === "number" ? window.scrollTo({ top: target, behavior: "smooth" }) : target.scrollIntoView({ behavior: "smooth" }));
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const el = id === "#top" ? 0 : $(id);
      if (el === null) return;
      e.preventDefault();
      toggleMenu(false);
      scrollToTarget(el);
    });
  });

  /* ---------- Scroll reveals (framer whileInView, once) ---------- */
  // Children of [data-stagger] get delay = index * 0.1s, like Nibras' delay: i * .1
  $$("[data-stagger]").forEach((group) => {
    [...group.children].forEach((child, i) => child.style.setProperty("--d", `${i * 0.1}s`));
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
        if (e.target.classList.contains("count")) runCount(e.target);
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".fu, .pop, .bar, .count").forEach((el) => io.observe(el));

  function runCount(el) {
    const to = parseFloat(el.dataset.to);
    const dec = parseInt(el.dataset.dec || "0", 10);
    if (reduced) return (el.textContent = to.toFixed(dec));
    const t0 = performance.now();
    const dur = 1800;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Typewriter word (Nibras typing effect) ---------- */
  const typeEl = $("#typeWord");
  const words = ["Beast", "Champion", "Legend", "Titan"];
  if (!reduced) {
    let w = 0, i = words[0].length, deleting = true;
    const tick = () => {
      const word = words[w];
      if (deleting) {
        i--;
        typeEl.textContent = word.slice(0, i);
        if (i === 0) { deleting = false; w = (w + 1) % words.length; }
        setTimeout(tick, 60);
      } else {
        const next = words[w];
        i++;
        typeEl.textContent = next.slice(0, i);
        if (i === next.length) { deleting = true; setTimeout(tick, 2200); }
        else setTimeout(tick, 110);
      }
    };
    setTimeout(tick, 2600);
  }

  /* ---------- Hero crossfade slideshow ---------- */
  const slides = $$("#heroSlides img");
  const dots = $$("#heroDots i");
  let slide = 0;
  if (!reduced) {
    setInterval(() => {
      slides[slide].classList.remove("is-active");
      dots[slide].classList.remove("is-active");
      slide = (slide + 1) % slides.length;
      slides[slide].classList.add("is-active");
      dots[slide].classList.add("is-active");
    }, 5000);
  }

  /* ---------- Header ---------- */
  const header = $("#header");
  const totop = $("#totop");
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 30);
    totop.classList.toggle("show", y > 700);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  totop.addEventListener("click", () => scrollToTarget(0));

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const menu = $("#menu");
  function toggleMenu(open) {
    menu.classList.toggle("open", open);
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-hidden", !open);
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", () => toggleMenu(!menu.classList.contains("open")));

  /* ---------- Active nav link ---------- */
  const navLinks = $$(".nav a");
  const navIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  navLinks.forEach((a) => { const s = $(a.getAttribute("href")); if (s) navIO.observe(s); });

  /* ---------- Zones carousel: autoplay, arrows, progress ---------- */
  const car = $("#zoneCarousel");
  const cards = $$(".zcard", car);
  const bar = $("#zoneProgress");
  const pauseBtn = $("#zonePause");
  let playing = !reduced;
  let timer = null;

  const cardStep = () => cards[0].getBoundingClientRect().width + 16;
  const updateProgress = () => {
    const max = car.scrollWidth - car.clientWidth;
    const p = max > 0 ? car.scrollLeft / max : 1;
    bar.style.width = `${Math.max(1 / cards.length, p) * 100}%`;
  };
  const go = (dir) => {
    const max = car.scrollWidth - car.clientWidth;
    if (dir > 0 && car.scrollLeft >= max - 4) car.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir < 0 && car.scrollLeft <= 4) car.scrollTo({ left: max, behavior: "smooth" });
    else car.scrollBy({ left: dir * cardStep(), behavior: "smooth" });
  };
  const restart = () => {
    clearInterval(timer);
    if (playing) timer = setInterval(() => go(1), 3500);
  };
  const setPlaying = (on) => {
    playing = on;
    pauseBtn.innerHTML = on
      ? '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    pauseBtn.setAttribute("aria-label", on ? "Pause autoplay" : "Play autoplay");
    restart();
  };
  $("#zoneNext").addEventListener("click", () => { go(1); restart(); });
  $("#zonePrev").addEventListener("click", () => { go(-1); restart(); });
  pauseBtn.addEventListener("click", () => setPlaying(!playing));
  car.addEventListener("scroll", updateProgress, { passive: true });
  car.addEventListener("mouseenter", () => clearInterval(timer));
  car.addEventListener("mouseleave", restart);
  updateProgress();
  // Only autoplay while the carousel is on screen
  new IntersectionObserver(([e]) => (e.isIntersecting ? restart() : clearInterval(timer))).observe(car);

  /* ---------- Coverflow gallery (John Reed club carousel) ---------- */
  const cflow = $("#cflow");
  const cfItems = $$(".cflow__item", cflow);
  let cfIndex = 0;
  let cfTimer = null;
  const renderFlow = () => {
    const n = cfItems.length;
    const mobile = window.innerWidth < 600;
    cfItems.forEach((item, i) => {
      // shortest circular distance from the centre card
      let o = i - cfIndex;
      if (o > n / 2) o -= n;
      if (o < -n / 2) o += n;
      const a = Math.abs(o);
      const x = o * (mobile ? 58 : 64);
      item.style.transform = `translate(-50%, -50%) translateX(${x}%) translateZ(${-a * 180}px) rotateY(${-o * 14}deg)`;
      item.style.zIndex = 10 - a;
      item.style.opacity = a > 2 ? 0 : 1;
      item.style.pointerEvents = a > 2 ? "none" : "auto";
      item.classList.toggle("is-center", o === 0);
    });
  };
  const flowTo = (i) => {
    cfIndex = (i + cfItems.length) % cfItems.length;
    renderFlow();
  };
  const flowAuto = () => {
    clearInterval(cfTimer);
    if (!reduced) cfTimer = setInterval(() => flowTo(cfIndex + 1), 4000);
  };
  cfItems.forEach((item, i) => item.addEventListener("click", () => { flowTo(i); flowAuto(); }));
  $("#cfPrev").addEventListener("click", () => { flowTo(cfIndex - 1); flowAuto(); });
  $("#cfNext").addEventListener("click", () => { flowTo(cfIndex + 1); flowAuto(); });
  let touchX = null;
  cflow.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  cflow.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) { flowTo(cfIndex + (dx < 0 ? 1 : -1)); flowAuto(); }
    touchX = null;
  });
  cflow.addEventListener("mouseenter", () => clearInterval(cfTimer));
  cflow.addEventListener("mouseleave", flowAuto);
  window.addEventListener("resize", renderFlow);
  renderFlow();
  new IntersectionObserver(([e]) => (e.isIntersecting ? flowAuto() : clearInterval(cfTimer))).observe(cflow);

  /* ---------- Enquire speed-dial ---------- */
  const enq = $("#enq");
  const enqBtn = $("#enqBtn");
  const enqBackdrop = $("#enqBackdrop");
  const setEnq = (open) => {
    enq.classList.toggle("open", open);
    enqBackdrop.classList.toggle("show", open);
    enqBtn.setAttribute("aria-expanded", open);
  };
  enqBtn.addEventListener("click", () => setEnq(!enq.classList.contains("open")));
  enqBackdrop.addEventListener("click", () => setEnq(false));
  $$(".enq__opt").forEach((a) => a.addEventListener("click", () => setEnq(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setEnq(false); });

  /* ---------- FAQ accordion (one open at a time) ---------- */
  $$(".acc__item").forEach((item) => {
    $(".acc__q", item).addEventListener("click", () => {
      const open = item.classList.contains("is-open");
      $$(".acc__item.is-open").forEach((o) => o.classList.remove("is-open"));
      if (!open) item.classList.add("is-open");
    });
  });

  /* ---------- BMI ---------- */
  $("#bmiForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const h = parseFloat($("#h").value) / 100;
    const w = parseFloat($("#w").value);
    if (!h || !w) return;
    const bmi = w / (h * h);
    const cats = [
      [18.5, "Underweight. A strength and weight-gain plan can help."],
      [25, "Healthy range. Keep building strength and stamina."],
      [30, "Overweight. Our weight-loss program is a great start."],
      [Infinity, "Obese. Talk to a trainer about a safe, steady plan."],
    ];
    $("#bmiCat").textContent = cats.find(([max]) => bmi < max)[1];
    const out = $("#bmiVal");
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 900);
      out.textContent = (bmi * (1 - Math.pow(1 - p, 3))).toFixed(1);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    // Meter spans BMI 12 → 40; segment stops in CSS match 18.5 / 25 / 30
    const pin = $("#bmiPin");
    pin.style.left = `${Math.min(100, Math.max(0, ((bmi - 12) / 28) * 100))}%`;
    pin.classList.add("on");
  });
})();
