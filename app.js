// app.js
App({
  data: {
    AV: null,
  },
  onLaunch(){
    this.initLeanCloud()
    console.log("app launched!")
    wx.login({
      success: (res) => {
        console.log(res.code)

        console.log("AV object " + this.data.AV)

        var reqData = {
          code: res.code,
        };

        console.log(reqData)

        this.data.AV.Cloud.run("getOpenId", reqData).then(
          function (data) {
            // 处理结果

            console.log("调用成功" + JSON.stringify(data, null, 2))
          },
          function (err) {
            // 处理报错
            console.log("调用失败" + err)
          }
        );
      },
    })
  },
  initLeanCloud(){
    // TODO, 可能把AV对象保存一下 不要当作临时变量
    const AV = require("./libs/av-core-min.js");
    const adapters = require("./libs/leancloud-adapters-weapp.js");

    AV.setAdapters(adapters);
    console.log("sdk init")

    AV.init({
      appId: "jlNkHO606phUDm1rhu8sChMT-gzGzoHsz",
      appKey: "14ccESsTFMtDoQN6yQT1g889",
      serverURL: "https://jlnkho60.lc-cn-n1-shared.com",
    });
    
    this.data.AV = AV
  }
})
