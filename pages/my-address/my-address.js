const app = getApp();

Page({
  data: {
    type: 0,  // 0.我的地址 1.order-create选择地址 2.cart-order-create选择地址
    address_list: [],
    loading: false
  },
  onLoad(options) {
    if (options.type) {
      this.data.type = parseInt(options.type);
      wx.setNavigationBarTitle({ title: '选择收货地址' });
    }
    this.addressList();
  },
  // 当地址用于选择
  choose(e) {
    if (this.data.type !== 0) {
      let address = e.currentTarget.dataset.address;
      let choose_page;
      switch (this.data.type) {
        case 1:
          choose_page = app.get_page('pages/order-create/order-create');
          break;
        case 2:
          choose_page = app.get_page('pages/cart-order-create/cart-order-create');
          break;
      }
      choose_page.choose_address(address.username, address.tel, address.provincename + ' ' + address.cityname + ' ' + address.countyname + ' ' + address.detail, () => {
        wx.navigateBack({ delta: 1 });
      });
    }
  },
  // 获取我的收货地址
  addressList(complete) {
    app.ajax('my/addressList', null, res => {
      this.setData({ address_list: res });
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  },
  // 去添加地址页面
  to_addressAdd() {
    wx.navigateTo({ url: '/pages/address-detail/address-detail' });
  },
  // 选择微信地址
  choose_address() {
    wx.chooseAddress({
      success: res => {
        wx.showLoading({
          title: '添加中',
          mask: true
        });

        this.addressAdd(res.userName, res.telNumber, res.provinceName, res.cityName, res.countyName, res.detailInfo, this.data.address_list.length === 0 ? 1 : 0, () => {
          app.modal('添加成功', () => {
            this.addressList();
          });
        }, () => {
          wx.hideLoading();
        });
      },
      fail: err => {
        if (err.errMsg.indexOf('auth') !== -1) {
          wx.showModal({
            title: '提示',
            content: '请先授权获取您的通讯地址',
            success: modal_res => {
              if (modal_res.confirm) {
                wx.openSetting({
                  success: os_res => {
                    if (os_res.authSetting['scope.address']) {
                      wx.chooseAddress({
                        success: res => {
                          wx.showLoading({
                            title: '添加中',
                            mask: true
                          });

                          this.addressAdd(res.userName, res.telNumber, res.provinceName, res.cityName, res.countyName, res.detailInfo, this.data.address_list.length === 0 ? 1 : 0, () => {
                            app.modal('添加成功', () => {
                              this.addressList();
                            });
                          }, () => {
                            wx.hideLoading();
                          });
                        }
                      })
                    }
                  }
                })
              }
            }
          });
        }
      }
    })
  },
  // 设为默认收货地址
  setDetaultAddress(e) {
    if (!this.data.loading) {
      let address = e.currentTarget.dataset.address;
      if (address.default !== 1) {
        this.data.loading = true;

        app.ajax('my/setDetaultAddress', {id: address.id}, () => {
          this.data.loading = false;
          app.toast('设置完成');
          this.addressList();
        });
      }
    }
  },
  // 添加收货地址
  addressAdd(username, tel, provincename, cityname, countyname, detail, is_default, success, complete) {
    let post = {
      token: app.user_data.token,
      username: username,
      tel: tel,
      provincename: provincename,
      cityname: cityname,
      countyname: countyname,
      detail: detail,
      default: is_default
    };

    app.ajax('my/addressAdd', post, () => {
      if (success) {
        success();
      }
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  },
  // 删除收货地址
  addressDel(e) {
    if (!this.data.loading) {
      wx.showModal({
        title: '提示',
        content: '删除收货地址？',
        success: res => {
          if (res.confirm) {
            this.data.loading = true;
            app.ajax('my/addressDel', { id: e.currentTarget.dataset.id }, () => {
              this.addressList();
            }, null, () => {
              this.data.loading = false;
            });
          }
        }
      });
    }
  },
  // 下拉刷新
  onPullDownRefresh() {
    if (!this.data.loading) {
      this.data.loading = true;
      wx.showNavigationBarLoading();
      this.addressList(() => {
        this.data.loading = false;
        wx.hideNavigationBarLoading();
        wx.stopPullDownRefresh();
      });
    }
  }
});