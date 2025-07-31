// pages/today/today.js
Page({
  data: {
    todayList: []
  },

  onLoad() {
    this.loadToday();
  },

  onShow() {
    this.loadToday();
  },

  // 从缓存加载「今日菜单」，并确保每项有 likes 字段
  loadToday() {
    const stored = wx.getStorageSync('TODAY_MENU') || [];
    const list = stored.map(item => ({
      ...item,
      likes: item.likes || 0
    }));
    this.setData({ todayList: list });
  },

  // 点赞处理：局部更新并写回缓存
  onLike(e) {
    const id = e.currentTarget.dataset.id;
    const list = this.data.todayList.map(item => {
      if (item.id === id) {
        item.likes = (item.likes || 0) + 1;
      }
      return item;
    });
    this.setData({ todayList: list });
    wx.setStorageSync('TODAY_MENU', list);
  }
});
