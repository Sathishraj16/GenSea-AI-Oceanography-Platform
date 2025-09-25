import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

export type MapRow = {
  lat: number
  lon: number
  region: string
  sea_temperature: number
  salinity: number
  fish_stock_index: number
  biodiversity_index: number
  eDNA_detected_species: string[]
  invasive_species_flag: string
  ai_recommendation: string
}

export default function OceanMap({ data }: { data: MapRow[] }) {
  const getColor = (row: MapRow) => {
    if (row.invasive_species_flag?.toLowerCase() === 'yes') return '#b91c1c' // deep red-700
    if (row.fish_stock_index < 30 || row.biodiversity_index < 40) return '#b45309' // amber-700
    return '#065f46' // emerald-800
  }

  return (
    <div className="card h-[600px] overflow-hidden">
      <MapContainer center={[15, 80]} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OSM</a> &copy; <a href='https://carto.com/attributions'>CARTO</a>"
        />
        {data.map((row, i) => (
          <CircleMarker key={i} center={[row.lat, row.lon]} pathOptions={{ color: getColor(row), fillColor: getColor(row), fillOpacity: 0.7 }} radius={8}>
            <Popup>
              <b>{row.region}</b><br />
              SST: {row.sea_temperature}°C<br />
              Fisheries Sustainability Index: {row.fish_stock_index}<br />
              Biodiversity Index: {row.biodiversity_index}<br />
              Policy Advisory: {row.ai_recommendation}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
