<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from "vue";
import {
  Search,
  Plus,
  Edit,
  Delete,
  Switch,
  Picture
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getDishList,
  deleteDish,
  changeDishStatus,
  getDishCategories,
  type Dish,
  type DishQueryParams,
  type DishCategory
} from "@/api/dishes";
import CategoryForm from "./components/CategoryForm.vue";
import DishForm from "./components/DishForm.vue";

defineOptions({
  name: "DishesList"
});

// 列表查询参数
const queryParams = reactive<DishQueryParams>({
  page: 1,
  pageSize: 10,
  name: "",
  categoryId: null,
  status: null
});

// 列表数据
const tableData = ref<Dish[]>([]);
const total = ref(0);
const loading = ref(false);
const categories = ref<DishCategory[]>([]);

// 弹窗控制
const dishFormVisible = ref(false);
const categoryFormVisible = ref(false);
const currentDish = ref<Dish>();
const currentCategory = ref<DishCategory>();
const isEdit = ref(false);

// 表单引用
const dishFormRef = ref();
const categoryFormRef = ref();

// 状态选项
const statusOptions = [
  { label: "上架", value: 1 },
  { label: "下架", value: 0 }
];

// 初始化加载
onMounted(() => {
  // 使用 Promise.all 并添加错误处理，避免一个请求失败导致整个页面卡死
  Promise.all([
    fetchData().catch(error => {
      console.error("初始化获取餐品列表失败", error);
      ElMessage.error("初始化获取餐品列表失败，请刷新页面重试");
      loading.value = false;
    }),
    fetchCategories().catch(error => {
      console.error("初始化获取分类列表失败", error);
      ElMessage.error("初始化获取分类列表失败，请刷新页面重试");
    })
  ]);
});

// 获取餐品列表
const fetchData = async () => {
  loading.value = true;
  try {
    // 添加超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const res = await getDishList(queryParams);
    clearTimeout(timeoutId);

    // 确保返回的数据是有效的
    tableData.value = Array.isArray(res.list) ? res.list : [];
    total.value = typeof res.total === "number" ? res.total : 0;
  } catch (error) {
    console.error("获取餐品列表失败", error);
    if (error.name === "AbortError") {
      ElMessage.error("获取餐品列表超时，请检查网络连接");
    } else {
      ElMessage.error("获取餐品列表失败，请刷新重试");
    }
    // 确保在错误情况下也有有效的数据
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 获取餐品类型列表
const fetchCategories = async () => {
  try {
    // 添加超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const res = await getDishCategories();
    clearTimeout(timeoutId);

    // 确保返回的数据是有效的，并且每个对象都有有效的id和name
    categories.value = Array.isArray(res)
      ? res.map(item => ({
          id: item.id || 0,
          name: item.name || "",
          ...item
        }))
      : [];
  } catch (error) {
    console.error("获取餐品类型列表失败", error);
    if (error.name === "AbortError") {
      ElMessage.error("获取餐品类型列表超时，请检查网络连接");
    } else {
      ElMessage.error("获取餐品类型列表失败，请刷新重试");
    }
    // 确保在错误情况下也有有效的数据
    categories.value = [];
  }
};

// 重置查询
const resetQuery = () => {
  queryParams.name = "";
  queryParams.categoryId = null;
  queryParams.status = null;
  queryParams.page = 1;
  fetchData();
};

// 搜索
const handleSearch = () => {
  queryParams.page = 1;
  fetchData();
};

// 表格尺寸改变
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  fetchData();
};

// 表格页码改变
const handleCurrentChange = (val: number) => {
  queryParams.page = val;
  fetchData();
};

// 获取餐品状态显示文本
const getStatusText = (status: number) => {
  return status === 1 ? "上架" : "下架";
};

// 获取餐品状态类型
const getStatusType = (status: number) => {
  return status === 1 ? "success" : "info";
};

// 获取餐品类型名称
const getCategoryName = (categoryId: number) => {
  const category = categories.value.find(item => item.id === categoryId);
  return category ? category.name : "";
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

// 添加餐品
const handleAddDish = () => {
  try {
    // 先重置状态，再显示弹窗
    isEdit.value = false;
    currentDish.value = undefined;

    // 使用 nextTick 确保状态更新后再显示弹窗
    nextTick(() => {
      dishFormVisible.value = true;

      // 延迟初始化表单，避免弹窗渲染和表单初始化同时进行导致卡顿
      setTimeout(() => {
        if (dishFormRef.value) {
          try {
            dishFormRef.value.init();
          } catch (error) {
            console.error("初始化表单失败", error);
            ElMessage.error("初始化表单失败，请重试");
          }
        }
      }, 300);
    });
  } catch (error) {
    console.error("打开添加餐品弹窗失败", error);
    ElMessage.error("打开添加餐品弹窗失败，请重试");
  }
};

// 编辑餐品
const handleEditDish = (row: Dish) => {
  try {
    // 先重置状态，再显示弹窗
    isEdit.value = true;
    currentDish.value = JSON.parse(JSON.stringify(row)); // 深拷贝，避免直接引用

    // 使用 nextTick 确保状态更新后再显示弹窗
    nextTick(() => {
      dishFormVisible.value = true;

      // 延迟初始化表单，避免弹窗渲染和表单初始化同时进行导致卡顿
      setTimeout(() => {
        if (dishFormRef.value) {
          try {
            dishFormRef.value.init();
          } catch (error) {
            console.error("初始化表单失败", error);
            ElMessage.error("初始化表单失败，请重试");
          }
        }
      }, 300);
    });
  } catch (error) {
    console.error("打开编辑餐品弹窗失败", error);
    ElMessage.error("打开编辑餐品弹窗失败，请重试");
  }
};

// 删除餐品
const handleDeleteDish = (row: Dish) => {
  ElMessageBox.confirm(`确定要删除餐品 "${row.name}" 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        await deleteDish(row.id);
        ElMessage.success("删除成功");
        fetchData();
      } catch (error) {
        console.error("删除餐品失败", error);
        ElMessage.error("删除失败，请重试");
      }
    })
    .catch(() => {});
};

// 切换餐品状态
const handleStatusChange = async (row: Dish) => {
  const originalStatus = row.status === 0 ? 1 : 0;
  const statusText = originalStatus === 1 ? "上架" : "下架";

  try {
    await changeDishStatus(row.id, originalStatus);
    ElMessage.success(`餐品${statusText}成功`);
    row.status = originalStatus;
  } catch (error) {
    console.error(`餐品${statusText}失败`, error);
    ElMessage.error(`${statusText}失败，请重试`);
    fetchData(); // 刷新数据
  }
};

// 添加餐品类型
const handleAddCategory = () => {
  try {
    // 先重置状态，再显示弹窗
    isEdit.value = false;
    currentCategory.value = undefined;

    // 使用 nextTick 确保状态更新后再显示弹窗
    nextTick(() => {
      categoryFormVisible.value = true;

      // 延迟初始化表单，避免弹窗渲染和表单初始化同时进行导致卡顿
      setTimeout(() => {
        if (categoryFormRef.value) {
          try {
            categoryFormRef.value.init();
          } catch (error) {
            console.error("初始化表单失败", error);
            ElMessage.error("初始化表单失败，请重试");
          }
        }
      }, 300);
    });
  } catch (error) {
    console.error("打开添加分类弹窗失败", error);
    ElMessage.error("打开添加分类弹窗失败，请重试");
  }
};

// 编辑餐品类型
const handleEditCategory = (category: DishCategory) => {
  try {
    // 先重置状态，再显示弹窗
    isEdit.value = true;
    currentCategory.value = JSON.parse(JSON.stringify(category)); // 深拷贝，避免直接引用

    // 使用 nextTick 确保状态更新后再显示弹窗
    nextTick(() => {
      categoryFormVisible.value = true;

      // 延迟初始化表单，避免弹窗渲染和表单初始化同时进行导致卡顿
      setTimeout(() => {
        if (categoryFormRef.value) {
          try {
            categoryFormRef.value.init();
          } catch (error) {
            console.error("初始化表单失败", error);
            ElMessage.error("初始化表单失败，请重试");
          }
        }
      }, 300);
    });
  } catch (error) {
    console.error("打开编辑分类弹窗失败", error);
    ElMessage.error("打开编辑分类弹窗失败，请重试");
  }
};

// 表单提交成功回调
const handleFormSuccess = () => {
  fetchData();
  fetchCategories();
};
</script>

<template>
  <div class="app-container">
    <el-card class="filter-container" shadow="never">
      <div>
        <i class="el-icon-search" />
        <span>筛选搜索</span>
        <el-button
          style="float: right"
          type="primary"
          size="default"
          @click="handleSearch"
        >
          查询结果
        </el-button>
        <el-button
          style="float: right; margin-right: 15px"
          size="default"
          @click="resetQuery"
        >
          重置
        </el-button>
      </div>
      <div style="margin-top: 15px">
        <el-form
          :inline="true"
          :model="queryParams"
          size="default"
          label-width="140px"
        >
          <el-form-item label="输入搜索：">
            <el-input
              v-model="queryParams.name"
              class="input-width"
              placeholder="菜品名称"
              clearable
            />
          </el-form-item>
          <el-form-item label="菜品分类：">
            <el-select
              v-model="queryParams.categoryId"
              placeholder="请选择"
              clearable
              class="input-width"
            >
              <el-option
                v-for="item in categories"
                :key="item.id || 0"
                :label="item.name || ''"
                :value="item.id || 0"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="上架状态：">
            <el-select
              v-model="queryParams.status"
              placeholder="请选择"
              clearable
              class="input-width"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value || 0"
                :label="item.label || ''"
                :value="item.value || 0"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    <el-card class="operate-container" shadow="never">
      <i class="el-icon-tickets" />
      <span>数据列表</span>
      <el-button
        class="btn-add"
        size="default"
        type="primary"
        @click="handleAddDish"
      >
        添加
      </el-button>
    </el-card>
    <div class="table-container">
      <el-table
        ref="dishTable"
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        border
      >
        <el-table-column label="序号" width="100" align="center">
          <template #default="scope">{{ scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="菜品名称" align="center">
          <template #default="scope">{{ scope.row.name }}</template>
        </el-table-column>
        <el-table-column label="图片" width="120" align="center">
          <template #default="scope">
            <el-image
              style="width: 80px; height: 80px"
              :src="scope.row.image"
              fit="cover"
              :preview-src-list="[scope.row.image]"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column label="菜品分类" align="center">
          <template #default="scope">{{
            getCategoryName(scope.row.categoryId)
          }}</template>
        </el-table-column>
        <el-table-column label="售价" align="center">
          <template #default="scope">{{ scope.row.price / 100 }}</template>
        </el-table-column>
        <el-table-column label="售卖数量" align="center">
          <template #default="scope">{{ scope.row.saleNum }}</template>
        </el-table-column>
        <el-table-column label="售卖状态" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="最后操作时间" width="160" align="center">
          <template #default="scope">{{
            formatDateTime(scope.row.updateTime)
          }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="scope">
            <el-button
              size="default"
              type="text"
              @click="handleEditDish(scope.row)"
              >修改
            </el-button>
            <el-button
              size="default"
              type="text"
              @click="handleDeleteDish(scope.row)"
              >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="queryParams.page"
        background
        layout="total, sizes,prev, pager, next,jumper"
        :page-size="queryParams.pageSize"
        :page-sizes="[5, 10, 15]"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 餐品表单对话框 -->
    <DishForm
      ref="dishFormRef"
      v-model:visible="dishFormVisible"
      :dish="currentDish"
      :is-edit="isEdit"
      @success="handleFormSuccess"
    />

    <!-- 餐品类型表单对话框 -->
    <CategoryForm
      ref="categoryFormRef"
      v-model:visible="categoryFormVisible"
      :category="currentCategory"
      :is-edit="isEdit"
      @success="handleFormSuccess"
    />
  </div>
</template>

<style scoped>
.input-width {
  width: 203px;
}

.filter-container {
  margin-bottom: 10px;
}

.operate-container {
  margin-top: 20px;
}

.operate-container .btn-add {
  float: right;
}

.table-container {
  margin-top: 20px;
}

.pagination-container {
  display: inline-block;
  float: right;
  margin-top: 20px;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  font-size: 30px;
  color: #909399;
  background-color: #f5f7fa;
}
</style>
