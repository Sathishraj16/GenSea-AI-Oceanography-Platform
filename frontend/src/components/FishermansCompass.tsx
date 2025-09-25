import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet'
import { fetchMapData } from '../lib/api'
import { getAlertStatus } from '../lib/ai'

export type SimpleRow = {
  lat: number
  lon: number
  region: string
  fish_stock_index: number
  biodiversity_index: number
  invasive_species_flag: string
}

function haversine(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function CenterTracker({ onChange }: { onChange: (center: [number, number]) => void }) {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter()
      onChange([c.lat, c.lng])
    },
  })
  return null
}

function verdictForStatus(status: 'ok' | 'ban' | 'conserve' | 'invasive') {
  if (status === 'invasive') return { color: 'red', text: 'AVOID THIS ZONE', desc: 'Elevated ecological risk and low expected return.' }
  if (status === 'ban') return { color: 'red', text: 'AVOID THIS ZONE', desc: 'Restricted zone. Policy intervention recommended.' }
  if (status === 'conserve') return { color: 'amber', text: 'PROCEED WITH CAUTION', desc: 'Conservation priority area. Returns may be limited.' }
  return { color: 'green', text: 'FISH HERE SAFELY', desc: 'Favourable conditions for sustainable operations.' }
}

function popupForStatus(status: 'ok' | 'ban' | 'conserve' | 'invasive') {
  if (status === 'invasive') return { title: 'Restricted: Invasive Species Risk', benefit: 'Low expected yield; ecological harm likely.' }
  if (status === 'ban') return { title: 'Restricted Zone: Policy Intervention', benefit: 'Low stock levels; avoid operational losses.' }
  if (status === 'conserve') return { title: 'Conservation Priority', benefit: 'Proceed cautiously; expected returns are limited.' }
  return { title: 'Authorized: Sustainable Operations', benefit: 'Favourable conditions; efficient effort expected.' }
}

export default function FishermansCompass() {
  const [rows, setRows] = useState<SimpleRow[]>([])
  const [center, setCenter] = useState<[number, number]>([15, 80])

  useEffect(() => {
    fetchMapData().then((data) => {
      // simplify to required fields only
      const simple = data.map((r: any) => ({
        lat: r.lat,
        lon: r.lon,
        region: r.region,
        fish_stock_index: Number(r.fish_stock_index),
        biodiversity_index: Number(r.biodiversity_index),
        invasive_species_flag: String(r.invasive_species_flag),
      }))
      setRows(simple)
    })
  }, [])

  const nearest = useMemo(() => {
    if (!rows.length) return null
    let best = rows[0]
    let bestD = haversine(center, [best.lat, best.lon])
    for (const r of rows) {
      const d = haversine(center, [r.lat, r.lon])
      if (d < bestD) {
        best = r
        bestD = d
      }
    }
    const status = getAlertStatus({
      region: best.region,
      fish_stock_index: best.fish_stock_index,
      biodiversity_index: best.biodiversity_index,
      invasive_species_flag: best.invasive_species_flag,
    } as any)
    return { row: best, distanceKm: bestD, status }
  }, [rows, center])

  const verdict = useMemo(() => {
    if (!nearest) return null
    return verdictForStatus(nearest.status)
  }, [nearest])

  const colorFor = (row: SimpleRow) => {
    const status = getAlertStatus({
      region: row.region,
      fish_stock_index: row.fish_stock_index,
      biodiversity_index: row.biodiversity_index,
      invasive_species_flag: row.invasive_species_flag,
    } as any)
    if (status === 'invasive') return 'red'
    if (status === 'ban' || status === 'conserve') return 'yellow'
    return 'green'
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Fisherman\'s Compass</h2>
          <p className="text-white/70">Actionable guidance for where to fish—fast.</p>
        </div>
        {nearest && verdict && (
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-lg font-extrabold uppercase ${verdict.color === 'green' ? 'border-green-400 text-green-300' : verdict.color === 'yellow' ? 'border-yellow-400 text-yellow-300' : 'border-red-400 text-red-300'}`}>
              {verdict.color === 'green' ? 'SAFE' : verdict.color === 'yellow' ? 'CAUTION' : 'STOP'}
            </div>
            <div>
              <div className="text-2xl font-black">{verdict.text}</div>
              <div className="text-white/80">Using this information saves you fuel and time, and protects your future catch.</div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ height: '70vh' }}>
        <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OSM &copy; CARTO"
          />
          <CenterTracker onChange={setCenter} />
          {rows.map((row, i) => {
            const status = getAlertStatus({
              region: row.region,
              fish_stock_index: row.fish_stock_index,
              biodiversity_index: row.biodiversity_index,
              invasive_species_flag: row.invasive_species_flag,
            } as any)
            const popup = popupForStatus(status)
            return (
              <CircleMarker
                key={i}
                center={[row.lat, row.lon]}
                pathOptions={{
                  color: colorFor(row) === 'red' ? '#b91c1c' : colorFor(row) === 'yellow' ? '#b45309' : '#065f46',
                  fillColor: colorFor(row) === 'red' ? '#b91c1c' : colorFor(row) === 'yellow' ? '#b45309' : '#065f46',
                  fillOpacity: 0.8,
                }}
                radius={10}
              >
                <Popup>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{popup.title}</div>
                  <div style={{ fontSize: '0.95rem' }}>{popup.benefit}</div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
