//index.js
//获取应用实例
const app = getApp()
const utils = require('../../utils/util');

Page({
  data: {
    slide_list: [],
    cate_list: [],
    jianhuo_list: [],
    canIUse: wx.canIUse('button.open-type.getUserInfo'),

    date: ''
  },
  onLoad: function () {
    setInterval(() => {
      this.setData({
        date: utils.date_format(new Date(), 'yyyy年MM月dd日 q季度 hh:mm:ss')
      });
    }, 1000);
    // if (app.globalData.userInfo) {
    //   this.setData({
    //     userInfo: app.globalData.userInfo,
    //     hasUserInfo: true
    //   })
    // } else if (this.data.canIUse){
    //   // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    //   // 所以此处加入 callback 以防止这种情况
    //   app.userInfoReadyCallback = res => {
    this.setData({
      slide_list: app.jia_data.slides,
      cate_list: app.jia_data.cate_list,
      jianhuo_list: app.jia_data.shop
    })
    // this.setData({
    //   userInfo: res.userInfo,
    //   hasUserInfo: true
    // })
    //   }
    // } else {
    //   // 在没有 open-type=getUserInfo 版本的兼容处理
    //   wx.getUserInfo({
    //     success: res => {
    //       app.globalData.userInfo = res.userInfo
    //       this.setData({
    //         userInfo: res.userInfo,
    //         hasUserInfo: true
    //       })
    //     }
    //   })
    // }
  },

  // 去搜索页
  to_search() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  // 跳页
  jump(e) {
    app.jump(e.currentTarget.dataset.url);
  },
  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})