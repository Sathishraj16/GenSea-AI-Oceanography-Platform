import { useMemo } from 'react'

function colorForValue(v: number | null) {
  if (v === null) return 'bg-gray-600/30'
  // 0..100 -> red..green gradient
  const hue = Math.round((v / 100) * 120) // 0 red -> 120 green
  return `bg-[hsl(${hue},70%,45%)]`
}

export default function BiodiversityHeatmap({ rows }: { rows: any[] }) {
  const { regions, months, grid } = useMemo(() => {
    const byKey: Record<string, { sum: number; count: number }> = {}
    const regionsSet = new Set<string>()
    const monthsSet = new Set<string>()
    rows.forEach((r) => {
      const region = r.region
      const month = String(r.date).slice(0, 7) // YYYY-MM
      regionsSet.add(region)
      monthsSet.add(month)
      const key = region + '|' + month
      if (!byKey[key]) byKey[key] = { sum: 0, count: 0 }
      byKey[key].sum += Number(r.biodiversity_index)
      byKey[key].count += 1
    })
    const regions = Array.from(regionsSet)
    const months = Array.from(monthsSet).sort()
    const grid: (number | null)[][] = regions.map(() => months.map(() => null))
    regions.forEach((region, i) => {
      months.forEach((month, j) => {
        const key = region + '|' + month
        const entry = byKey[key]
        grid[i][j] = entry ? entry.sum / entry.count : null
      })
    })
    return { regions, months, grid }
  }, [rows])

  return (
    <div className="card p-4">
      <h2 className="text-xl font-bold mb-3">Biodiversity Heatmap (Region x Month)</h2>
      <div className="overflow-auto">
        <table className="text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left">Region \ Month</th>
              {months.map((m) => (
                <th key={m} className="p-2 text-xs text-white/80">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regions.map((r, i) => (
              <tr key={r}>
                <td className="p-2 pr-4 font-medium">{r}</td>
                {months.map((m, j) => (
                  <td key={m} className="p-1">
                    <div className={`w-8 h-8 rounded ${colorForValue(grid[i][j])}`} title={`${r} ${m}: ${grid[i][j]?.toFixed(1) ?? 'N/A'}`}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
