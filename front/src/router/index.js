import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/home/HomeView.vue";
import RoomView from "../views/room/RoomView.vue";
import PreparingScreenView from "../views/preparingScreen/PreparingScreenView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/prepare/:id",
      name: "PreparingScreenView",
      component: PreparingScreenView,
    },
    {
      path: "/room/:id",
      name: "Room",
      component: RoomView,
    },
  ],
});

export default router;
