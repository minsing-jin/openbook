import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import type { DocumentBlock, DocumentSnapshot, ImportBundle, ImportJob, LibraryItem } from "@openbook/core";
import { createId, formatNow, snippetFromText } from "@openbook/core";

function normalizeWhitespace(input: string, preserveLineBreaks = false): string {
  if (!preserveLineBreaks) {
    return input.replace(/\s+/g, " ").trim();
  }

  return input
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTextWithBreaks(node: Node): string {
  if (node.nodeType === node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  const elementCtor = node.ownerDocument?.defaultView?.Element;
  if (!elementCtor || !(node instanceof elementCtor)) {
    return "";
  }

  if (node.tagName === "BR") {
    return "\n";
  }

  const childText = Array.from(node.childNodes).map(extractTextWithBreaks).join("");
  if (node.tagName === "P" || node.tagName === "LI" || node.tagName === "BLOCKQUOTE" || node.tagName === "PRE") {
    return `${childText}\n`;
  }

  return childText;
}

export function looksLikePdfUrl(url: string): boolean {
  return /\.pdf(?:$|\?)/i.test(url);
}

export async function detectPdfResponse(url: string): Promise<boolean> {
  const response = await fetch(url, { method: "HEAD", redirect: "follow" });
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("pdf");
}

function createBlocksFromBody(document: Document, chapterId: string): DocumentBlock[] {
  const nodes = Array.from(document.querySelectorAll("h1, h2, h3, p, li, blockquote, pre, img"));
  const blocks: DocumentBlock[] = [];
  let order = 1;
  let pageIndex = 1;

  for (const node of nodes) {
    const tagName = node.tagName.toLowerCase();
    const rawText = extractTextWithBreaks(node);
    const shouldPreserveLineBreaks = rawText.includes("\n") || tagName === "pre";
    const text = normalizeWhitespace(rawText, shouldPreserveLineBreaks);
    if (!text && tagName !== "img") {
      continue;
    }

    const type =
      tagName === "h1" || tagName === "h2" || tagName === "h3"
        ? "heading"
        : tagName === "blockquote"
          ? "quote"
          : tagName === "pre"
            ? "code"
            : tagName === "li"
              ? "list-item"
              : tagName === "img"
                ? "image"
                : "paragraph";

    if (order % 4 === 0) {
      pageIndex += 1;
    }

    blocks.push({
      id: createId("block"),
      type,
      order,
      chapterId,
      text: text || node.getAttribute("alt") || "Illustration",
      html: node.outerHTML,
      imageUrl: tagName === "img" ? node.getAttribute("src") ?? undefined : undefined,
      sourcePageIndex: pageIndex
    });
    order += 1;
  }

  return blocks;
}

function buildSnapshot({
  title,
  sourceUrl,
  blocks,
  importMethod,
  confidence,
  kind
}: {
  title: string;
  sourceUrl: string;
  blocks: DocumentBlock[];
  importMethod: DocumentSnapshot["importMethod"];
  confidence: number;
  kind: DocumentSnapshot["kind"];
}): DocumentSnapshot {
  const pageImages = blocks
    .filter((block) => block.type === "image" && block.imageUrl)
    .map((block) => ({
      id: createId("page_image"),
      pageIndex: block.sourcePageIndex,
      src: block.imageUrl!,
      alt: block.text
    }));

  const headings = blocks.filter((block) => block.type === "heading");
  const chapters = headings.length
    ? headings.map((heading, index) => ({
        id: `chapter_${index + 1}`,
        title: heading.text,
        order: index + 1,
        pageStart: heading.sourcePageIndex
      }))
    : [{ id: "chapter_1", title: "Imported text", order: 1, pageStart: 1 }];

  const toc = headings.map((heading, index) => ({
    id: createId("toc"),
    label: heading.text,
    level: 1,
    blockId: heading.id
  }));

  const fullText = blocks.map((block) => block.text).join("\n\n");

  return {
    docId: createId("doc"),
    kind,
    title,
    sourceUrl,
    language: "und",
    importMethod,
    confidence,
    completeness: blocks.length >= 6 ? "full" : "partial",
    chapters,
    toc,
    blocks,
    pageImages,
    fullText
  };
}

export async function importFromUrl(url: string): Promise<ImportJob> {
  const createdAt = formatNow();
  const baseJob: ImportJob = {
    jobId: createId("job"),
    sourceUrl: url,
    sourceMode: "url",
    stage: "fetching",
    progress: 10,
    completeness: "fallback",
    createdAt,
    updatedAt: createdAt,
    logs: [`Queued import for ${url}`]
  };

  try {
    if (looksLikePdfUrl(url) || (await detectPdfResponse(url))) {
      const item: LibraryItem = {
        id: createId("item"),
        kind: "pdf_book",
        title: url.split("/").pop() || "Imported PDF",
        sourceUrl: url,
        description: "Imported from a direct or detected PDF response.",
        createdAt,
        lastOpenedAt: createdAt,
        language: "und",
        tags: ["pdf", "imported"],
        importStatus: "ready"
      };

      return {
        ...baseJob,
        stage: "completed",
        progress: 100,
        detectedKind: "pdf_book",
        completeness: "full",
        updatedAt: formatNow(),
        logs: [...baseJob.logs, "Detected PDF response and created a PDF viewer item."],
        item
      };
    }

    const response = await fetch(url, { redirect: "follow" });
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    const extractedHtml = article?.content ?? dom.window.document.body.innerHTML;
    const articleDom = new JSDOM(`<article>${extractedHtml}</article>`);
    const blocks = createBlocksFromBody(articleDom.window.document, "chapter_1");

    const snapshot = buildSnapshot({
      title: article?.title ?? (dom.window.document.title || "Imported web book"),
      sourceUrl: url,
      blocks,
      importMethod: blocks.some((block) => block.type === "image") && blocks.filter((block) => block.type !== "image").length < 3 ? "ocr" : "dom",
      confidence: blocks.length > 8 ? 0.88 : 0.61,
      kind: url.includes("blog") ? "blog_snapshot" : "snapshot_book"
    });

    const item: LibraryItem = {
      id: createId("item"),
      kind: snapshot.kind,
      title: snapshot.title,
      sourceUrl: url,
      description: snippetFromText(snapshot.fullText, 220),
      createdAt,
      lastOpenedAt: createdAt,
      language: snapshot.language,
      tags: snapshot.kind === "blog_snapshot" ? ["blog", "imported"] : ["book", "imported"],
      importStatus: snapshot.completeness === "full" ? "ready" : "partial",
      snapshot
    };

    return {
      ...baseJob,
      stage: "completed",
      progress: 100,
      detectedKind: snapshot.kind,
      completeness: snapshot.completeness,
      updatedAt: formatNow(),
      logs: [...baseJob.logs, `Extracted ${blocks.length} blocks with ${snapshot.importMethod} import.`],
      item
    };
  } catch (error) {
    const item: LibraryItem = {
      id: createId("item"),
      kind: "web_shortcut",
      title: url,
      sourceUrl: url,
      description: "Open in the web shortcut viewer when full snapshot import is unavailable.",
      createdAt,
      lastOpenedAt: createdAt,
      language: "und",
      tags: ["shortcut", "fallback"],
      importStatus: "fallback"
    };

    return {
      ...baseJob,
      stage: "shortcut_fallback",
      progress: 100,
      detectedKind: "web_shortcut",
      completeness: "fallback",
      failureReason: error instanceof Error ? error.message : "Unknown import error",
      updatedAt: formatNow(),
      logs: [...baseJob.logs, "Full import failed, created a web shortcut fallback."],
      item
    };
  }
}

export async function importFromBundle(bundle: ImportBundle): Promise<ImportJob> {
  const createdAt = formatNow();
  const dom = new JSDOM(bundle.html, { url: bundle.url });
  const article = new Readability(dom.window.document).parse();
  const articleDom = new JSDOM(`<article>${article?.content ?? dom.window.document.body.innerHTML}</article>`);
  const blocks = createBlocksFromBody(articleDom.window.document, "chapter_1");

  const snapshot = buildSnapshot({
    title: bundle.title,
    sourceUrl: bundle.url,
    blocks,
    importMethod: "bundle",
    confidence: 0.9,
    kind: "snapshot_book"
  });

  const item: LibraryItem = {
    id: createId("item"),
    kind: "snapshot_book",
    title: bundle.title,
    sourceUrl: bundle.url,
    description: snippetFromText(snapshot.fullText, 220),
    createdAt,
    lastOpenedAt: createdAt,
    language: snapshot.language,
    tags: ["bundle", "authenticated"],
    importStatus: "ready",
    snapshot
  };

  return {
    jobId: createId("job"),
    sourceUrl: bundle.url,
    sourceMode: "bundle",
    stage: "completed",
    progress: 100,
    detectedKind: "snapshot_book",
    completeness: snapshot.completeness,
    createdAt,
    updatedAt: formatNow(),
    logs: [
      `Imported capture bundle from ${bundle.url}`,
      `Collected ${bundle.headings.length} headings and ${bundle.links.length} links from the authenticated page.`
    ],
    item
  };
}
