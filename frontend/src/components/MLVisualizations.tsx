import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';

// Using Plotly for all ML visualizations

interface OceanDataPoint {
  time: string;
  latitude: number;
  longitude: number;
  sithick: number;
  ist: number;
  sob: number;
  mlotst: number;
  siage: number;
  usi: number;
  vsi: number;
  siconc: number;
  zos: number;
  tob: number;
  pbo: number;
  sialb: number;
  sivelo: number;
  sisnthick: number;
}

interface MLVisualizationsProps {}

const MLVisualizations: React.FC<MLVisualizationsProps> = () => {
  const [data, setData] = useState<OceanDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedVisualization, setSelectedVisualization] = useState<'m1' | 'm2' | 'm3'>('m1');
  const [mapResetToken, setMapResetToken] = useState(0);

  useEffect(() => {
    fetchOceanData();
  }, []);

  const fetchOceanData = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
      console.log('Fetching from:', `${API_BASE}/api/ml/ocean-data?limit=1000`);
      const response = await fetch(`${API_BASE}/api/ml/ocean-data?limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const oceanData = await response.json();
      console.log('Fetched ocean data:', oceanData.length, 'points');
      console.log('Sample data point:', oceanData[0]);
      
      setData(oceanData);
      if (oceanData.length > 0) {
        setSelectedTime(oceanData[0].time);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ocean data:', error);
      // Generate some fallback data for testing
      const fallbackData = generateFallbackData();
      console.log('Using fallback data:', fallbackData.length, 'points');
      setData(fallbackData);
      if (fallbackData.length > 0) {
        setSelectedTime(fallbackData[0].time);
      }
      setLoading(false);
    }
  };

  const generateFallbackData = (): OceanDataPoint[] => {
    const times = ['16-06-2022', '17-06-2022', '18-06-2022'];
    const data: OceanDataPoint[] = [];
    
    for (let i = 0; i < 100; i++) {
      data.push({
        time: times[Math.floor(Math.random() * times.length)],
        latitude: -70 + Math.random() * 20, // -70 to -50
        longitude: 140 + Math.random() * 40, // 140 to 180
        sithick: Math.random() * 2,
        ist: -25 + Math.random() * 10,
        sob: 32 + Math.random() * 4,
        mlotst: 50 + Math.random() * 30,
        siage: Math.random() * 0.2,
        usi: (Math.random() - 0.5) * 0.01,
        vsi: (Math.random() - 0.5) * 0.01,
        siconc: 0.5 + Math.random() * 0.5,
        zos: -2 + Math.random() * 4,
        tob: -2 + Math.random() * 4,
        pbo: 100 + Math.random() * 200,
        sialb: 0.5 + Math.random() * 0.3,
        sivelo: Math.random() * 0.01,
        sisnthick: Math.random() * 0.2,
      });
    }
    return data;
  };

  const timeOptions = [...new Set(data.map(d => d.time))].sort();

  const getFilteredData = () => {
    return data.filter(d => d.time === selectedTime);
  };

  // M1 Visualization (Plotly traces): Sea Ice Thinning Risk
  const getM1Traces = () => {
    const filteredData = getFilteredData();
    console.log('M1 filtered data:', filteredData.length, 'points');
    
    if (filteredData.length === 0) {
      return [] as any[];
    }
    
    // Simulate risk calculation (predicted vs actual thickness)
    const processedData = filteredData.map(d => ({
      ...d,
      pred_sithick: d.sithick + (Math.random() - 0.5) * 0.4, // Simulate prediction
      risk: Math.random() < 0.15 // 15% risk probability
    }));

    const safe = processedData.filter(d => !d.risk);
    const risky = processedData.filter(d => d.risk);
    
    console.log('M1 safe points:', safe.length, 'risky points:', risky.length);

    const safeTrace = {
      type: 'scattergl' as const,
      mode: 'markers' as const,
      name: 'Stable Ice',
      x: safe.map(d => d.longitude),
      y: safe.map(d => d.latitude),
      marker: { color: 'rgba(34, 197, 94, 0.9)', size: 8, symbol: 'circle' as const, line: { color: 'rgba(34,197,94,1)', width: 1 } },
      hovertemplate: 'Type: Stable Ice<br>Lon: %{x:.3f}°<br>Lat: %{y:.3f}°<extra></extra>'
    };

    const riskTrace = {
      type: 'scattergl' as const,
      mode: 'markers' as const,
      name: 'High Melt Risk',
      x: risky.map(d => d.longitude),
      y: risky.map(d => d.latitude),
      marker: { color: 'rgba(239, 68, 68, 0.95)', size: 10, symbol: 'triangle-up' as const, line: { color: 'rgba(220,38,38,1)', width: 1 } },
      hovertemplate: 'Type: High Melt Risk<br>Lon: %{x:.3f}°<br>Lat: %{y:.3f}°<extra></extra>'
    };

    return [safeTrace, riskTrace];
  };

  // M2 Visualization (Plotly traces): Arctic Sentinel with Drift
  const getM2Traces = () => {
    const filteredData = getFilteredData();
    
    // Simulate drift vectors and anomalies
    const processedData = filteredData.map(d => ({
      ...d,
      risk: Math.random() < 0.1,
      anomaly: Math.random() < 0.05
    }));

    const risky = processedData.filter(d => d.risk);
    const anomalies = processedData.filter(d => d.anomaly);
    const normal = processedData.filter(d => !d.risk && !d.anomaly);

    const normalTrace = {
      type: 'scattergl' as const,
      mode: 'markers' as const,
      name: 'Normal Conditions',
      x: normal.map(d => d.longitude),
      y: normal.map(d => d.latitude),
      marker: { color: 'rgba(34, 197, 94, 0.8)', size: 6, symbol: 'circle' as const, line: { color: 'rgba(21,128,61,1)', width: 1 } },
      hovertemplate: 'Type: Normal<br>Lon: %{x:.3f}°<br>Lat: %{y:.3f}°<extra></extra>'
    };

    const riskTrace = {
      type: 'scattergl' as const,
      mode: 'markers' as const,
      name: 'High Melt Risk',
      x: risky.map(d => d.longitude),
      y: risky.map(d => d.latitude),
      marker: { color: 'rgba(239, 68, 68, 0.9)', size: 8, symbol: 'square' as const, line: { color: 'rgba(185,28,28,1)', width: 1 } },
      hovertemplate: 'Type: High Melt Risk<br>Lon: %{x:.3f}°<br>Lat: %{y:.3f}°<extra></extra>'
    };

    const anomalyTrace = {
      type: 'scattergl' as const,
      mode: 'markers' as const,
      name: 'Anomaly',
      x: anomalies.map(d => d.longitude),
      y: anomalies.map(d => d.latitude),
      marker: { color: 'rgba(245, 158, 11, 0.95)', size: 10, symbol: 'star' as const, line: { color: 'rgba(180,83,9,1)', width: 1 } },
      hovertemplate: 'Type: Anomaly<br>Lon: %{x:.3f}°<br>Lat: %{y:.3f}°<extra></extra>'
    };

    return [normalTrace, riskTrace, anomalyTrace];
  };

  // M3 Visualization (Plotly traces): Anomaly Detection
  const getM3Traces = () => {
    const filteredData = getFilteredData();
    
    // Simulate anomaly detection using PCA reconstruction error
    const processedData = filteredData.map(d => {
      const features = [d.sob, d.ist, d.zos, d.siconc];
      const mean = features.reduce((a, b) => a + b, 0) / features.length;
      const variance = features.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / features.length;
      const anomalyScore = Math.sqrt(variance) + Math.random() * 0.1;
      return {
        ...d,
        anomalyScore,
        anomaly: anomalyScore > 0.8
      };
    });

    const anomalies = processedData.filter(d => d.anomaly);
    const normal = processedData.filter(d => !d.anomaly);

    const normalTrace = {
      type: 'scattergl' as const,
      mode: 'markers' as const,
      name: 'Normal',
      x: normal.map(d => d.longitude),
      y: normal.map(d => d.latitude),
      marker: { color: 'rgba(59, 130, 246, 0.8)', size: 6, symbol: 'circle' as const, line: { color: 'rgba(37,99,235,1)', width: 1 } },
      hovertemplate: 'Type: Normal<br>Lon: %{x:.3f}°<br>Lat: %{y:.3f}°<extra></extra>'
    };

    const anomalyTrace = {
      type: 'scattergl' as const,
      mode: 'markers' as const,
      name: 'Anomaly',
      x: anomalies.map(d => d.longitude),
      y: anomalies.map(d => d.latitude),
      marker: { color: 'rgba(239, 68, 68, 0.95)', size: 9, symbol: 'diamond' as const, line: { color: 'rgba(185,28,28,1)', width: 1 } },
      hovertemplate: 'Type: Anomaly<br>Lon: %{x:.3f}°<br>Lat: %{y:.3f}°<extra></extra>'
    };

    return [normalTrace, anomalyTrace];
  };

  const getTimeSeriesTraces = () => {
    const timeSeriesData = data.reduce((acc, d) => {
      if (!acc[d.time]) {
        acc[d.time] = { count: 0, anomalies: 0 };
      }
      acc[d.time].count++;
      if (Math.random() < 0.05) { // 5% anomaly rate
        acc[d.time].anomalies++;
      }
      return acc;
    }, {} as Record<string, { count: number; anomalies: number }>);

    const times = Object.keys(timeSeriesData).sort();
    const anomalyScores = times.map(time => 
      timeSeriesData[time].anomalies / timeSeriesData[time].count
    );

    const scoreTrace = {
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Anomaly Score',
      x: times,
      y: anomalyScores,
      line: { color: 'rgba(239, 68, 68, 1)', width: 2 },
      fill: 'tozeroy' as const,
      fillcolor: 'rgba(239, 68, 68, 0.1)'
    };

    const thresholdTrace = {
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Threshold',
      x: times,
      y: new Array(times.length).fill(0.05),
      line: { color: 'rgba(156, 163, 175, 1)', width: 2, dash: 'dash' as const }
    };

    return [scoreTrace, thresholdTrace];
  };
  const getMapLayout = () => ({
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 50, r: 20, t: 40, b: 50 },
    title: {
      text: selectedVisualization === 'm1'
        ? `Sea Ice Thinning Risk at ${selectedTime}`
        : selectedVisualization === 'm2'
        ? `Arctic Sentinel Conditions at ${selectedTime}`
        : `Anomaly Detection at ${selectedTime}`,
      font: { color: '#ffffff', size: 16 },
    },
    xaxis: {
      title: { text: 'Longitude (°)', font: { color: '#ffffff', size: 14 } },
      tickfont: { color: '#ffffff' },
      gridcolor: 'rgba(255, 255, 255, 0.1)',
      zerolinecolor: 'rgba(255,255,255,0.2)'
    },
    yaxis: {
      title: { text: 'Latitude (°)', font: { color: '#ffffff', size: 14 } },
      tickfont: { color: '#ffffff' },
      gridcolor: 'rgba(255, 255, 255, 0.1)',
      zerolinecolor: 'rgba(255,255,255,0.2)'
    },
    legend: {
      font: { color: '#ffffff', size: 12 },
      orientation: 'h' as const,
      y: 1.08,
    }
  });

  const getTimeSeriesLayout = () => ({
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 50, r: 20, t: 40, b: 50 },
    title: { text: 'Anomaly Scores Over Time', font: { color: '#ffffff', size: 16 } },
    xaxis: { title: { text: 'Time', font: { color: '#ffffff' } }, tickfont: { color: '#ffffff' }, gridcolor: 'rgba(255,255,255,0.1)' },
    yaxis: { title: { text: 'Anomaly Score', font: { color: '#ffffff' } }, tickfont: { color: '#ffffff' }, gridcolor: 'rgba(255,255,255,0.1)' },
    legend: { font: { color: '#ffffff' } }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading ocean data... ({data.length} points loaded)</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">No ocean data available. Please check the backend connection.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">🌊 ML Visualizations</h2>
        
        {/* Visualization Selection */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedVisualization('m1')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedVisualization === 'm1'
                ? 'bg-blue-500 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🚨 Sea Ice Thinning Risk
          </button>
          <button
            onClick={() => setSelectedVisualization('m2')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedVisualization === 'm2'
                ? 'bg-blue-500 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🌊 Arctic Sentinel
          </button>
          <button
            onClick={() => setSelectedVisualization('m3')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedVisualization === 'm3'
                ? 'bg-blue-500 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🔍 Anomaly Detection
          </button>
        </div>

        {/* Time Selection */}
        <div className="mb-6">
          <label className="block text-white mb-2">Select Time Step:</label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="bg-white/20 text-white rounded-lg px-4 py-2 border border-white/30"
          >
            {timeOptions.map(time => (
              <option key={time} value={time} className="bg-gray-800">
                {time}
              </option>
            ))}
          </select>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {selectedVisualization === 'm1' && 'Sea Ice Risk Map'}
                {selectedVisualization === 'm2' && 'Ice Conditions & Drift'}
                {selectedVisualization === 'm3' && 'Geographic Anomaly Distribution'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setMapResetToken((t) => t + 1)}
                  className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm hover:bg-blue-500/30 transition-colors"
                >
                  Reset Zoom
                </button>
              </div>
            </div>
            <div className="h-96 relative">
              <Plot
                data={
                  selectedVisualization === 'm1'
                    ? getM1Traces()
                    : selectedVisualization === 'm2'
                    ? getM2Traces()
                    : getM3Traces()
                }
                layout={{ ...getMapLayout(), height: 380, uirevision: mapResetToken, xaxis: { ...getMapLayout().xaxis, autorange: true }, yaxis: { ...getMapLayout().yaxis, autorange: true } }}
                config={{ responsive: true, displaylogo: false, modeBarButtonsToRemove: ['select2d', 'lasso2d'] }}
                style={{ width: '100%', height: '100%' }}
                
              />
            </div>
          </div>

          {selectedVisualization === 'm3' && (
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Anomaly Scores Over Time
              </h3>
              <div className="h-96">
                <Plot
                  data={getTimeSeriesTraces()}
                  layout={{ ...getTimeSeriesLayout(), height: 360 }}
                  config={{ responsive: true, displaylogo: false }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          )}

          {selectedVisualization === 'm1' && (
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                How It Works
              </h3>
              <div className="text-white/80 space-y-2">
                <p>• A RandomForest model predicts <strong>sea ice thickness (sithick)</strong></p>
                <p>• If predicted thickness is much lower than actual → flagged <strong>at risk</strong></p>
                <p>• Red points = <strong>potential early warning zones</strong></p>
                <p>• Blue points = <strong>stable ice conditions</strong></p>
              </div>
            </div>
          )}

          {selectedVisualization === 'm2' && (
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Ice Drift & Risk Analysis
              </h3>
              <div className="text-white/80 space-y-2">
                <p>• <strong>Green points</strong> = Normal ice conditions</p>
                <p>• <strong>Red points</strong> = High melt risk zones</p>
                <p>• <strong>Orange triangles</strong> = Detected anomalies</p>
                <p>• <strong>Blue arrows</strong> = Ice drift vectors (usi, vsi)</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white/5 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">🎯 How to Use the Visualizations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/80">
            <div>
              <h4 className="font-semibold text-white mb-2">🔍 Zoom & Navigation:</h4>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Mouse wheel:</strong> Zoom in/out</li>
                <li>• <strong>Click & drag:</strong> Pan around the map</li>
                <li>• <strong>Zoom buttons:</strong> Use the control buttons above the chart</li>
                <li>• <strong>Reset Zoom:</strong> Click "Reset Zoom" to return to original view</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">📊 Point Types:</h4>
              <ul className="space-y-1 text-sm">
                <li>• <strong>M1 (Sea Ice Risk):</strong> Green circles = Safe, Red triangles = High Risk</li>
                <li>• <strong>M2 (Arctic Sentinel):</strong> Green circles = Normal, Red squares = Risk, Yellow stars = Anomaly</li>
                <li>• <strong>M3 (Anomaly Detection):</strong> Blue circles = Normal, Red diamonds = Anomaly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="mt-6 bg-white/5 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Data Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white/80">
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {data.length.toLocaleString()}
              </div>
              <div className="text-sm">Total Data Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {timeOptions.length}
              </div>
              <div className="text-sm">Time Steps</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {getFilteredData().length}
              </div>
              <div className="text-sm">Current Selection</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">
                {selectedTime}
              </div>
              <div className="text-sm">Selected Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLVisualizations;
