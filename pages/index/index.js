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

    page: 1
  },
  onLoad: function () {
    console.log(app.user_data)
    this.slideList();
    this.cateList();
    this.newRecommendList();
    // if (app.globalData.userInfo) {
    //   this.setData({
    //     userInfo: app.globalData.userInfo,
    //     hasUserInfo: true
    //   })
    // } else if (this.data.canIUse){
    //   // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    //   // 所以此处加入 callback 以防止这种情况
    //   app.userInfoReadyCallback = res => {
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
  // 获取首页轮播图
  slideList(complete) {
    app.ajax('api/slideList', null, res => {
      app.aliyun_format(res);
      this.setData({
        slide_list: res
      });
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  },
  // 商品分类列表
  cateList(complete) {
    app.ajax('api/cateList', {
      recommed: 1
    }, res => {
      app.aliyun_format(res, 'icon');
      this.setData({
        cate_list: res
      });
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  },

  // 新品推荐
  newRecommendList(complete) {
    let post = {
      page: this.data.page,
      type: 1,
      perpage: 11
    };

    this.goodsList(post, res => {
      // if (res.length === 0) {
      //   if (this.data.page === 1) {
      //     this.setData({
      //       jianhuo_list: [],
      //       nodata: true,
      //       nomore: false
      //     })
      //   } else {
      //     this.setData({
      //       nodata: false,
      //       nomore: true
      //     })
      //   }
      // } else {
      this.setData({
        jianhuo_list: res
      });
      // }
      // this.data.page++;
    }, () => {
      if (complete)
        complete();
    });
  },

  // 商品列表
  goodsList(post, success, complete) {
    app.ajax('api/goodsList', post, res => {
      for (let i = 0; i < res.length; i++) {
        app.aliyun_format(res[i].pics);
      }
      success(res);
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  },

  // 去分类页
  to_cate(e) {
    app.cate.cate_id = e.currentTarget.dataset.cate_id;
    app.cate.change = true;
    wx.switchTab({
      url: '/pages/sort/sort'
    });
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