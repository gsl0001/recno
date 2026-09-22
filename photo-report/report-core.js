(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RecnoReport = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const campaign =
    "https://apps.apple.com/app/apple-store/id6785280739?pt=129096683&ct=FreePhotoReportSep2026&mt=8";
  const types = [
    "Progress update",
    "Pre-cover record",
    "Punch list",
    "Client handover",
  ];
  const statuses = ["Open", "In progress", "Done"];
  const clean = (v, max = 200) =>
    String(v ?? "")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
      .slice(0, max);
  function normalize(raw) {
    if (
      !raw ||
      raw.schema !== 1 ||
      !Array.isArray(raw.photos) ||
      !Array.isArray(raw.actions)
    )
      throw Error("This is not a Recno report draft.");
    if (raw.photos.length > 30 || raw.actions.length > 50)
      throw Error("A draft supports up to 30 photos and 50 action items.");
    const fields = {};
    for (const key of [
      "job",
      "author",
      "company",
      "client",
      "address",
      "reference",
    ])
      fields[key] = clean(raw[key], 200);
    fields.date = /^\d{4}-\d{2}-\d{2}$/.test(raw.date || "") ? raw.date : "";
    return {
      schema: 1,
      ...fields,
      type: types.includes(raw.type) ? raw.type : types[0],
      paper: raw.paper === "A4" ? "A4" : "Letter",
      layout: raw.layout === "detail" ? "detail" : "compact",
      summary: clean(raw.summary, 6000),
      photos: raw.photos.map((p) => {
        if (
          !p ||
          typeof p.data !== "string" ||
          !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(p.data) ||
          p.data.length > 4000000
        )
          throw Error("Draft contains an unsupported or oversized photo.");
        return {
          data: p.data,
          name: clean(p.name),
          caption: clean(p.caption, 2000),
          location: clean(p.location),
          stage: ["Before", "During", "After", "Issue"].includes(p.stage)
            ? p.stage
            : "During",
        };
      }),
      actions: raw.actions.map((a) => {
        if (!a || typeof a !== "object")
          throw Error("Draft contains an invalid action item.");
        return {
          text: clean(a.text, 1500),
          owner: clean(a.owner, 120),
          due: /^\d{4}-\d{2}-\d{2}$/.test(a.due || "") ? a.due : "",
          status: statuses.includes(a.status) ? a.status : "Open",
        };
      }),
    };
  }
  const filename = (job) =>
    clean(job, 80)
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-|-$/g, "") || "jobsite-report";
  function wrap(text, font, size, width) {
    const lines = [];
    for (const paragraph of text.split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        const trial = line ? line + " " + word : word;
        if (font.widthOfTextAtSize(trial, size) <= width) {
          line = trial;
          continue;
        }
        if (line) {
          lines.push(line);
          line = "";
        }
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > width && line) {
            lines.push(line);
            line = "";
          }
          line += char;
        }
      }
      lines.push(line);
    }
    return lines;
  }
  async function pdf(raw, lib, fontkit, fontBytes) {
    const r = normalize(raw);
    if (!r.photos.length) throw Error("Add at least one photo.");
    const doc = await lib.PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(fontBytes, { subset: true });
    const supported = new Set(font.getCharacterSet());
    const warnings = new Set();
    const safe = (text) =>
      Array.from(text)
        .map((c) => {
          if (c === "\n" || supported.has(c.codePointAt(0))) return c;
          warnings.add(
            "Some characters are not supported by the report font and were replaced with ?.",
          );
          return "?";
        })
        .join("");
    const W = r.paper === "A4" ? 595.28 : 612,
      H = r.paper === "A4" ? 841.89 : 792,
      M = 42,
      body = W - M * 2;
    const ink = lib.rgb(0.1, 0.11, 0.12),
      orange = lib.rgb(0.83, 0.25, 0.08),
      muted = lib.rgb(0.37, 0.39, 0.41);
    let page, y;
    const pages = [];
    function newPage() {
      page = doc.addPage([W, H]);
      pages.push(page);
      y = H - 65;
      page.drawText("recno. / FIELD REPORT", {
        x: M,
        y: H - 31,
        font,
        size: 9,
        color: orange,
      });
    }
    function room(height) {
      if (y - height < 55) newPage();
    }
    function text(value, size = 11, color = ink) {
      for (const line of wrap(safe(value), font, size, body)) {
        room(size * 1.45);
        page.drawText(line, { x: M, y: y - size, font, size, color });
        y -= size * 1.45;
      }
      y -= 6;
    }
    newPage();
    text(r.type.toUpperCase(), 10, orange);
    text(r.job || "Jobsite photo report", 26);
    const meta = [
      ["Report", r.reference],
      ["Date", r.date],
      ["Prepared by", r.author],
      ["Company", r.company],
      ["Client", r.client],
      ["Site", r.address],
    ];
    for (const [label, value] of meta)
      if (value) text(label + ": " + value, 10, muted);
    text(
      `${r.photos.length} photos · ${r.actions.filter((a) => a.status !== "Done").length} outstanding actions`,
      10,
      muted,
    );
    if (r.summary.trim()) {
      text("SUMMARY", 11, orange);
      text(r.summary);
    }
    if (r.actions.length) {
      room(50);
      text("ACTION ITEMS", 12, orange);
      r.actions.forEach((a, i) => {
        room(65);
        text(`${i + 1}. [${a.status}] ${a.text || "Action item"}`);
        const details = [
          a.owner && "Owner: " + a.owner,
          a.due && "Due: " + a.due,
        ]
          .filter(Boolean)
          .join(" · ");
        if (details) text(details, 10, muted);
      });
    }
    for (let i = 0; i < r.photos.length; i++) {
      const p = r.photos[i];
      const image = await doc.embedJpg(p.data);
      const maxH = r.layout === "detail" ? 400 : 230;
      const scale = Math.min(body / image.width, maxH / image.height);
      const h = image.height * scale,
        w = image.width * scale;
      const label = `PHOTO ${i + 1} / ${p.stage}${p.location ? " / " + p.location : ""}`;
      const labelHeight = wrap(safe(label), font, 10, body).length * 14.5 + 6;
      if (r.layout === "detail" || y - h - labelHeight - 50 < 55) newPage();
      text(label, 10, orange);
      page.drawImage(image, {
        x: M + (body - w) / 2,
        y: y - h,
        width: w,
        height: h,
      });
      y -= h + 12;
      if (p.caption) text(p.caption, 10);
      y -= 12;
    }
    pages.forEach((pg, i) => {
      pg.drawLine({
        start: { x: M, y: 43 },
        end: { x: W - M, y: 43 },
        thickness: 0.5,
        color: lib.rgb(0.8, 0.8, 0.8),
      });
      pg.drawText("Created with Recno · Get the iPhone app", {
        x: M,
        y: 28,
        size: 8,
        font,
        color: muted,
      });
      pg.drawText(`${i + 1} / ${pages.length}`, {
        x: W - M - 35,
        y: 28,
        size: 8,
        font,
        color: muted,
      });
      const annotation = doc.context.register(
        doc.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: [M, 24, M + 230, 40],
          Border: [0, 0, 0],
          A: { Type: "Action", S: "URI", URI: lib.PDFString.of(campaign) },
        }),
      );
      pg.node.set(lib.PDFName.of("Annots"), doc.context.obj([annotation]));
    });
    doc.setTitle(r.job || "Jobsite photo report");
    doc.setAuthor(r.author || r.company || "Recno");
    doc.setCreator("Recno free photo report tool");
    return {
      bytes: await doc.save(),
      pages: pages.length,
      warnings: [...warnings],
    };
  }
  return { normalize, filename, wrap, pdf, campaign, types, statuses };
});
