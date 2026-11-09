<!-- 文件路径: /cysl-web/app-uniapp/pages/about/about.vue -->
<template>
  <view class="page safe-bottom">
    <view class="card center">
      <view class="logo">🚩</view>
      <view class="name">智团慧建</view>
      <view class="mut">v1.0.0 · 与团工作平台数据同步</view>
    </view>

    <view class="card">
      <view class="row-item" @click="refresh">
        <text>🔄 刷新云端数据</text>
        <text class="mut">{{ refreshText }}</text>
      </view>
      <view class="row-item" @click="copySite">
        <text>🌐 打开网页版（复制链接）</text>
        <text class="mut">icyteacn.github.io/CYSL-26CS</text>
      </view>
    </view>

    <view class="card">
      <view class="sec-title">平台定位</view>
      <view class="mut li">· 智团慧建 = 干活工具：留痕/签到/纪要/材料生成</view>
      <view class="mut li">· 智慧团建 = 上报系统：正式业务仍在官方系统办理</view>
      <view class="mut li">· 本端为团员只读视图，写入请用网页版/App 支委端</view>
      <view class="mut li">· 不收集任何个人信息</view>
    </view>

    <view class="card">
      <view class="sec-title">iOS 打包（HBuilderX 云打包）</view>
      <view class="mut li">1. manifest.json 填 appid 与 iOS 证书</view>
      <view class="mut li">2. 发行 → 原生App-云打包 → iOS(ipa)</view>
      <view class="mut li">3. 爱思助手/AltStore/TestFlight 安装</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { fetchAll, cacheTime, SITE_URL } from '../../utils/api.js';

const refreshText = ref(cacheTime() ? `上次 ${cacheTime()}` : '点击同步');
async function refresh() {
  refreshText.value = '同步中…';
  const s = await fetchAll(true);
  refreshText.value = s ? `已更新 ${cacheTime()}` : '同步失败';
}
function copySite() {
  uni.setClipboardData({ data: SITE_URL, success: () => uni.showToast({ title: '链接已复制' }) });
}
</script>

<style>
.center { display: flex; flex-direction: column; align-items: center; padding: 40rpx 0; }
.logo { font-size: 72rpx; }
.name { font-size: 34rpx; font-weight: 700; margin-top: 12rpx; }
.row-item { display: flex; align-items: center; justify-content: space-between; padding: 26rpx 0; border-bottom: 1rpx solid #f0f1f5; }
.row-item:last-child { border-bottom: none; }
.sec-title { font-weight: 600; margin-bottom: 12rpx; }
.li { line-height: 1.8; }
</style>
