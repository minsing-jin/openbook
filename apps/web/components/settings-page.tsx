"use client";

import { useOpenBook } from "./openbook-provider";

export function SettingsPage() {
  const { ready, state, updateReaderPreferences, updateSettings } = useOpenBook();

  if (!ready) {
    return <section className="page-shell">Loading settings…</section>;
  }

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Reader preferences and OpenAI connection</h2>
        </div>
      </div>

      <div className="settings-grid">
        <article className="panel">
          <h3>OpenAI settings</h3>
          <div className="field-group">
            <label htmlFor="api-key">API key</label>
            <input
              id="api-key"
              className="text-input"
              type="password"
              value={state.settings.openAIApiKey}
              onChange={(event) => updateSettings({ openAIApiKey: event.target.value })}
              placeholder="sk-..."
            />
          </div>
          <div className="field-group">
            <label htmlFor="model-name">Model</label>
            <input
              id="model-name"
              className="text-input"
              value={state.settings.openAIApiModel}
              onChange={(event) => updateSettings({ openAIApiModel: event.target.value })}
            />
          </div>
          <div className="field-group">
            <label htmlFor="capture-mode">Capture mode</label>
            <select
              id="capture-mode"
              className="text-input"
              value={state.settings.captureMode}
              onChange={(event) =>
                updateSettings({
                  captureMode: event.target.value as "browser-extension" | "in-app-webview"
                })
              }
            >
              <option value="browser-extension">Browser extension</option>
              <option value="in-app-webview">In-app WebView</option>
            </select>
          </div>
        </article>

        <article className="panel">
          <h3>Reader preferences</h3>
          <div className="field-group">
            <label htmlFor="font-scale">Font scale</label>
            <input
              id="font-scale"
              className="text-input"
              type="number"
              min="0.8"
              max="1.6"
              step="0.1"
              value={state.readerPreferences.fontScale}
              onChange={(event) => updateReaderPreferences({ fontScale: Number(event.target.value) })}
            />
          </div>
          <div className="field-group">
            <label htmlFor="line-height">Line height</label>
            <input
              id="line-height"
              className="text-input"
              type="number"
              min="1.3"
              max="2.2"
              step="0.1"
              value={state.readerPreferences.lineHeight}
              onChange={(event) => updateReaderPreferences({ lineHeight: Number(event.target.value) })}
            />
          </div>
          <div className="field-group">
            <label htmlFor="page-limit">Characters per virtual page</label>
            <input
              id="page-limit"
              className="text-input"
              type="number"
              min="400"
              max="1600"
              step="50"
              value={state.readerPreferences.pageCharLimit}
              onChange={(event) => updateReaderPreferences({ pageCharLimit: Number(event.target.value) })}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
