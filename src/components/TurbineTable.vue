<template>
  <div class="table-card">
    <div class="table-title">风机实时数据</div>
    <div class="table-container">
      <n-data-table
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :single-line="false"
        @row-click="handleRowClick"
      />
    </div>
  </div>
</template>

<script setup>
import { h, computed } from 'vue'
import { NTag } from 'naive-ui'

const props = defineProps({
  tableData: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['row-click'])

const columns = [
  {
    title: '风机编号',
    key: 'turbineId',
    sortable: true,
    width: 120
  },
  {
    title: '所属线路',
    key: 'line',
    sortable: true,
    width: 100,
    render: (row) => {
      return h(
        NTag,
        { type: 'info', size: 'small' },
        { default: () => row.line }
      )
    }
  },
  {
    title: '当前功率 (MW)',
    key: 'power',
    sortable: true,
    width: 140,
    render: (row) => {
      const color = row.power <= 0.01 ? '#ff4d4f' : '#1890ff'
      return h('span', { style: { color, fontWeight: 500 } }, row.power.toFixed(2))
    }
  },
  {
    title: '今日发电量 (MWh)',
    key: 'dailyGeneration',
    sortable: true,
    width: 150
  },
  {
    title: '风速 (m/s)',
    key: 'windSpeed',
    sortable: true,
    width: 120
  },
  {
    title: '状态',
    key: 'state',
    sortable: true,
    width: 100,
    render: (row) => {
      let type = 'success'
      if (row.state === '停机') type = 'error'
      if (row.state === '故障') type = 'warning'
      return h(
        NTag,
        { type, size: 'small' },
        { default: () => row.state }
      )
    }
  }
]

const pagination = computed(() => ({
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 30]
}))

const handleRowClick = (row) => {
  emit('row-click', row)
}
</script>
