import React from 'react'

type Props = {
  onNavigate: (tab: 'dashboard' | 'data' | 'predict' | 'compass' | 'upload') => void
}

export default function Landing({ onNavigate }: Props) {
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000'
  const imagePath = `${API_BASE}/media/101%20Fondos%20De%20Pantalla%20Mar%20En%20HD%20Para%20PC%20Y%20M%C3%B3vil%20_%20Gratis.jpg`

  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        backgroundImage: `url('${imagePath}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div className="mb-8">
          <div className="text-6xl md:text-7xl font-black tracking-wide">GENSEA</div>
          <div className="mt-2 text-white/80 max-w-2xl">
            Northern Indian Ocean Fisheries & Ecosystem Analytics
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl">
          <button className="tab-btn bg-white/10" onClick={() => onNavigate('dashboard')}>Open Overview</button>
          <button className="tab-btn bg-white/10" onClick={() => onNavigate('data')}>Open Data Catalogue</button>
          <button className="tab-btn bg-white/10" onClick={() => onNavigate('predict')}>Open Forecasting</button>
          <button className="tab-btn bg-white/10" onClick={() => onNavigate('compass')}>Open Field Navigator</button>
        </div>

        <div className="mt-6 text-white/70 text-sm">Use the navigation above to access all dashboards.</div>
      </div>
    </div>
  )
}
