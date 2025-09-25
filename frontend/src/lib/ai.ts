export type Row = {
  region: string
  fish_stock_index?: number
  biodiversity_index: number
  invasive_species_flag: string
  eDNA_detected_species?: string[] | string
}

export function normalizeSpecies(v: Row['eDNA_detected_species']): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export type AlertStatus = 'invasive' | 'ban' | 'conserve' | 'ok'

export function getAlertStatus(row: Row): AlertStatus {
  const invasive = String(row.invasive_species_flag || '').toLowerCase() === 'yes'
  const fish = Number(row.fish_stock_index ?? Infinity)
  const bio = Number(row.biodiversity_index)
  if (invasive) return 'invasive'
  if (fish < 30) return 'ban'
  if (bio < 40) return 'conserve'
  return 'ok'
}

export function getRecommendation(row: Row): string {
  const status = getAlertStatus(row)
  if (status === 'invasive') return 'INVASIVE SPECIES RISK: Rapid Response Advised'
  if (status === 'ban') return 'RESTRICTED ZONE: Policy Intervention Recommended'
  if (status === 'conserve') return 'CONSERVATION PRIORITY: Biodiversity Support Required'
  return 'AUTHORIZED: Sustainable Operations'
}

export function colorForStatus(status: AlertStatus): string {
  if (status === 'invasive') return 'text-red-300'
  if (status === 'ban') return 'text-amber-300'
  if (status === 'conserve') return 'text-amber-300'
  return 'text-emerald-300'
}

export function bgForStatus(status: AlertStatus): string {
  if (status === 'invasive') return 'bg-red-900/30'
  if (status === 'ban') return 'bg-amber-900/30'
  if (status === 'conserve') return 'bg-amber-900/30'
  return 'bg-emerald-900/30'
}

export function buildVerboseReport(params: {
  input: {
    region: string
    sea_temperature: number
    salinity: number
    biodiversity_index: number
    eDNA_detected_species: string[]
    invasive_species_flag: string
  }
  fishPred: number
  riskPred: string
}): string {
  const { input, fishPred, riskPred } = params
  const status: AlertStatus = (() => {
    if (String(input.invasive_species_flag).toLowerCase() === 'yes') return 'invasive'
    if (fishPred < 30) return 'ban'
    if (input.biodiversity_index < 40) return 'conserve'
    return 'ok'
  })()

  const statusText =
    status === 'invasive' ? 'HIGH RISK: INVASIVE SPECIES – RAPID RESPONSE' :
    status === 'ban' ? 'RESTRICTED ZONE – POLICY INTERVENTION RECOMMENDED' :
    status === 'conserve' ? 'CONSERVATION PRIORITY – BIODIVERSITY SUPPORT' :
    'AUTHORIZED OPERATIONS – SUSTAINABLE FISHERIES'

  const species = input.eDNA_detected_species?.join(', ') || 'None detected'

  const justification = [
    `Fish Stock Index is predicted at ${fishPred.toFixed(1)}.`,
    `Biodiversity Index provided is ${input.biodiversity_index.toFixed(1)} (risk class: ${riskPred}).`,
    `Sea Temperature ${input.sea_temperature.toFixed(1)}°C and Salinity ${input.salinity.toFixed(1)} ppt provide the environmental context.`,
  ]
  if (status === 'ban') justification.push('This falls below the 30-point threshold for a fishing ban.')
  if (status === 'conserve') justification.push('Biodiversity Index is below 40, triggering a conservation recommendation.')
  if (status === 'invasive') justification.push('Invasive species flag is set, elevating risk regardless of other indicators.')

  let recommendation = ''
  if (status === 'invasive') {
    recommendation = 'Initiate rapid response protocols: targeted removal operations, heightened surveillance, and temporary activity controls. Notify coastal authorities and fishing cooperatives.'
  } else if (status === 'ban') {
    recommendation = 'Enact a time-bound fishing restriction (e.g., 6 months) to facilitate stock recovery. Implement enforcement patrols and publish guidance to fleets.'
  } else if (status === 'conserve') {
    recommendation = 'Designate a conservation priority zone with selective-gear measures and bycatch mitigation. Increase eDNA sampling frequency and habitat monitoring.'
  } else {
    recommendation = 'Proceed under sustainable quotas with periodic review. Maintain routine eDNA sampling and compliance checks.'
  }

  const speciesRisk = (() => {
    const inv = String(input.invasive_species_flag).toLowerCase() === 'yes'
    if (inv) return `Invasive species risk present. eDNA indicates: ${species}.`
    return `No invasive species flagged. eDNA indicates: ${species}.`
  })()

  return [
    `Predicted Status for ${input.region}: ${statusText}.`,
    '',
    'Justification:',
    `- ${justification.join('\n- ')}`,
    '',
    'Proactive Recommendation:',
    recommendation,
    '',
    'Species Risk:',
    speciesRisk,
  ].join('\n')
}
