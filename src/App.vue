<template>
  <n-config-provider>
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div class="dashboard-title">🌬️ 风电场发电量监测看板</div>
        <div class="dashboard-time">当前数据时间: {{ currentDataTime }}</div>
      </div>
      
      <FilterBar
        :current-line="selectedLine"
        :current-time-range="timeRange"
        @update:line="handleLineChange"
        @update:time-range="handleTimeRangeChange"
        @refresh="loadData"
      />
      
      <MetricCards :metrics="metrics" />
      
      <div class="charts-row">
        <PowerBarChart :chart-data="barChartData" />
        <PowerLineChart :chart-data="lineChartData" />
      </div>
      
      <TurbineTable
        :table-data="tableData"
        @row-click="handleRowClick"
      />
      
      <TurbineDetailModal
        :show="showModal"
        :turbine-id="selectedTurbineId"
        :turbine-info="selectedTurbineInfo"
        :chart-data="turbineDetailData"
        @close="showModal = false"
      />
    </div>
  </n-config-provider>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NConfigProvider } from 'naive-ui'
import dayjs from 'dayjs'
import FilterBar from './components/FilterBar.vue'
import MetricCards from './components/MetricCards.vue'
import PowerBarChart from './components/PowerBarChart.vue'
import PowerLineChart from './components/PowerLineChart.vue'
import TurbineTable from './components/TurbineTable.vue'
import TurbineDetailModal from './components/TurbineDetailModal.vue'
import {
  fetchCSVData,
  getLatestData,
  getDataByTimeRange,
  calculateMetrics,
  getTurbinePowerBarData,
  getTotalPowerLineData,
  getTableData,
  getTurbine24HourData
} from './services/dataService'

const allData = ref([])
const selectedLine = ref('all')
const timeRange = ref('today')
const currentDataTime = ref('--')

const showModal = ref(false)
const selectedTurbineId = ref('')
const selectedTurbineInfo = ref(null)

let refreshInterval = null
const REFRESH_INTERVAL = 30000

const latestData = computed(() => getLatestData(allData.value))

const timeRangeData = computed(() => 
  getDataByTimeRange(allData.value, timeRange.value)
)

const metrics = computed(() => {
  if (timeRange.value === 'today') {
    return calculateMetrics(latestData.value, timeRangeData.value)
  } else {
    const data = latestData.value
    if (data.length === 0) {
      return {
        totalGeneration: 0,
        currentPower: 0,
        utilizationHours: 0,
        stoppedCount: 0
      }
    }
    const totalGen = data.reduce((sum, d) => sum + parseFloat(d.dailyGeneration || 0), 0)
    const currentPower = data.reduce((sum, d) => sum + parseFloat(d.power || 0), 0)
    const utilizationHours = 75 > 0 ? totalGen / 75 : 0
    const stoppedCount = data.filter(d => parseFloat(d.power || 0) <= 0.01).length
    return {
      totalGeneration: Math.round(totalGen * 100) / 100,
      currentPower: Math.round(currentPower * 100) / 100,
      utilizationHours: Math.round(utilizationHours * 100) / 100,
      stoppedCount
    }
  }
})

const barChartData = computed(() => 
  getTurbinePowerBarData(latestData.value, selectedLine.value)
)

const lineChartData = computed(() => 
  getTotalPowerLineData(allData.value, 1)
)

const tableData = computed(() => 
  getTableData(latestData.value, selectedLine.value)
)

const turbineDetailData = computed(() => {
  if (!selectedTurbineId.value) return { xData: [], yData: [] }
  return getTurbine24HourData(allData.value, selectedTurbineId.value)
})

const loadData = async (forceRefresh = true) => {
  try {
    const data = await fetchCSVData(forceRefresh)
    allData.value = data
    
    if (data.length > 0) {
      const timestamps = [...new Set(data.map(d => d.timestamp))].sort()
      const latestTs = timestamps[timestamps.length - 1]
      currentDataTime.value = dayjs(latestTs).format('YYYY-MM-DD HH:mm:ss')
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const handleLineChange = (line) => {
  selectedLine.value = line
}

const handleTimeRangeChange = (range) => {
  timeRange.value = range
}

const handleRowClick = (row) => {
  selectedTurbineId.value = row.turbineId
  selectedTurbineInfo.value = row
  showModal.value = true
}

onMounted(async () => {
  await loadData(true)
  refreshInterval = setInterval(() => {
    loadData(true)
  }, REFRESH_INTERVAL)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
