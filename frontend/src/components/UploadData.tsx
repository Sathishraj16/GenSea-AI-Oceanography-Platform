import { useState } from 'react'
import { triggerTrain, uploadDataset } from '../lib/api'

export default function UploadData() {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string>('')

  const onUpload = async () => {
    if (!file) return
    try {
      const res = await uploadDataset(file)
      setMessage(res.message)
    } catch (e: any) {
      setMessage(e?.response?.data?.detail ?? 'Upload failed')
    }
  }

  const onRetrain = async () => {
    const res = await triggerTrain()
    setMessage(res.message)
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold">Upload CSV/Excel</h2>
        <p className="text-white/70 text-sm">Headers required: date, lat, lon, region, sea_temperature, salinity, fish_stock_index, biodiversity_index, eDNA_detected_species, invasive_species_flag</p>
      </div>
      <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div className="flex gap-3">
        <button className="tab-btn bg-white/10" onClick={onUpload} disabled={!file}>Upload & Retrain</button>
        <button className="tab-btn bg-white/10" onClick={onRetrain}>Retrain on Current Data</button>
      </div>
      {message && <div className="text-green-300">{message}</div>}
    </div>
  )
}
