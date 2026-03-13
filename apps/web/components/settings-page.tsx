"use client";

import { AI_MODEL_PRESETS, AI_PROVIDER_LABELS, DEFAULT_AI_MODELS, type AIProvider } from "@openbook/core";
import { useOpenBook } from "./openbook-provider";

export function SettingsPage() {
  const { ready, state, updateReaderPreferences, updateSettings } = useOpenBook();

  if (!ready) {
    return <section className="page-shell">Loading settings…</section>;
  }

  const activeProvider = state.settings.aiProvider;
  const activeApiKey = state.settings.apiKeys[activeProvider] ?? "";

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Reader preferences and model access</h2>
        </div>
      </div>

      <div className="settings-grid">
        <article className="panel">
          <h3>AI providers</h3>
          <div className="field-group">
            <label htmlFor="provider-name">Provider</label>
            <select
              id="provider-name"
              className="text-input"
              value={activeProvider}
              onChange={(event) => {
                const provider = event.target.value as AIProvider;
                updateSettings({
                  aiProvider: provider,
                  aiModel: DEFAULT_AI_MODELS[provider]
                });
              }}
            >
              {Object.entries(AI_PROVIDER_LABELS).map(([provider, label]) => (
                <option key={provider} value={provider}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="api-key">API key</label>
            <input
              id="api-key"
              className="text-input"
              type="password"
              value={activeApiKey}
              onChange={(event) =>
                updateSettings({
                  apiKeys: {
                    [activeProvider]: event.target.value
                  }
                })
              }
              placeholder={activeProvider === "openai" || activeProvider === "xai" ? "sk-..." : "Enter API key"}
            />
          </div>
          <div className="field-group">
            <label htmlFor="model-name">Model</label>
            <input
              id="model-name"
              className="text-input"
              value={state.settings.aiModel}
              onChange={(event) => updateSettings({ aiModel: event.target.value })}
            />
          </div>
          <div className="field-group">
            <label>Suggested models</label>
            <div className="preset-grid">
              {AI_MODEL_PRESETS[activeProvider].map((model) => (
                <button
                  key={model}
                  className={state.settings.aiModel === model ? "segment segment-active" : "segment"}
                  type="button"
                  onClick={() => updateSettings({ aiModel: model })}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
          <p className="fine-print">Keys stay in browser-local storage in this MVP and are sent only when you ask the current book.</p>
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
