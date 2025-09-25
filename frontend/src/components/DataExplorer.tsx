import { useEffect, useState } from 'react'
import { fetchData } from '../lib/api'
import { Row as AIRow, getRecommendation, getAlertStatus, bgForStatus, colorForStatus, normalizeSpecies } from '../lib/ai'

export default function DataExplorer() {
  const [rows, setRows] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'ok' | 'ban' | 'conserve' | 'invasive'>('all')

  useEffect(() => {
    fetchData().then(setRows)
  }, [])

  const headerLabel = (k: string) => {
    const map: Record<string, string> = {
      sea_temperature: 'Sea Surface Temperature (SST)',
      salinity: 'Salinity (ppt)',
      fish_stock_index: 'Fisheries Sustainability Index',
      biodiversity_index: 'Biodiversity Index',
      eDNA_detected_species: 'eDNA Detected Biota',
      invasive_species_flag: 'Invasive Species Flag',
      region: 'Region',
      lat: 'Latitude',
      lon: 'Longitude',
      date: 'Date',
    }
    return map[k] ?? k
  }

  return (
    <div className="card p-4 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Data Catalogue</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-white/80">Policy Advisory Status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-white/10 px-3 py-2 rounded"
          >
            <option value="all">All Locations</option>
            <option value="ok">Authorized: Sustainable Operations</option>
            <option value="ban">Restricted Zone: Policy Intervention</option>
            <option value="conserve">Conservation Priority</option>
            <option value="invasive">Invasive Species Risk</option>
          </select>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-900/80">
            <tr>
              {rows[0] && (
                <>
                  {Object.keys(rows[0]).map((k) => (
                    <th key={k} className="text-left p-2 border-b border-white/10">{headerLabel(k)}</th>
                  ))}
                  <th className="text-left p-2 border-b border-white/10">Policy Advisory</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((r) => {
                if (filter === 'all') return true
                const status = getAlertStatus({
                  region: r.region,
                  fish_stock_index: r.fish_stock_index,
                  biodiversity_index: r.biodiversity_index,
                  invasive_species_flag: r.invasive_species_flag,
                  eDNA_detected_species: normalizeSpecies(r.eDNA_detected_species),
                } as AIRow)
                return status === filter
              })
              .map((r, i) => {
                const status = getAlertStatus({
                  region: r.region,
                  fish_stock_index: r.fish_stock_index,
                  biodiversity_index: r.biodiversity_index,
                  invasive_species_flag: r.invasive_species_flag,
                  eDNA_detected_species: normalizeSpecies(r.eDNA_detected_species),
                } as AIRow)
                const rec = getRecommendation({
                  region: r.region,
                  fish_stock_index: r.fish_stock_index,
                  biodiversity_index: r.biodiversity_index,
                  invasive_species_flag: r.invasive_species_flag,
                } as AIRow)
                return (
                  <tr key={i} className="odd:bg-white/5">
                    {Object.keys(rows[0] || {}).map((k) => (
                      <td key={k} className="p-2 align-top border-b border-white/5">{String(r[k])}</td>
                    ))}
                    <td className={`p-2 align-top border-b border-white/5 font-medium rounded ${bgForStatus(status)} ${colorForStatus(status)}`}>
                      {rec}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
