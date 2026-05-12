<script setup lang="ts">
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
const form = reactive<RoleParam>({
  name: '',
  code: '',
  description: '',
  menu_ids: [],
})

const formRules: Record<string, any> = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
}

const menuTree = ref<MenuInfo[]>([])
const menuTreeRef = ref()
const menuLoading = ref(false)
const checkedMenuIds = ref<number[]>([])

/** 递归获取所有叶子节点 ID */
function getLeafIds(nodes: MenuInfo[]): number[] {
  const ids: number[] = []
  for (const n of nodes) {
    if (!n.children?.length) ids.push(n.id)
    else ids.push(...getLeafIds(n.children))
  }
  return ids
}

/** 判断节点是否包含目标叶子节点中的任何一个 */
function containsAnyLeaf(node: MenuInfo, leafSet: Set<number>): boolean {
  if (!node.children?.length) return leafSet.has(node.id)
  return node.children.some(c => containsAnyLeaf(c, leafSet))
}

/** 过滤出叶子节点（去掉只包含非叶子节点的父级，保留叶子父级） */
function filterToLeafOnly(nodes: MenuInfo[], leafSet: Set<number>): MenuInfo[] {
  const result: MenuInfo[] = []
  for (const n of nodes) {
    if (!n.children?.length) {
      if (leafSet.has(n.id)) result.push({ ...n })
    }
    else {
      const filteredChildren = filterToLeafOnly(n.children, leafSet)
      if (filteredChildren.length) result.push({ ...n, children: filteredChildren })
    }
  }
  return result
}

/** 过滤出当前用户有权限的菜单节点 */
function filterByPermission(nodes: MenuInfo[]): MenuInfo[] {
  const result: MenuInfo[] = []
  for (const n of nodes) {
    let filteredChildren: MenuInfo[] = []
    if (n.children?.length) {
      filteredChildren = filterByPermission(n.children)
    }
    const hasPerm = n.perms ? userStore.permissions.includes(n.perms) : filteredChildren.length > 0
    if (hasPerm) {
      result.push({ ...n, children: filteredChildren })
    }
  }
  return result
}

async function loadMenuTree() {
  menuLoading.value = true
  try {
    // 确保用户权限已加载
    if (!userStore.permissions.length) {
      await userStore.fetchUserInfo()
    }
    const res = await getMenuList()
    // 过滤出当前用户有权限的菜单
    menuTree.value = filterByPermission(res.data)
  }
  catch {
    // 错误已由拦截器处理
  }
  finally {
    menuLoading.value = false
  }
}

async function handleAdd() {
  isEdit.value = false
  Object.assign(form, {
    id: undefined,
    name: '',
    code: '',
    description: '',
    menu_ids: [],
  })
  checkedMenuIds.value = []
  await loadMenuTree()
  dialogVisible.value = true
}

async function handleEdit(row: RoleInfo) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    menu_ids: [],
  })
  checkedMenuIds.value = []

  // 先获取角色权限
  try {
    const res = await getRoleById(row.id)
    if (res.data.menu_ids?.length) {
      // 加载菜单树
      await loadMenuTree()
      // 从菜单树中找出所有叶子节点 ID
      const allLeafIds = getLeafIds(menuTree.value)
      const leafSet = new Set(allLeafIds)
      // 只保留叶子节点 ID 作为默认勾选（避免父级 ID 导致级联全选）
      checkedMenuIds.value = res.data.menu_ids.filter(id => leafSet.has(id))
    }
  }
  catch {
    // 错误已由拦截器处理
  }

  dialogVisible.value = true
}

async function handleSubmit() {
  // 非严格模式下：获取所有勾选节点（含父级联动产生的）
  const checkedKeys = menuTreeRef.value?.getCheckedKeys() as number[]
  const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() as number[]
  form.menu_ids = [...halfCheckedKeys, ...checkedKeys]

  if (!form.name || !form.code) {
    ElMessage.warning('请填写必填项')
    return
  }

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
  catch {
    // 错误已由拦截器处理
  }
  finally {
    submitting.value = false
  }
}

function handleDialogClose() {
  form.menu_ids = []
  checkedMenuIds.value = []
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
      <el-form :model="searchForm" inline class="search-form" @submit.prevent="handleSearch">
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
        <el-table-column v-if="userStore.hasPermission(['account:role:update', 'account:role:delete'])" label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'account:role:update'" link type="primary" size="small" @click="handleEdit(row)">
              编辑
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
      @closed="handleDialogClose"
    >
      <el-form
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
        <el-form-item label="菜单权限">
          <div v-loading="menuLoading" style="width: 100%">
            <el-tree
              ref="menuTreeRef"
              :data="menuTree"
              :props="{ label: 'name', children: 'children' }"
              node-key="id"
              show-checkbox
              :default-checked-keys="checkedMenuIds"
              style="max-height: 260px; overflow-y: auto"
            />
          </div>
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
  </div>
</template>

<style scoped lang="scss">
.role-management {
  padding: 20px;
}

.search-card {
  margin-bottom: 16px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0 12px;
}

.search-form :deep(.el-form-item:last-child) {
  margin-left: auto;
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
