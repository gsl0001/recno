"use strict";
const $ = (id) => document.getElementById(id),
  core = window.RecnoReport;
const fields = [
  "job",
  "author",
  "company",
  "client",
  "address",
  "reference",
  "date",
  "type",
  "paper",
  "layout",
  "summary",
];
let photos = [],
  actions = [],
  dirty = false,
  busy = false,
  fontPromise;
const status = (message) => {
  $("status").textContent = message;
};
function changed() {
  dirty = true;
  $("output").hidden = true;
  $("pdf").disabled = busy || !photos.length;
  $("preview").disabled = busy || !photos.length;
  $("count").textContent = `${photos.length} / 30 photos`;
}
function model() {
  return core.normalize({
    schema: 1,
    ...Object.fromEntries(fields.map((k) => [k, $(k).value])),
    photos,
    actions,
  });
}
function element(tag, text, className) {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (className) e.className = className;
  return e;
}
function button(text, run, disabled = false) {
  const b = element("button", text, "secondary small");
  b.type = "button";
  b.disabled = disabled;
  b.addEventListener("click", run);
  return b;
}
function field(parent, label, value, update, options) {
  const l = element("label", label),
    input = document.createElement(
      options?.choices ? "select" : options?.area ? "textarea" : "input",
    );
  if (options?.choices)
    options.choices.forEach((v) => {
      const o = element("option", v);
      input.append(o);
    });
  else {
    if (!options?.area) input.type = options?.type || "text";
    input.maxLength = options?.max || 200;
    if (options?.area) input.rows = 3;
  }
  input.value = value;
  input.addEventListener("input", () => {
    update(input.value);
    changed();
  });
  l.append(input);
  parent.append(l);
}
async function imageData(source, rotation = 0) {
  const img = new Image();
  img.src = source;
  await img.decode();
  const scale = Math.min(
      1,
      1600 / Math.max(img.naturalWidth, img.naturalHeight),
    ),
    w = Math.round(img.naturalWidth * scale),
    h = Math.round(img.naturalHeight * scale),
    canvas = document.createElement("canvas");
  canvas.width = rotation ? h : w;
  canvas.height = rotation ? w : h;
  const c = canvas.getContext("2d");
  c.fillStyle = "#fff";
  c.fillRect(0, 0, canvas.width, canvas.height);
  if (rotation) {
    c.translate(canvas.width, 0);
    c.rotate(Math.PI / 2);
  }
  c.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.86);
}
async function work(fn) {
  if (busy) return;
  busy = true;
  document.body.classList.add("busy");
  $("photos").disabled = true;
  $("pdf").disabled = true;
  $("preview").disabled = true;
  try {
    await fn();
  } catch (e) {
    status(e.message || "Something went wrong. Your report is still here.");
  } finally {
    busy = false;
    document.body.classList.remove("busy");
    $("photos").disabled = false;
    $("pdf").disabled = !photos.length;
    $("preview").disabled = !photos.length;
  }
}
function drawPhotos() {
  const container = $("cards");
  container.replaceChildren();
  photos.forEach((p, i) => {
    const card = element("article", null, "card");
    card.append(element("h3", `Photo ${i + 1} · ${p.name}`));
    const img = element("img");
    img.src = p.data;
    img.alt = `Photo ${i + 1} preview`;
    card.append(img);
    const bar = element("div", null, "toolbar");
    bar.append(
      button(
        "Move up",
        () => {
          [photos[i - 1], photos[i]] = [photos[i], photos[i - 1]];
          drawPhotos();
          changed();
        },
        i === 0,
      ),
      button(
        "Move down",
        () => {
          [photos[i + 1], photos[i]] = [photos[i], photos[i + 1]];
          drawPhotos();
          changed();
        },
        i === photos.length - 1,
      ),
      button("Rotate", () =>
        work(async () => {
          p.data = await imageData(p.data, 90);
          drawPhotos();
          changed();
          status(`Photo ${i + 1} rotated.`);
        }),
      ),
      button("Remove photo", () => {
        photos.splice(i, 1);
        drawPhotos();
        changed();
      }),
    );
    card.append(bar);
    const row = element("div", null, "fields");
    field(row, `Photo ${i + 1} location`, p.location, (v) => (p.location = v));
    field(row, `Photo ${i + 1} stage`, p.stage, (v) => (p.stage = v), {
      choices: ["Before", "During", "After", "Issue"],
    });
    card.append(row);
    field(card, `Photo ${i + 1} caption`, p.caption, (v) => (p.caption = v), {
      area: true,
      max: 2000,
    });
    container.append(card);
  });
}
function drawActions() {
  const container = $("action-items");
  container.replaceChildren();
  actions.forEach((a, i) => {
    const row = element("div", null, "action-row");
    field(row, `Action ${i + 1}`, a.text, (v) => (a.text = v), {
      area: true,
      max: 1500,
    });
    const grid = element("div", null, "fields");
    field(grid, `Action ${i + 1} owner`, a.owner, (v) => (a.owner = v), {
      max: 120,
    });
    field(grid, `Action ${i + 1} due`, a.due, (v) => (a.due = v), {
      type: "date",
    });
    field(grid, `Action ${i + 1} status`, a.status, (v) => (a.status = v), {
      choices: core.statuses,
    });
    row.append(
      grid,
      button("Remove action", () => {
        actions.splice(i, 1);
        drawActions();
        changed();
      }),
    );
    container.append(row);
  });
  $("add-action").disabled = actions.length >= 50;
}
function download(bytes, name, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type })),
    a = element("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function load(r) {
  fields.forEach((k) => ($(k).value = r[k]));
  photos = r.photos;
  actions = r.actions;
  drawPhotos();
  drawActions();
  changed();
}
$("date").value = new Date().toLocaleDateString("en-CA");
fields.forEach((k) => $(k).addEventListener("input", changed));
$("type").addEventListener("change", () => {
  const hints = {
    "Progress update": "Work completed, current conditions, and next steps.",
    "Pre-cover record":
      "What will be covered? Record the location and visible condition before work continues.",
    "Punch list":
      "List remaining work and link each issue to a numbered photo.",
    "Client handover":
      "Completed scope, handover notes, and any outstanding items.",
  };
  $("summary").placeholder = hints[$("type").value];
});
$("photos").addEventListener("change", () => {
  const files = [...$("photos").files];
  $("photos").value = "";
  work(async () => {
    let added = 0;
    const errors = [];
    for (const f of files) {
      if (photos.length >= 30) {
        errors.push("30-photo limit reached.");
        break;
      }
      if (
        (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(f.type) &&
          !/\.(heic|heif)$/i.test(f.name)) ||
        f.size > 15 * 1024 * 1024
      ) {
        errors.push(`${f.name}: use JPG, PNG, WebP or HEIC under 15 MB.`);
        continue;
      }
      const url = URL.createObjectURL(f);
      try {
        status(`Preparing ${f.name}…`);
        photos.push({
          data: await imageData(url),
          name: f.name,
          caption: "",
          location: "",
          stage: "During",
        });
        added++;
      } catch {
        errors.push(`${f.name}: image could not be read. For HEIC, use Safari 17 or newer, or export as JPG.`);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    drawPhotos();
    changed();
    status(
      `${added} photo${added === 1 ? "" : "s"} added. ${errors.join(" ")}`,
    );
  });
});
$("add-action").addEventListener("click", () => {
  if (actions.length < 50) {
    actions.push({ text: "", owner: "", due: "", status: "Open" });
    drawActions();
    changed();
  }
});
$("save").addEventListener("click", () => {
  try {
    download(
      JSON.stringify(model()),
      `${core.filename($("job").value)}.recno.json`,
      "application/json",
    );
    dirty = false;
    status(
      "Editable draft downloaded. Keep it private: it contains your photos and notes.",
    );
  } catch (e) {
    status(e.message);
  }
});
$("import-button").addEventListener("click", () => $("import").click());
$("import").addEventListener("change", () => {
  const f = $("import").files[0];
  $("import").value = "";
  if (!f) return;
  work(async () => {
    if (f.size > 50 * 1024 * 1024)
      throw Error("Draft is too large (50 MB maximum).");
    const r = core.normalize(JSON.parse(await f.text()));
    for (const p of r.photos) {
      const img = new Image();
      img.src = p.data;
      await img.decode();
      if (img.naturalWidth > 1600 || img.naturalHeight > 1600)
        p.data = await imageData(p.data);
    }
    if (
      dirty &&
      !confirm(
        "Replace the current report with this saved draft? Save your current draft first if you need it.",
      )
    )
      return;
    load(r);
    dirty = false;
    status(
      `Draft opened: ${photos.length} photos and ${actions.length} action items.`,
    );
  });
});
$("clear").addEventListener("click", () => {
  if (!confirm("Clear this report? Download a draft first to keep your work."))
    return;
  load(
    core.normalize({
      schema: 1,
      photos: [],
      actions: [],
      date: new Date().toLocaleDateString("en-CA"),
    }),
  );
  dirty = false;
  status("Report cleared.");
});
$("preview").addEventListener("click", () => {
  const r = model(),
    out = $("output");
  out.replaceChildren(
    element("p", "recno. / " + r.type, "eyebrow"),
    element("h2", r.job || "Jobsite photo report"),
  );
  for (const k of [
    "date",
    "reference",
    "author",
    "company",
    "client",
    "address",
  ])
    if (r[k])
      out.append(element("p", `${k[0].toUpperCase() + k.slice(1)}: ${r[k]}`));
  if (r.summary) out.append(element("p", r.summary));
  if (r.actions.length) {
    out.append(element("h3", "Action items"));
    r.actions.forEach((a, i) =>
      out.append(
        element(
          "p",
          `${i + 1}. [${a.status}] ${a.text}\n${[a.owner, a.due].filter(Boolean).join(" · ")}`,
        ),
      ),
    );
  }
  r.photos.forEach((p, i) => {
    const fig = element("figure"),
      img = element("img");
    img.src = p.data;
    img.alt = `Photo ${i + 1}`;
    fig.append(
      element(
        "h3",
        `Photo ${i + 1} · ${p.stage}${p.location ? " · " + p.location : ""}`,
      ),
      img,
      element("figcaption", p.caption),
    );
    out.append(fig);
  });
  out.hidden = false;
  out.scrollIntoView({ behavior: "smooth", block: "start" });
  status("Preview updated. Download PDF for final pagination.");
});
$("pdf").addEventListener("click", () =>
  work(async () => {
    const r = model();
    status("Building your PDF…");
    fontPromise ||= fetch("vendor/Geist-Regular.ttf")
      .then((res) => {
        if (!res.ok)
          throw Error("Report font could not load. Please try again.");
        return res.arrayBuffer();
      })
      .catch((e) => {
        fontPromise = null;
        throw e;
      });
    const result = await core.pdf(r, PDFLib, fontkit, await fontPromise);
    download(result.bytes, `${core.filename(r.job)}.pdf`, "application/pdf");
    status(`PDF ready: ${result.pages} pages. ${result.warnings.join(" ")}`);
  }),
);
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
