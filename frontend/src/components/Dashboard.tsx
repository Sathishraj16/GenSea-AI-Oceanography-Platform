import { useEffect, useMemo, useState } from 'react'
import { fetchData, fetchMapData } from '../lib/api'
import OceanMap, { MapRow } from './OceanMap'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, ResponsiveContainer } from 'recharts'
import BiodiversityHeatmap from './BiodiversityHeatmap'
import { getAlertStatus, normalizeSpecies } from '../lib/ai'

export default function Dashboard() {
  const [table, setTable] = useState<any[]>([])
  const [mapData, setMapData] = useState<MapRow[]>([])

  useEffect(() => {
    fetchData().then(setTable)
    fetchMapData().then(setMapData)
  }, [])

  const tempSeries = useMemo(() => {
    return table.slice(0, 200).map((r) => ({ date: r.date, sea_temperature: r.sea_temperature, salinity: r.salinity }))
  }, [table])

  const stockByRegion = useMemo(() => {
    const agg: Record<string, { region: string; avg_stock: number; count: number }> = {}
    table.forEach((r) => {
      if (!agg[r.region]) agg[r.region] = { region: r.region, avg_stock: 0, count: 0 }
      agg[r.region].avg_stock += Number(r.fish_stock_index)
      agg[r.region].count += 1
    })
    return Object.values(agg).map((v) => ({ region: v.region, avg_stock: v.avg_stock / v.count }))
  }, [table])

  const insights = useMemo(() => {
    const total = table.length || 1
    let bans = 0
    let conserve = 0
    let invasive = 0
    const invSpeciesFreq: Record<string, number> = {}
    let criticalMsg = ''

    let worstBan: any | null = null
    let worstConserve: any | null = null
    let firstInvasive: any | null = null

    table.forEach((r) => {
      const status = getAlertStatus({
        region: r.region,
        fish_stock_index: r.fish_stock_index,
        biodiversity_index: r.biodiversity_index,
        invasive_species_flag: r.invasive_species_flag,
        eDNA_detected_species: normalizeSpecies(r.eDNA_detected_species),
      })
      if (status === 'invasive') {
        invasive += 1
        firstInvasive = firstInvasive ?? r
        const species = normalizeSpecies(r.eDNA_detected_species)
        species.forEach((s) => (invSpeciesFreq[s] = (invSpeciesFreq[s] || 0) + 1))
      } else if (status === 'ban') {
        bans += 1
        if (!worstBan || r.fish_stock_index < worstBan.fish_stock_index) worstBan = r
      } else if (status === 'conserve') {
        conserve += 1
        if (!worstConserve || r.biodiversity_index < worstConserve.biodiversity_index) worstConserve = r
      }
    })

    // Determine most critical action: prioritize invasive > ban > conserve
    if (firstInvasive) {
      criticalMsg = `🚨 High Risk: Invasive species detected near ${firstInvasive.region}. Immediate containment and monitoring recommended. Review data in the Data Explorer.`
    } else if (worstBan) {
      criticalMsg = `🔴 Fishing Ban: ${worstBan.region} flagged due to low Fish Stock Index (${Number(worstBan.fish_stock_index).toFixed(0)}). Review in Data Explorer.`
    } else if (worstConserve) {
      criticalMsg = `🟡 Conservation Zone: ${worstConserve.region} has low Biodiversity Index (${Number(worstConserve.biodiversity_index).toFixed(0)}). Consider protective measures.`
    } else {
      criticalMsg = '✅ Overall conditions appear sustainable across monitored locations.'
    }

    const topSpecies = Object.entries(invSpeciesFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s, n]) => `${s} (${n})`)

    return {
      total,
      bans,
      conserve,
      invasive,
      banPct: Math.round((bans / total) * 100),
      conservePct: Math.round((conserve / total) * 100),
      invasivePct: Math.round((invasive / total) * 100),
      topSpecies,
      criticalMsg,
    }
  }, [table])

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="text-2xl font-extrabold mb-3">Policy Insights & Action Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="rounded-xl p-4 bg-red-900/30 border border-red-700/40">
            <div className="text-red-300 text-sm">Restricted Zones</div>
            <div className="text-3xl font-bold">{insights.bans}</div>
            <div className="text-white/70 text-sm">{insights.banPct}% of locations</div>
          </div>
          <div className="rounded-xl p-4 bg-amber-900/30 border border-amber-700/40">
            <div className="text-amber-300 text-sm">Conservation Priority</div>
            <div className="text-3xl font-bold">{insights.conserve}</div>
            <div className="text-white/70 text-sm">{insights.conservePct}% of locations</div>
          </div>
          <div className="rounded-xl p-4 bg-red-900/40 border border-red-700/40">
            <div className="text-red-300 text-sm">Invasive Species Risk</div>
            <div className="text-3xl font-bold">{insights.invasive}</div>
            <div className="text-white/70 text-sm">{insights.invasivePct}% of locations</div>
            {insights.topSpecies.length > 0 && (
              <div className="text-white/80 text-sm mt-1">Most frequently detected biota: {insights.topSpecies.join(', ')}</div>
            )}
          </div>
        </div>
        <div className="rounded-xl p-4 bg-white/10 border border-white/20 text-lg">
          <span className="mr-2">🚨</span>
          {insights.criticalMsg}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="text-xl font-bold mb-2">Regional Sea Surface Temperature (SST) Trends</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
                <XAxis dataKey="date" hide/>
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sea_temperature" stroke="#60a5fa" dot={false} />
                <Line type="monotone" dataKey="salinity" stroke="#34d399" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <h2 className="text-xl font-bold mb-2">Fisheries Sustainability Index by Region</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
                <XAxis dataKey="region" tick={{ fill: 'white' }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avg_stock" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Map View</h2>
        <OceanMap data={mapData} />
      </div>

      <div>
        <BiodiversityHeatmap rows={table} />
      </div>
    </div>
  )
}
