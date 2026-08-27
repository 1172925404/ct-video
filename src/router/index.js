import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import VideoListView from '../views/VideoListView.vue'
import VideoView from '../views/VideoView.vue'
import ChatView from '../views/ChatView.vue'
import UserView from '../views/UserView.vue'
import FavoritesView from '../views/FavoritesView.vue'
import HistoryView from '../views/HistoryView.vue'
import SearchView from '../views/SearchView.vue'  // 新增，搜索页面路由
import MyCommentsView from '../views/MyCommentsView.vue'  // 新增，评论管理页面路由
import PostDetailView from '../views/PostDetailView.vue'  // 新增，聊天社区页面路由
import FollowView from '../views/FollowView.vue'  // 👈 新增：关注/粉丝页面路由
import UploadView from '../views/UploadView.vue'  // 👈 新增：视频上传页面路由
import NotificationView from '../views/NotificationView.vue'  // 👈 新增：通知页面路由
import VideoEditView from '../views/VideoEditView.vue'  // 👈 新增：视频编辑页面路由
import MyVideosView from '../views/MyVideosView.vue'  // 👈 新增：我发布的视频页面路由
import MyPostsView from '../views/MyPostsView.vue'  // 👈 新增：我发布的帖子页面路由
import ConversationView from '../views/ConversationView.vue'  // 👈 新增：私信会话列表页面
import ConversationDetailView from '../views/ConversationDetailView.vue'  // 👈 新增：私信聊天窗口页面

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/video', name: 'video', component: VideoListView },   //视频列表
    { path: '/video/:id', name: 'videoDetail', component: VideoView },    //视频观看页面
    { path: '/chat', name: 'chat', component: ChatView },
    { path: '/user/:id', name: 'user', component: UserView },  // 个人中心
    { path: '/favorites', name: 'favorites', component: FavoritesView },   // 收藏页面
    { path: '/history', name: 'history', component: HistoryView },    // 观看历史
    { path: '/search', name: 'search', component: SearchView },  // 新增，搜索页面路由路径
    { path: '/my-comments', name: 'myComments', component: MyCommentsView },  // 新增，评论管理页面
    { path: '/post/:id', name: 'postDetail', component: PostDetailView },  // 新增，聊天社区页面
    { path: '/follow/:id', name: 'follow', component: FollowView },  // 👈 新增：关注/粉丝页面
    { path: '/upload', name: 'upload', component: UploadView },  // 👈 新增：视频上传页面
    { path: '/notifications', name: 'notifications', component: NotificationView },  // 👈 新增：通知页面
    { path: '/video/edit/:id', name: 'videoEdit', component: VideoEditView },  // 👈 新增：视频编辑页面
    { path: '/my-videos', name: 'myVideos', component: MyVideosView },  // 👈 新增：我发布的视频页面
    { path: '/my-posts', name: 'myPosts', component: MyPostsView },  // 👈 新增：我发布的帖子页面
    { path: '/conversations', name: 'conversations', component: ConversationView },  // 👈 新增：私信会话列表页面
    { path: '/conversations/:id', name: 'conversationDetail', component: ConversationDetailView },  // 👈 新增：私信聊天窗口页面
  ],
})

export default router
