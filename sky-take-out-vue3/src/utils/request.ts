import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserInfoStore } from '@/store'

const baseURL = '/api'
const instance = axios.create({ baseURL })

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = useUserInfoStore().userInfo?.token
    console.log('请求拦截器 token:', token)
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
instance.interceptors.response.use((response) => {
  if ('code' in response.data && response.data.code !== 1) {
    ElMessage.error(response.data.msg)
    return Promise.reject(response.data)
  }
  return response
})

export default instance
