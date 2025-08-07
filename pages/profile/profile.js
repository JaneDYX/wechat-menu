const app = getApp();
const AV = app.AV;

Page({
  data: {
    avatarUrl: '',
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
        const username = user.getUsername() || '';
        const openid = user.get('openId') || '';
        const phone = user.get('mobilePhoneNumber') || '';
        const email = user.getEmail() || '';
        const isAdmin = user.get('isAdmin') || false;

        this.setData({
          avatarUrl: avatar,
          username,
          openid,
          phone,
          email,
          isAdmin
        });

        this.fetchLikedDishes(user);
        this.fetchDailyCosts(user);
      }).catch(err => {
        console.error('恢复失败:', err);
      });
    } else {
      console.warn('⚠️ 无 sessionToken，请先登录');
    }
  },

  // 暂未使用
  fetchLikedDishes(user) {
    // const Like = AV.Object.extend('Like');
    // const query = new AV.Query(Like);
    // query.equalTo('user', user);
    // query.include('dish');
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
      sizeType: ['compressed'],
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
          const fileUrl = fileObj.url();
          user.set('avatarUrl', fileUrl);
          return user.save().then(() => fileUrl);
        }).then(async (fileUrl) => {
          await AV.User.current().fetch(); // 强制刷新
          wx.hideLoading();
          wx.showToast({ title: '头像已更新' });
          this.setData({
            avatarUrl: fileUrl.replace(/^http:/, 'https:') + '?t=' + Date.now() // 加时间戳防缓存
          });
        }).catch(err => {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
          console.error('❌ 上传头像失败:', err);
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
    const newUsername = this.data.username.trim();
    if (!newUsername) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }

    const user = AV.User.current();
    user.setUsername(newUsername);
    user.save().then(() => {
      wx.showToast({ title: '昵称已更新' });
      this.setData({
        isEditingUsername: false,
        username: newUsername
      });
    }).catch(err => {
      console.error('❌ 昵称更新失败:', err);
      wx.showToast({ title: '更新失败', icon: 'none' });
    });
  },
  fetchDailyCosts(user) {
    const Summary = AV.Object.extend('DailySummary');
    const query = new AV.Query(Summary);
    query.equalTo('owner', user);
    query.descending('date');
    query.limit(7); // 近7天
    query.find().then(results => {
      const dailyCosts = results.map(obj => {
        const date = new Date(obj.get('date'));
        const cost = obj.get('totalCost') || 0;
        return {
          dateStr: `${date.getMonth() + 1}月${date.getDate()}日`,
          costStr: `¥${cost.toFixed(2)}`
        };
      });
      this.setData({ dailyCosts });
    }).catch(err => {
      console.error('获取每日消费失败:', err);
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
