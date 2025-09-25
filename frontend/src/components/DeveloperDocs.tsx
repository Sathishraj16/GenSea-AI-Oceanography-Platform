import React from 'react'

export default function DeveloperDocs() {
  const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000'
  const key = 'GENSEA-2024'

  const curl = {
    raw: `curl -s "${apiBase}/api/v1/data/raw?limit=5&api_key=${key}"`,
    summary: `curl -s -H "x-api-key: ${key}" "${apiBase}/api/v1/data/summary"`,
    alerts: `curl -s "${apiBase}/api/v1/ai/alerts?api_key=${key}&limit=5"`,
    ml: `curl -s -H "x-api-key: ${key}" "${apiBase}/api/v1/ml/predictions?sample=5"`,
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="text-2xl font-extrabold mb-2">Developer API</h2>
        <p className="text-white/80">All endpoints are versioned under <code>/api/v1</code> and require an API key via <code>x-api-key</code> header or <code>?api_key=</code> query.</p>
        <p className="text-white/70">Default key (hackathon): <code>{key}</code></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-bold mb-2">Raw Data</h3>
          <p className="text-white/80 text-sm mb-2">GET <code>/api/v1/data/raw</code></p>
          <pre className="bg-black/40 p-3 rounded text-sm whitespace-pre-wrap">{curl.raw}</pre>
        </div>
        <div className="card p-4">
          <h3 className="font-bold mb-2">Summary Metrics</h3>
          <p className="text-white/80 text-sm mb-2">GET <code>/api/v1/data/summary</code></p>
          <pre className="bg-black/40 p-3 rounded text-sm whitespace-pre-wrap">{curl.summary}</pre>
        </div>
        <div className="card p-4">
          <h3 className="font-bold mb-2">AI Alerts</h3>
          <p className="text-white/80 text-sm mb-2">GET <code>/api/v1/ai/alerts</code></p>
          <pre className="bg-black/40 p-3 rounded text-sm whitespace-pre-wrap">{curl.alerts}</pre>
        </div>
        <div className="card p-4">
          <h3 className="font-bold mb-2">ML Predictions</h3>
          <p className="text-white/80 text-sm mb-2">GET <code>/api/v1/ml/predictions</code></p>
          <pre className="bg-black/40 p-3 rounded text-sm whitespace-pre-wrap">{curl.ml}</pre>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-bold mb-2">Why this API?</h3>
        <p className="text-white/80">Seamless integration allows partners to feed real-time insights directly into their internal GIS systems and policy dashboards, removing dependency on the UI and enabling machine-to-machine workflows.</p>
      </div>
    </div>
  )
}
