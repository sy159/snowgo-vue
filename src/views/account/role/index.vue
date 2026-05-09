<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { MenuInfo } from '@/api/account/menu'
import type { RoleInfo, RoleListCondition, RoleParam } from '@/api/account/role'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { getMenuList } from '@/api/account/menu'
import {
  createRole,
  deleteRole,
  getRoleById,
  getRoleList,

  updateRole,
} from '@/api/account/role'
import { useUserStore } from '@/store'

const userStore = useUserStore()

// 搜索条件
const searchForm = reactive({
  name: '',
  code: '',
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 表格数据
const tableData = ref<RoleInfo[]>([])
const loading = ref(false)

// 获取列表数据
async function fetchData() {
  loading.value = true
  try {
    const params: RoleListCondition = {
      name: searchForm.name || undefined,
      code: searchForm.code || undefined,
      offset: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
    }
    const res = await getRoleList(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  }
  catch (_e: unknown) {
    // 错误已由 axios 拦截器处理
  }
  finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchData()
}

// 重置搜索
function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  handleSearch()
}

// ---- 新增/编辑 ----
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<RoleParam>({
  name: '',
  code: '',
  description: '',
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
}

function handleAdd() {
  isEdit.value = false
  dialogVisible.value = true
}

function handleEdit(row: RoleInfo) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value)
    return
  await formRef.value.validate(async (valid) => {
    if (!valid)
      return
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateRole({ ...form })
        ElMessage.success('更新成功')
      }
      else {
        await createRole({ ...form })
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      fetchData()
    }
    catch (_e: unknown) {
      // 错误已由拦截器处理
    }
    finally {
      submitting.value = false
    }
  })
}

function resetForm() {
  formRef.value?.resetFields()
  Object.assign(form, {
    id: undefined,
    name: '',
    code: '',
    description: '',
  })
}

// ---- 权限分配 ----
const permDialogVisible = ref(false)
const permSubmitting = ref(false)
const permLoading = ref(false)
const permTarget = ref<RoleInfo | null>(null)
const treeRef = ref()
const menuTree = ref<MenuInfo[]>([])
const checkedMenuIds = ref<number[]>([])

// 加载菜单树
async function loadMenuTree() {
  permLoading.value = true
  try {
    const res = await getMenuList()
    menuTree.value = res.data
  }
  catch (_e: unknown) {
    // 错误已由拦截器处理
  }
  finally {
    permLoading.value = false
  }
}

// 打开权限分配
async function handlePermAlloc(row: RoleInfo) {
  permTarget.value = row
  checkedMenuIds.value = []
  permDialogVisible.value = true
  await loadMenuTree()
  // 获取角色已有的菜单权限
  try {
    const res = await getRoleById(row.id)
    if (res.data.menu_ids && res.data.menu_ids.length) {
      checkedMenuIds.value = res.data.menu_ids
      // 等待树渲染完成后设置选中
      setTimeout(() => {
        treeRef.value?.setCheckedKeys(res.data.menu_ids as number[])
      }, 100)
    }
  }
  catch (_e: unknown) {
    // 错误已由拦截器处理
  }
}

async function handlePermSubmit() {
  if (!permTarget.value || !treeRef.value)
    return
  permSubmitting.value = true
  try {
    // 获取当前勾选的节点 ID（包含半选节点）
    const checkedKeys = treeRef.value.getCheckedKeys() as number[]
    const halfCheckedKeys = treeRef.value.getHalfCheckedKeys() as number[]
    const menuIds = [...checkedKeys, ...halfCheckedKeys]

    await updateRole({
      id: permTarget.value.id,
      name: permTarget.value.name,
      code: permTarget.value.code,
      menu_ids: menuIds,
    })
    ElMessage.success('权限分配成功')
    permDialogVisible.value = false
  }
  catch (_e: unknown) {
    // 错误已由拦截器处理
  }
  finally {
    permSubmitting.value = false
  }
}

// ---- 删除 ----
async function handleDelete(row: RoleInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色「${row.name}」吗？此操作不可恢复。`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    fetchData()
  }
  catch {
    // 用户取消
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="role-management">
    <!-- 搜索表单 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline @submit.prevent="handleSearch">
        <el-form-item label="角色名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入角色名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="角色编码">
          <el-input
            v-model="searchForm.code"
            placeholder="请输入角色编码"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工具栏 & 表格 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>角色列表</span>
          <el-button v-permission="'account:role:create'" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" min-width="120" />
        <el-table-column prop="code" label="角色编码" min-width="140" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column v-if="userStore.hasPermission(['account:role:update', 'account:role:delete'])" label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'account:role:update'" link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button v-permission="'account:role:update'" link type="warning" size="small" @click="handlePermAlloc(row)">
              权限分配
            </el-button>
            <el-button v-permission="'account:role:delete'" link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="520px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code" placeholder="例如：admin, editor" :disabled="!!isEdit" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 权限分配对话框 -->
    <el-dialog
      v-model="permDialogVisible"
      title="权限分配"
      width="480px"
      destroy-on-close
    >
      <el-alert
        v-if="permTarget"
        :title="`为角色「${permTarget.name}」分配菜单权限`"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />
      <div v-loading="permLoading">
        <el-tree
          ref="treeRef"
          :data="menuTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          show-checkbox
          check-strictly
          :default-checked-keys="checkedMenuIds"
          style="max-height: 420px; overflow-y: auto"
        />
      </div>
      <template #footer>
        <el-button @click="permDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="permSubmitting" @click="handlePermSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.role-management {
  padding: 20px;
}

.search-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
