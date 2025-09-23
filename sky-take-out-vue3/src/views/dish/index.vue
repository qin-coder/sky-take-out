<script setup lang="ts">
import { reactive, ref } from 'vue'
import { getDishPageListAPI, updateDishStatusAPI, deleteDishesAPI } from '@/api/dish'
import { getCategoryPageListAPI } from '@/api/category'
import { ElMessage, ElMessageBox, ElTable } from 'element-plus'
import { useRouter } from 'vue-router'

// ------ .d.ts 属性类型接口 ------
// 接收到不在接口中定义的属性的数据，ts会报错，但是类型推断错误不会妨碍接收，控制台还是能打印的
interface dish {
  id: number
  name: string
  pic: string
  detail: string
  price: number
  status: number
  categoryId: number
  updateTime: string
}
interface Category {
  id: number
  name: string
}

// ------ 数据 ------

// 当前页的菜品列表
const dishList = ref<dish[]>([])
// 菜品id对应的分类列表，即categoryId字段不能只展示id值，应该根据id查询到对应的分类名进行回显
const categoryList = ref<Category[]>([])
// 分页参数
const pageData = reactive({
  name: '',
  categoryId: '',
  status: '',
  page: 1,
  pageSize: 6
})
const total = ref(0)
const options = [
  {
    value: '1',
    label: 'On sale'
  },
  {
    value: '0',
    label: 'Stop sale'
  }
]

// ------ 方法 ------

// 页面初始化
const init = async () => {
  const { data: res_category } = await getCategoryPageListAPI({ page: 1, pageSize: 100, type: 1 })
  categoryList.value = res_category.data.records
}
// 刷新页面数据
const showPageList = async () => {
  const { data: res } = await getDishPageListAPI(pageData)
  dishList.value = res.data.records
  total.value = res.data.total
}
init() // 页面初始化，写在这里时的生命周期是beforecreated/created的时候
showPageList() // 页面一开始就要展示分页菜品列表

// 监听翻页和每页显示数量的变化
const handleCurrentChange = (val: number) => {
  pageData.page = val
  // 根据输入框是否有值/进行了查询，来决定是所有歌曲还是查询后的列表
  showPageList()
}

const handleSizeChange = (val: number) => {
  pageData.pageSize = val
  // 根据输入框是否有值/进行了查询，来决定是所有歌曲还是查询后的列表
  showPageList()
}

const multiTableRef = ref<InstanceType<typeof ElTable>>()
const multiSelection = ref<dish[]>([])

const handleSelectionChange = (val: dish[]) => {
  multiSelection.value = val
}

// 新增和修改菜品都是同一个页面，不过要根据路径传参的方式来区分
const router = useRouter()
const to_add_update = (row?: any) => {
  console.log('Check if it has been passed to determine whether to add or update.', row)
  if (row && row.id) {
    router.push({
      path: '/dish/add',
      query: { id: row.id }
    })
  } else {
    router.push('/dish/add')
  }
}

// 修改菜品状态
const change_btn = async (row: any) => {
  // 取反状态
  const newStatus = row.status === 1 ? 0 : 1

  const res = await updateDishStatusAPI(row.id, newStatus)
  if (res.data.code === 1) {
    // 修改成功后更新前端状态，不必再刷新整个分页
    row.status = newStatus
    ElMessage({
      type: 'success',
      message: 'Modified successfully'
    })
  } else {
    ElMessage({
      type: 'error',
      message: 'Failed to modify'
    })
  }
}

// 删除菜品
const deleteBatch = (row?: any) => {
  ElMessageBox.confirm(
    'This operation will permanently delete the dish. Are you sure you want to continue?',
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning'
    }
  )
    .then(async () => {
      // 1. 没传入行数据，批量删除
      if (row == undefined) {
        console.log(multiSelection.value)
        if (multiSelection.value.length == 0) {
          ElMessage({
            type: 'warning',
            message: 'Please select the dish you want to delete first.'
          })
          return
        }
        // 拿到当前 multiSelection.value 的所有id，然后调用批量删除接口
        let ids: any = []
        multiSelection.value.map((item) => {
          ids.push(item.id)
        })
        ids = ids.join(',')
        console.log('ids', ids)
        let res = await deleteDishesAPI(ids)
        if (res.data.code != 0) return
      }
      // 2. 传入行数据，单个删除
      else {
        let res = await deleteDishesAPI(row.id)
        if (res.data.code != 0) return
      }
      // 删除后刷新页面，更新数据
      showPageList()
      ElMessage({
        type: 'success',
        message: 'Deleted successfully'
      })
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: 'Cancelled deletion'
      })
    })
}
</script>

<template>
  <el-card>
    <div class="horizontal">
      <el-input
        size="large"
        class="input"
        v-model="pageData.name"
        placeholder="Please enter the dish name"
      />
      <el-select
        size="large"
        class="input"
        clearable
        v-model="pageData.categoryId"
        placeholder="Select category type"
      >
        <el-option
          v-for="item in categoryList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      <el-select
        class="input"
        clearable
        v-model="pageData.status"
        placeholder="Select dish status"
        size="large"
      >
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button size="large" class="btn" round type="success" @click="showPageList()"
        >Check dishes</el-button
      >
      <el-button size="large" class="btn" round type="danger" @click="deleteBatch()"
        >Batch delete</el-button
      >
      <el-button size="large" class="btn" type="primary" @click="to_add_update()">
        <el-icon style="font-size: 15px; margin-right: 10px"> <Plus /> </el-icon>Add dish
      </el-button>
    </div>
    <el-table
      class="table_box"
      ref="multiTableRef"
      :data="dishList"
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <!-- <el-table-column prop="id" label="id" /> -->
      <el-table-column prop="name" label="dish name" align="center" />
      <el-table-column prop="pic" label="Picture" align="center">
        <template #default="scope">
          <img v-if="scope.row.pic" :src="scope.row.pic" alt="" />
          <img v-else src="/src/assets/image/user_default.png" alt="" />
        </template>
      </el-table-column>
      <el-table-column prop="detail" label="detail" width="200px" align="center" />
      <el-table-column prop="price" label="price" align="center" />
      <el-table-column prop="status" label="status" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" round>
            {{ scope.row.status === 1 ? 'On sale' : 'Stop sale' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="categoryId" label="Category" align="center">
        <!-- scope 的父组件是 el-table -->
        <template #default="scope">
          <!-- 遍历categoryList，找到categoryId对应的name   ?.防止找不到对应关系而报错 -->
          {{ categoryList.find((item) => item.id === scope.row.categoryId)?.name }}
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="Last operation time" width="180px" align="center" />
      <el-table-column label="operation" width="300px" align="center">
        <template #default="scope">
          <div class="btn-group">
            <el-button class="small-btn" @click="to_add_update(scope.row)" type="primary"
              >Modify</el-button
            >
            <el-button
              class="small-btn"
              @click="change_btn(scope.row)"
              plain
              :type="scope.row.status === 1 ? 'danger' : 'primary'"
            >
              {{ scope.row.status === 1 ? 'Stop sale' : 'On sale' }}</el-button
            >
            <el-button class="small-btn" @click="deleteBatch(scope.row)" type="danger"
              >Delete</el-button
            >
          </div>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="No data" />
      </template>
    </el-table>

    <!-- element ui 官方推荐使用 v-model 双向绑定 而不是使用事件监听 -->
    <!-- 但是为了监听后还要调用相关函数，看来只能用事件了... -->
    <!-- 有没有办法让v-model的值发生改变时自动触发更新函数？ -->
    <el-pagination
      class="page"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      :page-sizes="[2, 4, 6, 8]"
      v-model:current-page="pageData.page"
      v-model:page-size="pageData.pageSize"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />
  </el-card>
</template>

<style lang="less" scoped>
// element-plus的样式修改
.el-table {
  width: 90%;
  height: 800px;
  margin: 3rem auto;
  text-align: center;
  border: 1px solid #e4e4e4;
}
.btn-group {
  display: flex;
  justify-content: center; /* 居中对齐按钮 */
  gap: 6px;                /* 按钮之间间距 */
}

.small-btn {
  min-width: 60px;
  height: 28px;      /* 高度可选，适当缩小 */
  font-size: 12px;
  padding: 0 6px;    /* 控制左右内边距 */
}


:deep(.el-table tr) {
  font-size: 12px;
}

.el-button {
  width: 45px;
  font-size: 12px;
}

.el-pagination {
  justify-content: center;
}

// 自定义样式
body {
  background-color: #c91c1c;
}

.horizontal {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 0 80px;

  .input {
    width: 160px;
  }

  .btn {
    width: 120px;
  }
}

img {
  width: 50px;
  height: 50px;
  border-radius: 10px;
}

.add_btn {
  width: 100px;
  height: 40px;
  margin-left: 900px;
}
</style>
