<template>
  <div class="container">
    <h2 class="homeTitle">
      Today's Data<i>{{ days[1] }}</i>
      <div class="more">
        <router-link to="statistics">Details data</router-link>
        <el-icon>
          <ArrowRight />
        </el-icon>
      </div>
    </h2>
    <div class="overviewBox">
      <ul>
        <li>
          <p class="tit">Turnover</p>
          <p class="num">$ {{ overviewData.turnover }}</p>
        </li>
        <li>
          <p class="tit">Valid order</p>
          <p class="num">{{ overviewData.validOrderCount }}</p>
        </li>
        <li>
          <p class="tit">Order completion rate</p>
          <p class="num">{{ (overviewData.orderCompletionRate * 100).toFixed(0) }}%</p>
        </li>
        <li>
          <p class="tit">Average order value</p>
          <p class="num">
            $
            {{ overviewData.unitPrice !== undefined ? overviewData.unitPrice.toFixed(2) : '0.00' }}
          </p>
        </li>
        <li>
          <p class="tit">New Customers</p>
          <p class="num">{{ overviewData.newUsers }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { getday } from '@/utils/date'

// Define props
const props = defineProps<{
  overviewData: {
    turnover: number
    validOrderCount: number
    orderCompletionRate: number
    unitPrice: number
    newUsers: number
  }
}>()

// Computed property for days
const days = computed(() => getday())
</script>

<style lang="less" scoped></style>
