<!-- 文件路径: /cysl-web/app-uniapp/pages/members/members.vue -->
<template>
  <view class="page safe-bottom">
    <view class="card">
      <view class="g-title">👥 支部成员（{{ members.length }}）</view>
      <view v-for="(m, i) in members" :key="i" class="mrow">
        <view class="avatar">{{ (m.name || '?')[0] }}</view>
        <view class="m-body">
          <text class="m-name">{{ m.name }}</text>
          <text class="m-role">{{ m.branchRole || m.role || '团员' }}</text>
        </view>
        <text class="m-hours" v-if="vol[m.name]">志愿 {{ vol[m.name] }}h</text>
      </view>
      <view v-if="!members.length" class="mut">暂无成员数据</view>
    </view>

    <view class="card">
      <view class="g-title">🏆 荣誉墙（{{ honors.length }}）</view>
      <view v-for="(h, i) in honors" :key="i" class="hrow">
        <view class="h-body">
          <text class="h-title">{{ h.title }}</text>
          <text class="h-meta">{{ h.level }}<text v-if="h.grantee"> · {{ h.grantee }}</text> · {{ dateText(h.date) }}</text>
        </view>
      </view>
      <view v-if="!honors.length" class="mut">暂无荣誉记录</view>
    </view>

    <view class="mut foot">成员学号等敏感信息不在本端展示 · 志愿服务时长以「志愿汇」认定为准</view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { fetchAll, membersList, honorsList, volByMember, dateText } from '../../utils/api.js';

const members = computed(() => membersList());
const honors = computed(() => honorsList());
const vol = computed(() => volByMember());
onShow(() => fetchAll());
onPullDownRefresh(async () => { await fetchAll(true); uni.stopPullDownRefresh(); });
</script>

<style>
.g-title { font-size: 30rpx; font-weight: 600; margin-bottom: 12rpx; }
.mrow { display: flex; align-items: center; padding: 16rpx 0; border-top: 1rpx solid #f0f1f5; }
.avatar { width: 72rpx; height: 72rpx; border-radius: 50%; background: #fdecea; color: #c62828; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 20rpx; }
.m-body { flex: 1; }
.m-name { font-size: 28rpx; font-weight: 500; }
.m-role { display: block; font-size: 20rpx; color: #8a8f99; }
.m-hours { font-size: 22rpx; color: #2e7d32; }
.hrow { padding: 16rpx 0; border-top: 1rpx solid #f0f1f5; }
.h-title { font-size: 28rpx; font-weight: 500; }
.h-meta { display: block; font-size: 22rpx; color: #8a8f99; margin-top: 4rpx; }
.foot { text-align: center; padding: 30rpx; }
</style>
