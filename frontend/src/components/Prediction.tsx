import { useEffect, useMemo, useState } from 'react'
import { fetchMetrics, predict } from '../lib/api'
import { buildVerboseReport } from '../lib/ai'

export default function Prediction() {
  const [metrics, setMetrics] = useState<{ regression_r2?: number; classification_accuracy?: number; classification_f1?: number }>({})
  const [input, setInput] = useState({
    date: '2025-01-01',
    lat: 20,
    lon: 80,
    region: 'Indian Ocean',
    sea_temperature: 22,
    salinity: 34,
    biodiversity_index: 60,
    eDNA_detected_species: ['Tuna', 'Mackerel'],
    invasive_species_flag: 'no',
  })
  const [result, setResult] = useState<any | null>(null)
  const [report, setReport] = useState<string>('')

  useEffect(() => {
    fetchMetrics().then(setMetrics)
  }, [])

  const submit = async () => {
    const res = await predict([input])
    setResult(res)
    const rep = buildVerboseReport({
      input: {
        region: input.region,
        sea_temperature: Number(input.sea_temperature),
        salinity: Number(input.salinity),
        biodiversity_index: Number(input.biodiversity_index),
        eDNA_detected_species: Array.isArray(input.eDNA_detected_species)
          ? input.eDNA_detected_species
          : String(input.eDNA_detected_species).split(',').map((s) => s.trim()).filter(Boolean),
        invasive_species_flag: input.invasive_species_flag,
      },
      fishPred: Number(res.fish_stock_predictions[0]),
      riskPred: String(res.biodiversity_risk_predictions[0]),
    })
    setReport(rep)
  }

  const metricCards = useMemo(() => ([
    { title: 'R² (Regression)', value: metrics.regression_r2?.toFixed(3) ?? '–' },
    { title: 'Accuracy (Classification)', value: metrics.classification_accuracy?.toFixed(3) ?? '–' },
    { title: 'F1 (Classification)', value: metrics.classification_f1?.toFixed(3) ?? '–' },
  ]), [metrics])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricCards.map((m) => (
          <div key={m.title} className="card p-4">
            <div className="text-white/70">{m.title}</div>
            <div className="text-2xl font-bold">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h3 className="text-lg font-bold mb-4">Predict</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.keys(input).map((k) => (
            <div key={k} className="space-y-1">
              <label className="text-sm text-white/80">{k}</label>
              {Array.isArray((input as any)[k]) ? (
                <input className="w-full px-3 py-2 rounded bg-white/10" value={(input as any)[k].join(',')} onChange={(e) => setInput({ ...input, [k]: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
              ) : (
                <input className="w-full px-3 py-2 rounded bg-white/10" value={String((input as any)[k])} onChange={(e) => setInput({ ...input, [k]: isNaN(Number((input as any)[k])) ? e.target.value : Number(e.target.value) })} />
              )}
            </div>
          ))}
        </div>
        <button className="mt-4 tab-btn bg-white/10" onClick={submit}>Run Prediction</button>

        {result && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="text-white/70">Fish Stock Prediction</div>
              <div className="text-2xl font-bold">{Number(result.fish_stock_predictions[0]).toFixed(2)}</div>
            </div>
            <div className="card p-4">
              <div className="text-white/70">Biodiversity Risk</div>
              <div className="text-2xl font-bold capitalize">{result.biodiversity_risk_predictions[0]}</div>
            </div>
            <div className="card p-4">
              <div className="text-white/70">Policy Advisory</div>
              <div className="text-lg">{result.recommendations[0]}</div>
            </div>
          </div>
        )}

        {report && (
          <div className="mt-6 typewriter-card">
            <div className="text-sm uppercase tracking-widest text-white/70 mb-2">Agentic AI Report</div>
            <pre className="whitespace-pre-wrap font-mono text-[0.95rem] leading-6">{report}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
