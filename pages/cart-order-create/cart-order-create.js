const app = getApp();

Page({
  data: {
    full_loading: true,

    ids: [],
    cartList: [],
    goods_num: 0,  // 物品总件数
    carriage: 0,  // 运费
    total: 0,  // 总计
    receiver: '',  // 收货人
    tel: '',  // 电话
    address: '',  // 地址
    purchase_loading: false
  },
  onLoad(options) {
    this.data.ids = decodeURIComponent(options.ids).split(',');
    this.cartList(() => {
      this.setData({ full_loading: false });
    });

    this.addressList();
  },

  // 我的购物车
  cartList(complete) {
    let post = {
      token: app.user_data.token
    };

    app.ajax('shop/cartList', post, (res) => {
      let cartList = [];
      app.aliyun_format(res, 'cover');
      for (let i = 0; i < res.length; i++) {
        if (this.data.ids.indexOf(res[i].id + '') !== -1) {
          cartList.push(res[i]);
        }
      }

      this.setData({ cartList: cartList }, () => {
        this.price_compute();
      });
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  },
  // 计算价格（运费，总计）
  price_compute() {
    let cartList = this.data.cartList;

    let carriage = 0, total = 0, goods_num = 0;
    for (let i = 0; i < cartList.length; i++) {
      goods_num += cartList[i].num;
      carriage += Number(cartList[i].carriage) * cartList[i].num;
      total += Number(cartList[i].total_price) + Number(cartList[i].carriage) * cartList[i].num;
    }
    if (goods_num > 1) {
      total -= carriage;
      carriage = 0;
    }

    this.setData({
      carriage: carriage.toFixed(2),
      total: total.toFixed(2),
      goods_num: goods_num
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
  cartToPurchase(e) {
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
          receiver: this.data.receiver,
          tel: this.data.tel,
          address: this.data.address,
          cart_ids: this.data.ids
        };

        app.ajax('shop/cartToPurchase', post, (pay_order_sn) => {
          this.orderSnPay(pay_order_sn, (res) => {
            // todo 底下这个不知道管不管用？因为下面直接就跳页了
            let shop_page = app.get_page('pages/shop/shop');
            if (shop_page) {
              shop_page.cartList();
            }

            if (res) {
              wx.redirectTo({ url: '/pages/my-orders/my-orders?status=1' });
            } else {
              app.modal('支付未完成，可以在我的订单中进行后续的付款操作', () => {
                wx.redirectTo({ url: '/pages/my-orders/my-orders?status=0' });
              });
            }
          });
        }, (err) => {
          if (err.code === 47) {
            app.modal(err.message, () => {
              wx.redirectTo({ url: '/pages/shop-car/shop-car' })
            });
          } else {
            app.toast(err.message);
          }
        }, () => {
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
