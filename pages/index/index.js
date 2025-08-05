// index.js
const app = getApp();
const AV = app.AV;

Page({
  data: {
    userInfo: null
  },
  onLoginTap() {
    let req_openid = {
      openId: wx.getStorageSync('open_id')
    }
    AV.Cloud.run('loginWithOpenId', req_openid)
      .then(result => {
        console.log(result)
        const user = result.user;
        const sessionToken = user.sessionToken;
        const isAdmin = user.isAdmin;
        wx.setStorageSync('sessionToken', sessionToken);
        wx.setStorageSync('isAdmin', isAdmin);
        console.log(wx.getStorageSync('isAdmin'));
        wx.hideLoading();
        wx.switchTab({
          url: '/pages/menu/menu',
        });
      })
      .catch(err => {
        console.error('登录失败', err);
      });
  },
  onLoad() {
    console.log(JSON.stringify(this.data, null, 2))
    this.setData({
      isAdmin: wx.getStorageSync('isAdmin')
    });
    console.log(JSON.stringify(this.data, null, 2))
  },
});

