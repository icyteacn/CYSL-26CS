<!-- 文件路径: /cysl-web/app-uniapp/pages/index/index.vue -->
<template>
  <view class="page safe-bottom">
    <view class="hero">
      <view class="hero-title">智团慧建</view>
      <view class="hero-sub">支部动态 · 与网站数据实时同步</view>
    </view>

    <view class="stats">
      <view class="stat"><text class="num">{{ counts.records }}</text><text class="lab">留痕记录</text></view>
      <view class="stat"><text class="num">{{ counts.members }}</text><text class="lab">支部成员</text></view>
      <view class="stat"><text class="num">{{ counts.honors }}</text><text class="lab">荣誉</text></view>
      <view class="stat"><text class="num">{{ counts.hours }}</text><text class="lab">志愿时长</text></view>
    </view>

    <view class="card">
      <view class="g-title">📢 最新公告</view>
      <view v-if="!items.length && !loading" class="mut">暂无公告</view>
      <view v-for="(it, i) in items" :key="i" class="item">
        <view class="i-body">
          <text class="i-title">{{ it.title || it.name }}</text>
          <text class="i-text" v-if="it.summary || it.body">{{ it.summary || it.body }}</text>
          <text class="i-date">{{ dateText(it.date || it.at || it.time) }}</text>
        </view>
      </view>
      <view v-if="loading" class="mut">加载中…</view>
    </view>

    <view class="foot mut">数据只读 · 业务办理请用网页版或 App</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchAll, state, feedItems, norm, dateText } from '../../utils/api.js';

const loading = ref(true);
const items = computed(() => feedItems().slice(0, 20));
const counts = computed(() => {
  const s = state.value || {};
  const vols = norm(s.volunteers);
  return {
    records: norm(s.records).length,
    members: norm(s.members).length,
    honors: norm(s.honors).length,
    hours: vols.reduce((a, v) => a + (Number(v.hours) || 0), 0),
  };
});
onShow(async () => { loading.value = true; await fetchAll(); loading.value = false; });
</script>

<style>
.hero { background: linear-gradient(135deg, #c62828, #e53935); color: #fff; padding: 44rpx 32rpx 32rpx; }
.hero-title { font-size: 44rpx; font-weight: 700; }
.hero-sub { opacity: .85; margin-top: 8rpx; font-size: 26rpx; }
.stats { display: flex; background: #fff; margin: 20rpx 24rpx; border-radius: 20rpx; padding: 24rpx 0; }
.stat { flex: 1; display: flex; flex-direction: column; align-items: center; }
.num { font-size: 40rpx; font-weight: 700; color: #c62828; }
.lab { font-size: 22rpx; color: #8a8f99; margin-top: 4rpx; }
.g-title { font-size: 30rpx; font-weight: 600; margin-bottom: 8rpx; }
.item { display: flex; padding: 18rpx 0; border-top: 1rpx solid #f0f1f5; }
.i-body { flex: 1; }
.i-title { font-size: 28rpx; font-weight: 500; }
.i-text { display: block; font-size: 22rpx; color: #8a8f99; margin-top: 4rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 600rpx; }
.i-date { display: block; font-size: 20rpx; color: #b0b5bd; margin-top: 4rpx; }
.foot { text-align: center; padding: 30rpx; }
</style>
