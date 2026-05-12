<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { DictInfo, DictItemParam, DictParam, ItemInfo } from '@/api/system/dict'
import { ArrowLeft, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import {
  createDict,
  createItem,
  deleteDictById,
  deleteDictItem,
  getDictList,
  getItemListByDictCode,
  updateDict,
  updateDictItem,
} from '@/api/system/dict'
import { useUserStore } from '@/store'

const userStore = useUserStore()

// ========== 字典列表 ==========

const dictList = ref<DictInfo[]>([])
const dictLoading = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 搜索条件
const searchForm = reactive({
  name: '',
  code: '',
})

function handleSearch() {
  pagination.page = 1
  fetchDictList()
}

function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  pagination.page = 1
  fetchDictList()
}

async function fetchDictList() {
  dictLoading.value = true
  try {
    const res = await getDictList({
      name: searchForm.name || undefined,
      code: searchForm.code || undefined,
      offset: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
    })
    dictList.value = res.data.list
    pagination.total = res.data.total
  }
  catch {
    // 错误已由 axios 拦截器处理
  }
  finally {
    dictLoading.value = false
  }
}

// ========== 字典项列表 ==========

const selectedDict = ref<DictInfo | null>(null)
const itemList = ref<ItemInfo[]>([])
const itemLoading = ref(false)

async function fetchItemList() {
  if (!selectedDict.value)
    return
  itemLoading.value = true
  try {
    const res = await getItemListByDictCode(selectedDict.value.code)
    itemList.value = res.data
  }
  catch {
    // 错误已由 axios 拦截器处理
  }
  finally {
    itemLoading.value = false
  }
}

function handleBackToList() {
  selectedDict.value = null
  itemList.value = []
}

// ========== 字典 CRUD ==========

const dictDialogVisible = ref(false)
const isEditDict = ref(false)
const dictSubmitting = ref(false)
const dictFormRef = ref<FormInstance>()
const dictForm = reactive<DictParam>({
  code: '',
  name: '',
  description: '',
})

const dictFormRules: FormRules = {
  code: [{ required: true, message: '请输入字典编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
}

function openAddDict() {
  isEditDict.value = false
  Object.assign(dictForm, { id: undefined, code: '', name: '', description: '' })
  dictDialogVisible.value = true
}

function openEditDict(row: DictInfo) {
  isEditDict.value = true
  Object.assign(dictForm, {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
  })
  dictDialogVisible.value = true
}

async function handleDictSubmit() {
  if (!dictFormRef.value)
    return
  await dictFormRef.value.validate(async (valid) => {
    if (!valid)
      return
    dictSubmitting.value = true
    try {
      if (isEditDict.value) {
        await updateDict({ ...dictForm })
        ElMessage.success('更新成功')
      }
      else {
        await createDict({ ...dictForm })
        ElMessage.success('创建成功')
      }
      dictDialogVisible.value = false
      fetchDictList()
    }
    catch {
      // 错误已由拦截器处理
    }
    finally {
      dictSubmitting.value = false
    }
  })
}

function resetDictForm() {
  dictFormRef.value?.resetFields()
  Object.assign(dictForm, {
    id: undefined,
    code: '',
    name: '',
    description: '',
  })
}

async function handleDeleteDict(row: DictInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除字典「${row.name}」及其所有字典项吗？此操作不可恢复。`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
    await deleteDictById(row.id)
    ElMessage.success('删除成功')
    fetchDictList()
  }
  catch {
    // 用户取消
  }
}

function handleViewItems(row: DictInfo) {
  selectedDict.value = row
  fetchItemList()
}

// ========== 字典项 CRUD ==========

const itemDialogVisible = ref(false)
const isEditItem = ref(false)
const itemSubmitting = ref(false)
const itemFormRef = ref<FormInstance>()
const itemForm = reactive<DictItemParam>({
  dict_id: 0,
  dict_code: '',
  item_name: '',
  item_code: '',
  status: 'Active',
  sort_order: 0,
  description: '',
})

const itemFormRules: FormRules = {
  item_name: [{ required: true, message: '请输入字典项名称', trigger: 'blur' }],
  item_code: [{ required: true, message: '请输入字典项编码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function handleAddItem() {
  if (!selectedDict.value)
    return
  isEditItem.value = false
  Object.assign(itemForm, {
    id: undefined,
    dict_id: selectedDict.value.id,
    dict_code: selectedDict.value.code,
    item_name: '',
    item_code: '',
    status: 'Active',
    sort_order: 0,
    description: '',
  })
  itemDialogVisible.value = true
}

function handleEditItem(row: ItemInfo) {
  if (!selectedDict.value)
    return
  isEditItem.value = true
  Object.assign(itemForm, {
    id: row.id,
    dict_id: selectedDict.value.id,
    dict_code: selectedDict.value.code,
    item_name: row.item_name,
    item_code: row.item_code,
    status: row.status,
    sort_order: row.sort_order,
    description: row.description,
  })
  itemDialogVisible.value = true
}

async function handleItemSubmit() {
  if (!itemFormRef.value)
    return
  await itemFormRef.value.validate(async (valid) => {
    if (!valid)
      return
    itemSubmitting.value = true
    try {
      if (isEditItem.value) {
        await updateDictItem({ ...itemForm })
        ElMessage.success('更新成功')
      }
      else {
        await createItem({ ...itemForm })
        ElMessage.success('创建成功')
      }
      itemDialogVisible.value = false
      fetchItemList()
    }
    catch {
      // 错误已由拦截器处理
    }
    finally {
      itemSubmitting.value = false
    }
  })
}

function resetItemForm() {
  itemFormRef.value?.resetFields()
  Object.assign(itemForm, {
    id: undefined,
    dict_id: 0,
    dict_code: '',
    item_name: '',
    item_code: '',
    status: 'Active',
    sort_order: 0,
    description: '',
  })
}

async function handleDeleteItem(row: ItemInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除字典项「${row.item_name}」吗？此操作不可恢复。`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
    await deleteDictItem(row.id)
    ElMessage.success('删除成功')
    fetchItemList()
  }
  catch {
    // 用户取消
  }
}

onMounted(() => {
  fetchDictList()
})
</script>

<template>
  <div class="dict-management">
    <!-- 视图一：字典列表 -->
    <template v-if="!selectedDict">
      <el-card shadow="never" class="table-card">
        <!-- 搜索表单 -->
        <el-form :model="searchForm" inline @submit.prevent="handleSearch">
          <el-form-item label="字典名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入字典名称"
              clearable
              style="width: 180px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="字典编码">
            <el-input
              v-model="searchForm.code"
              placeholder="请输入字典编码"
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

        <!-- 工具栏 -->
        <div class="card-header">
          <span>字典列表</span>
          <el-button v-permission="'system:dict:create'" type="primary" @click="openAddDict">
            <el-icon><Plus /></el-icon>新增字典
          </el-button>
        </div>

        <el-table v-loading="dictLoading" :data="dictList" stripe border style="width: 100%">
          <el-table-column label="字典编码" min-width="180">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" class="dict-code-link" @click="handleViewItems(row)">
                {{ row.code }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="字典名称" min-width="140" />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column v-if="userStore.hasPermission(['system:dict:view', 'system:dict:update', 'system:dict:delete'])" label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleViewItems(row)">
                字典项
              </el-button>
              <el-button v-permission="'system:dict:update'" link type="primary" size="small" @click="openEditDict(row)">
                编辑
              </el-button>
              <el-button v-permission="'system:dict:delete'" link type="danger" size="small" @click="handleDeleteDict(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchDictList"
            @current-change="fetchDictList"
          />
        </div>
      </el-card>
    </template>

    <!-- 视图二：字典项列表 -->
    <template v-else>
      <el-card shadow="never" class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <el-button link @click="handleBackToList">
                <el-icon><ArrowLeft /></el-icon>
                返回字典列表
              </el-button>
              <span class="dict-title">{{ selectedDict.name }}</span>
              <el-tag size="small" type="info" class="dict-code-tag">
                {{ selectedDict.code }}
              </el-tag>
            </div>
            <el-button v-permission="'system:dict:create'" type="primary" @click="handleAddItem">
              <el-icon><Plus /></el-icon>新增字典项
            </el-button>
          </div>
        </template>

        <el-table v-loading="itemLoading" :data="itemList" stripe border style="width: 100%">
          <el-table-column prop="item_name" label="字典项名称" min-width="140" />
          <el-table-column prop="item_code" label="字典项编码" min-width="140" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'Active' ? 'success' : 'danger'">
                {{ row.status === 'Active' ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sort_order" label="排序" width="80" align="center" />
          <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
          <el-table-column prop="created_at" label="创建时间" width="180" />
          <el-table-column v-if="userStore.hasPermission(['system:dict:update', 'system:dict:delete'])" label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button v-permission="'system:dict:update'" link type="primary" size="small" @click="handleEditItem(row)">
                编辑
              </el-button>
              <el-button v-permission="'system:dict:delete'" link type="danger" size="small" @click="handleDeleteItem(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <!-- 字典新增/编辑弹窗 -->
    <el-dialog
      v-model="dictDialogVisible"
      :title="isEditDict ? '编辑字典' : '新增字典'"
      width="520px"
      destroy-on-close
      @closed="resetDictForm"
    >
      <el-form
        ref="dictFormRef"
        :model="dictForm"
        :rules="dictFormRules"
        label-width="80px"
        @submit.prevent="handleDictSubmit"
      >
        <el-form-item label="字典编码" prop="code">
          <el-input v-model="dictForm.code" placeholder="例如：sys_user_status" :disabled="!!isEditDict" />
        </el-form-item>
        <el-form-item label="字典名称" prop="name">
          <el-input v-model="dictForm.name" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="dictForm.description" type="textarea" :rows="3" placeholder="请输入字典描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dictDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="dictSubmitting" @click="handleDictSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 字典项新增/编辑弹窗 -->
    <el-dialog
      v-model="itemDialogVisible"
      :title="isEditItem ? '编辑字典项' : '新增字典项'"
      width="560px"
      destroy-on-close
      @closed="resetItemForm"
    >
      <el-form
        ref="itemFormRef"
        :model="itemForm"
        :rules="itemFormRules"
        label-width="90px"
        @submit.prevent="handleItemSubmit"
      >
        <el-form-item label="字典编码" prop="dict_code">
          <el-input v-model="itemForm.dict_code" disabled />
        </el-form-item>
        <el-form-item label="字典项名称" prop="item_name">
          <el-input v-model="itemForm.item_name" placeholder="请输入字典项名称" />
        </el-form-item>
        <el-form-item label="字典项编码" prop="item_code">
          <el-input v-model="itemForm.item_code" placeholder="请输入字典项编码" :disabled="!!isEditItem" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="itemForm.status">
            <el-radio value="Active">
              启用
            </el-radio>
            <el-radio value="Disabled">
              停用
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="itemForm.sort_order" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="itemForm.description" type="textarea" :rows="3" placeholder="请输入字典项描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="itemSubmitting" @click="handleItemSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.dict-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0 12px;
}

.search-form :deep(.el-form-item:last-child) {
  margin-left: auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dict-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.dict-code-tag {
  margin-left: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.dict-code-link {
  cursor: pointer;
}
</style>
