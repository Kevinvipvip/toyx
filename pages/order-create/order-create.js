const app = getApp();

Page({
  data: {
    full_loading: true,

    id: 0,
    num: 0,
    attr_id: 0,
    attr_index: 0,
    goods: {},
    receiver: '',  // 收货人
    tel: '',  // 电话
    address: '',  // 地址
    purchase_loading: false
  },
  onLoad(options) {
    this.data.id = parseInt(options.id);
    this.data.attr_id = parseInt(options.attr_id);
    this.setData({ num: options.num });

    this.goodsDetail(() => {
      this.setData({ full_loading: false });
    });
    this.addressList();
  },
  // 商品详情
  goodsDetail(complete) {
    app.ajax('api/goodsDetail', { goods_id: this.data.id }, (res) => {
      app.aliyun_format(res.pics);
      res.carriage = Number(res.carriage);
      res.price = Number(res.price);
      res.vip_price = Number(res.vip_price);
      if (res.use_attr === 1) {
        for (let i = 0; i < res.attr_list.length; i++) {
          if (res.attr_list[i].id === this.data.attr_id) {
            this.setData({ attr_index: i });
            break;
          }
        }
      }
      this.setData({ goods: res });
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  },
  bind_input(e) {
    this.setData({ [e.currentTarget.dataset['name']]: e.detail.value || '' })
  },
  // 获取默认收货地址
  addressList() {
    let post = {
      token: app.user_data.token
    };

    app.ajax('my/addressList', post, (res) => {
      for (let i = 0; i < res.length; i++) {
        if (res[i].default === 1) {
          this.setData({
            receiver: res[i].username,
            tel: res[i].tel,
            address: res[i].provincename + ' ' + res[i].cityname + ' ' + res[i].countyname + ' ' + res[i].detail
          });
          break;
        }
      }
    });
  },
  // 选择收货地址，在其他页调用
  choose_address(receiver, tel, address, callback) {
    this.setData({
      receiver: receiver,
      tel: tel,
      address: address
    }, () => {
      if (callback) {
        callback();
      }
    });
  },
  // 下单
  purchase(e) {
    if (!this.data.purchase_loading) {
      let data = this.data;
      if (!data.receiver.trim()) {
        app.toast('请填写收货人');
      } else if (!data.tel.trim()) {
        app.toast('请填写手机号');
      } else if (!app.config.reg.tel.test(data.tel)) {
        app.toast('手机号格式不正确');
      } else if (!data.address.trim()) {
        app.toast('请填写收货地址');
      } else {
        // 先不用收集了
        // app.collectFormid(e.detail.formId);

        this.setData({ purchase_loading: true });

        let post = {
          token: app.user_data.token,
          goods_id: this.data.id,
          num: this.data.num,
          receiver: this.data.receiver,
          tel: this.data.tel,
          address: this.data.address
        };

        if (this.data.goods.use_attr === 1) {
          post.attr_id = this.data.attr_id;
        }

        app.ajax('shop/purchase', post, (pay_order_sn) => {
          this.orderSnPay(pay_order_sn, (res) => {
            if (res) {
              wx.redirectTo({ url: '/pages/my-orders/my-orders?status=1' });
            } else {
              app.modal('支付未完成，可以在我的订单中进行后续的付款操作', () => {
                wx.redirectTo({ url: '/pages/my-orders/my-orders?status=0' });
              })
            }
          });
        }, null, () => {
          this.setData({ purchase_loading: false });
        });
      }
    }
  },
  // 支付
  orderSnPay(pay_order_sn, complete) {
    let post = {
      token: app.user_data.token,
      pay_order_sn: pay_order_sn
    };

    app.ajax('pay/orderSnPay', post, (res) => {
      wx.requestPayment({
        timeStamp: res.timeStamp,
        nonceStr: res.nonceStr,
        package: res.package,
        signType: 'MD5',
        paySign: res.paySign,
        success() {
          complete(true);
        },
        fail() {
          // app.toast('支付失败');
          complete(false);
        }
      })
    });
  }
});
