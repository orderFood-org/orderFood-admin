<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import {
  addDishCategory,
  updateDishCategory,
  type DishCategory
} from "@/api/dishes";

const props = defineProps<{
  visible: boolean;
  category?: DishCategory;
  isEdit: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", visible: boolean): void;
  (e: "success"): void;
}>();

const loading = ref(false);

const formRef = ref();
const form = reactive({
  name: ""
});

const rules = {
  name: [{ required: true, message: "请输入餐品类型名称", trigger: "blur" }]
};

const close = () => {
  emit("update:visible", false);
  form.name = "";
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

const init = () => {
  if (props.isEdit && props.category) {
    form.name = props.category.name;
  }
};

const save = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (valid) {
      loading.value = true;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        if (props.isEdit && props.category) {
          await updateDishCategory(props.category.id, { name: form.name });
          clearTimeout(timeoutId);
          ElMessage.success("类型更新成功");
        } else {
          await addDishCategory({ name: form.name });
          clearTimeout(timeoutId);
          ElMessage.success("类型添加成功");
        }
        emit("success");
        close();
      } catch (error) {
        console.error("保存餐品类型失败", error);
        if (error.name === "AbortError") {
          ElMessage.error("保存餐品类型超时，请检查网络连接");
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
    :title="isEdit ? '编辑餐品类型' : '添加餐品类型'"
    :model-value="visible"
    width="500px"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
    @closed="close"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      label-position="right"
    >
      <el-form-item label="类型名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入餐品类型名称" />
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
