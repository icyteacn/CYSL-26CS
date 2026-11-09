<!-- 文件路径: /cysl-web/app-uniapp/pages/records/records.vue -->
<template>
  <view class="page safe-bottom">
    <view class="filter">
      <text v-for="t in types" :key="t" class="chip" :class="{ on: type === t }" @click="type = t">{{ t }}</text>
    </view>

    <view class="card">
      <view v-if="!list.length" class="mut">暂无{{ type === '全部' ? '' : type }}记录</view>
      <view v-for="(r, i) in list" :key="i" class="rec">
        <view class="r-head">
          <text class="r-title">{{ r.title }}</text>
          <text class="tag r-tag">{{ r.type || r.label || '活动' }}</text>
        </view>
        <text class="r-meta">{{ dateText(r.date) }}<text v-if="r.location"> · {{ r.location }}</text><text v-if="r.attendees"> · {{ r.attendees }}人</text></text>
        <text class="r-sum" v-if="r.summary">{{ r.summary }}</text>
        <view class="r-flags">
          <text class="tag f" v-if="r.signin || r.hasSignIn">签到</text>
          <text class="tag f" v-if="r.minutes || r.hasMinutes">纪要</text>
          <text class="tag f" v-if="r.photos || r.hasPhotos">照片</text>
          <text class="tag f" v-if="r.archived || r.hasArchive">归档</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { fetchAll, recordsList, dateText } from '../../utils/api.js';

const type = ref('全部');
const types = ['全部', '支部团员大会', '支部委员会', '团小组会', '团课', '主题团日', '志愿活动', '立项活动', '其他'];
const list = computed(() => {
  const rs = recordsList();
  if (type.value === '全部') return rs;
  return rs.filter(r =>
    (r.type || r.label || '').includes(type.value)
    || (r.extraCats || []).some(c => String(c).includes(type.value))
    || (r.types || []).some(c => String(c).includes(type.value)));
});
onShow(() => fetchAll());
onPullDownRefresh(async () => { await fetchAll(true); uni.stopPullDownRefresh(); });
</script>

<style>
.filter { display: flex; flex-wrap: wrap; padding: 20rpx 24rpx 0; gap: 14rpx; }
.chip { font-size: 24rpx; background: #fff; color: #5a5f66; border-radius: 999rpx; padding: 10rpx 24rpx; }
.chip.on { background: #c62828; color: #fff; }
.rec { padding: 18rpx 0; border-top: 1rpx solid #f0f1f5; }
.rec:first-child { border-top: none; }
.r-head { display: flex; align-items: center; justify-content: space-between; }
.r-title { font-size: 28rpx; font-weight: 500; flex: 1; }
.r-tag { background: #fdecea; color: #c62828; flex-shrink: 0; }
.r-meta { display: block; font-size: 22rpx; color: #8a8f99; margin-top: 6rpx; }
.r-sum { display: block; font-size: 24rpx; color: #5a5f66; margin-top: 8rpx; }
.r-flags { margin-top: 8rpx; display: flex; gap: 10rpx; }
.f { background: #e8f5e9; color: #2e7d32; }
</style>
