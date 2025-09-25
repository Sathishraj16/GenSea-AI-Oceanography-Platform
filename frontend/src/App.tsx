import { useState } from 'react'
import Dashboard from './components/Dashboard'
import DataExplorer from './components/DataExplorer'
import Prediction from './components/Prediction'
import UploadData from './components/UploadData'
import FishermansCompass from './components/FishermansCompass'
import Landing from './components/Landing'
import DeveloperDocs from './components/DeveloperDocs'
import MLVisualizations from './components/MLVisualizations'

const tabs = [
  { id: 'dashboard', label: '📊 Overview' },
  { id: 'data', label: '🗂 Data Catalogue' },
  { id: 'predict', label: '📈 Forecasting & Advisory' },
  { id: 'compass', label: '🧭 Field Navigator' },
  { id: 'ml', label: '🤖 ML Visualizations' },
  { id: 'upload', label: '📥 Data Ingestion' },
  { id: 'developer', label: '🧩 Developer' },
] as const

type TabId = typeof tabs[number]['id']

export default function App() {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [showLanding, setShowLanding] = useState(true)

  return (
    <div className="min-h-screen">
      {showLanding ? (
        <Landing onNavigate={(t) => { setTab(t); setShowLanding(false) }} />
      ) : (
      <>
      <header className="p-6 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">GENSEA: Northern Indian Ocean Fisheries & Ecosystem Analytics</h1>
        <div className="flex items-center gap-3">
          <p className="text-white/80 hidden md:block">Bay of Bengal · Arabian Sea · Laccadive Sea · Andaman Sea</p>
          <button className="tab-btn bg-white/10" onClick={() => setShowLanding(true)}>Launch</button>
        </div>
      </header>

      <nav className="px-6 flex gap-2">
        {tabs.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'bg-white/20' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="p-6">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'data' && <DataExplorer />}
        {tab === 'predict' && <Prediction />}
        {tab === 'compass' && <FishermansCompass />}
        {tab === 'ml' && <MLVisualizations />}
        {tab === 'upload' && <UploadData />}
        {tab === 'developer' && <DeveloperDocs />}
      </main>

      <footer className="p-6 text-center text-white/70">
        Built for Hackathons · Ocean-themed UI · React + FastAPI
      </footer>
      </>
      )}
    </div>
  )
}
