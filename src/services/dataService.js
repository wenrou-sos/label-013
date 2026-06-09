import Papa from 'papaparse'
import dayjs from 'dayjs'

export const RATED_CAPACITY_PER_TURBINE = 2.5
export const TOTAL_TURBINES = 30
export const TOTAL_RATED_CAPACITY = RATED_CAPACITY_PER_TURBINE * TOTAL_TURBINES
export const LINES = ['L1', 'L2', 'L3', 'L4', 'L5']

let cachedData = []
let lastFetchTime = 0
const CACHE_DURATION = 1000

export async function fetchCSVData(forceRefresh = false) {
  const now = Date.now()
  if (!forceRefresh && cachedData.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return cachedData
  }

  try {
    const response = await fetch(`/data/wind_farm_data.csv?t=${now}`)
    const csvText = await response.text()
    
    const result = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    })
    
    cachedData = result.data
    lastFetchTime = now
    return cachedData
  } catch (error) {
    console.error('读取CSV数据失败:', error)
    return cachedData
  }
}

export function getLatestData(data) {
  if (!data || data.length === 0) return []
  
  const timestamps = [...new Set(data.map(d => d.timestamp))].sort()
  const latestTimestamp = timestamps[timestamps.length - 1]
  
  return data.filter(d => d.timestamp === latestTimestamp)
}

export function getDataByTimeRange(data, range) {
  if (!data || data.length === 0) return []
  
  const now = new Date()
  let startTime
  
  switch (range) {
    case 'week':
      startTime = dayjs(now).subtract(7, 'day').toDate()
      break
    case 'month':
      startTime = dayjs(now).subtract(30, 'day').toDate()
      break
    case 'today':
    default:
      startTime = dayjs(now).startOf('day').toDate()
      break
  }
  
  return data.filter(d => new Date(d.timestamp) >= startTime)
}

export function calculateMetrics(latestData, timeRangeData) {
  if (!latestData || latestData.length === 0) {
    return {
      totalGeneration: 0,
      currentPower: 0,
      utilizationHours: 0,
      stoppedCount: 0
    }
  }
  
  const totalGeneration = latestData.reduce((sum, d) => sum + parseFloat(d.dailyGeneration || 0), 0)
  const currentPower = latestData.reduce((sum, d) => sum + parseFloat(d.power || 0), 0)
  const utilizationHours = TOTAL_RATED_CAPACITY > 0 ? totalGeneration / TOTAL_RATED_CAPACITY : 0
  const stoppedCount = latestData.filter(d => parseFloat(d.power || 0) <= 0.01).length
  
  return {
    totalGeneration: Math.round(totalGeneration * 100) / 100,
    currentPower: Math.round(currentPower * 100) / 100,
    utilizationHours: Math.round(utilizationHours * 100) / 100,
    stoppedCount
  }
}

export function getTurbinePowerBarData(latestData, selectedLine = 'all') {
  if (!latestData || latestData.length === 0) return { xData: [], yData: [], colors: [] }
  
  let filtered = latestData
  if (selectedLine !== 'all') {
    filtered = latestData.filter(d => d.line === selectedLine)
  }
  
  filtered = filtered.sort((a, b) => a.turbineId.localeCompare(b.turbineId))
  
  const xData = filtered.map(d => d.turbineId)
  const yData = filtered.map(d => parseFloat(d.power || 0))
  const colors = filtered.map(d => 
    parseFloat(d.power || 0) <= 0.01 ? '#ff4d4f' : '#1890ff'
  )
  
  return { xData, yData, colors, rawData: filtered }
}

export function getTotalPowerLineData(data, hours = 1) {
  if (!data || data.length === 0) return { xData: [], yData: [] }
  
  const now = new Date()
  const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)
  
  const filtered = data.filter(d => new Date(d.timestamp) >= startTime)
  
  const timestampMap = {}
  filtered.forEach(d => {
    const ts = d.timestamp
    if (!timestampMap[ts]) {
      timestampMap[ts] = 0
    }
    timestampMap[ts] += parseFloat(d.power || 0)
  })
  
  const sortedTimestamps = Object.keys(timestampMap).sort()
  const xData = sortedTimestamps.map(ts => {
    const date = new Date(ts)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  })
  const yData = sortedTimestamps.map(ts => Math.round(timestampMap[ts] * 100) / 100)
  
  return { xData, yData }
}

export function getTurbine24HourData(data, turbineId) {
  if (!data || data.length === 0) return { xData: [], yData: [] }
  
  const now = new Date()
  const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  const filtered = data.filter(d => 
    d.turbineId === turbineId && new Date(d.timestamp) >= startTime
  )
  
  const hourlyData = {}
  filtered.forEach(d => {
    const date = new Date(d.timestamp)
    const hourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`
    
    if (!hourlyData[hourKey]) {
      hourlyData[hourKey] = { sum: 0, count: 0 }
    }
    hourlyData[hourKey].sum += parseFloat(d.power || 0)
    hourlyData[hourKey].count++
  })
  
  const sortedHours = Object.keys(hourlyData).sort()
  const xData = sortedHours.map(h => h.split(' ')[1])
  const yData = sortedHours.map(h => 
    Math.round((hourlyData[h].sum / hourlyData[h].count) * 100) / 100
  )
  
  return { xData, yData }
}

export function getTableData(latestData, selectedLine = 'all') {
  if (!latestData || latestData.length === 0) return []
  
  let filtered = latestData
  if (selectedLine !== 'all') {
    filtered = latestData.filter(d => d.line === selectedLine)
  }
  
  return filtered.sort((a, b) => a.turbineId.localeCompare(b.turbineId)).map(d => ({
    turbineId: d.turbineId,
    line: d.line,
    power: Math.round(parseFloat(d.power || 0) * 100) / 100,
    dailyGeneration: Math.round(parseFloat(d.dailyGeneration || 0) * 100) / 100,
    windSpeed: Math.round(parseFloat(d.windSpeed || 0) * 10) / 10,
    state: d.state
  }))
}

export function getHistoricalSummary(data, range) {
  if (!data || data.length === 0) return null
  
  const dailyGeneration = {}
  
  data.forEach(d => {
    const date = new Date(d.timestamp)
    const dateKey = dayjs(date).format('YYYY-MM-DD')
    const turbineId = d.turbineId
    
    if (!dailyGeneration[dateKey]) {
      dailyGeneration[dateKey] = {}
    }
    if (!dailyGeneration[dateKey][turbineId]) {
      dailyGeneration[dateKey][turbineId] = parseFloat(d.dailyGeneration || 0)
    }
    dailyGeneration[dateKey][turbineId] = Math.max(
      dailyGeneration[dateKey][turbineId],
      parseFloat(d.dailyGeneration || 0)
    )
  })
  
  const dates = Object.keys(dailyGeneration).sort()
  const summary = dates.map(date => {
    const totalGen = Object.values(dailyGeneration[date]).reduce((sum, g) => sum + g, 0)
    return {
      date,
      totalGeneration: Math.round(totalGen * 100) / 100
    }
  })
  
  return summary
}
