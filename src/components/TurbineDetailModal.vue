<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="`${turbineId} - 24小时功率曲线`"
    :mask-closable="false"
    style="width: 700px"
  >
    <template #header-extra>
      <n-button text @click="handleClose">
        <n-icon size="18">
          <CloseOutline />
        </n-icon>
      </n-button>
    </template>
    
    <div v-if="turbineInfo" class="turbine-info">
      <n-space :size="16">
        <n-tag type="info">线路: {{ turbineInfo.line }}</n-tag>
        <n-tag :type="turbineInfo.state === '运行' ? 'success' : 'error'">
          状态: {{ turbineInfo.state }}
        </n-tag>
        <n-tag type="warning">当前功率: {{ turbineInfo.power }} MW</n-tag>
      </n-space>
    </div>
    
    <div ref="chartRef" class="modal-chart"></div>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">关闭</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import { NButton, NIcon, NTag, NSpace } from 'naive-ui'
import { CloseOutline } from '@vicons/ionicons5'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  turbineId: {
    type: String,
    default: ''
  },
  turbineInfo: {
    type: Object,
    default: null
  },
  chartData: {
    type: Object,
    default: () => ({ xData: [], yData: [] })
  }
})

const emit = defineEmits(['close', 'update:show'])

const showModal = computed({
  get: () => props.show,
  set: (val) => {
    if (!val) {
      emit('update:show', false)
      emit('close')
    }
  }
})

const chartRef = ref(null)
let chartInstance = null
let resizeObserver = null

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
  
  resizeObserver = new ResizeObserver(() => {
    chartInstance?.resize()
  })
  resizeObserver.observe(chartRef.value)
}

const updateChart = () => {
  if (!chartInstance || !props.chartData) return
  
  const { xData, yData } = props.chartData
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0]
        return `<strong>时间: ${data.name}</strong><br/>功率: ${data.value} MW`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData,
      boundaryGap: false,
      axisLabel: {
        fontSize: 11,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '功率 (MW)',
      nameTextStyle: {
        fontSize: 12
      },
      axisLabel: {
        fontSize: 11
      }
    },
    series: [
      {
        type: 'line',
        data: yData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#667eea'
        },
        itemStyle: {
          color: '#667eea'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

const handleClose = () => {
  emit('close')
}

watch(() => props.show, (val) => {
  if (val) {
    setTimeout(() => {
      initChart()
    }, 100)
  }
})

watch(() => props.chartData, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  window.addEventListener('resize', () => chartInstance?.resize())
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  chartInstance?.dispose()
  window.removeEventListener('resize', () => chartInstance?.resize())
})
</script>

<style scoped>
.turbine-info {
  margin-bottom: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
}
</style>
