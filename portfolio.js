(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = getComputedStyle(document.documentElement);
  const colors = {
    pink: css.getPropertyValue("--pink").trim(),
    cyan: css.getPropertyValue("--cyan").trim(),
    violet: css.getPropertyValue("--violet").trim(),
    lime: css.getPropertyValue("--lime").trim()
  };

  const field = {
    canvas: document.querySelector("#operator-field"),
    order: "FV",
    entropy: 0.38,
    memory: 0.66,
    particles: [],
    pointer: { x: 0, y: 0, active: false },
    time: 0
  };
  field.ctx = field.canvas.getContext("2d");

  function resizeCanvas(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return rect;
  }

  function resetField() {
    const rect = field.canvas.getBoundingClientRect();
    const count = Math.max(90, Math.min(210, Math.round(rect.width * rect.height / 1800)));
    field.particles = Array.from({ length: count }, (_, i) => {
      const angle = i * 2.399963 + Math.random() * .22;
      const radius = 16 + Math.sqrt(i / count) * Math.min(rect.width, rect.height) * .38;
      return {
        x: rect.width * .5 + Math.cos(angle) * radius,
        y: rect.height * .5 + Math.sin(angle) * radius,
        px: rect.width * .5,
        py: rect.height * .5,
        seed: Math.random() * 9,
        hue: i % 3
      };
    });
  }

  function applyF(x, y, cx, cy, p) {
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.hypot(dx, dy) + .001;
    const spin = .006 + field.memory * .018;
    return { x: x + (-dy / r) * (1.5 + field.memory * 2.1) + Math.sin(p.seed + field.time) * spin * r, y: y + (dx / r) * (1.5 + field.memory * 2.1) };
  }

  function applyV(x, y, cx, cy, p) {
    const wave = Math.sin((x + y) * .018 + field.time * 1.8 + p.seed);
    const noise = (Math.sin(p.seed * 8.1 + field.time * 3.1) + Math.cos(p.seed * 3.2 - field.time)) * field.entropy;
    return { x: x + wave * (1.2 + field.entropy * 3.8), y: y + noise * 1.8 + (cy - y) * .0012 };
  }

  function renderField() {
    const rect = field.canvas.getBoundingClientRect();
    const { ctx } = field;
    field.time += reducedMotion ? 0 : .006;
    ctx.fillStyle = "rgba(8,10,15,.12)";
    ctx.fillRect(0, 0, rect.width, rect.height);
    const cx = rect.width * .5 + (field.pointer.active ? (field.pointer.x - rect.width * .5) * .1 : 0);
    const cy = rect.height * .5 + (field.pointer.active ? (field.pointer.y - rect.height * .5) * .1 : 0);

    field.particles.forEach((p) => {
      p.px = p.x; p.py = p.y;
      let next;
      if (field.order === "FV") {
        const f = applyF(p.x, p.y, cx, cy, p);
        next = applyV(f.x, f.y, cx, cy, p);
      } else {
        const v = applyV(p.x, p.y, cx, cy, p);
        next = applyF(v.x, v.y, cx, cy, p);
      }
      p.x = next.x; p.y = next.y;
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d > Math.max(rect.width, rect.height) * .64 || p.x < -30 || p.y < -30 || p.x > rect.width + 30 || p.y > rect.height + 30) {
        const a = p.seed * 3 + field.time;
        p.x = cx + Math.cos(a) * 12;
        p.y = cy + Math.sin(a) * 12;
        p.px = p.x; p.py = p.y;
      }
      const palette = p.hue === 0 ? colors.pink : p.hue === 1 ? colors.cyan : colors.violet;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = palette + (field.order === "FV" ? "aa" : "88");
      ctx.lineWidth = p.hue === 2 ? .7 : 1;
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 4 + field.memory * 5, 0, Math.PI * 2);
    ctx.fillStyle = colors.lime;
    ctx.shadowColor = colors.lime;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (!reducedMotion) requestAnimationFrame(renderField);
  }

  function setupField() {
    resizeCanvas(field.canvas, field.ctx);
    resetField();
    field.canvas.addEventListener("pointermove", (event) => {
      const rect = field.canvas.getBoundingClientRect();
      field.pointer.x = event.clientX - rect.left;
      field.pointer.y = event.clientY - rect.top;
      field.pointer.active = true;
    });
    field.canvas.addEventListener("pointerleave", () => { field.pointer.active = false; });
    document.querySelectorAll(".order-button").forEach((button) => {
      button.addEventListener("click", () => {
        field.order = button.dataset.order;
        document.querySelectorAll(".order-button").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        document.querySelector("#commutator-value").textContent = field.order === "FV" ? "0.62" : "0.79";
        resetField();
      });
    });
    [["entropy", "entropy-output"], ["memory", "memory-output"]].forEach(([id, outputId]) => {
      const input = document.querySelector(`#${id}`);
      input.addEventListener("input", () => {
        field[id] = Number(input.value);
        document.querySelector(`#${outputId}`).textContent = Number(input.value).toFixed(2);
      });
    });
    document.querySelector("#field-reset").addEventListener("click", resetField);
    if (reducedMotion) renderField(); else requestAnimationFrame(renderField);
  }

  const pathCanvas = document.querySelector("#path-canvas");
  const pathCtx = pathCanvas.getContext("2d");
  let experimentProgress = 1;
  let experimentFrame = 0;

  function bezierPoint(points, t) {
    const [p0, p1, p2, p3] = points;
    const u = 1 - t;
    return {
      x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
      y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y
    };
  }

  function drawPath(points, progress, color, width) {
    pathCtx.beginPath();
    for (let i = 0; i <= 120 * progress; i += 1) {
      const p = bezierPoint(points, i / 120);
      if (i === 0) pathCtx.moveTo(p.x, p.y); else pathCtx.lineTo(p.x, p.y);
    }
    pathCtx.strokeStyle = color;
    pathCtx.lineWidth = width;
    pathCtx.shadowColor = color;
    pathCtx.shadowBlur = 14;
    pathCtx.stroke();
    pathCtx.shadowBlur = 0;
  }

  function renderPaths() {
    const rect = pathCanvas.getBoundingClientRect();
    resizeCanvas(pathCanvas, pathCtx);
    pathCtx.clearRect(0, 0, rect.width, rect.height);
    const present = { x: rect.width * .5, y: rect.height * .52 };
    const start = { x: rect.width * .08, y: rect.height * .5 };
    const endPink = { x: rect.width * .92, y: rect.height * .22 };
    const endCyan = { x: rect.width * .92, y: rect.height * .78 };
    const pinkA = [start, { x: rect.width * .22, y: rect.height * .08 }, { x: rect.width * .38, y: rect.height * .72 }, present];
    const cyanA = [start, { x: rect.width * .2, y: rect.height * .88 }, { x: rect.width * .42, y: rect.height * .28 }, present];
    const pinkB = [present, { x: rect.width * .68, y: rect.height * .45 }, { x: rect.width * .74, y: rect.height * .08 }, endPink];
    const cyanB = [present, { x: rect.width * .66, y: rect.height * .58 }, { x: rect.width * .8, y: rect.height * .88 }, endCyan];
    const p1 = Math.min(1, experimentProgress * 2);
    const p2 = Math.max(0, experimentProgress * 2 - 1);
    drawPath(pinkA, p1, colors.pink, 2.2);
    drawPath(cyanA, p1, colors.cyan, 2.2);
    if (p2 > 0) {
      drawPath(pinkB, p2, colors.pink, 3);
      drawPath(cyanB, p2, colors.cyan, 3);
    }
    pathCtx.beginPath(); pathCtx.arc(start.x, start.y, 5, 0, Math.PI * 2); pathCtx.fillStyle = "#fff"; pathCtx.fill();
    if (p1 >= 1) {
      pathCtx.beginPath(); pathCtx.arc(present.x, present.y, 7, 0, Math.PI * 2); pathCtx.fillStyle = "#fff"; pathCtx.shadowColor = "#fff"; pathCtx.shadowBlur = 18; pathCtx.fill(); pathCtx.shadowBlur = 0;
    }
    pathCtx.fillStyle = "rgba(255,255,255,.5)";
    pathCtx.font = "11px SFMono-Regular, Consolas, monospace";
    pathCtx.fillText("SAME INITIAL STATE", start.x, start.y - 16);
    if (p1 >= 1) pathCtx.fillText("MATCHED PRESENT", present.x - 48, present.y - 18);
    if (p2 >= .98) {
      pathCtx.fillStyle = colors.pink; pathCtx.fillText("FUTURE A", endPink.x - 62, endPink.y - 14);
      pathCtx.fillStyle = colors.cyan; pathCtx.fillText("FUTURE B", endCyan.x - 62, endCyan.y + 24);
    }
  }

  function animateExperiment() {
    experimentProgress = Math.min(1, experimentProgress + .008);
    const past = Math.min(1, experimentProgress * 2);
    const future = Math.max(0, experimentProgress * 2 - 1);
    document.querySelector("#divergence-readout").textContent = (Math.sin(past * Math.PI) * .842).toFixed(3);
    document.querySelector("#response-readout").textContent = (future * .617).toFixed(3);
    renderPaths();
    if (experimentProgress < 1) experimentFrame = requestAnimationFrame(animateExperiment);
  }

  document.querySelector("#run-experiment").addEventListener("click", () => {
    cancelAnimationFrame(experimentFrame);
    experimentProgress = 0;
    animateExperiment();
  });

  document.querySelector("#copy-code").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const text = document.querySelector("#xc-code").innerText;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = "Copy"; }, 1600);
    } catch (_) {
      button.textContent = "Select code";
    }
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas(field.canvas, field.ctx);
      resetField();
      renderPaths();
    }, 120);
  });

  document.querySelector("#year").textContent = new Date().getFullYear();
  setupField();
  renderPaths();
})();
