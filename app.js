// app.js
App({
  AV: null,
  onLaunch(){
    this.initLeanCloud()
    wx.login({
      success: (res) => {
        var req_params = {
          code: res.code
        }

        this.AV.Cloud.run("getOpenId", req_params).then(
          function (data) {
            const session_key = data.session_key;
            const openid = data.openid;

            wx.setStorageSync('session_key', session_key);
            wx.setStorageSync('open_id', openid);
          },
          function (err) {
            // 处理报错s
            console.log("调用失败" + err)
          }
        );
      },
    })
  },
  initLeanCloud(){
    const AV = require("./libs/av-core-min.js");
    const adapters = require("./libs/leancloud-adapters-weapp.js");
    
    AV.setAdapters(adapters);

    AV.init({
      appId: "jlNkHO606phUDm1rhu8sChMT-gzGzoHsz",
      appKey: "14ccESsTFMtDoQN6yQT1g889",
      serverURL: "https://jlnkho60.lc-cn-n1-shared.com",
    });
    this.AV = AV;
  }
})
