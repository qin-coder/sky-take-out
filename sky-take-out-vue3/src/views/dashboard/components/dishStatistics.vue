<template>
  <div class="container">
    <h2 class="homeTitle">
      Dish Overview
      <div class="more">
        <router-link to="dish">Dish Management</router-link>
        <el-icon>
          <ArrowRight />
        </el-icon>
      </div>
    </h2>
    <div class="orderviewBox">
      <ul>
        <li>
          <span class="status">
            <el-icon>
              <Finished />
            </el-icon>
            Now on sale
          </span>
          <span class="num">{{ dishesData.sold }}</span>
        </li>
        <li>
          <span class="status">
            <el-icon>
              <Lock />
            </el-icon>
            Discontinued
          </span>
          <span class="num">{{ dishesData.discontinued }}</span>
        </li>
        <li class="add">
          <router-link to="/dish/add">
            <el-icon>
              <CirclePlus />
            </el-icon>
            <p>Add New dishes</p>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>

// Define props
const props = defineProps<{
  dishesData: {
    sold: number,
    discontinued: number
  }
}>()
</script>

<style scoped></style>
