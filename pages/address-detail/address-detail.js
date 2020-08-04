const app = getApp();

Page({
  data: {
    is_ios: false,

    id: 0,  // 新增为0
    username: '',  // 联系人
    tel: '',  // 手机号码
    provincename: '',  // 省
    cityname: '',  // 市
    countyname: '',  // 区
    detail: '',  // 地址详情
    default: 0,  // 0.非默认 1.默认

    citys: [],  // 默认选择的省市区，用于修改

    loading: false
  },
  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      wx.setNavigationBarTitle({ title: '修改收货地址' });
      this.addressDetail();
    } else {
      wx.setNavigationBarTitle({ title: '新增收货地址' });
    }

    this.setData({ is_ios: app.is_ios });
  },
  // 选择微信地址
  choose_address() {
    wx.chooseAddress({
      success: res => {
        this.setData({
          username: res.userName,
          tel: res.telNumber,
          provincename: res.provinceName,
          cityname: res.cityName,
          countyname: res.countyName,
          detail: res.detailInfo,
          citys: [res.provinceName, res.cityName, res.countyName]
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
                          this.setData({
                            username: res.userName,
                            tel: res.telNumber,
                            provincename: res.provinceName,
                            cityname: res.cityName,
                            countyname: res.countyName,
                            detail: res.detailInfo,
                            citys: [res.provinceName, res.cityName, res.countyName]
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
  // 添加收货地址
  addressEdit() {
    let data = this.data;
    if (!data.username.trim()) {
      app.toast('请填写联系人');
    } else if (!data.tel.trim()) {
      app.toast('请填写手机号码');
    } else if (!app.config.reg.tel.test(data.tel)) {
      app.toast('手机号格式不正确');
    } else if (!data.provincename) {
      app.toast('请选择省市区');
    } else if (!data.detail.trim()) {
      app.toast('请填写详细地址');
    } else {
      wx.showModal({
        title: '提示',
        content: '确定保存？',
        success: modal_res => {
          if (modal_res.confirm) {
            wx.showLoading({
              title: '保存中',
              mask: true
            });

            let post = {
              username: data.username,
              tel: data.tel,
              provincename: data.provincename,
              cityname: data.cityname,
              countyname: data.countyname,
              detail: data.detail
            };

            // 新增或是修改
            let method;
            if (this.data.id) {
              post.id = this.data.id;
              method = 'my/addressMod';
            } else {
              method = 'my/addressAdd';
            }

            app.ajax(method, post, () => {
              let my_address = app.get_page('pages/my-address/my-address');
              if (my_address) {
                my_address.addressList(() => {
                  wx.navigateBack({ delta: 1 });
                });
              } else {
                wx.navigateBack({ delta: 1 });
              }
            }, null, () => {
              wx.hideLoading();
            });
          }
        }
      });
    }
  },
  // 弹出城市选择器
  citys_change(e) {
    let citys = e.detail.value;
    this.setData({
      provincename: citys[0],
      cityname: citys[1],
      countyname: citys[2]
    });
  },
  bind_input(e) {
    app.bind_input(e, this);
  },
  // 获取地址详情
  addressDetail() {
    app.ajax('my/addressDetail', { id: this.data.id }, (res) => {
      this.setData({
        username: res.username,
        tel: res.tel,
        provincename: res.provincename,
        cityname: res.cityname,
        countyname: res.countyname,
        detail: res.detail,
        default: res.default,
        citys: [res.provincename, res.cityname, res.countyname]
      });
    });
  }
});