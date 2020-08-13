//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    slide_list: [],
    cate_list: [],
    jianhuo_list: [],
    loading: false,
    page: 1
  },
  onLoad: function () {
    // this.slideList();
    // this.cateList();
    // this.newRecommendList();
    wx.showLoading({
      title: '加载中',
    })
    let promise1 = new Promise(resolve => {
      this.slideList(() => {
        resolve();
      });
    });

    let promise2 = new Promise(resolve => {
      this.cateList(() => {
        resolve();
      });
    });

    let promise3 = new Promise(resolve => {
      this.newRecommendList(() => {
        resolve();
      });
    });
    Promise.all([
      promise1, promise2, promise3,
    ]).then(() => {
      wx.hideLoading()
    });
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
      recommend: 1
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
      this.setData({
        jianhuo_list: res
      });
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
  },

  // 下拉刷新
  onPullDownRefresh() {
    if (!this.data.loading) {
      this.data.loading = true;

      this.data.page = 1;
      this.data.jianhuo_list = [];

      let promise1 = new Promise(resolve => {
        this.slideList(() => {
          resolve();
        });
      });

      let promise2 = new Promise(resolve => {
        this.cateList(() => {
          resolve();
        });
      });

      let promise3 = new Promise(resolve => {
        this.newRecommendList(() => {
          resolve();
        });
      });

      wx.showNavigationBarLoading();
      Promise.all([
        promise1, promise2, promise3
      ]).then(() => {
        this.data.loading = false;
        wx.hideNavigationBarLoading();
        wx.stopPullDownRefresh();
      });
    }
  },

  // 分享
  onShareAppMessage() {
    wx.showShareMenu();
    // return {
    //   path: app.share_path()
    // };
  },
})