const STORAGE_KEY = "riso-club-v1";

const TEMPLATES = {
  cut: {
    label: "Cut & paste",
    pieces: ["cut-photo", "cut-block", "cut-bar", "cut-tape"]
  },
  halo: {
    label: "Halftone halo",
    pieces: ["halo-circle", "halo-ring"]
  },
  columns: {
    label: "Column riot",
    pieces: ["col-strip", "col-block"]
  },
  big: {
    label: "Big type",
    pieces: ["big-block", "big-bar", "big-dot"]
  }
};

const INKS = {
  pinkblue: { label: "Pink over blue", short: "two inks" },
  bluepink: { label: "Blue over pink", short: "two inks" },
  pink: { label: "Pink only", short: "one ink" },
  blue: { label: "Blue only", short: "one ink" }
};

const CONTENT = [
  {
    kicker: "Note from the table",
    title: "Make it badly",
    body: "The photocopier does not care about your proportions. Neither do we. Cut the words out, move them two centimetres left, and let the toner finish the sentence."
  },
  {
    kicker: "Field notes",
    title: "Things found on a walk",
    body: "A glove with no partner. A receipt for one lemon. Three blues in a puddle. The corner shop cat, mid-stretch, refusing to move. We came back with a zine instead of groceries."
  },
  {
    kicker: "Instructions",
    title: "How to copy a feeling",
    body: "Set the drum to pink. Lay your hand flat on the glass. Press hard. The warm hum is part of the image. Do not correct the crooked edge; that is where the feeling got in."
  },
  {
    kicker: "Recipe",
    title: "Toast for a bad day",
    body: "Bread, butter, too much salt. Put the plate on the windowsill and watch the rain do its slow typing. Eat standing up. A second slice is recommended by the management."
  },
  {
    kicker: "Interview",
    title: "The corner shop speaks",
    body: "We asked what sells best after midnight. 'Ice cream,' said the man behind the counter. 'And batteries. People always need one thing to keep the other thing going.' He let us photocopy our hands for free."
  },
  {
    kicker: "Repair manual",
    title: "Small fixes, slowly",
    body: "Sew the button back on. Glue the broken cup and use it for pens. Rewrite the sentence until it stops apologising. None of these are permanent, which is the point. A thing can be mended and still show where it broke."
  },
  {
    kicker: "Post",
    title: "Letters to nobody",
    body: "Dear you, I saw a dog wearing a raincoat and thought of our unfinished argument. The dog looked fine. I hope you are also fine, and a little ridiculous. No reply needed."
  },
  {
    kicker: "Useful mistakes",
    title: "A page of wrong answers",
    body: "Fold against the grain. Print the cover upside down. Leave the staple half open. Type the wrong word and underline it twice. Somewhere in the margin, a better idea is waiting for you to stop being careful."
  },
  {
    kicker: "Diary",
    title: "Sunday, four o'clock",
    body: "The light goes peach. Someone is practising scales two floors down. The kettle clicks off and nobody gets up. This is the whole event. We are including it because it happened, and because it was enough."
  },
  {
    kicker: "List",
    title: "Twelve small thrills",
    body: "A fresh pen. The last of the tape. Finding money in a coat. The photocopier finishing exactly on time. A stranger's good playlist. Being early. Being late and forgiven, once. A zine that fits in your back pocket."
  },
  {
    kicker: "End matter",
    title: "The end, sort of",
    body: "Every zine is a rumour that got printed. Pass this one on, leave it on a bus, or keep it in a drawer until the ink goes strange. There is no correct ending. Fold the corner and start again."
  }
];

const DEFAULTS = {
  title: "RISO CLUB",
  subtitle: "a zine about small things, badly photocopied",
  template: "cut",
  ink: "pinkblue",
  pageCount: 8,
  mis: 3,
  page: 0,
  edits: {}
};

function loadState() {
  const fallback = Object.assign({}, DEFAULTS, { edits: {} });
  let saved;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    saved = JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
  if (!saved || typeof saved !== "object") return fallback;

  const next = Object.assign({}, DEFAULTS, { edits: {} });
  if (typeof saved.title === "string") next.title = saved.title.slice(0, 34);
  if (typeof saved.subtitle === "string") next.subtitle = saved.subtitle.slice(0, 72);
  if (TEMPLATES[saved.template]) next.template = saved.template;
  if (INKS[saved.ink]) next.ink = saved.ink;

  const count = Number(saved.pageCount);
  if (Number.isFinite(count)) {
    next.pageCount = Math.max(4, Math.min(12, Math.round(count / 2) * 2));
  }

  const mis = Number(saved.mis);
  if (Number.isFinite(mis)) {
    next.mis = Math.max(0, Math.min(8, Math.round(mis)));
  }

  const page = Number(saved.page);
  if (Number.isFinite(page)) {
    next.page = Math.max(0, Math.min(next.pageCount - 1, Math.round(page)));
  }

  if (saved.edits && typeof saved.edits === "object") {
    Object.keys(saved.edits).forEach(function (key) {
      const value = saved.edits[key];
      if (typeof value === "string") next.edits[key] = value.slice(0, 600);
    });
  }

  return next;
}

let state = loadState();
let lastFocus = null;

function byId(id) {
  return document.getElementById(id);
}

const els = {
  title: byId("cover-title"),
  subtitle: byId("cover-subtitle"),
  templateGrid: byId("template-grid"),
  inkGrid: byId("ink-grid"),
  pageCount: byId("page-count"),
  misregistration: byId("misregistration"),
  pagesValue: byId("pages-value"),
  misValue: byId("mis-value"),
  preview: byId("preview"),
  print: byId("print"),
  prev: byId("prev-page"),
  next: byId("next-page"),
  pageLabel: byId("page-label"),
  stage: byId("stage"),
  pageMount: byId("page-mount"),
  thumbStrip: byId("thumb-strip"),
  previewOverlay: byId("preview-overlay"),
  previewClose: byId("preview-close"),
  previewPrint: byId("preview-print"),
  previewPages: byId("preview-pages"),
  printRoot: byId("print-root"),
  status: byId("status")
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function hasEdit(key) {
  return Object.prototype.hasOwnProperty.call(state.edits, key);
}

function pageContent(index) {
  const base = CONTENT[(index - 1) % CONTENT.length];
  const kickerKey = "p" + index + ":kicker";
  const titleKey = "p" + index + ":title";
  const bodyKey = "p" + index + ":body";
  return {
    kicker: hasEdit(kickerKey) ? state.edits[kickerKey] : base.kicker,
    title: hasEdit(titleKey) ? state.edits[titleKey] : base.title,
    body: hasEdit(bodyKey) ? state.edits[bodyKey] : base.body
  };
}

function titleClass(value) {
  const length = value.trim().length;
  if (length > 20) return "title-long";
  if (length > 10) return "title-medium";
  return "";
}

function applyTitleClass(node, value) {
  node.classList.remove("title-medium", "title-long");
  const size = titleClass(value);
  if (size) node.classList.add(size);
}

function fillBody(node, value) {
  node.textContent = "";
  if (!value) return;
  value.split("\n").forEach(function (line) {
    node.appendChild(el("p", "", line));
  });
}

function limitValue(text, multiline, limit) {
  const source = String(text).replace(/\r/g, "");
  if (multiline) {
    const lines = source
      .split("\n")
      .map(function (line) {
        return line.replace(/\s+/g, " ").trim();
      })
      .filter(Boolean);
    return lines.join("\n").slice(0, limit);
  }
  return source.replace(/\s+/g, " ").trim().slice(0, limit);
}

function writeEditable(node, value, multiline) {
  if (multiline) {
    fillBody(node, value);
  } else {
    node.textContent = value;
  }
}

function attachEditable(node, options) {
  node.setAttribute("contenteditable", "true");
  node.setAttribute("role", "textbox");
  node.setAttribute("spellcheck", "false");
  node.setAttribute("aria-label", options.label);
  if (options.multiline) node.setAttribute("aria-multiline", "true");

  node.addEventListener("paste", function (event) {
    event.preventDefault();
    const clipboard = event.clipboardData || window.clipboardData;
    if (!clipboard) return;
    const text = clipboard.getData("text/plain");
    const clean = options.multiline
      ? text.replace(/\r/g, "")
      : text.replace(/\s+/g, " ");
    if (document.execCommand) {
      document.execCommand("insertText", false, clean);
    }
  });

  node.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      event.preventDefault();
      node.blur();
      return;
    }
    if (!options.multiline && event.key === "Enter") {
      event.preventDefault();
      node.blur();
    }
  });

  node.addEventListener("input", function () {
    const value = limitValue(node.innerText, options.multiline, options.limit);
    options.save(value);
    if (options.isTitle) applyTitleClass(node, value);
  });

  node.addEventListener("blur", function () {
    const value = limitValue(node.innerText, options.multiline, options.limit);
    options.save(value);
    if (options.isTitle) applyTitleClass(node, value);
    writeEditable(node, value, options.multiline);
  });
}

function saveCoverTitle(value) {
  state.title = value;
  els.title.value = value;
  persist();
  refreshThumb(0);
}

function saveCoverSubtitle(value) {
  state.subtitle = value;
  els.subtitle.value = value;
  persist();
}

function savePageField(index, field, value) {
  state.edits["p" + index + ":" + field] = value;
  persist();
  refreshThumb(index);
}

function basePage(extraClass, label) {
  const page = el("article", "zine-page " + extraClass);
  page.classList.add("ink-" + state.ink);
  page.classList.add("template-" + state.template);
  page.style.setProperty("--mis", state.mis);
  page.setAttribute("aria-label", label);
  page.append(el("div", "page-fiber"), el("div", "page-texture"));
  return page;
}

function buildCover(editable) {
  const page = basePage("zine-cover", "Cover");
  page.append(
    el("div", "deco cover-halftone"),
    el("div", "deco cover-block"),
    el("div", "deco cover-block-small"),
    el("div", "deco cover-strip")
  );

  const inner = el("div", "cover-inner");
  const kicker = el("p", "cover-kicker");
  kicker.append(el("span", "", "Riso Club"), el("span", "", "Issue 01"));

  const title = el("h1", "cover-title", state.title);
  applyTitleClass(title, state.title);
  title.dataset.placeholder = "Cover title";

  const subtitle = el("p", "cover-sub", state.subtitle);
  subtitle.dataset.placeholder = "Subtitle";

  const stamp = el("span", "cover-stamp");
  stamp.innerHTML = "HOT<br>OFF<br>THE<br>PRESS";

  const meta = el("div", "cover-meta");
  meta.appendChild(el("span", "barcode"));
  const metaText = el("p");
  metaText.append(pad(state.pageCount) + " pages / " + INKS[state.ink].short);
  metaText.appendChild(document.createElement("br"));
  metaText.append("A5 / free / take one");
  meta.appendChild(metaText);

  inner.append(kicker, title, subtitle, stamp, meta);
  page.appendChild(inner);

  if (editable) {
    attachEditable(title, {
      label: "Cover title, editable",
      multiline: false,
      limit: 34,
      isTitle: true,
      save: saveCoverTitle
    });
    attachEditable(subtitle, {
      label: "Cover subtitle, editable",
      multiline: false,
      limit: 72,
      save: saveCoverSubtitle
    });
  }

  return page;
}

function buildInterior(index, editable) {
  const content = pageContent(index);
  const page = basePage("variant-" + (index % 3), "Page " + (index + 1));

  TEMPLATES[state.template].pieces.forEach(function (name) {
    page.appendChild(el("div", "deco " + name));
  });

  const inner = el("div", "page-inner");
  const kicker = el("p", "page-kicker");
  const kickerText = el("span", "", content.kicker);
  const pageNumber = el("span", "", pad(index + 1) + " / " + pad(state.pageCount));
  kicker.append(kickerText, pageNumber);

  const title = el("h2", "page-title", content.title);
  applyTitleClass(title, content.title);
  title.dataset.placeholder = "Page title";

  const body = el("div", "page-body");
  fillBody(body, content.body);
  body.dataset.placeholder = "Write something here";

  const foot = el("div", "page-foot");
  foot.append(el("span", "", "Riso Club"), el("span", "", "Take one"));

  inner.append(kicker, title, el("div", "page-rule"), body, foot);
  page.append(inner, el("span", "page-staple top"), el("span", "page-staple bottom"));

  if (editable) {
    attachEditable(kickerText, {
      label: "Page kicker, editable",
      multiline: false,
      limit: 40,
      save: function (value) {
        savePageField(index, "kicker", value);
      }
    });
    attachEditable(title, {
      label: "Page title, editable",
      multiline: false,
      limit: 60,
      isTitle: true,
      save: function (value) {
        savePageField(index, "title", value);
      }
    });
    attachEditable(body, {
      label: "Page text, editable",
      multiline: true,
      limit: 460,
      save: function (value) {
        savePageField(index, "body", value);
      }
    });
  }

  return page;
}

function buildPage(index, editable) {
  return index === 0 ? buildCover(editable) : buildInterior(index, editable);
}

function pageTitleText(index) {
  if (index === 0) return state.title.trim() || "Untitled cover";
  return pageContent(index).title.trim() || "Untitled page";
}

function renderStage() {
  els.pageMount.textContent = "";
  els.pageMount.appendChild(buildPage(state.page, true));
  els.stage.style.setProperty("--mis", state.mis);
  els.pageLabel.textContent = pageLabel();
  els.prev.disabled = state.page === 0;
  els.next.disabled = state.page === state.pageCount - 1;
}

function pageLabel() {
  const current = state.page === 0 ? "Cover" : "Page " + pad(state.page + 1);
  return current + " · " + pad(state.page + 1) + " / " + pad(state.pageCount);
}

function renderThumbs() {
  els.thumbStrip.textContent = "";
  for (let i = 0; i < state.pageCount; i += 1) {
    const thumb = el("button", "thumb");
    thumb.type = "button";
    thumb.setAttribute("title", i === 0 ? "Go to cover" : "Go to page " + (i + 1));
    thumb.setAttribute("aria-label", i === 0 ? "Cover" : "Page " + (i + 1));
    thumb.setAttribute("aria-pressed", String(i === state.page));
    if (i === state.page) thumb.classList.add("is-active");

    const blocks = el(
      "span",
      "thumb-blocks" + (state.template === "cut" ? "" : " blocks-" + state.template)
    );
    const title = el("span", "thumb-title", pageTitleText(i));
    const number = el("span", "thumb-num", pad(i + 1));
    thumb.append(blocks, title, number);

    thumb.addEventListener("click", function () {
      goTo(i);
    });

    els.thumbStrip.appendChild(thumb);
  }
}

function updateThumbSelection() {
  Array.from(els.thumbStrip.children).forEach(function (thumb, index) {
    const active = index === state.page;
    thumb.classList.toggle("is-active", active);
    thumb.setAttribute("aria-pressed", String(active));
  });
}

function refreshThumb(index) {
  const thumb = els.thumbStrip.children[index];
  if (!thumb) return;
  const title = thumb.querySelector(".thumb-title");
  if (title) title.textContent = pageTitleText(index);
}

function renderAll() {
  renderStage();
  renderThumbs();
}

function goTo(index) {
  const next = Math.max(0, Math.min(state.pageCount - 1, index));
  if (next === state.page) return;
  state.page = next;
  persist();
  renderStage();
  updateThumbSelection();
  announce(pageLabel());
}

function updateOutputs() {
  els.pagesValue.textContent = pad(state.pageCount);
  els.misValue.textContent = state.mis + " px";
}

function updatePressed() {
  els.templateGrid.querySelectorAll("[data-template]").forEach(function (button) {
    button.setAttribute("aria-pressed", String(button.dataset.template === state.template));
  });
  els.inkGrid.querySelectorAll("[data-ink]").forEach(function (button) {
    const active = button.dataset.ink === state.ink;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("is-active", active);
  });
}

function syncControls() {
  els.title.value = state.title;
  els.subtitle.value = state.subtitle;
  els.pageCount.value = String(state.pageCount);
  els.misregistration.value = String(state.mis);
  updateOutputs();
  updatePressed();
}

function persist() {
  const payload = {
    title: state.title,
    subtitle: state.subtitle,
    template: state.template,
    ink: state.ink,
    pageCount: state.pageCount,
    mis: state.mis,
    page: state.page,
    edits: state.edits
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    return;
  }
}

function announce(message) {
  els.status.textContent = message;
}

function buildPrintRoot() {
  els.printRoot.textContent = "";
  for (let i = 0; i < state.pageCount; i += 1) {
    const sheet = el("div", "print-sheet");
    ["tl", "tr", "bl", "br"].forEach(function (position) {
      sheet.appendChild(el("span", "sheet-crop " + position));
    });
    sheet.appendChild(buildPage(i, false));
    els.printRoot.appendChild(sheet);
  }
}

function buildPreview() {
  els.previewPages.textContent = "";
  for (let i = 0; i < state.pageCount; i += 1) {
    const item = el("div", "preview-item");
    const label = el("p", "preview-label");
    label.append(
      el("span", "", i === 0 ? "Cover" : "Page " + pad(i + 1)),
      el("span", "", "A5 / 148 × 210")
    );
    item.append(label, buildPage(i, false));
    els.previewPages.appendChild(item);
  }
}

function openPreview() {
  lastFocus = document.activeElement;
  buildPreview();
  buildPrintRoot();
  els.previewOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  els.previewClose.focus();
  announce("Print preview open. " + state.pageCount + " pages.");
}

function closePreview() {
  if (els.previewOverlay.hidden) return;
  els.previewOverlay.hidden = true;
  document.body.style.overflow = "";
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  announce("Print preview closed.");
}

function trapOverlayFocus(event) {
  const nodes = Array.from(
    els.previewOverlay.querySelectorAll(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    )
  ).filter(function (node) {
    return !node.disabled && node.offsetParent !== null;
  });
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function printZine() {
  buildPrintRoot();
  announce("Opening the print dialog for " + state.pageCount + " pages.");
  window.print();
}

els.title.addEventListener("input", function () {
  state.title = els.title.value.slice(0, 34);
  persist();
  if (state.page === 0) {
    renderStage();
  }
  refreshThumb(0);
});

els.subtitle.addEventListener("input", function () {
  state.subtitle = els.subtitle.value.slice(0, 72);
  persist();
  if (state.page === 0) {
    renderStage();
  }
});

els.templateGrid.addEventListener("click", function (event) {
  const button = event.target.closest("[data-template]");
  if (!button) return;
  state.template = button.dataset.template;
  updatePressed();
  renderAll();
  persist();
  announce(TEMPLATES[state.template].label + " composition selected.");
});

els.inkGrid.addEventListener("click", function (event) {
  const button = event.target.closest("[data-ink]");
  if (!button) return;
  state.ink = button.dataset.ink;
  updatePressed();
  renderAll();
  persist();
  announce(INKS[state.ink].label + " selected.");
});

els.pageCount.addEventListener("input", function () {
  state.pageCount = Number(els.pageCount.value);
  if (state.page > state.pageCount - 1) state.page = state.pageCount - 1;
  updateOutputs();
  renderAll();
  persist();
});

els.pageCount.addEventListener("change", function () {
  announce("Zine set to " + state.pageCount + " pages.");
});

els.misregistration.addEventListener("input", function () {
  state.mis = Number(els.misregistration.value);
  updateOutputs();
  renderStage();
  persist();
});

els.prev.addEventListener("click", function () {
  goTo(state.page - 1);
});

els.next.addEventListener("click", function () {
  goTo(state.page + 1);
});

els.preview.addEventListener("click", openPreview);
els.previewClose.addEventListener("click", closePreview);
els.previewPrint.addEventListener("click", printZine);
els.print.addEventListener("click", printZine);

window.addEventListener("beforeprint", buildPrintRoot);

document.addEventListener("keydown", function (event) {
  if (!els.previewOverlay.hidden) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePreview();
    } else if (event.key === "Tab") {
      trapOverlayFocus(event);
    }
    return;
  }

  const target = event.target;
  if (
    target instanceof HTMLElement &&
    target.closest("input, textarea, select, [contenteditable='true']")
  ) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goTo(state.page - 1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    goTo(state.page + 1);
  }
});

function init() {
  syncControls();
  renderAll();
  buildPrintRoot();
  announce("Press ready. " + state.pageCount + " pages, " + TEMPLATES[state.template].label.toLowerCase() + ".");
}

init();
