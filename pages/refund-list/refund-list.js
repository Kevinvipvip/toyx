const app = getApp();

Page({
  data: {
    full_loading: true,
    is_ios: false,

    refund_list: [],
    type: 0,
    page: 1,
    nomore: false,
    nodata: false,
    loading: false
  },
  onLoad(options) {
    if (options.type) {
      this.setData({ type: parseInt(options.type) });
    }

    this.refundList(() => {
      this.setData({ full_loading: false });
    });

    this.setData({ is_ios: app.is_ios });
  },
  tab_change(e) {
    if (!this.data.loading) {
      this.data.loading = true;

      this.setData({
        nomore: false,
        nodata: false
      });

      this.data.page = 1;
      this.data.refund_list = [];

      wx.showLoading({
        title: '加载中',
        mask: true
      });
      this.setData({ type: e.currentTarget.dataset.type });
      this.refundList(() => {
        this.data.loading = false;
        wx.hideLoading();
      });
    }
  },
  // 售后列表
  refundList(complete) {
    let post = {
      type: this.data.type,
      page: this.data.page,
      perpage: 10
    };

    app.ajax('my/refundList', post, (res) => {
      if (res.length === 0) {
        if (this.data.page === 1) {
          this.setData({
            refund_list: [],
            nomore: false,
            nodata: true
          });
        } else {
          this.setData({
            nomore: true,
            nodata: false
          });
        }
      } else {
        let sum;
        for (let i = 0; i < res.length; i++) {
          app.qiniu_format(res[i].child, 'cover');
          switch (res[i].refund_apply) {
            case 1:
              res[i].refund_text = '退款中';
              break;
            case 2:
              res[i].refund_text = '已退款';
              break;
          }

          sum = 0;
          for (let j = 0; j < res[i].child.length; j++) {
            sum += res[i].child[j].num;
          }

          res[i].sum = sum;
        }
        this.setData({ refund_list: this.data.refund_list.concat(res) });
      }

      this.data.page++;
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  },
  // 下拉刷新
  onPullDownRefresh() {
    if (!this.data.loading) {
      this.data.loading = true;

      this.data.nomore = false;
      this.data.nodata = false;
      this.data.page = 1;
      this.data.refund_list = [];

      wx.showNavigationBarLoading();
      this.refundList(() => {
        this.data.loading = false;
        wx.hideNavigationBarLoading();
        wx.stopPullDownRefresh();
      });
    }
  },
  // 上拉加载
  onReachBottom() {
    if (!this.data.nomore && !this.data.nodata) {
      if (!this.data.loading) {
        this.data.loading = true;
        wx.showNavigationBarLoading();
        this.refundList(() => {
          wx.hideNavigationBarLoading();
          this.data.loading = false;
        });
      }
    }
  },
  // 订单状态改变后刷新，区别于下拉刷新
  refresh() {
    this.data.nomore = false;
    this.data.nodata = false;
    this.data.page = 1;
    this.data.refund_list = [];
    this.refundList();
  }
});
