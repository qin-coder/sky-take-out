<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { getEmployeeByIdAPI, updateEmployeeAPI } from '@/api/employee'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserInfoStore } from '@/store'

// ------ 数据 ------
let userInfoStore = useUserInfoStore()

const formLabelWidth = '60px'
const id = ref()
const form = reactive({
  id: 0,
  name: '',
  account: '',
  phone: '',
  age: '',
  gender: '',
  pic: ''
})
const genders = [
  {
    value: 1,
    label: 'male'
  },
  {
    value: 0,
    label: 'female'
  }
]
const inputRef1 = ref<HTMLInputElement | null>(null)
const updateRef = ref()

// Form validation
const checkAge = (rule: any, value: string, callback: (error?: Error) => void) => {
  if (value === '' || value === undefined) {
    callback(new Error('Please enter your age'))
  } else if (!/^\d+$/.test(value)) {
    callback(new Error('Age must be a number'))
  } else {
    const age = parseInt(value)
    if (age < 3) {
      callback(new Error('Age cannot be less than 3'))
    } else if (age > 99) {
      callback(new Error('Age cannot be greater than 99'))
    } else {
      callback()
    }
  }
}

const rules = {
  name: [
    { required: true, trigger: 'blur', message: 'Cannot be empty' },
    { min: 2, message: 'Name must be at least 2 characters', trigger: 'blur' },
    { max: 20, message: 'Name cannot exceed 20 characters', trigger: 'blur' }
  ],
  account: [
    { required: true, trigger: 'blur', message: 'Cannot be empty' },
    {
      pattern: /^[a-zA-Z0-9]{1,10}$/,
      message: 'Username must be 1–10 letters or digits',
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, trigger: 'blur', message: 'Cannot be empty' },
    {
      pattern: /^\S{6,15}$/,
      message: 'Password must be 6–15 non-whitespace characters',
      trigger: 'blur'
    }
  ],
  phone: [
    { required: true, trigger: 'blur', message: 'Cannot be empty' },
    { pattern: /^1[3-9]\d{9}$/, message: 'Invalid phone number format', trigger: 'blur' }
  ],
  age: [
    { required: true, trigger: 'blur', message: 'Cannot be empty' },
    { validator: checkAge, trigger: 'blur' }
  ],
  gender: [{ required: true, trigger: 'blur', message: 'Cannot be empty' }]
}

// ------ 方法 ------

const router = useRouter()
const route = useRoute()

// 选择图片->点击事件->让选择框出现
const chooseImg = () => {
  // 模拟点击input框的行为，通过点击按钮触发另一个input框的事件，移花接木
  // 否则直接调用input框，其样式不太好改    input框中有个inputRef1属性，让inputRef1去click模拟点击行为
  if (inputRef1.value) {
    inputRef1.value.click() // 当input框的type是file时，click()方法会触发选择文件的对话框(弹出文件管理器)
  }
}

// 在文件管理器中选择图片后触发的改变事件：预览
const onFileChange1 = (e: Event) => {
  // 获取用户选择的文件列表（伪数组）
  console.log(e)
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    // 选择了图片
    console.log(files[0])
    // 文件 -> base64字符串  (可以发给后台)
    // 1. 创建 FileReader 对象
    const fr = new FileReader()
    // 2. 调用 readAsDataURL 函数，读取文件内容
    fr.readAsDataURL(files[0])
    // 3. 监听 fr 的 onload 事件，文件转为base64字符串成功后会触发该事件
    fr.onload = () => {
      // 4. 通过 e.target.result 获取到读取的结果，值是字符串（base64 格式的字符串）
      form.pic = fr.result as string
    }
  }
}

// 修改员工信息后提交（只有管理员才能对其他员工进行修改，否则普通员工只能对自己进行修改）
const submit = async () => {
  try {
    const valid = await updateRef.value.validate()
    if (valid) {
      // 在这里执行表单提交操作，比如调用updateUser(form)方法等
      const res = await updateEmployeeAPI(form)
      if (res.data.code !== 1) {
        // 响应拦截器已经用ElMessage打印了错误信息，这里直接return
        return false
      }
      // 如果修改的是当前用户信息，那么可能会更新当前登录系统员工的账号，即需要更新store的account值

      if (userInfoStore.userInfo && userInfoStore.userInfo.id === form.id) {
        let { data: employee } = await getEmployeeByIdAPI(form.id)
        if (userInfoStore.userInfo) {
          userInfoStore.userInfo.account = employee.data.account
        }
      }
      // 然后进行 消息提示，页面跳转 等操作
      ElMessage({
        message: 'Employee information updated successfully',
        type: 'success'
      })
      router.push({
        path: '/employee'
      })
    } else {
      return false
    }
  } catch (error) {
    console.error('Failed during execution:', error)
  }
}
// 取消修改
const cancel = () => {
  router.push({
    path: '/employee'
  })
}

const init = async () => {
  console.log(route.query)
  if (route.query) {
    id.value = route.query.id || 0
    form.id = id.value
    let employee = await getEmployeeByIdAPI(id.value)
    // 真服了，下面这种常规写法丢失响应式！因为对象重新赋值会分配新的引用地址，其指向的对象是新对象，因此丢失响应式！
    // form = song.data.data
    // 重新赋值，不改变引用的写法
  } else {
    console.log('没有id')
  }
  console.log(id)
}

init()
</script>

<template>
  <h1>Edit Employee Page</h1>
  <el-card>
    <el-form :model="form" :rules="rules" ref="updateRef">
      <el-form-item label="Name" :label-width="formLabelWidth" prop="name">
        <el-input v-model="form.name" autocomplete="off" />
      </el-form-item>
      <el-form-item label="Account" :label-width="formLabelWidth" prop="account">
        <el-input v-model="form.account" autocomplete="off" />
      </el-form-item>
      <el-form-item label="Phone" :label-width="formLabelWidth" prop="phone">
        <el-input v-model="form.phone" autocomplete="off" />
      </el-form-item>
      <el-form-item label="Age" :label-width="formLabelWidth" prop="age">
        <el-input v-model="form.age" autocomplete="off" />
      </el-form-item>
      <el-form-item label="Gender" :label-width="formLabelWidth" prop="gender">
        <el-select clearable v-model="form.gender" placeholder="Select category type">
          <el-option
            v-for="item in genders"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Avatar" :label-width="formLabelWidth" prop="pic">
        <img class="the_img" v-if="!form.pic" src="/src/assets/image/user_default.png" alt="" />
        <img class="the_img" v-else :src="form.pic" alt="" />
        <input
          type="file"
          accept="image/*"
          style="display: none"
          ref="inputRef1"
          @change="onFileChange1"
        />
        <el-button type="primary" @click="chooseImg">
          <el-icon style="font-size: 15px; margin-right: 10px">
            <Plus />
          </el-icon>
          Select Image
        </el-button>
      </el-form-item>
    </el-form>
    <el-form-item class="btn_box">
      <el-button class="submit_btn" type="success" @click="submit">Update</el-button>
      <el-button class="cancel_btn" type="info" plain @click="cancel">Cancel</el-button>
    </el-form-item>
  </el-card>
</template>

<style lang="less" scoped>
h1 {
  font-size: 20px;
  text-align: center;
  margin: 20px;
}

.el-form {
  margin-top: 30px;
  width: 500px;
  margin: 0 auto;
}

img {
  width: 50px;
  height: 50px;
  margin-right: 20px;
}

.btn_box {
  display: flex;
  justify-content: center;

  .submit_btn {
    width: 100px;
    height: 40px;
    margin: 30px 0 0 950px;
  }

  .cancel_btn {
    width: 100px;
    height: 40px;
    margin: 30px 0 0 200px;
  }
}
</style>
