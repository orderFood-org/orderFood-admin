<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from "vue";
import { ElMessage, UploadProps, UploadUserFile } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import {
  addDish,
  updateDish,
  getDishCategories,
  type Dish,
  type DishCategory
} from "@/api/dishes";

const props = defineProps<{
  visible: boolean;
  dish?: Dish;
  isEdit: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", visible: boolean): void;
  (e: "success"): void;
}>();

const loading = ref(false);
const uploading = ref(false);
const categories = ref<DishCategory[]>([]);

const formRef = ref();
const form = reactive<{
  name: string;
  categoryId: number;
  price: number;
  description: string;
  image: string;
  status: number;
}>({
  name: "",
  categoryId: 0,
  price: 0,
  description: "",
  image: "",
  status: 1
});

const imageUrl = ref("");
const fileList = ref<UploadUserFile[]>([]);

const rules = {
  name: [{ required: true, message: "请输入餐品名称", trigger: "blur" }],
  categoryId: [
    { required: true, message: "请选择餐品类型", trigger: "change" }
  ],
  price: [
    { required: true, message: "请输入餐品价格", trigger: "blur" },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value === null || value === undefined) {
          callback(new Error("请输入餐品价格"));
        } else if (isNaN(value)) {
          callback(new Error("价格必须为数字"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  description: [{ required: true, message: "请输入餐品描述", trigger: "blur" }]
};

const fetchCategories = async () => {
  try {
    const res = await getDishCategories();
    categories.value = Array.isArray(res)
      ? res.map(item => ({
          id: item.id || 0,
          name: item.name || "",
          ...item
        }))
      : [];
  } catch (error) {
    console.error("获取餐品类型列表失败", error);
    ElMessage.error("获取餐品类型列表失败，请刷新重试");
    categories.value = [];
  }
};

const close = () => {
  emit("update:visible", false);
  resetForm();
};

const resetForm = () => {
  form.name = "";
  form.categoryId = 0;
  form.price = 0;
  form.description = "";
  form.image = "";
  form.status = 1;
  imageUrl.value = "";
  fileList.value = [];
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

const init = () => {
  try {
    // 延迟加载分类数据，减轻初始化负担
    setTimeout(() => {
      // 使用 Promise 处理异步操作，避免卡死
      fetchCategories().catch(error => {
        console.error("初始化获取分类列表失败", error);
        ElMessage.error("初始化获取分类列表失败");
        categories.value = [];
      });
    }, 100);

    if (props.isEdit && props.dish) {
      const { name, categoryId, price, description, image, status } =
        props.dish;
      // 分批设置表单值，减轻一次性渲染负担
      nextTick(() => {
        form.name = name || "";
        form.categoryId = categoryId || 0;

        nextTick(() => {
          form.price = price || 0;
          form.status = typeof status === "number" ? status : 1;

          nextTick(() => {
            form.description = description || "";
            form.image = image || "";

            if (image) {
              imageUrl.value = image;
              fileList.value = [
                {
                  name: image.substring(image.lastIndexOf("/") + 1),
                  url: image
                }
              ];
            }
          });
        });
      });
    } else {
      // 重置为默认值
      resetForm();
    }
  } catch (error) {
    console.error("初始化表单失败", error);
    ElMessage.error("初始化表单失败，请重试");
    resetForm();
  }
};

// 模拟图片上传
const handleAvatarSuccess: UploadProps["onSuccess"] = (
  response,
  uploadFile
) => {
  uploading.value = false;
  try {
    if (uploadFile.raw) {
      imageUrl.value = URL.createObjectURL(uploadFile.raw);
    } else {
      imageUrl.value = uploadFile.url || "";
    }
    // 实际项目中这里应该使用后端返回的图片URL
    form.image = `/uploads/${uploadFile.name}`;
    ElMessage.success("图片上传成功");
  } catch (error) {
    console.error("处理上传图片失败", error);
    ElMessage.error("处理上传图片失败");
  }
};

const beforeAvatarUpload: UploadProps["beforeUpload"] = rawFile => {
  try {
    uploading.value = true;
    if (rawFile.type !== "image/jpeg" && rawFile.type !== "image/png") {
      ElMessage.error("图片只能是 JPG 或 PNG 格式");
      uploading.value = false;
      return false;
    }
    if (rawFile.size / 1024 / 1024 > 2) {
      ElMessage.error("图片大小不能超过 2MB");
      uploading.value = false;
      return false;
    }
    return true;
  } catch (error) {
    console.error("检查上传图片失败", error);
    ElMessage.error("检查上传图片失败");
    uploading.value = false;
    return false;
  }
};

const save = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (valid) {
      loading.value = true;
      try {
        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

        // 准备提交的数据
        const submitData = {
          name: form.name || "",
          categoryId: typeof form.categoryId === "number" ? form.categoryId : 0,
          price: typeof form.price === "number" ? form.price : 0,
          description: form.description || "",
          status: typeof form.status === "number" ? form.status : 1
        };

        // 如果没有上传图片，使用默认图片
        if (!form.image) {
          submitData.image =
            "https://via.placeholder.com/200x200?text=" +
            encodeURIComponent(form.name || "餐品");
        } else {
          submitData.image = form.image;
        }

        if (props.isEdit && props.dish) {
          await updateDish(props.dish.id, submitData);
          clearTimeout(timeoutId);
          ElMessage.success("餐品更新成功");
        } else {
          await addDish(submitData as Omit<Dish, "id">);
          clearTimeout(timeoutId);
          ElMessage.success("餐品添加成功");
        }
        emit("success");
        close();
      } catch (error) {
        console.error("保存餐品失败", error);
        if (error.name === "AbortError") {
          ElMessage.error("保存餐品超时，请检查网络连接");
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

defineExpose({
  init
});
</script>

<template>
  <el-dialog
    :title="isEdit ? '编辑餐品' : '添加餐品'"
    :model-value="visible"
    width="700px"
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @update:model-value="$emit('update:visible', $event)"
    @closed="close"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <el-form-item label="餐品名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入餐品名称" />
      </el-form-item>

      <el-form-item label="餐品类型" prop="categoryId">
        <el-select
          v-model="form.categoryId"
          placeholder="请选择餐品类型"
          style="width: 100%"
        >
          <el-option
            v-for="item in categories"
            :key="item.id || 0"
            :label="item.name || ''"
            :value="item.id || 0"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="餐品价格" prop="price">
        <el-input-number
          v-model="form.price"
          :min="0"
          :precision="2"
          :step="0.1"
          style="width: 100%"
          placeholder="请输入餐品价格"
        />
      </el-form-item>

      <el-form-item label="餐品状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :label="1">上架</el-radio>
          <el-radio :label="0">下架</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="餐品图片" prop="image">
        <div class="avatar-uploader">
          <template v-if="imageUrl">
            <img :src="imageUrl" class="avatar" />
          </template>
          <template v-else>
            <div class="avatar-uploader-icon">
              <el-icon><Plus /></el-icon>
            </div>
          </template>
        </div>
        <div class="el-upload__tip">
          请先填写其他信息，保存时系统将自动生成示例图片
        </div>
      </el-form-item>

      <el-form-item label="餐品描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请输入餐品描述"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button size="default" @click="close">取消</el-button>
      <el-button size="default" type="primary" :loading="loading" @click="save">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.avatar-uploader {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  width: 178px;
  height: 178px;
  font-size: 28px;
  color: #8c939d;
  text-align: center;
  border: 1px dashed var(--el-border-color);
}

.avatar {
  display: block;
  width: 178px;
  height: 178px;
  object-fit: cover;
}
</style>
