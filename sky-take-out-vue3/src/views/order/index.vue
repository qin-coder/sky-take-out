<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Empty from '@/components/Empty.vue'
import {
  getOrderDetailPageAPI,
  queryOrderDetailByIdAPI,
  completeOrderAPI,
  deliveryOrderAPI,
  orderCancelAPI,
  orderRejectAPI,
  orderAcceptAPI,
  getOrderListByAPI
} from '@/api/order'
import type { Order, OrderVO } from '@/types/order'
import { ElMessage } from 'element-plus'

type OrderStatics = {
  toBeConfirmed: number
  confirmed: number
  deliveryInProgress: number
}

const defaultActivity = ref(0)
const orderStatics = ref<OrderStatics>()
const my_row = ref<Order>()
const isAutoNext = ref(true)
const isTableOperateBtn = ref(true)
// const currentPageIndex = ref(0) //记录查看详情数据的index
const orderId = ref<number>() //订单id
const input = ref('') //搜索条件的订单号
const phone = ref('') //搜索条件的手机号
const rangeTime = ref<[Date, Date]>()
const dialogVisible = ref(false) //详情弹窗
const cancelDialogVisible = ref(false) //取消，拒单弹窗
const cancelDialogTitle = ref('') //取消，拒绝弹窗标题
const cancelReason = ref('')
const remark = ref('') //自定义原因
const counts = ref(0)
const page = ref(1)
const pageSize = ref(10)
const tableData = ref<Array<any>>([])
const diaForm = ref<OrderVO>()
const isSearch = ref(false)
const orderStatus = ref(0) //列表字段展示所需订单状态,用于分页请求数据
const dialogOrderStatus = ref(0) //弹窗所需订单状态，用于详情展示字段
// 拒单原因列表
const rejectReasonList = reactive([
  { value: 1, label: 'High order volume, temporarily unable to accept orders' },
  { value: 2, label: 'Dish sold out, temporarily unable to accept orders' },
  { value: 3, label: 'Restaurant is closed, temporarily unable to accept orders' },
  { value: 0, label: 'Custom reason' }
])
// Cancel order reason list
const cancelReasonList = reactive([
  { value: 1, label: 'High order volume, temporarily unable to accept orders' },
  { value: 2, label: 'Dish sold out, temporarily unable to accept orders' },
  { value: 3, label: 'Insufficient delivery riders' },
  { value: 4, label: 'Customer canceled by phone' },
  { value: 0, label: 'Custom reason' }
])
// All order status list
const orderList = reactive([
  { label: 'All Orders', value: 0 },
  { label: 'Pending Payment', value: 1 },
  { label: 'Pending Acceptance', value: 2 },
  { label: 'Pending Dispatch', value: 3 },
  { label: 'Out for Delivery', value: 4 },
  { label: 'Completed', value: 5 },
  { label: 'Cancelled', value: 6 }
])
// Tab bar order status list
const changedOrderList = reactive([
  { label: 'All Orders', value: 0 },
  { label: 'Pending Acceptance', value: 2, num: orderStatics.value?.toBeConfirmed },
  { label: 'Pending Dispatch', value: 3, num: orderStatics.value?.confirmed },
  { label: 'Out for Delivery', value: 4, num: orderStatics.value?.deliveryInProgress },
  { label: 'Completed', value: 5 },
  { label: 'Cancelled', value: 6 }
])

const activeIndex = ref(0)

// 监视订单数量变化
watch(orderStatics, (newValue) => {
  changedOrderList[1].num = newValue && newValue.toBeConfirmed
  changedOrderList[2].num = newValue && newValue.confirmed
  changedOrderList[3].num = newValue && newValue.deliveryInProgress
})

const tabChange = (index: number) => {
  activeIndex.value = index
  init(index)
}

const route = useRoute()
const router = useRouter()

// 初始化时需要分页查询，展示所有订单
const init = async (activeIndex: number = 0, search?: boolean) => {
  search && (isSearch.value = search)
  const params = {
    page: page.value,
    pageSize: pageSize.value,
    number: input.value || undefined,
    phone: phone.value || undefined,
    beginTime: rangeTime.value && rangeTime.value.length > 0 ? rangeTime.value[0] : undefined,
    endTime: rangeTime.value && rangeTime.value.length > 0 ? rangeTime.value[1] : undefined,
    status: activeIndex || undefined
  }
  try {
    const res = await getOrderDetailPageAPI(params)
    if (res.data.code === 1) {
      tableData.value = res.data.data.records
      orderStatus.value = activeIndex
      counts.value = Number(res.data.data.total)
      await getOrderListBy3Status()
      if (
        dialogOrderStatus.value === 2 &&
        orderStatus.value === 2 &&
        isAutoNext.value &&
        !isTableOperateBtn.value &&
        res.data.data.records.length >= 1
      ) {
        const row = res.data.data.records[0]
        await goDetail(row.id, row.status, row)
      }
    } else {
      throw new Error(res.data.msg)
    }
  } catch (err) {
    console.error('请求出错了：', err)
  }
}

// 获取订单统计数据（3种状态的数量），进行红色小圆消息显示
const getOrderListBy3Status = async () => {
  try {
    const res = await getOrderListByAPI()
    if (res.data.code === 1) {
      orderStatics.value = res.data.data
    } else {
      throw new Error(res.data.msg)
    }
  } catch (err) {
    console.error('请求出错了：', err)
  }
}

// 打开对话框，查看订单详情
const goDetail = async (id: any, status: number, row?: any) => {
  orderId.value = id
  try {
    const { data: res } = await queryOrderDetailByIdAPI({ orderId: id })
    diaForm!.value = res.data
    my_row.value = row || { id: route.query.orderId, status: status }
    if (route.query.orderId) {
      router.push('/order')
    }
    dialogVisible.value = true
    dialogOrderStatus.value = status
  } catch (err) {
    console.error('请求出错了：', err)
  }
}

// 接单
const orderAccept = async (row: any) => {
  orderId.value = row!.id
  dialogOrderStatus.value = row.status
  try {
    const res = await orderAcceptAPI({ id: orderId.value })
    if (res.data.code === 1) {
      orderId.value = 0
      dialogVisible.value = false
      await init(orderStatus.value)
      ElMessage.success('Order accepted successfully')
    } else {
      throw new Error(res.data.msg)
    }
  } catch (err) {
    console.error('请求出错了：', err)
  }
}

// 打开拒单弹窗
const orderReject = (row: any) => {
  cancelDialogVisible.value = true
  orderId.value = row.id
  dialogOrderStatus.value = row.status
  cancelDialogTitle.value = 'reject'
  dialogVisible.value = false
  cancelReason.value = ''
}

// 打开取消订单弹窗
const cancelOrder = (row: any) => {
  cancelDialogVisible.value = true
  orderId.value = row.id
  dialogOrderStatus.value = row.status
  cancelDialogTitle.value = 'cancel'
  dialogVisible.value = false
  cancelReason.value = ''
}

// 确认取消订单或拒单
const confirmCancel = async () => {
  if (!cancelReason.value) {
    return ElMessage.error(`Please select ${cancelDialogTitle.value} reason`)
  } else if (cancelReason.value === 'Custom reason' && !remark.value) {
    return ElMessage.error(`Please enter ${cancelDialogTitle.value} reason`)
  }
  try {
    const res = await (cancelDialogTitle.value === 'cancel' ? orderCancelAPI : orderRejectAPI)({
      id: orderId.value,
      [cancelDialogTitle.value === 'cancel' ? 'cancelReason' : 'rejectionReason']:
        cancelReason.value === 'Custom reason' ? remark.value : cancelReason.value
    })
    if (res.data.code === 1) {
      ElMessage.success(`${cancelDialogTitle.value} successful`)
      cancelDialogVisible.value = false
      orderId.value = 0
      // Refresh page
      await init(orderStatus.value)
    } else {
      throw new Error(res.data.msg)
    }
  } catch (err) {
    console.error('Request error:', err)
  }
}

// 派送或完成订单
const deliveryOrComplete = async (status: number, id: number) => {
  const params = { status, id }
  try {
    const res = await (status === 3 ? deliveryOrderAPI : completeOrderAPI)(params)
    if (res.data.code === 1) {
      ElMessage.success(`${status === 3 ? 'Delivery successful' : 'Order completed'}`)
      orderId.value = 0
      dialogVisible.value = false
      // Refresh page
      await init(orderStatus.value)
    } else {
      throw new Error(res.data.msg)
    }
  } catch (err) {
    console.error('Request error:', err)
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  init(orderStatus.value)
}

const handleCurrentChange = (val: number) => {
  page.value = val
  init(orderStatus.value)
}

const initFun = (orderStatus: any) => {
  page.value = 1
  init(orderStatus)
}

const getOrderType = (row: any) => {
  if (row.status === 1) {
    return 'Pending Payment'
  } else if (row.status === 2) {
    return 'Pending Acceptance'
  } else if (row.status === 3) {
    return 'Pending Dispatch'
  } else if (row.status === 4) {
    return 'Out for Delivery'
  } else if (row.status === 5) {
    return 'Completed'
  } else if (row.status === 6) {
    return 'Cancelled'
  } else {
    return 'Refund'
  }
}

// init不够，还得在mounted里面再执行一遍，获取订单统计才行！
init(Number(route.query.status) || 0)
onMounted(async () => {
  if (route.query.status) {
    defaultActivity.value = Number(route.query.status)
  }
  // 获取订单统计数据（3种状态的数量）
  await getOrderListBy3Status()
  // 如果路径中有orderId值，说明是点击右上角消息通知进来的
  if (route.query.orderId && route.query.orderId !== 'undefined') {
    goDetail(route.query.orderId, 2)
  }
})
</script>

<template>
  <div class="dashboard-container">
    <div class="tab-change">
      <div
        v-for="item in changedOrderList"
        :key="item.value"
        class="tab-item"
        :class="{ active: item.value === activeIndex }"
        @click="tabChange(item.value)"
      >
        <el-badge
          :class="{ 'special-item': item.num && item.num < 10 }"
          class="item"
          :value="item.num && item.num > 99 ? '99+' : item.num"
          :hidden="!([2, 3, 4].includes(item.value) && item.num)"
        >
          {{ item.label }}
        </el-badge>
      </div>
    </div>
    <div class="container" :class="{ hContainer: tableData.length }">
      <!-- 搜索项 -->
      <div class="tableBar">
        <label style="margin-right: 5px; font-size: 14px">Order Number:</label>
        <el-input
          v-model="input"
          placeholder="Please enter the order number"
          style="width: 15%"
          clearable
          @clear="init(orderStatus)"
          @keyup.enter="initFun(orderStatus)"
        />
        <label style="margin: 0 5px 0 30px; font-size: 14px">phone:</label>
        <el-input
          v-model="phone"
          placeholder="Please enter phone number"
          style="width: 15%"
          clearable
          @clear="init(orderStatus)"
          @keyup.enter="initFun(orderStatus)"
        />
        <label style="margin: 0 5px 0 30px; font-size: 14px">Order time:</label>
        <el-date-picker
          v-model="rangeTime"
          clearable
          format="YYYY/MM/DD"
          value-format="YYYY-MM-DD HH:mm:ss"
          range-separator="to"
          :default-time="rangeTime"
          type="daterange"
          start-placeholder="Start date"
          end-placeholder="End date"
          style="width: 25%; margin-left: 10px"
          @clear="init(orderStatus)"
        />
        <el-button class="normal-btn continue" @click="init(orderStatus, true)">Check</el-button>
      </div>
      <el-table v-if="tableData.length" :data="tableData" stripe class="tableBox">
        <el-table-column key="number" prop="number" label="Order number" />
        <el-table-column
          v-if="[2, 3, 4].includes(orderStatus)"
          key="orderDishes"
          prop="orderDishes"
          label="Order Dishes"
        />
        <el-table-column
          v-if="[0].includes(orderStatus)"
          key="status"
          prop="Order status"
          label="Order status"
        >
          <template v-slot="{ row }">
            <span>{{ getOrderType(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="[0, 5, 6].includes(orderStatus)"
          key="consignee"
          prop="consignee"
          label="username"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="[0, 5, 6].includes(orderStatus)"
          key="phone"
          prop="phone"
          label="phone"
        />
        <el-table-column
          v-if="[0, 2, 3, 4, 5, 6].includes(orderStatus)"
          key="address"
          prop="address"
          label="address"
          :class-name="orderStatus === 6 ? 'address' : ''"
        />
        <el-table-column
          v-if="[0, 6].includes(orderStatus)"
          key="orderTime"
          prop="orderTime"
          label="order Time"
          class-name="orderTime"
          min-width="110"
        />
        <el-table-column
          v-if="[6].includes(orderStatus)"
          key="cancelTime"
          prop="cancelTime"
          class-name="cancelTime"
          label="cancel Time"
          min-width="110"
        />
        <el-table-column
          v-if="[6].includes(orderStatus)"
          key="cancelReason"
          prop="cancelReason"
          label="cancel Reason"
          class-name="cancelReason"
          :min-width="[6].includes(orderStatus) ? 80 : 'auto'"
        />
        <el-table-column
          v-if="[5].includes(orderStatus)"
          key="deliveryTime"
          prop="deliveryTime"
          label="delivery Time"
        />
        <el-table-column
          v-if="[2, 3, 4].includes(orderStatus)"
          key="estimatedDeliveryTime"
          prop="estimatedDeliveryTime"
          label="Estimated Delivery Time"
          min-width="110"
          align="center"
        />
        <el-table-column
          v-if="[0, 2, 5].includes(orderStatus)"
          key="amount"
          prop="amount"
          label="amount"
          align="center"
        >
          <template v-slot="{ row }">
            <span>￥{{ (row.amount.toFixed(2) * 100) / 100 }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="[2, 3, 4, 5].includes(orderStatus)"
          key="remark"
          prop="remark"
          label="remark"
          align="center"
        />
        <el-table-column
          v-if="[2, 3, 4].includes(orderStatus)"
          key="tablewareNumber"
          prop="tablewareNumber"
          label="Tableware Number"
          align="center"
          min-width="80"
        >
          <template #default="scope">
            {{
              scope.row.tablewareNumber === -1
                ? 'No Tableware needed'
                : scope.row.tablewareNumber === 0
                  ? 'Portion according to meal size'
                  : scope.row.tablewareNumber
            }}
          </template>
        </el-table-column>
        <el-table-column
          prop="btn"
          label="operation"
          align="center"
          width="190px"
          :class-name="orderStatus === 0 ? 'operate' : 'otherOperate'"
          :min-width="
            [2, 3, 4].includes(orderStatus) ? 130 : [0].includes(orderStatus) ? 140 : 'auto'
          "
        >
          <template #default="scope">
            <div class="btn_box">
              <div class="before">
                <el-button
                  v-if="scope.row.status === 2"
                  type="primary"
                  link
                  @click="orderAccept(scope.row), (isTableOperateBtn = true)"
                >
                  Accept
                </el-button>
                <el-button
                  v-if="scope.row.status === 3"
                  type="primary"
                  link
                  @click="deliveryOrComplete(3, scope.row.id)"
                >
                  Delivery
                </el-button>
                <el-button
                  v-if="scope.row.status === 4"
                  type="primary"
                  link
                  @click="deliveryOrComplete(4, scope.row.id)"
                >
                  Complete
                </el-button>
              </div>
              <el-divider direction="vertical" />
              <div class="middle">
                <el-button
                  v-if="scope.row.status === 2"
                  type="danger"
                  link
                  @click="orderReject(scope.row), (isTableOperateBtn = true)"
                >
                  Reject
                </el-button>
                <el-button
                  v-if="[1, 3, 4, 5].includes(scope.row.status)"
                  type="danger"
                  link
                  @click="cancelOrder(scope.row)"
                >
                  Cancel
                </el-button>
              </div>
              <el-divider direction="vertical" />
              <div class="after">
                <el-button
                  type="primary"
                  link
                  class="blueBtn"
                  @click="goDetail(scope.row.id, scope.row.status, scope.row)"
                >
                  Check
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <Empty v-else :is-search="isSearch" />
      <el-pagination
        v-if="counts > 10"
        class="pageList"
        :page-sizes="[10, 20, 30, 40]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="counts"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 查看dialog弹框部分 -->
    <el-dialog
      title="Order Details"
      v-model="dialogVisible"
      width="53%"
      :before-close="handleClose"
      class="order-dialog"
    >
      <el-scrollbar style="height: 100%">
        <div class="order-top">
          <div>
            <div style="display: inline-block">
              <label style="font-size: 16px">Order Number:</label>
              <div class="order-num">
                {{ diaForm!.number }}
              </div>
            </div>
            <div
              style="display: inline-block"
              class="order-status"
              :class="{ status3: [3, 4].includes(dialogOrderStatus) }"
            >
              {{ orderList.filter((item) => item.value === dialogOrderStatus)[0].label }}
            </div>
          </div>
          <p><label>Order time:</label>{{ diaForm!.orderTime }}</p>
        </div>

        <div class="order-middle">
          <div class="user-info">
            <div class="user-info-box">
              <div class="user-name">
                <label>Username:</label>
                <span>{{ diaForm!.consignee }}</span>
              </div>
              <div class="user-phone">
                <label>Phone:</label>
                <span>{{ diaForm!.phone }}</span>
              </div>
              <div v-if="[2, 3, 4, 5].includes(dialogOrderStatus)" class="user-getTime">
                <label>{{
                  dialogOrderStatus === 5 ? 'Delivery Time: ' : 'Estimated Delivery Time: '
                }}</label>
                <span>{{
                  dialogOrderStatus === 5 ? diaForm!.deliveryTime : diaForm!.estimatedDeliveryTime
                }}</span>
              </div>
              <div class="user-address">
                <label>Address:</label>
                <span>{{ diaForm!.address }}</span>
              </div>
            </div>
            <div class="user-remark" :class="{ orderCancel: dialogOrderStatus === 6 }">
              <div>{{ dialogOrderStatus === 6 ? 'Cancellation Reason' : 'Remarks' }}</div>
              <span>{{
                dialogOrderStatus === 6
                  ? diaForm!.cancelReason || diaForm!.rejectionReason
                  : diaForm!.remark
              }}</span>
            </div>
          </div>

          <div class="dish-info">
            <div class="dish-label">Dish</div>
            <div class="dish-list">
              <div v-for="(item, index) in diaForm!.orderDetailList" :key="index" class="dish-item">
                <div class="dish-item-box">
                  <span class="dish-name">{{ item.name }}</span>
                  <span class="dish-num">x{{ item.number }}</span>
                </div>
                <span class="dish-price">￥{{ item.amount ? item.amount.toFixed(2) : '' }}</span>
              </div>
            </div>
            <div class="dish-all-amount">
              <label>Subtotal of dishes</label>
              <span
                >￥{{
                  diaForm && diaForm.amount && diaForm?.packAmount
                    ? (diaForm!.amount - 6 - diaForm!.packAmount).toFixed(2)
                    : 0
                }}</span
              >
            </div>
          </div>
        </div>

        <div class="order-bottom">
          <div class="amount-info">
            <div class="amount-label">Cost</div>
            <div class="amount-list">
              <div class="dish-amount">
                <span class="amount-name">Subtotal for dishes:</span>
                <span class="amount-price"
                  >￥{{
                    diaForm &&
                    typeof diaForm.amount === 'number' &&
                    typeof diaForm.packAmount === 'number'
                      ? (((diaForm.amount - 6 - diaForm.packAmount) * 100) / 100).toFixed(2)
                      : 0
                  }}</span
                >
              </div>
              <div class="send-amount">
                <span class="amount-name">Delivery fee:</span>
                <span class="amount-price">￥{{ 6 }}</span>
              </div>
              <div class="package-amount">
                <span class="amount-name">Packing fee:</span>
                <span class="amount-price"
                  >￥{{
                    diaForm && diaForm.amount && diaForm.packAmount
                      ? ((diaForm!.packAmount * 100) / 100).toFixed(2)
                      : ''
                  }}</span
                >
              </div>
              <div class="all-amount">
                <span class="amount-name">Total:</span>
                <span class="amount-price"
                  >￥{{
                    diaForm && diaForm.amount && diaForm.packAmount
                      ? ((diaForm!.amount * 100) / 100).toFixed(2)
                      : ''
                  }}</span
                >
              </div>
              <div class="pay-type">
                <span class="pay-name">Payment Method: </span>
                <span class="pay-value">{{
                  diaForm!.payMethod === 1 ? 'WeChat Pay' : 'Alipay'
                }}</span>
              </div>
              <div class="pay-time">
                <span class="pay-name">Payment Time:</span>
                <span class="pay-value">{{ diaForm!.checkoutTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
      <template #footer>
        <span v-if="dialogOrderStatus !== 6" class="dialog-footer">
          <el-checkbox v-if="dialogOrderStatus === 2 && orderStatus === 2" v-model="isAutoNext"
            >Automatically jump to the next one after processing</el-checkbox
          >
          <div>
            <el-button
              v-if="dialogOrderStatus === 2"
              @click="orderReject(my_row), (isTableOperateBtn = false)"
              >Reject</el-button
            >
            <el-button
              v-if="dialogOrderStatus === 2"
              type="primary"
              @click="orderAccept(my_row), (isTableOperateBtn = false)"
              >Accept</el-button
            >

            <el-button
              v-if="[1, 3, 4, 5].includes(dialogOrderStatus)"
              @click="dialogVisible = false"
              >Return</el-button
            >
            <el-button
              v-if="dialogOrderStatus === 3"
              type="primary"
              @click="deliveryOrComplete(3, my_row!.id)"
              >Delivery</el-button
            >
            <el-button
              v-if="dialogOrderStatus === 4"
              type="primary"
              @click="deliveryOrComplete(4, my_row!.id)"
              >Complete</el-button
            >
            <el-button
              v-if="[1].includes(dialogOrderStatus)"
              type="primary"
              @click="cancelOrder(my_row)"
              >Cancel Order</el-button
            >
          </div>
        </span>
      </template>
    </el-dialog>

    <!-- 点击拒单，弹出 填拒单/取消原因 的弹窗 -->
    <el-dialog
      :title="cancelDialogTitle + 'reason'"
      v-model="cancelDialogVisible"
      width="42%"
      :before-close="() => ((cancelDialogVisible = false), (cancelReason = ''))"
      class="cancelDialog"
    >
      <el-form label-width="90px">
        <el-form-item :label="cancelDialogTitle + 'Reason:'">
          <el-select v-model="cancelReason" :placeholder="'Please' + cancelDialogTitle + 'Reason'">
            <el-option
              v-for="(item, index) in cancelDialogTitle === 'Cancel'
                ? cancelrReasonList
                : rejectReasonList"
              :key="index"
              :label="item.label"
              :value="item.label"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="cancelReason === 'Custom Reason'" label="Reason:">
          <el-input
            v-model.trim="remark"
            type="textarea"
            :placeholder="
              'Please fill in your' + cancelDialogTitle + 'Reasons (within 20 characters)'
            "
            maxlength="20"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button
            @click="
              () => {
                cancelDialogVisible = false
                cancelReason = ''
              }
            "
            >Cancel</el-button
          >

          <el-button type="primary" @click="confirmCancel">Confirm</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.tab-change {
  display: flex;
  border-radius: 4px;
  margin-bottom: 20px;

  .tab-item {
    width: 220px;
    height: 45px;
    text-align: center;
    line-height: 40px;
    color: #333;
    border: 1px solid #e5e4e4;
    background-color: white;
    border-left: none;
    cursor: pointer;

    .special-item {
      .el-badge__content {
        width: 20px;
        padding: 0 5px;
      }
    }

    .item {
      :deep(.el-badge__content) {
        background-color: #ff4433 !important;
        line-height: 15px;
        height: auto;
        min-width: 18px;
        min-height: 18px;
        // border-radius: 50%;
      }

      :deep(.el-badge__content.is-fixed) {
        top: 14px;
        right: 2px;
      }
    }
  }

  .active {
    background-color: #818d8e;

    font-weight: bold;
  }

  .tab-item:first-child {
    border-left: 1px solid #e5e4e4;
  }
}

.dashboard {
  &-container {
    margin: 30px;
    // height: 100%;
    min-height: 700px;

    .container {
      background: #fff;
      position: relative;
      z-index: 1;
      padding: 30px 28px;
      border-radius: 4px;
      // min-height: 650px;
      height: calc(100% - 55px);

      .tableBar {
        // display: flex;
        margin-bottom: 20px;
        justify-content: space-between;

        .tableLab {
          span {
            cursor: pointer;
            display: inline-block;
            font-size: 14px;
            padding: 0 20px;
            color: gray;
            border-right: solid 1px gray;
          }
        }
      }

      .tableBox {
        width: 100%;
        border: 1px solid #e4e4e4;
        border-bottom: 0;
        display: flex;
        flex-direction: row;

        .btn_box {
          display: flex;
          align-items: center;
          height: 100%;

          .before,
          .middle,
          .after {
            width: 40px;
            margin: 2px;
          }
        }
      }

      .pageList {
        justify-content: center;
        text-align: center;
        margin-top: 30px;
      }

      //查询黑色按钮样式
      .normal-btn {
        background: #333333;
        color: white;
        margin-left: 20px;
      }
    }

    .hContainer {
      height: auto !important;
    }
  }
}

.search-btn {
  margin-left: 20px;
}

.info-box {
  margin: -15px -44px 20px;

  p {
    display: flex;
    height: 20px;
    line-height: 20px;
    font-size: 14px;
    font-weight: 400;
    color: #666666;
    text-align: left;
    margin-bottom: 14px;

    &:last-child {
      margin-bottom: 0;
    }

    label {
      width: 100px;
      display: inline-block;
      color: #666;
    }

    .des {
      flex: 1;
      color: #333333;
    }
  }
}

.order-top {
  // height: 80px;
  border-bottom: 1px solid #e7e6e6;
  padding-bottom: 26px;
  padding-left: 22px;
  padding-right: 22px;
  // margin: 0 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .order-status {
    width: 57.25px;
    height: 27px;
    background: #333333;
    border-radius: 13.5px;
    color: white;
    margin-left: 19px;
    text-align: center;
    line-height: 27px;
  }

  .status3 {
    background: #f56c6c;
  }

  p {
    color: #333;

    label {
      color: #666;
    }
  }

  .order-num {
    font-size: 16px;
    color: #2a2929;
    font-weight: bold;
    display: inline-block;
  }
}

.order-middle {
  .user-info {
    min-height: 140px;
    background: #fbfbfa;
    margin-top: 10px;

    padding: 10px 43px;
    color: #333;

    .user-info-box {
      text-align: left;
      min-height: 30px;
      display: flex;
      flex-wrap: wrap;

      .user-name {
        flex: 67%;
      }

      .user-phone {
        flex: 33%;
      }

      .user-getTime {
        margin-top: 10px;
        flex: 80%;

        label {
          margin-right: 3px;
        }
      }

      label {
        margin-right: 17px;
        color: #666;
      }

      .user-address {
        margin-top: 14px;
        flex: 80%;

        label {
          margin-right: 30px;
        }
      }
    }

    .user-remark {
      min-height: 43px;
      line-height: 43px;
      background: #f0fbff;
      border: 1px solid #88eeff;
      border-radius: 4px;
      margin-top: 10px;
      padding: 6px;
      display: flex;
      align-items: center;

      div {
        display: inline-block;
        min-width: 53px;
        height: 32px;
        background: #88eeff;
        border-radius: 4px;
        text-align: center;
        line-height: 32px;
        color: #333;
        margin-right: 30px;
        // padding: 12px 6px;
      }

      span {
        color: #22ccff;
        line-height: 1.15;
      }
    }

    .orderCancel {
      background: #ffffff;
      border: 1px solid #b6b6b6;

      div {
        padding: 0 10px;
        background-color: #e5e4e4;
      }

      span {
        color: #f56c6c;
      }
    }
  }

  .dish-info {
    // min-height: 180px;
    display: flex;
    flex-wrap: wrap;
    padding: 20px 40px;
    border-bottom: 1px solid #e7e6e6;

    .dish-label {
      color: #666;
    }

    .dish-list {
      flex: 80%;
      display: flex;
      flex-wrap: wrap;

      .dish-item {
        flex: 50%;
        margin-bottom: 14px;
        color: #333;

        .dish-item-box {
          display: inline-block;
          width: 120px;
        }
      }
    }

    .dish-label {
      margin-right: 65px;
    }

    .dish-all-amount {
      flex: 1;
      padding-left: 92px;
      margin-top: 10px;

      label {
        color: #333333;
        font-weight: bold;
        margin-right: 5px;
      }

      span {
        color: #f56c6c;
      }
    }
  }
}

.order-bottom {
  .amount-info {
    // min-height: 180px;
    display: flex;
    flex-wrap: wrap;
    padding: 20px 40px;
    padding-bottom: 0px;

    .amount-label {
      color: #666;
      margin-right: 65px;
    }

    .amount-list {
      flex: 80%;
      display: flex;
      flex-wrap: wrap;
      color: #333;

      // height: 65px;
      .dish-amount,
      .package-amount,
      .pay-type {
        display: inline-block;
        width: 300px;
        margin-bottom: 14px;
        flex: 50%;
      }

      .send-amount,
      .all-amount,
      .pay-time {
        display: inline-block;
        flex: 50%;
        padding-left: 10%;
      }

      .package-amount {
        .amount-name {
          margin-right: 14px;
        }
      }

      .all-amount {
        .amount-name {
          margin-right: 24px;
        }

        .amount-price {
          color: #f56c6c;
        }
      }

      .send-amount {
        .amount-name {
          margin-right: 10px;
        }
      }
    }
  }
}

:deep(.el-table tr) {
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;

  .blueBtn {
    background: #409eff;
    color: white;
  }
}
</style>
