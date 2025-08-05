// pages/profile/profile.js
const app = getApp();
const AV = app.AV;

Page({
  data: {
    avatarUrl: '/images/tab/profile-def.png',
    nickname: '',
    openid: '',
    isAdmin: wx.getStorageSync('isAdmin'),
    username: '',
    phone: '',
    email: '',
    likedDishes: []
  },

  onLoad() {
    const user = AV.User.current();
    if (user) {
      const avatar = user.get('avatarUrl') || '/images/tab/profile-def.png';
      this.setData({
        avatarUrl: avatar,
        nickname: user.get('nickname') || '',
        openid: user.get('openId') || '',
        isAdmin: user.get('isAdmin') || false,
        username: user.getUsername(),
        phone: user.get('mobilePhoneNumber') || '',
        email: user.getEmail() || ''
      });
      this.fetchLikedDishes(user);
    }
  },

  fetchLikedDishes(user) {
    const Like = AV.Object.extend('Like');
    const query = new AV.Query(Like);
    query.equalTo('user', user);
    query.include('dish');
    query.find().then(results => {
      const likedDishes = results.map(like => {
        const dish = like.get('dish');
        return {
          id: dish.id,
          name: dish.get('name'),
          image: dish.get('image')
        };
      });
      this.setData({ likedDishes });
    });
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      success: res => {
        const filePath = res.tempFilePaths[0];
        const fileName = `avatar_${Date.now()}.png`;
        const file = new AV.File(fileName, {
          blob: {
            uri: filePath
          }
        });

        wx.showLoading({ title: '上传中...' });
        file.save().then(fileObj => {
          const user = AV.User.current();
          user.set('avatarUrl', fileObj.url());
          return user.save();
        }).then(() => {
          wx.hideLoading();
          wx.showToast({ title: '头像已更新' });
          this.setData({ avatarUrl: filePath });
        }).catch(err => {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
          console.error(err);
        });
      }
    });
  },

  logout() {
    AV.User.logOut().then(() => {
      wx.reLaunch({ url: '/pages/index/index' });
    });
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/menu' });
  }
});