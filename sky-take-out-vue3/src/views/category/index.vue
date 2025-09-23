<script setup lang="ts">
import { reactive, ref } from 'vue'
import { getCategoryPageListAPI, updateCategoryStatusAPI, deleteCategoryAPI } from '@/api/category'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

// ------ .d.ts 属性类型接口 ------
interface category {
  id: number
  name: string
  type: string
  sort: string
  status: string
  updateTime: string
}

// ------ 数据 ------

// 当前页的分类列表
const categoryList = ref<category[]>([])
// 带查询条件的分页参数
const pageData = reactive({
  name: '',
  type: '',
  page: 1,
  pageSize: 6,
  total: 0
})
const options = [
  {
    value: '1',
    label: 'Dish Categories'
  },
  {
    value: '2',
    label: 'Package Categories'
  }
]

// ------ 方法 ------

// 页面初始化，就根据token去获取用户信息，才能实现如果没有token/token过期，刚开始就能够跳转到登录页
const init = async () => {
  // 参数解构再传进去，不用传total
  const { data: res } = await getCategoryPageListAPI({
    name: pageData.name,
    type: pageData.type,
    page: pageData.page,
    pageSize: pageData.pageSize
  })

  categoryList.value = res.data.records
  pageData.total = res.data.total
}

init() // 页面初始化/分页查询，写在这里时的生命周期是beforecreated/created的时候

// 监听翻页和每页显示数量的变化
const handleCurrentChange = (val: number) => {
  pageData.page = val
  // 条件分页查询
  init()
}

const handleSizeChange = (val: number) => {
  pageData.pageSize = val
  // 条件分页查询
  init()
}

// 修改分类(路径传参，到update页面后，根据id查询分类信息，回显到表单中)
const router = useRouter()
const update_btn = (row: any) => {
  console.log(row)
  router.push({
    name: 'category_update',
    query: {
      id: row.id
    }
  })
}

// 修改分类状态
const change_btn = async (row: any) => {
  console.log(row)
  await updateCategoryStatusAPI(row.id, row.status === 1 ? 0 : 1)
  // 修改后刷新页面，更新数据
  init()
  ElMessage({
    type: 'success',
    message: 'Modified successfully'
  })
}

// 删除分类
const delete_btn = (row: any) => {
  ElMessageBox.confirm(
    'This operation will permanently delete the category. Are you sure you want to continue?',
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning'
    }
  )
    .then(async () => {
      await deleteCategoryAPI(row.id)
      // 删除后刷新页面，更新数据
      init()
      ElMessage({
        type: 'success',
        message: 'Successfully deleted'
      })
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: 'Cancel deletion'
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
        placeholder="Please enter the category name"
      />
      <el-select
        size="large"
        class="input"
        clearable
        v-model="pageData.type"
        placeholder="Select category type"
      >
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button size="large" class="btn" round type="success" @click="init()"
        >Query Categories</el-button
      >
      <el-button size="large" class="btn" type="primary" @click="router.push('/category/add')">
        <el-icon style="font-size: 15px; margin-right: 10px"> <Plus /> </el-icon>Add Category
      </el-button>
    </div>
    <el-table :data="categoryList" stripe>
      <!-- <el-table-column prop="id" label="id" /> -->
      <el-table-column prop="name" label="Category Name" align="center" />
      <el-table-column prop="type" label="Category" align="center">
        <template #default="scope">
          <span>{{ scope.row.type === 1 ? 'Dish Categories' : 'Package Categories' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="Sorting" align="center" />
      <el-table-column prop="status" label="Status" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" round>
            {{ scope.row.status === 1 ? 'Start selling' : 'Stop selling' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="updateTime"
        label="Last operation time"
        width="250px"
        style="font-size: 10px"
        align="center"
      />
      <el-table-column label="operation" width="250px" align="center">
        <!-- scope 的父组件是 el-table -->
        <template #default="scope">
          <div class="btn-group">
            <el-button class="small-btn" @click="update_btn(scope.row)" type="primary"
              >Modify</el-button
            >
            <el-button
              class="small-btn"
              @click="change_btn(scope.row)"
              plain
              :type="scope.row.status === 1 ? 'danger' : 'primary'"
            >
              {{ scope.row.status === 1 ? 'Stop sale' : 'On sale' }}
            </el-button>
            <el-button class="small-btn" @click="delete_btn(scope.row)" type="danger"
              >Delete</el-button
            >
          </div>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description=" No data" />
      </template>
    </el-table>

    <!-- element ui 官方推荐使用 v-model 双向绑定 而不是使用事件监听 -->
    <!-- 但是为了监听后还要调用相关函数，看来只能用事件了... -->
    <!-- 有没有办法让v-model的值发生改变时自动触发更新函数？ -->
    <el-pagination
      class="page"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="pageData.total"
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
  justify-content: space-around; // 可选，按钮居中
  gap: 10px; // 按钮间距
}

.small-btn {
  min-width: 60px; // 或者你觉得合适的宽度
  margin: 0 5px; // 按钮间距
  font-size: 12px;
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
.horizontal {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 0 80px;

  .input {
    width: 200px;
  }

  .btn {
    width: 150px;
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
