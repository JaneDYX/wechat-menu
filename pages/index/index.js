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
          console.log('登录成功：', loggedInUser.toJSON());
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
    console.log(JSON.stringify(this.data, null, 2))
    this.setData({
      isAdmin: wx.getStorageSync('isAdmin')
    });
    console.log(JSON.stringify(this.data, null, 2))
  },
});

