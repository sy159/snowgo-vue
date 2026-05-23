<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { UserInfo, UserParam } from '@/api/account/user'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { getRoleList } from '@/api/account/role'
import {
  createUser,
  deleteUserById,
  getUserById,
  getUserList,
  resetPwdById,
  updateUser,

} from '@/api/account/user'
import { useUserStore } from '@/store'

const userStore = useUserStore()

// 角色列表
const roleOptions = ref<Array<{ id: number, name: string, code: string }>>([])

async function loadRoleOptions() {
  try {
    const res = await getRoleList({ offset: 0, limit: 100 })
    roleOptions.value = res.data.list
  }
  catch (err) {
    console.error('[user] request failed:', err)
  }
}

// 搜索条件
const searchForm = reactive({
  ids: '',
  username: '',
  nickname: '',
  tel: '',
  status: undefined as number | undefined,
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 表格数据
const tableData = ref<UserInfo[]>([])
const loading = ref(false)

// 获取列表数据
async function fetchData() {
  loading.value = true
  try {
    const ids = searchForm.ids
      ? searchForm.ids.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n))
      : undefined
    const params = {
      ids,
      username: searchForm.username || undefined,
      nickname: searchForm.nickname || undefined,
      tel: searchForm.tel || undefined,
      status: searchForm.status,
      offset: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
    }
    const res = await getUserList(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  }
  catch (err) {
    console.error('[user] request failed:', err)
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
  searchForm.ids = ''
  searchForm.username = ''
  searchForm.nickname = ''
  searchForm.tel = ''
  searchForm.status = undefined
  handleSearch()
}

// ---- 新增/编辑 ----
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<UserParam>({
  username: '',
  tel: '',
  nickname: '',
  email: '',
  password: '',
  remark: '',
  status: 1,
  role_ids: [],
})

// 密码校验：6-32位，至少包含字母、数字、特殊字符中的2种
function validatePasswordMixed(_rule: unknown, value: string, callback: (err?: Error) => void) {
  if (!value) {
    callback(new Error('请输入密码'))
    return
  }
  if (value.length < 6 || value.length > 32) {
    callback(new Error('密码长度为 6-32 个字符'))
    return
  }
  const hasLetter = /[a-z]/i.test(value)
  const hasDigit = /\d/.test(value)
  const hasSpecial = /[^a-z0-9]/i.test(value)
  const count = [hasLetter, hasDigit, hasSpecial].filter(Boolean).length
  if (count < 2) {
    callback(new Error('密码须同时包含以下任意两类：字母、数字或特殊字符'))
    return
  }
  callback()
}

// 手机号校验：11位，以1开头，第二位为3-9
function validatePhone(_rule: unknown, value: string, callback: (err?: Error) => void) {
  if (!value) {
    callback(new Error('请输入手机号'))
    return
  }
  if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('手机号格式不正确'))
    return
  }
  callback()
}

// 邮箱校验：非必填，但填写时必须符合格式
function validateEmail(_rule: unknown, value: string, callback: (err?: Error) => void) {
  if (!value) {
    callback()
    return
  }
  const emailReg = /^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
  if (!emailReg.test(value)) {
    callback(new Error('邮箱格式不正确'))
    return
  }
  callback()
}

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, validator: validatePasswordMixed, trigger: 'blur' }],
  tel: [{ required: true, validator: validatePhone, trigger: 'blur' }],
  email: [{ validator: validateEmail, trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function handleAdd() {
  isEdit.value = false
  dialogVisible.value = true
}

async function handleEdit(row: UserInfo) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    username: row.username,
    tel: row.tel,
    nickname: row.nickname,
    email: row.email,
    password: '',
    remark: row.remark,
    status: row.status,
    role_ids: [],
  })
  // 列表接口不返回 role_list，需要通过详情接口获取
  try {
    const res = await getUserById(row.id)
    form.role_ids = res.data.role_list?.map(r => r.id) || []
  }
  catch (err) {
    console.error('[user] request failed:', err)
  }
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
      const payload = { ...form }
      // 编辑时不传空密码
      if (isEdit.value && !payload.password)
        delete payload.password
      // 新增用户未分配角色时不传空数组；编辑时保留空数组以支持清空角色。
      if (!isEdit.value && !payload.role_ids?.length)
        delete payload.role_ids
      if (isEdit.value) {
        await updateUser(payload)
        ElMessage.success('更新成功')
      }
      else {
        await createUser(payload)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      fetchData()
    }
    catch (err) {
      console.error('[user] request failed:', err)
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
    username: '',
    tel: '',
    nickname: '',
    email: '',
    password: '',
    remark: '',
    status: 1,
    role_ids: [],
  })
}

// ---- 重置密码 ----
const pwdDialogVisible = ref(false)
const pwdSubmitting = ref(false)
const pwdFormRef = ref<FormInstance>()
const resetTarget = ref<UserInfo | null>(null)
const pwdForm = reactive({
  password: '',
  confirmPassword: '',
})

const pwdRules: FormRules = {
  password: [{ required: true, validator: validatePasswordMixed, trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (err?: Error) => void) => {
        if (value !== pwdForm.password) {
          callback(new Error('两次输入的密码不一致'))
        }
        else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

function handleResetPwd(row: UserInfo) {
  resetTarget.value = row
  pwdForm.password = ''
  pwdForm.confirmPassword = ''
  pwdDialogVisible.value = true
}

async function handlePwdSubmit() {
  if (!pwdFormRef.value || !resetTarget.value)
    return
  const targetId = resetTarget.value.id
  await pwdFormRef.value.validate(async (valid) => {
    if (!valid)
      return
    pwdSubmitting.value = true
    try {
      await resetPwdById(targetId, pwdForm.password)
      ElMessage.success('密码重置成功')
      pwdDialogVisible.value = false
    }
    catch (err) {
      console.error('[user] request failed:', err)
    }
    finally {
      pwdSubmitting.value = false
    }
  })
}

// ---- 删除 ----
async function handleDelete(row: UserInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户「${row.username}」吗？此操作不可恢复。`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
    await deleteUserById(row.id)
    ElMessage.success('删除成功')
    fetchData()
  }
  catch {
    // 用户取消
  }
}

onMounted(() => {
  fetchData()
  loadRoleOptions()
})
</script>

<template>
  <div class="user-management">
    <!-- 搜索表单 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline class="search-form" @submit.prevent="handleSearch">
        <el-form-item label="用户ID">
          <el-input
            v-model="searchForm.ids"
            placeholder="多个ID用逗号分隔"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input
            v-model="searchForm.nickname"
            placeholder="请输入昵称"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="searchForm.tel"
            placeholder="请输入手机号"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="活跃" :value="1" />
            <el-option label="禁用" :value="2" />
          </el-select>
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
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button v-permission="'account:user:create'" type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="tel" label="手机号" width="140" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '活跃' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column v-if="userStore.hasPermission(['account:user:update', 'account:user:reset_pwd', 'account:user:delete'])" label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'account:user:update'" link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button v-permission="'account:user:reset_pwd'" link type="warning" size="small" @click="handleResetPwd(row)">
              重置密码
            </el-button>
            <el-button v-permission="'account:user:delete'" link type="danger" size="small" @click="handleDelete(row)">
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
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="560px"
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
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="!!isEdit" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="6-32位，至少包含字母、数字、符号中的2种"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="tel">
          <el-input v-model="form.tel" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">
              活跃
            </el-radio>
            <el-radio :value="2">
              禁用
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role_ids" multiple placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
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

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="pwdDialogVisible"
      title="重置密码"
      width="480px"
      destroy-on-close
    >
      <el-alert
        v-if="resetTarget"
        :title="`将重置用户「${resetTarget.username}」的密码`"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="80px">
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="pwdForm.password"
            type="password"
            show-password
            placeholder="6-32位，至少包含字母、数字、符号中的2种"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="pwdSubmitting" @click="handlePwdSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.user-management {
  padding: var(--space-6);
  background: var(--bg-page);
  min-height: 100%;
}
</style>
