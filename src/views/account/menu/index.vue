<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { MenuInfo, MenuParam } from '@/api/account/menu'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  createMenu,
  deleteMenuById,
  getMenuList,

  updateMenu,
} from '@/api/account/menu'
import { useUserStore } from '@/store'

const userStore = useUserStore()

// ---- 表单数据与规则（需在 computed 和函数定义之前声明） ----
const form = reactive<MenuParam>({
  parent_id: 0,
  menu_type: 'Dir',
  name: '',
  path: '',
  icon: '',
  perms: '',
  sort_order: 0,
})

// 动态表单校验规则
function buildFormRules(): FormRules {
  const rules: FormRules = {
    name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  }
  if (form.menu_type !== 'Btn') {
    rules.path = [{ required: true, message: '请输入路由地址', trigger: 'blur' }]
  }
  if (form.menu_type === 'Btn') {
    rules.perms = [{ required: true, message: '请输入权限标识', trigger: 'blur' }]
  }
  return rules
}

const formRules = ref<FormRules>(buildFormRules())

// 菜单类型标签
function typeLabel(type: string): string {
  const map: Record<string, string> = { Dir: '目录', Menu: '菜单', Btn: '按钮' }
  return map[type] || type
}

// 表格数据
const tableData = ref<MenuInfo[]>([])
const loading = ref(false)

// 获取菜单树
async function fetchData() {
  loading.value = true
  try {
    const res = await getMenuList()
    tableData.value = res.data
  }
  catch (err) {
    console.error('[menu] request failed:', err)
  }
  finally {
    loading.value = false
  }
}

// 菜单树选项（用于 el-tree-select，包含根节点）
interface MenuTreeSelectNode {
  id: number
  name: string
  children: MenuTreeSelectNode[]
}
const menuTreeOptions = computed((): MenuTreeSelectNode[] => {
  // 递归过滤掉按钮类型的节点，按钮不能作为上级菜单
  function filterBtnNodes(nodes: MenuInfo[]): MenuTreeSelectNode[] {
    return nodes
      .filter(n => n.menu_type !== 'Btn')
      .map(n => ({
        id: n.id,
        name: n.name,
        children: n.children ? filterBtnNodes(n.children) : [],
      }))
  }
  const filtered = filterBtnNodes(tableData.value)
  // 添加根节点选项
  return [
    { id: 0, name: '根目录', children: filtered },
  ]
})

// 根据选中的上级菜单，返回当前菜单可选的类型
const availableMenuTypes = computed((): ('Dir' | 'Menu' | 'Btn')[] => {
  if (form.parent_id === 0)
    return ['Dir', 'Menu']
  // 找到选中的父节点类型
  function findNode(nodes: MenuInfo[], id: number): MenuInfo | null {
    for (const n of nodes) {
      if (n.id === id)
        return n
      if (n.children) {
        const found = findNode(n.children, id)
        if (found)
          return found
      }
    }
    return null
  }
  const parent = findNode(tableData.value, form.parent_id)
  if (!parent)
    return ['Dir', 'Menu']
  if (parent.menu_type === 'Dir')
    return ['Dir', 'Menu']
  if (parent.menu_type === 'Menu')
    return ['Btn']
  return ['Dir', 'Menu']
})

// 当上级菜单切换时，自动修正菜单类型
function onParentChange(): void {
  if (!availableMenuTypes.value.includes(form.menu_type as 'Dir' | 'Menu' | 'Btn')) {
    form.menu_type = availableMenuTypes.value[0]
    formRules.value = buildFormRules()
  }
}

// ---- 新增/编辑 ----
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

function handleAdd(parentRow?: MenuInfo) {
  isEdit.value = false
  if (parentRow) {
    form.parent_id = parentRow.id
    // 根据父级类型自动设置当前类型
    form.menu_type = parentRow.menu_type === 'Dir' ? 'Dir' : 'Btn'
  }
  else {
    form.parent_id = 0
    form.menu_type = 'Dir'
  }
  formRules.value = buildFormRules()
  dialogVisible.value = true
}

function handleEdit(row: MenuInfo) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    parent_id: row.parent_id,
    menu_type: row.menu_type,
    name: row.name,
    path: row.path || '',
    icon: row.icon || '',
    perms: row.perms || '',
    sort_order: row.sort_order,
  })
  formRules.value = buildFormRules()
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value)
    return
  // 切换类型后重新校验
  formRules.value = buildFormRules()
  await formRef.value.validate(async (valid) => {
    if (!valid)
      return
    submitting.value = true
    try {
      // 构造提交数据，清除空字符串的可选字段
      const payload: MenuParam = {
        parent_id: form.parent_id || 0,
        menu_type: form.menu_type,
        name: form.name,
        sort_order: form.sort_order || 0,
      }
      if (form.menu_type !== 'Btn') {
        payload.path = form.path || undefined
        payload.icon = form.icon || undefined
      }
      if (form.menu_type === 'Btn') {
        payload.perms = form.perms || undefined
      }
      if (isEdit.value) {
        payload.id = form.id
        await updateMenu(payload)
        ElMessage.success('更新成功')
      }
      else {
        await createMenu(payload)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      fetchData()
    }
    catch (err) {
      console.error('[menu] request failed:', err)
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
    parent_id: 0,
    menu_type: 'Dir',
    name: '',
    path: '',
    icon: '',
    perms: '',
    sort_order: 0,
  })
}

// ---- 删除 ----
async function handleDelete(row: MenuInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除菜单「${row.name}」吗？${row.children && row.children.length > 0 ? '该菜单下存在子菜单，将一并删除。' : ''}此操作不可恢复。`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
    await deleteMenuById(row.id)
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
  <div class="menu-management">
    <!-- 工具栏 & 表格 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>菜单列表</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        row-key="id"
        :tree-props="{ children: 'children' }"
        style="width: 100%"
      >
        <el-table-column prop="name" label="菜单名称" min-width="180" />
        <el-table-column prop="menu_type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.menu_type === 'Dir' ? 'primary' : row.menu_type === 'Menu' ? 'success' : 'warning'"
              size="small"
            >
              {{ typeLabel(row.menu_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由地址" min-width="160" show-overflow-tooltip />
        <el-table-column prop="icon" label="图标" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.icon">{{ row.icon }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="perms" label="权限标识" min-width="180" show-overflow-tooltip />
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column v-if="userStore.hasPermission(['account:menu:create', 'account:menu:update', 'account:menu:delete'])" label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.menu_type !== 'Btn'" v-permission="'account:menu:create'" link type="success" size="small" @click="handleAdd(row)">
              新增子菜单
            </el-button>
            <el-button v-permission="'account:menu:update'" link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button v-permission="'account:menu:delete'" link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑菜单' : '新增菜单'"
      width="560px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="90px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="上级菜单" prop="parent_id">
          <el-tree-select
            v-model="form.parent_id"
            :data="menuTreeOptions"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            check-strictly
            :render-after-expand="false"
            placeholder="根目录"
            clearable
            style="width: 100%"
            @change="onParentChange"
          />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menu_type">
          <el-radio-group v-model="form.menu_type">
            <el-radio value="Dir" :disabled="!availableMenuTypes.includes('Dir')">
              目录
            </el-radio>
            <el-radio value="Menu" :disabled="!availableMenuTypes.includes('Menu')">
              菜单
            </el-radio>
            <el-radio value="Btn" :disabled="!availableMenuTypes.includes('Btn')">
              按钮
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item v-if="form.menu_type !== 'Btn'" label="路由地址" prop="path">
          <el-input v-model="form.path" placeholder="请输入路由地址" />
        </el-form-item>
        <el-form-item v-if="form.menu_type !== 'Btn'" label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标类名，如 el-icon-Setting" />
        </el-form-item>
        <el-form-item v-if="form.menu_type === 'Btn'" label="权限标识" prop="perms">
          <el-input v-model="form.perms" placeholder="例如：account:user:add" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" :max="999" />
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
.menu-management {
  padding: var(--space-6);
  background: var(--bg-page);
  min-height: 100%;
}

.text-muted {
  color: var(--text-tertiary);
}
</style>
