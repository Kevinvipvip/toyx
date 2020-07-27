//app.js
App({
  onLaunch() {
    wx.getSystemInfo({
      success: res => {
        this.config.statusBarHeight = res.statusBarHeight;
        if (res.model.indexOf('iPhone') !== -1) {
          this.config.topBarHeight = 44;
        } else {
          this.config.topBarHeight = 48;
        }
      }
    });

    let phone = wx.getSystemInfoSync();
    this.is_ios = phone.platform === 'ios';

    wx.onMemoryWarning(res => {
      console.log('内存不足', res);
    })
  },
  is_ios: '',
  config: {
    base_url: 'https://toy.wcip.net',
    base_api: 'https://toy.wcip.net/api',
    qiniu_base: 'https://qiniu.sd.wcip.net',
    reg: {
      tel: /^1\d{10}$/,
      phone: /\d{3,4}-\d{7,8}/,
      email: /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/,
      natural: /^([1-9]\d*|0)$/,
      positive: /^[1-9]\d*$/,
      price: /^([1-9]\d*|0)(\.\d{1,2})?$/
    },
    statusBarHeight: 0,
    topBarHeight: 0,
  },
  user_data: {
    token: '',
    uid: 0,
    nickname: '',
    realname: '',
    sex: 0, // 0.未知 1.男 2.女
    user_auth: 0, // 0.用户未授权 1.用户已授权
    avatar: '',
    tel: '',
    share_auth: 0 // 是否有查看分享的权限
  },
  mp_update() {
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate(function (res) {
      console.log(res.hasUpdate); // 是否有更新
    });
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否马上重启小程序？',
        success: function (res) {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    });
    updateManager.onUpdateFailed(function () {
      // 新的版本下载失败
    })
  },
  toast(title, duration, icon = 'none') {
    let dura = duration || 2000;
    wx.showToast({
      title: String(title),
      icon: icon,
      duration: dura
    });
  },
  modal(content, callback) {
    wx.showModal({
      title: '提示',
      content: content,
      showCancel: false,
      success() {
        if (callback) {
          callback();
        }
      }
    });
  },
  confirm(content, callback) {
    wx.showModal({
      title: '提示',
      content: content,
      success: res => {
        if (res.confirm) {
          callback();
        }
      }
    });
  },
  ajax(path, data, succ, err, complete) {
    data = data || {};
    if (!data.token) {
      data.token = this.user_data.token;
    }

    wx.request({
      url: this.my_config.api + path,
      method: 'POST',
      dataType: 'json',
      data: data,
      success: res => {
        if (res.data.code !== 1) {
          if (err) {
            err(res.data);
          } else {
            switch (res.data.code) {
              case -3: // token失效
              case -6: // token为空
                let current_pages = getCurrentPages();
                let current_page = current_pages[current_pages.length - 1];
                wx.redirectTo({
                  url: '/pages/login/login?route=' + encodeURIComponent(current_page.route + this.obj2query(current_page.options))
                });
                break;
              case -7: // 用户未绑定手机号
                break;
              case 49:
                this.toast(res.data.data);
                break;
              case 63:
              case 64:
                this.modal(res.data.message);
                break;
              case -8:
                // this.modal(res.data.message, () => {
                wx.redirectTo({
                  url: '/pages/test2/test2',
                })
                // });
                break;
              case 87: // 活动已删除
              case 88: // 创意已删除
              case 89: // 作品已删除
                this.modal(res.data.message, () => {
                  wx.navigateBack({
                    delta: 1
                  });
                });
                break;
              default:
                if (res.data.message) {
                  this.modal(res.data.message);
                } else {
                  this.toast('网络异常');
                }
                break;
            }
          }
        } else {
          if (succ) {
            succ(res.data.data);
          }
        }
      },
      fail() {
        // this.toast('网络异常');
      },
      complete() {
        if (complete) {
          complete();
        }
      }
    });
  },

  // 小程序登录获取token
  login(callback, inviter_id) {
    this.get_code(code => {
      let post = {
        code: code,
        inviter_id
      };

      this.ajax('login/login', post, (res) => {
        console.log(res);
        callback(res);
      });
    });
  },
  get_code(callback) {
    wx.login({
      success(login) {
        console.log(login.code);
        callback(login.code);
      }
    });
  },

  /* 内部方法 */
  // 对象转query字符串
  obj2query(obj) {
    let query = '';
    for (let key in obj) {
      query += key + '=' + obj[key] + '&';
    }
    if (!query) {
      return '';
    } else {
      return '?' + query.substr(0, query.length - 1);
    }
  },
  // 公共跳页方法
  jump(page) {
    if (page) {
      switch (page) {
        case 'index':
        case 'sort':
        case 'my-cart':
        case 'mine':
          wx.switchTab({
            url: `/pages/${page}/${page}`
          });
          break;
        default:
          page = page.split('?');
          if (page[1]) {
            wx.navigateTo({
              url: `/pages/${page[0]}/${page[0]}?${page[1]}`
            });
          } else {
            wx.navigateTo({
              url: `/pages/${page[0]}/${page[0]}`
            });
          }
          break;
      }
    }
  },


  // 假数据
  jia_data: {
    slides: [{
      pic: 'http://static.wcip.net/images/img1.jpg'
    }, {
      pic: 'http://static.wcip.net/images/img2.jpg'
    }],
    cate_list: [{
      icon: 'http://static.wcip.net/images/img1.jpg'
    }, {
      icon: 'http://static.wcip.net/images/img2.jpg'
    }, {
      icon: 'http://static.wcip.net/images/img1.jpg'
    }, {
      icon: 'http://static.wcip.net/images/img2.jpg'
    }],
    shop: [{
      id: 1,
      pics: ['http://static.wcip.net/images/img1.jpg', 'http://static.wcip.net/images/img2.jpg'],
      name: '卡后即可hi足协杯那几个号阿斯顿',
      price: '15.35'
    },{
      id: 2,
      pics: ['http://static.wcip.net/images/img2.jpg', 'http://static.wcip.net/images/img1.jpg'],
      name: '个马晓灿是有米诺阿斯顿勘查局阿斯蒂芬飞机场',
      price: '50.35'
    },{
      id: 3,
      pics: ['http://static.wcip.net/images/img1.jpg', 'http://static.wcip.net/images/img2.jpg'],
      name: '卡后即可hi足协杯那几个号阿斯顿',
      price: '15.35'
    },{
      id: 4,
      pics: ['http://static.wcip.net/images/img2.jpg', 'http://static.wcip.net/images/img1.jpg'],
      name: '个马晓灿是有米诺阿斯顿勘查局阿斯蒂芬飞机场',
      price: '50.35'
    }],
    user_data:{
      nickname:'陆剑客',
      avatar:'http://static.wcip.net/images/header1.jpg'
    }
  }
})