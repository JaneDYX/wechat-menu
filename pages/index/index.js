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
        const { user } = result;
        const sessionToken = user.sessionToken;
        const isAdmin = user.isAdmin;
        AV.User.become(sessionToken).then(loggedInUser => {
          wx.setStorageSync('sessionToken', sessionToken);
          wx.setStorageSync('isAdmin', isAdmin);
        wx.hideLoading();
        wx.switchTab({
          url: '/pages/menu/menu',
        });
       });
      })
      .catch(err => {
        console.error('登录失败', err);
      });
  },
  onLoad() {
    this.setData({
      isAdmin: wx.getStorageSync('isAdmin')
    });
  },
});

