<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Plus, Edit, Delete } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getDishCategories,
  addDishCategory,
  updateDishCategory,
  deleteDishCategory,
  type DishCategory
} from "@/api/dishes";

defineOptions({
  name: "DishesCategory"
});

// 列表数据
const tableData = ref<DishCategory[]>([]);
const loading = ref(false);

// 弹窗控制
const dialogVisible = ref(false);
const dialogTitle = ref("添加餐品分类");
const isEdit = ref(false);
const currentCategory = ref<DishCategory>();

// 表单数据
const formRef = ref();
const form = reactive({
  name: ""
});

// 表单验证规则
const rules = {
  name: [{ required: true, message: "请输入分类名称", trigger: "blur" }]
};

// 初始化加载
onMounted(() => {
  fetchData();
});

// 获取餐品分类列表
const fetchData = async () => {
  loading.value = true;
  try {
    // 添加超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const res = await getDishCategories();
    clearTimeout(timeoutId);

    // 确保返回的数据是有效的，并且每个对象都有有效的id和name
    tableData.value = Array.isArray(res)
      ? res.map(item => ({
          id: item.id || 0,
          name: item.name || "",
          createTime: item.createTime || "",
          updateTime: item.updateTime || "",
          ...item
        }))
      : [];
  } catch (error) {
    console.error("获取餐品分类列表失败", error);
    if (error.name === "AbortError") {
      ElMessage.error("获取餐品分类列表超时，请检查网络连接");
    } else {
      ElMessage.error("获取餐品分类列表失败，请刷新重试");
    }
    // 确保在错误情况下也有有效的数据
    tableData.value = [];
  } finally {
    loading.value = false;
  }
};

// 添加分类
const handleAdd = () => {
  resetForm();
  dialogTitle.value = "添加餐品分类";
  isEdit.value = false;
  dialogVisible.value = true;
};

// 编辑分类
const handleEdit = (row: DishCategory) => {
  resetForm();
  dialogTitle.value = "编辑餐品分类";
  isEdit.value = true;
  currentCategory.value = row;
  form.name = row.name;
  dialogVisible.value = true;
};

// 删除分类
const handleDelete = (row: DishCategory) => {
  ElMessageBox.confirm(`确定要删除分类 "${row.name}" 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

        await deleteDishCategory(row.id);
        clearTimeout(timeoutId);

        ElMessage.success("删除成功");
        fetchData();
      } catch (error) {
        console.error("删除分类失败", error);
        if (error.name === "AbortError") {
          ElMessage.error("删除分类超时，请检查网络连接");
        } else {
          ElMessage.error("删除失败，请重试");
        }
      }
    })
    .catch(() => {});
};

// 重置表单
const resetForm = () => {
  form.name = "";
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
  resetForm();
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (valid) {
      try {
        loading.value = true;
        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

        if (isEdit.value && currentCategory.value) {
          await updateDishCategory(currentCategory.value.id, {
            name: form.name
          });
          clearTimeout(timeoutId);
          ElMessage.success("更新成功");
        } else {
          await addDishCategory({ name: form.name });
          clearTimeout(timeoutId);
          ElMessage.success("添加成功");
        }
        dialogVisible.value = false;
        fetchData();
      } catch (error) {
        console.error("保存分类失败", error);
        if (error.name === "AbortError") {
          ElMessage.error("保存分类超时，请检查网络连接");
        } else {
          ElMessage.error("操作失败，请重试");
        }
      } finally {
        loading.value = false;
      }
    }
  } catch (error) {
    console.error("表单验证失败", error);
    ElMessage.error("表单验证失败，请检查输入");
  }
};

// 格式化日期时间
const formatDateTime = (time: string | number) => {
  if (!time) return "N/A";
  const date = new Date(time);
  return date
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
    .replace(/\//g, "-");
};
</script>

<template>
  <div class="app-container">
    <el-card class="operate-container" shadow="never">
      <i class="el-icon-tickets" />
      <span>数据列表</span>
      <el-button
        class="btn-add"
        size="default"
        type="primary"
        @click="handleAdd"
      >
        添加
      </el-button>
    </el-card>
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        border
      >
        <el-table-column label="序号" width="100" align="center">
          <template #default="scope">{{ scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="分类名称" align="center">
          <template #default="scope">{{ scope.row.name }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="180" align="center">
          <template #default="scope">{{
            formatDateTime(scope.row.createTime)
          }}</template>
        </el-table-column>
        <el-table-column label="最后修改时间" width="180" align="center">
          <template #default="scope">{{
            formatDateTime(scope.row.updateTime)
          }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="scope">
            <el-button size="default" type="text" @click="handleEdit(scope.row)"
              >修改
            </el-button>
            <el-button
              size="default"
              type="text"
              @click="handleDelete(scope.row)"
              >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分类表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="default" @click="handleClose">取消</el-button>
        <el-button size="default" type="primary" @click="submitForm"
          >确定</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.operate-container {
  margin-top: 20px;
}

.operate-container .btn-add {
  float: right;
}

.table-container {
  margin-top: 20px;
}
</style>
