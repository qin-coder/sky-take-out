import { defineStore } from 'pinia'

export const useUserInfoStore = defineStore('userInfo', {
  state: () => ({
    userInfo: null as null | { token: string; userName: string; [key: string]: any }
  }),
  actions: {
    // 设置用户信息，同时保存到 localStorage
    setUserInfo(info: any) {
      this.userInfo = info
      localStorage.setItem('userInfo', JSON.stringify(info))
    },
    // 清除用户信息，同时清理 localStorage
    clearUserInfo() {
      this.userInfo = null
      localStorage.removeItem('userInfo')
    },
    // 初始化 store，从 localStorage 读取（可选，pinia-plugin-persistedstate 可自动）
    initUserInfo() {
      const stored = localStorage.getItem('userInfo')
      if (stored) this.userInfo = JSON.parse(stored)
    }
  },
  persist: true // 使用 pinia-plugin-persistedstate 自动持久化
})
