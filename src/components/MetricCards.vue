<template>
  <div class="metrics-row">
    <div class="metric-card">
      <div class="metric-label">总发电量（今日累计）</div>
      <div class="metric-value">
        {{ metrics.totalGeneration.toFixed(2) }}
        <span class="metric-unit">MWh</span>
      </div>
    </div>
    
    <div class="metric-card">
      <div class="metric-label">当前实时总功率</div>
      <div class="metric-value">
        {{ metrics.currentPower.toFixed(2) }}
        <span class="metric-unit">MW</span>
      </div>
    </div>
    
    <div class="metric-card">
      <div class="metric-label">等效利用小时数</div>
      <div class="metric-value">
        {{ metrics.utilizationHours.toFixed(2) }}
        <span class="metric-unit">h</span>
      </div>
    </div>
    
    <div class="metric-card" :class="{ warning: metrics.stoppedCount > 0 }">
      <div class="metric-label">停机台数</div>
      <div class="metric-value">
        {{ metrics.stoppedCount }}
        <span class="metric-unit">台</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  metrics: {
    type: Object,
    required: true
  }
})
</script>
