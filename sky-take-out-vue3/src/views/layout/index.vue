<script setup lang="ts" name="layout">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserInfoStore } from '@/store'
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { fixPwdAPI } from '@/api/employee'
import { getStatusAPI, fixStatusAPI } from '@/api/shop'
import { ElNotification } from 'element-plus'

// ------ data ------
const dialogFormVisible = ref(false)
const dialogStatusVisible = ref(false)
const formLabelWidth = '80px'
const isCollapse = ref(false)

const menuList = [
  {
    title: 'Home',
    path: '/dashboard',
    icon: 'HomeFilled'
  },
  {
    title: 'Performance',
    path: '/statistics',
    icon: 'pieChart'
  },
  {
    title: 'Orders',
    path: '/order',
    icon: 'collection'
  },
  {
    title: 'Category',
    path: '/category',
    icon: 'postcard'
  },
  {
    title: 'Menu',
    path: '/setmeal',
    icon: 'menu'
  },
  {
    title: 'Dishes',
    path: '/dish',
    icon: 'dish'
  },
  {
    title: 'User',
    path: '/employee',
    icon: 'user'
  }
]

const form = reactive({
  oldPwd: '',
  newPwd: '',
  rePwd: ''
})
const pwdRef = ref()
const status = ref(1)
const status_active = ref(1) // 单选框绑定的动态值

// 自定义校验规则: 两次密码是否一致
const samePwd = (rules: any, value: any, callback: any) => {
  if (value !== form.newPwd) {
    // 如果验证失败，则调用 回调函数时，指定一个 Error 对象。
    callback(new Error('The passwords entered twice do not match!'))
  } else {
    // 如果验证成功，则直接调用 callback 回调函数即可。
    callback()
  }
}
const rules = {
  // 表单的规则检验对象
  oldPwd: [
    { required: true, message: 'Please enter the original password', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9]{1,10}$/,
      message: 'The original password must be 1-10 uppercase and lowercase letters and numbers.',
      trigger: 'blur'
    }
  ],
  newPwd: [
    { required: true, message: 'Please enter a new password', trigger: 'blur' },
    {
      pattern: /^\S{6,15}$/,
      message: 'The new password must be 6-15 non-empty characters.',
      trigger: 'blur'
    }
  ],
  rePwd: [
    { required: true, message: 'Please enter a new password again', trigger: 'blur' },
    {
      pattern: /^\S{6,15}$/,
      message: 'The new password must be 6-15 non-empty characters.',
      trigger: 'blur'
    },
    { validator: samePwd, trigger: 'blur' }
  ]
}

// ------ method ------
const router = useRouter()
const userInfoStore = useUserInfoStore()
const route = useRoute()
// 根据当前路由的路径返回要激活的菜单项
const getActiveAside = () => {
  console.log('当前路由的路径--------------', route.path)
  return route.path
}

// 初始化时获取营业状态
const init = async () => {
  const { data: res } = await getStatusAPI()
  console.log('初始化后的status status_active', res.data)
  status.value = res.data
  status_active.value = res.data
}
init()

// 关闭修改店铺状态对话框
const cancelStatus = () => {
  ElMessage({
    type: 'info',
    message: 'Modification canceled'
  })
  dialogStatusVisible.value = false
}
// 关闭修改密码对话框
const cancelForm = () => {
  ElMessage({
    type: 'info',
    message: 'Modification canceled'
  })
  dialogFormVisible.value = false
}
// 修改店铺状态
const fixStatus = async () => {
  const { data: res } = await fixStatusAPI(status_active.value)
  if (res.code != 0) return // 修改失败信息会在相应拦截器中捕获并提示
  // 修改成功才改变status的值
  status.value = status_active.value
  ElMessage({
    type: 'success',
    message: 'Successfully modified'
  })
  dialogStatusVisible.value = false
}
// 修改密码
const fixPwd = async () => {
  const valid = await pwdRef.value.validate()
  if (valid) {
    const submitForm = {
      oldPwd: form.oldPwd,
      newPwd: form.newPwd
    }

    const { data: res } = await fixPwdAPI(submitForm)
    if (res.code != 0) return // 密码错误信息会在相应拦截器中捕获并提示
    ElMessage({
      type: 'success',
      message: 'Successfully modified'
    })
    dialogFormVisible.value = false
  } else {
    return false
  }
}

const quitFn = () => {
  // 为了让用户体验更好，来个确认提示框
  ElMessageBox.confirm('Goodbye', 'Log out', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    type: 'warning'
  })
    .then(() => {
      ElMessage({
        type: 'success',
        message: 'Log out successfully'
      })
      // 清除用户信息，包括token
      userInfoStore.userInfo = null
      console.log(userInfoStore)
      router.push('/login')
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: 'Log out canceled'
      })
    })
}

// refs
const websocket = ref<WebSocket | null>(null)
const shopShow = ref(false)

const audio1 = ref<HTMLAudioElement | null>(null)
const audio2 = ref<HTMLAudioElement | null>(null)

const webSocket = () => {
  const clientId = Math.random().toString(36).slice(2)
  const socketUrl = 'ws://localhost:8080/ws/' + clientId
  console.log('socketUrl', socketUrl)

  if (typeof WebSocket == 'undefined') {
    ElNotification({
      title: 'Reminder',
      message:
        'The current browser cannot receive real-time alarm messages. Please use Google Chrome!',
      type: 'warning',
      duration: 0
    })
  } else {
    websocket.value = new WebSocket(socketUrl)
    websocket.value.onopen = () => {
      console.log('浏览器WebSocket已打开')
    }
    websocket.value.onmessage = (msg) => {
      console.log('接收到的消息', msg)
      audio1.value && audio1.value.click()
      // 重置音频，从头开始播放
      audio1.value!.currentTime = 0
      audio2.value!.currentTime = 0
      // 解析服务器通过WebSocket发送的消息
      const jsonMsg = JSON.parse(msg.data)
      if (jsonMsg.type === 1) {
        audio1.value!.play()
      } else if (jsonMsg.type === 2) {
        audio2.value!.play()
      }
      // 右上角弹窗提示
      ElNotification({
        title: jsonMsg.type === 1 ? 'Waiting for orders' : 'Urge for order',
        message:
          jsonMsg.type === 1
            ? `<span>You have 1<span style="color:#419EFF">Order pending</span>,${jsonMsg.content},Please accept the order promptly.</span>`
            : `${jsonMsg.content}<span style='color:#419EFF;cursor: pointer'>Handle it</span>`,
        duration: 0,
        dangerouslyUseHTMLString: true,
        onClick: () => {
          router.push(`/order?orderId=${jsonMsg.orderId}`).catch((err) => {
            console.log(err)
          })
          setTimeout(() => {
            location.reload()
          }, 100)
        }
      })
    }
    websocket.value.onerror = () => {
      ElNotification({
        title: 'Error',
        message: 'Server error, unable to receive real-time alarm information',
        type: 'error',
        duration: 0
      })
    }
    websocket.value.onclose = () => {
      console.log('WebSocket connection closed')
    }
  }
}

const handleClose = () => {
  shopShow.value = false
}

// lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClose)
  // getStatus()
  webSocket()
})

onBeforeUnmount(() => {
  if (websocket.value) {
    websocket.value.close()
  }
})
</script>

<template>
  <div class="common-layout">
    <!-- 店铺状态对话框 -->
    <el-dialog v-model="dialogStatusVisible" title="Store Status" width="500">
      <el-radio-group v-model="status_active">
        <el-radio :value="1" size="large">
          Open for Business
          <span>The restaurant is open. Click "Close" to switch.</span>
        </el-radio>
        <el-radio :value="0" size="large">
          Closed
          <span>The restaurant is closed. Click "Open" to resume.</span>
        </el-radio>
      </el-radio-group>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelStatus">Cancel</el-button>
          <el-button type="primary" @click="fixStatus">Confirm</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="dialogFormVisible" title="Change Password" width="500">
      <el-form :model="form" :rules="rules" ref="pwdRef">
        <el-form-item prop="oldPwd" label="Original password" :label-width="formLabelWidth">
          <el-input v-model="form.oldPwd" autocomplete="off" />
        </el-form-item>
        <el-form-item prop="newPwd" label="New password" :label-width="formLabelWidth">
          <el-input v-model="form.newPwd" autocomplete="off" />
        </el-form-item>
        <el-form-item prop="rePwd" label="Confirm password" :label-width="formLabelWidth">
          <el-input v-model="form.rePwd" autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelForm">Cancel</el-button>
          <el-button type="primary" @click="fixPwd">Confirm</el-button>
        </div>
      </template>
    </el-dialog>

    <el-container>
      <!-- 头部 -->
      <el-header class="header">
        <img
          src="../../assets/image/ubereats.svg"
          class="logo"
          style="cursor: pointer"
          @click="router.push('/dashboard')"
        />
        <el-button class="collapse-btn" @click="isCollapse = !isCollapse">
          <component :is="isCollapse ? 'Expand' : 'Fold'" />
        </el-button>
        <div class="status">{{ status === 1 ? 'Open' : 'Closed' }}</div>

        <el-dropdown class="user-dropdown">
          <el-button type="primary">
            {{ userInfoStore.userInfo?.account || 'Admin' }}
            <el-icon class="arrow-down-icon"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="dialogFormVisible = true">Change password</el-dropdown-item>
              <el-dropdown-item @click="quitFn">Log out</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button class="status-change" @click="dialogStatusVisible = true"
          >Store Status</el-button
        >
      </el-header>

      <el-container class="main-container">
        <!-- 左侧导航 -->
        <el-aside :width="isCollapse ? '80px' : '220px'" class="sidebar">
          <el-menu
            :collapse="isCollapse"
            background-color="#fff"
            text-color="#333"
            active-text-color="#00e6ff"
            :default-active="getActiveAside()"
            router
          >
            <template v-for="item in menuList" :key="item.path">
              <el-menu-item :index="item.path">
                <el-icon>
                  <component :is="item.icon" />
                </el-icon>
                <span>{{ item.title }}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </el-aside>

        <!-- 右侧内容区域 -->
        <el-container class="content-area">
          <el-main>
            <router-view />
          </el-main>
          <el-footer>© 2025.9.21 Sky-take-out Tech and Fun. All rights reserved.</el-footer>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<style lang="less" scoped>
.common-layout {
  height: 100%;
  background-color: #f5f5f5;
}

.header {
  background-color: #f0f0f0; /* 浅灰色头部 */
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;

  .logo {
    width: 160px;
    height: auto;
    margin-right: 20px;
  }

  .collapse-btn {
    margin-right: 20px;
    background: transparent;
    border: none;
    color: #333;
  }

  .status {
    background-color: #eebb00;
    padding: 4px 12px;
    border-radius: 4px;
    margin-left: 10px;
    font-weight: bold;
  }

  .status-change {
    margin-left: 20px;
    background-color: rgba(0, 0, 0, 0.1);
    border: none;
    color: #333;
  }

  .user-dropdown {
    margin-left: auto;
    .el-button {
      background-color: #eebb00;
      border-color: #eebb00;
      color: #111f3c;
    }
  }
}

.main-container {
  display: flex;
  height: calc(100vh - 60px);

  .sidebar {
    background-color: #fff; /* 白色侧边栏 */
    color: #333;
  }

  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;

    el-main {
      flex: 1;
      padding: 20px;
      background-color: #fff;
    }

    .el-footer {
      display: flex; /* 使用 flex 布局 */
      justify-content: center; /* 水平居中 */
      align-items: center; /* 垂直居中 */
      height: 40px; /* 高度可根据需要调整 */
      background-color: #f5f5f5;
      font-size: 12px;
      width: 100%; /* 占满宽度 */
      position: relative;
      bottom: 0;
    }
  }
}

.el-menu-item {
  margin: 5px 10px;
  border-radius: 6px;
  height: 50px;
  line-height: 50px;
  display: flex;
  align-items: center;

  span {
    margin-left: 10px;
  }
}

.el-menu-item.is-active {
  background-color: #818d8e;
  color: #111f3c;
}

.el-menu--collapse {
  width: 80px !important;
}
</style>
