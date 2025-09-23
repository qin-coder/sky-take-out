<template>
  <div class="container">
    <h2 class="chartTitle">User Statistics</h2>
    <div class="charBox">
      <div id="usermain" style="width: 100%; height: 320px"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue'
import * as echarts from 'echarts'

interface UserData {
  dateList: string[]
  totalUserList: number[]
  newUserList: number[]
}

const props = defineProps<{
  userdata: UserData
}>()

const initChart = () => {
  const chartDom = document.getElementById('usermain') as HTMLElement
  const myChart = echarts.init(chartDom)
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderRadius: 2,
      textStyle: {
        color: '#333',
        fontSize: 12,
        fontWeight: 300
      }
    },
    grid: {
      top: '20%',
      left: '6%',
      right: '10%',
      bottom: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisLabel: {
        textStyle: {
          color: '#666',
          fontSize: '12px'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#E5E4E4',
          width: 1
        }
      },
      data: props.userdata.dateList
    },
    yAxis: [
      {
        type: 'value',
        min: 0,
        axisLabel: {
          textStyle: {
            color: '#666',
            fontSize: '12px'
          }
        }
      }
    ],
    legend: {
      bottom: '0%',
      icon: 'rect',
      itemWidth: 20,
      itemHeight: 2,
      textStyle: {
        fontSize: 12,
        color: '#666'
      }
    },
    series: [
      {
        name: 'Total Users',
        type: 'line',
        smooth: false,
        showSymbol: false,
        symbolSize: 10,
        itemStyle: {
          normal: {
            color: '#FFD000',
            lineStyle: {
              color: '#FFD000'
            }
          },
          emphasis: {
            color: '#fff',
            borderWidth: 5,
            borderColor: '#FFC100'
          }
        },
        data: props.userdata.totalUserList
      },
      {
        name: 'New Users',
        type: 'line',
        smooth: false,
        showSymbol: false,
        symbolSize: 10,
        itemStyle: {
          normal: {
            color: '#FD7F7F',
            lineStyle: {
              color: '#FD7F7F'
            }
          },
          emphasis: {
            color: '#fff',
            borderWidth: 5,
            borderColor: '#FD7F7F'
          }
        },
        areaStyle: {

          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(255, 1, 0, 1)'
            },
            {
              offset: 1,
              color: 'rgba(255, 1, 0, 0)'
            }
          ])
        },
        data: props.userdata.newUserList
      }
    ]
  }
  myChart.setOption(option)
}

onMounted(() => {
  initChart()
})

watch(
  () => props.userdata,
  (newVal) => {
    if (newVal) {
      initChart()
    }
  }
)
</script>

<style lang="less" scoped>
.chartTitle {
  font-size: 16px;
  color: #333;
  margin: 10px 20px;
}
</style>
