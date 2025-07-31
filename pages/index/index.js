// index.js
const app = getApp();

Page({
  data: {
    isAdmin: true 
  },
  onLoad() {
    // 从 globalData 读取管理员标志
    this.setData({ isAdmin: this.data.isAdmin });
  },
  goMenu() {
    wx.switchTab({url: '/pages/menu/menu' });
  },
  goToday() {
    wx.switchTab({url: '/pages/today/today' });
  },
  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/menu' });
  }
});

