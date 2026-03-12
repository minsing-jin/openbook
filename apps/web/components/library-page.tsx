"use client";

import type { ImportBundle, ImportJob, LibraryItem } from "@openbook/core";
import { sortLibrary, summarizeItem } from "@openbook/core";
import Link from "next/link";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { useOpenBook } from "./openbook-provider";

function ImportStatus({ job }: { job: ImportJob }) {
  return (
    <article className="job-card">
      <div className="job-row">
        <strong>{job.item?.title ?? job.sourceUrl}</strong>
        <span className={`badge badge-${job.stage}`}>{job.stage.replace(/_/g, " ")}</span>
      </div>
      <p>{job.logs[job.logs.length - 1]}</p>
      {job.failureReason ? <p className="job-error">{job.failureReason}</p> : null}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${job.progress}%` }} />
      </div>
    </article>
  );
}

function LibraryCard({ item }: { item: LibraryItem }) {
  return (
    <article className="library-card">
      <div className="library-card-header">
        <span className="badge badge-soft">{item.kind.replace(/_/g, " ")}</span>
        <span className="timestamp">{new Date(item.createdAt).toLocaleString()}</span>
      </div>
      <h3>{item.title}</h3>
      <p>{summarizeItem(item)}</p>
      <div className="tag-row">
        {item.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
      <div className="card-actions">
        <Link className="button button-primary" href={`/reader/${item.id}`}>
          Open reader
        </Link>
        <a className="button button-ghost" href={item.sourceUrl} target="_blank" rel="noreferrer">
          Open source
        </a>
      </div>
    </article>
  );
}

export function LibraryPage() {
  const { ready, state, importBundle, importPdfFile, importUrl, resetDemo } = useOpenBook();
  const [url, setUrl] = useState("");
  const [bundleText, setBundleText] = useState("");
  const [activeTab, setActiveTab] = useState<"books" | "blogs">("books");
  const [activeImportSource, setActiveImportSource] = useState<"url" | "bundle" | "pdf">("url");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bookCount = state.library.filter((item) => item.kind !== "blog_snapshot").length;
  const blogCount = state.library.filter((item) => item.kind === "blog_snapshot").length;

  const items = useMemo(() => {
    const sorted = sortLibrary(state.library);
    return sorted.filter((item) =>
      activeTab === "books"
        ? item.kind !== "blog_snapshot"
        : item.kind === "blog_snapshot"
    );
  }, [activeTab, state.library]);

  async function handleUrlImport() {
    if (!url.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await importUrl(url.trim());
      setUrl("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBundleImport() {
    if (!bundleText.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const bundle = JSON.parse(bundleText) as ImportBundle;
      await importBundle(bundle);
      setBundleText("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePdfImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsSubmitting(true);
    try {
      await importPdfFile(file);
      event.target.value = "";
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!ready) {
    return <section className="page-shell">Loading OpenBook…</section>;
  }

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Keep the books you can already read at the top</h2>
        </div>
        <button className="button button-ghost" type="button" onClick={resetDemo}>
          Reset demo data
        </button>
      </div>

      <article className="panel library-panel library-panel-priority">
        <div className="panel-heading panel-heading-stack">
          <div>
            <p className="eyebrow">{activeTab === "books" ? "Books" : "Blogs"}</p>
            <h3>{activeTab === "books" ? "Imported books and reader-ready sources" : "Saved blog captures"}</h3>
          </div>
          <div className="library-toolbar">
            <div className="segmented-control">
              <button
                type="button"
                className={activeTab === "books" ? "segment segment-active" : "segment"}
                onClick={() => setActiveTab("books")}
              >
                Books
              </button>
              <button
                type="button"
                className={activeTab === "blogs" ? "segment segment-active" : "segment"}
                onClick={() => setActiveTab("blogs")}
              >
                Blogs
              </button>
            </div>
            <p className="collection-meta">{activeTab === "books" ? `${bookCount} books ready to open` : `${blogCount} blogs saved`}</p>
          </div>
        </div>
        <div className="library-grid">
          {items.map((item) => (
            <LibraryCard key={item.id} item={item} />
          ))}
        </div>
      </article>

      <div className="library-dashboard-grid">
        <article className="panel job-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Import jobs</p>
              <h3>Watch the capture queue</h3>
            </div>
          </div>
          <div className="job-list">
            {state.importJobs.length === 0 ? <p className="empty-state">No imports yet. Start with a URL or capture bundle.</p> : null}
            {state.importJobs.map((job) => (
              <ImportStatus key={job.jobId} job={job} />
            ))}
          </div>
        </article>
        <article className="panel import-selector-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Import sources</p>
              <h3>Choose how to bring in the next book</h3>
            </div>
            <p className="collection-meta">Click a source to open its box</p>
          </div>

          <div className="import-source-switcher">
            <button
              type="button"
              className={activeImportSource === "url" ? "source-trigger source-trigger-active" : "source-trigger"}
              onClick={() => setActiveImportSource("url")}
            >
              <strong>URL capture</strong>
              <span>Live book page</span>
            </button>
            <button
              type="button"
              className={activeImportSource === "bundle" ? "source-trigger source-trigger-active" : "source-trigger"}
              onClick={() => setActiveImportSource("bundle")}
            >
              <strong>Auth bundle</strong>
              <span>Extension JSON</span>
            </button>
            <button
              type="button"
              className={activeImportSource === "pdf" ? "source-trigger source-trigger-active" : "source-trigger"}
              onClick={() => setActiveImportSource("pdf")}
            >
              <strong>PDF upload</strong>
              <span>Local file</span>
            </button>
          </div>

          <div className="import-drawer">
            {activeImportSource === "url" ? (
              <article className="import-drawer-card">
                <h3>URL import task</h3>
                <p>Paste a reading page and let OpenBook try PDF detection, DOM extraction, then fallback formatting.</p>
                <div className="field-group">
                  <label htmlFor="book-url">Book or reading page URL</label>
                  <input
                    id="book-url"
                    className="text-input"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://reader.example.com/chapter/1"
                  />
                </div>
                <div className="card-actions">
                  <button className="button button-primary" type="button" onClick={handleUrlImport} disabled={isSubmitting}>
                    Start import
                  </button>
                </div>
              </article>
            ) : null}

            {activeImportSource === "bundle" ? (
              <article className="import-drawer-card">
                <h3>Authenticated capture bundle</h3>
                <p>Paste the JSON bundle emitted by the extension when the book is open in a logged-in browser tab.</p>
                <div className="field-group">
                  <label htmlFor="bundle-input">Extension bundle JSON</label>
                  <textarea
                    id="bundle-input"
                    className="text-area"
                    value={bundleText}
                    onChange={(event) => setBundleText(event.target.value)}
                    placeholder='{"url":"https://reader.example.com","title":"Captured chapter","html":"..."}'
                  />
                </div>
                <div className="card-actions">
                  <button className="button button-primary" type="button" onClick={handleBundleImport} disabled={isSubmitting}>
                    Import bundle
                  </button>
                </div>
              </article>
            ) : null}

            {activeImportSource === "pdf" ? (
              <article className="import-drawer-card">
                <h3>PDF import</h3>
                <p>Upload a PDF to add an offline-first book entry to the shelf.</p>
                <div className="field-group">
                  <label htmlFor="pdf-file">Choose a PDF file</label>
                  <input id="pdf-file" type="file" accept="application/pdf" onChange={handlePdfImport} />
                </div>
                <p className="fine-print">Large PDFs are stored in browser-local state for the current MVP shell.</p>
              </article>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
