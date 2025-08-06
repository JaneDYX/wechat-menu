// pages/profile/profile.js
const app = getApp();
const AV = app.AV;


Page({
  data: {
    avatarUrl: '',
    nickname: '',
    openid: '',
    isAdmin: false,
    username: '',
    isEditingUsername: false,
    phone: '',
    email: '',
    likedDishes: []
  },


  onLoad() {
    const sessionToken = wx.getStorageSync('sessionToken');
    if (sessionToken) {
      AV.User.become(sessionToken).then(user => {
        console.log('profile会话恢复成功:', user.toJSON());

        const avatar = user.get('avatarUrl') || '/images/tab/profile-def.png';
        const nickname = user.get('nickname') || '';
        const username = user.getUsername() || '';
        const openid = user.get('openId') || '';
        const phone = user.get('mobilePhoneNumber') || '';
        const email = user.getEmail() || '';
        const isAdmin = user.get('isAdmin') || false;

        this.setData({
          avatarUrl: avatar,
          nickname,
          username,
          openid,
          phone,
          email,
          isAdmin
        });

        this.fetchLikedDishes(user);
      }).catch(err => {
        console.error('恢复失败:', err);
      });
    } else {
      console.warn('无 sessionToken，请先登录');
    }
  },


  fetchLikedDishes(user) {
    const Like = AV.Object.extend('Like');
    const query = new AV.Query(Like);
    query.equalTo('user', user);
    query.include('dish');
    // query.find().then(results => {
    //   const likedDishes = results.map(like => {
    //     const dish = like.get('dish');
    //     return {
    //       id: dish.id,
    //       name: dish.get('name'),
    //       image: dish.get('image')
    //     };
    //   });
    //   this.setData({ likedDishes });
    // });
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

  startEditUsername() {
    this.setData({ isEditingUsername: true });
  },
  
  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },
  
  confirmUsername() {
    this.setData({ isEditingUsername: false });

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