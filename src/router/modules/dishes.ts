const Layout = () => import("@/layout/index.vue");

export default {
  path: "/dishes",
  name: "Dishes",
  component: Layout,
  redirect: "/dishes/list",
  meta: {
    icon: "ep:food",
    title: "餐品管理",
    rank: 2
  },
  children: [
    {
      path: "/dishes/list",
      name: "DishesList",
      component: () => import("@/views/dishes/index.vue"),
      meta: {
        title: "餐品列表"
      }
    },
    {
      path: "/dishes/category",
      name: "DishesCategory",
      component: () => import("@/views/dishes/category.vue"),
      meta: {
        title: "餐品分类"
      }
    }
  ]
} satisfies RouteConfigsTable;
