const app = getApp();

Page({
  data: {
    full_loading: true,
    is_ios: false,

    order_list: [],
    status: '',
    page: 1,
    nomore: false,
    nodata: false,
    loading: false,

    // 退款
    refund_show: false,
    reason: '',
    refund_id: 0
  },
  onLoad(options) {
    if (options.status) {
      this.setData({ status: parseInt(options.status) });
    }

    this.orderList(() => {
      this.setData({ full_loading: false });
    });

    this.setData({ is_ios: app.is_ios });
  },
  tab_change(e) {
    if (!this.data.loading) {
      this.data.loading = true;

      this.reset();

      wx.showLoading({
        title: '加载中',
        mask: true
      });
      this.setData({ status: e.currentTarget.dataset.status });
      this.orderList(() => {
        this.data.loading = false;
        wx.hideLoading();
      });
    }
  },
  // 订单列表
  orderList(complete) {
    let post = {
      token: app.user_data.token,
      page: this.data.page,
      perpage: 5
    };

    if (this.data.status !== '') {
      post.status = this.data.status;
    }

    app.ajax('my/orderList', post, (res) => {
      if (res.length === 0) {
        if (this.data.page === 1) {
          this.setData({
            order_list: [],
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
          app.aliyun_format(res[i].child, 'cover');
          switch (res[i].status) {
            case 0:
              res[i].status_text = '待付款';
              break;
            case 1:
              res[i].status_text = '待发货';
              break;
            case 2:
              res[i].status_text = '待收货';
              break;
            case 3:
              res[i].status_text = '已完成';
              break;
          }

          sum = 0;
          for (let j = 0; j < res[i].child.length; j++) {
            sum += res[i].child[j].num;
          }

          res[i].sum = sum;
        }
        this.setData({ order_list: this.data.order_list.concat(res) });
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

      this.reset();

      wx.showNavigationBarLoading();
      this.orderList(() => {
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
        this.orderList(() => {
          wx.hideNavigationBarLoading();
          this.data.loading = false;
        });
      }
    }
  },
  // 订单状态改变后刷新，区别于下拉刷新
  refresh() {
    this.reset();
    this.orderList();
  },
  // 重置订单数据
  reset() {
    this.data.page = 1;
    this.data.order_list = [];
    this.setData({
      nomore: false,
      nodata: false
    });
  },
  // 确认收货
  orderConfirm(e) {
    wx.showModal({
      title: '提示',
      content: '确认收货？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({
            title: '确认收货...',
            mask: true
          });
          let order = e.currentTarget.dataset.order;
          app.ajax('my/orderConfirm', { order_id: order.id }, () => {
            wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + order.id });
            this.refresh();
          }, null, () => {
            wx.hideLoading();
          });
        }
      }
    });
  },
  // 支付
  orderSnPay(e) {
    let order = e.currentTarget.dataset.order;
    app.ajax('pay/orderSnPay', { pay_order_sn: order.pay_order_sn }, (res) => {
      wx.requestPayment({
        timeStamp: res.timeStamp,
        nonceStr: res.nonceStr,
        package: res.package,
        signType: 'MD5',
        paySign: res.paySign,
        success: () => {
          wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + order.id });
          this.refresh();
        },
        fail: err => {
          if (err.errMsg.indexOf('fail cancel')) {
            app.toast('取消支付')
          } else {
            app.toast('支付失败')
          }
        }
      })
    });
  },
  // 取消订单
  orderCancel(e) {
    wx.showModal({
      title: '提示',
      content: '取消订单？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({
            title: '加载中',
            mask: true
          });
          let order = e.currentTarget.dataset.order;
          app.ajax('my/orderCancel', { order_id: order.id }, () => {
            app.modal('订单已取消', () => {
              this.refresh();
            });
          }, null, () => {
            wx.hideLoading();
          });
        }
      }
    });
  },
  // 点击退款按钮
  refund_click(e) {
    let order = e.currentTarget.dataset.order;
    this.data.refund_id = order.id;
    this.setData({ refund_show: true });
  },
  // 申请退款
  refundApply() {
    let that = this;
    if (!that.data.reason.trim()) {
      app.toast('请填写退款理由');
    } else {
      wx.showLoading({
        title: '加载中',
        mask: true
      });
      let post = {
        order_id: that.data.refund_id,
        reason: that.data.reason
      };
      app.ajax('my/refundApply', post, (res) => {
        that.setData({
          reason: '',
          refund_show: false
        });
        wx.navigateTo({ url: '/pages/refund-list/refund-list' });
        that.refresh();
      }, err => {
        app.modal(err.message);
      }, () => {
        wx.hideLoading();
      });
    }
  },
  bind_input(e) {
    app.bind_input(e, this);
  },
  // 隐藏退款框
  hide_refund() {
    this.setData({ refund_show: false });
  },
  // 去物流页
  to_logistics(e) {
    let order_id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/logistics/logistics?id=' + order_id });
  }
});
