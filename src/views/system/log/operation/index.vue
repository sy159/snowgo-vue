<script setup lang="ts">
import type { OperationLogCondition, OperationLogInfo } from '@/api/system/log'
import { Refresh, Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import { getItemListByDictCode, type ItemInfo } from '@/api/system/dict'
import {
  getOperationLogList,

} from '@/api/system/log'

// 资源字典项
const resourceOptions = ref<ItemInfo[]>([])

async function loadResourceOptions() {
  try {
    const res = await getItemListByDictCode('operation_resource')
    resourceOptions.value = res.data
  }
  catch {
    // 错误已由拦截器处理
  }
}

// 搜索条件
const searchForm = reactive({
  operator_name: '',
  resource: '',
  action: '',
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
const tableData = ref<OperationLogInfo[]>([])
const loading = ref(false)

// 获取日志列表
async function fetchList() {
  loading.value = true
  try {
    const params: OperationLogCondition = {
      operator_name: searchForm.operator_name || undefined,
      resource: searchForm.resource || undefined,
      action: searchForm.action || undefined,
      start_time: dateRange.value?.[0] ? `${dateRange.value[0]} 00:00:00` : undefined,
      end_time: dateRange.value?.[1] ? `${dateRange.value[1]} 23:59:59` : undefined,
      offset: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
    }
    const res = await getOperationLogList(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  }
  catch {
    // 错误已由 axios 拦截器处理
  }
  finally {
    loading.value = false
  }
}

// 重置搜索
function handleReset() {
  searchForm.operator_name = ''
  searchForm.resource = ''
  searchForm.action = ''
  dateRange.value = []
  pagination.page = 1
  fetchList()
}

// 操作类型标签颜色
function getActionTagType(action: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    Create: 'success',
    Update: 'warning',
    Delete: 'danger',
  }
  return map[action] || 'info'
}

// 操作类型中文
function getActionText(action: string): string {
  const map: Record<string, string> = {
    Create: '创建',
    Update: '更新',
    Delete: '删除',
  }
  return map[action] || action
}

// 格式化 JSON 数据
function formatJson(data: string): string {
  if (!data)
    return '无'
  try {
    return JSON.stringify(JSON.parse(data), null, 2)
  }
  catch {
    return data
  }
}

onMounted(() => {
  fetchList()
  loadResourceOptions()
})
</script>

<template>
  <div class="operation-log-page">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="操作人">
          <el-input
            v-model="searchForm.operator_name"
            placeholder="请输入操作人"
            clearable
            style="width: 160px"
            @keyup.enter="fetchList"
          />
        </el-form-item>
        <el-form-item label="资源">
          <el-select
            v-model="searchForm.resource"
            placeholder="请选择资源"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in resourceOptions"
              :key="item.item_code"
              :label="item.item_name"
              :value="item.item_code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select
            v-model="searchForm.action"
            placeholder="请选择操作类型"
            clearable
            style="width: 140px"
          >
            <el-option label="创建" value="Create" />
            <el-option label="更新" value="Update" />
            <el-option label="删除" value="Delete" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
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
        <!-- 展开行：显示前后数据 -->
        <el-table-column type="expand" width="50">
          <template #default="{ row }">
            <div class="expand-content">
              <div class="expand-section">
                <h4>操作前数据</h4>
                <pre class="json-block">{{ formatJson(row.before_data) }}</pre>
              </div>
              <div class="expand-section">
                <h4>操作后数据</h4>
                <pre class="json-block">{{ formatJson(row.after_data) }}</pre>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="operator_name" label="操作人" width="120" />
        <el-table-column prop="operator_type" label="操作人类型" width="120" align="center" />
        <el-table-column prop="resource" label="资源" min-width="150" show-overflow-tooltip />
        <el-table-column prop="resource_id" label="资源ID" width="100" align="center" />
        <el-table-column prop="action" label="操作类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getActionTagType(row.action)" effect="light">
              {{ getActionText(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="trace_id" label="追踪ID" width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="created_at" label="操作时间" width="180" />
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
.operation-log-page {
  padding: var(--space-6);
}

.expand-content {
  padding: 16px 24px;
  display: flex;
  gap: 24px;
}

.expand-section {
  flex: 1;
  min-width: 0;

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 600;
  }
}

.json-block {
  margin: 0;
  padding: 12px;
  background-color: var(--color-gray-100);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow: auto;
}
</style>
