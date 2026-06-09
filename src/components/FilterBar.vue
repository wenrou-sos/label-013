<template>
  <div class="filter-bar">
    <n-space :size="16" align="center">
      <div>
        <span style="margin-right: 8px; color: #666;">集电线路:</span>
        <n-select
          v-model:value="selectedLine"
          :options="lineOptions"
          style="width: 150px"
          @update:value="handleLineChange"
        />
      </div>
      
      <div>
        <span style="margin-right: 8px; color: #666;">时间范围:</span>
        <n-radio-group v-model:value="timeRange" @update:value="handleTimeRangeChange">
          <n-space>
            <n-radio-button value="today">今日</n-radio-button>
            <n-radio-button value="week">本周</n-radio-button>
            <n-radio-button value="month">本月</n-radio-button>
          </n-space>
        </n-radio-group>
      </div>
      
      <n-button type="primary" @click="handleRefresh">
        <template #icon>
          <n-icon>
            <RefreshOutline />
          </n-icon>
        </template>
        刷新数据
      </n-button>
      
      <n-tag v-if="timeRange !== 'today'" type="warning">
        {{ timeRange === 'week' ? '本周' : '本月' }}为历史汇总数据
      </n-tag>
    </n-space>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { NSelect, NRadioGroup, NRadioButton, NSpace, NButton, NIcon, NTag } from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { LINES } from '../services/dataService'

const props = defineProps({
  currentLine: {
    type: String,
    default: 'all'
  },
  currentTimeRange: {
    type: String,
    default: 'today'
  }
})

const emit = defineEmits(['update:line', 'update:timeRange', 'refresh'])

const selectedLine = ref(props.currentLine)
const timeRange = ref(props.currentTimeRange)

const lineOptions = [
  { label: '全部线路', value: 'all' },
  ...LINES.map(line => ({ label: `${line} 线路`, value: line }))
]

const handleLineChange = (value) => {
  emit('update:line', value)
}

const handleTimeRangeChange = (value) => {
  emit('update:timeRange', value)
}

const handleRefresh = () => {
  emit('refresh')
}
</script>
