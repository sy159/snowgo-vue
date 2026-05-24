<script setup lang="ts">
import type { LoginLogCondition, LoginLogInfo } from '@/api/system/log'
import { Refresh, Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import {
  getLoginLogList,

} from '@/api/system/log'

// 搜索条件
const searchForm = reactive({
  username: '',
  status: undefined as boolean | undefined,
})

// 日期范围
const dateRange = ref<string[]>([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 表格数据
const tableData = ref<LoginLogInfo[]>([])
const loading = ref(false)

// 获取日志列表
async function fetchList() {
  loading.value = true
  try {
    const params: LoginLogCondition = {
      username: searchForm.username || undefined,
      status: searchForm.status,
      start_time: dateRange.value?.[0] ? `${dateRange.value[0]} 00:00:00` : undefined,
      end_time: dateRange.value?.[1] ? `${dateRange.value[1]} 23:59:59` : undefined,
      offset: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
    }
    const res = await getLoginLogList(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  }
  catch (err) {
    console.error('[login-log] request failed:', err)
  }
  finally {
    loading.value = false
  }
}

// 重置搜索
function handleReset() {
  searchForm.username = ''
  searchForm.status = undefined
  dateRange.value = []
  pagination.page = 1
  fetchList()
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="login-log-page">
    <el-card shadow="never" class="table-card">
      <!-- 搜索表单 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
            style="width: 160px"
            @keyup.enter="fetchList"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="成功" :value="true" />
            <el-option label="失败" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="登录时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
        row-key="id"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'" effect="light">
              {{ row.status ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="信息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="row.status ? 'msg-success' : 'msg-fail'">
              {{ row.message }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="user_agent" label="User Agent" min-width="250" show-overflow-tooltip />
        <el-table-column prop="created_at" label="登录时间" width="180" />
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.login-log-page {
  background: var(--bg-page);
  min-height: 100%;
}

.msg-success {
  color: var(--color-success-600);
}

.msg-fail {
  color: var(--color-danger-600);
}
</style>
