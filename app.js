const utils = require('./utils/util');
const aliyunUploadFile = require("./utils/aliyunUploadFile");
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
    base_url: 'https://mp.tjluckytoy.com',
    base_api: 'https://mp.tjluckytoy.com/mp/',
    aliyun_base: 'https://testoss.psn.asia/',
    reg: {
      tel: /^1([358][0-9]|4[579]|66|7[0135678]|9[89])[0-9]{8}$/,
      phone: /\d{3,4}-\d{7,8}/,
      email: /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/,
      natural: /^([1-9]\d*|0)$/,
      positive: /^[1-9]\d*$/,
      price: /^([1-9]\d*|0)(\.\d{1,2})?$/
    },
    statusBarHeight: 0,
    topBarHeight: 0,
    default_img: '/images/default.png'
  },
  cate: {
    cate_id: 0,
    change: false
  },
  user_data: {
    token: '',
    uid: 0,
    nickname: '',
    score: 0,
    sex: 0, // 0.未知 1.男 2.女
    avatar: '',
    tel: '',
    user_auth: 0
  },
  mp_update() {
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate(function (res) {
      // console.log(res.hasUpdate); // 是否有更新
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
      url: this.config.base_api + path,
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
              case -7:
                this.modal(res.data.message, () => {
                  wx.navigateTo({
                    url: 'pages/user-info/user-info',
                  })
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

  // 获取打开的页面
  get_page(page_name) {
    let pages = getCurrentPages();
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].route === page_name) {
        return pages[i];
      }
    }
    return false;
  },
  // input绑定page中的数据
  bind_input(e, page) {
    page.setData({
      [e.currentTarget.dataset['name']]: e.detail.value || ''
    })
  },
  // 小程序登录获取token
  login(callback, inviter_id) {
    this.get_code(code => {
      let post = {
        code: code,
        inviter_id
      };

      this.ajax('login/login', post, (res) => {
        callback(res);
      });
    });
  },
  get_code(callback) {
    wx.login({
      success(login) {
        callback(login.code);
      }
    });
  },
  // 授权获取用户信息
  userAuth(callback) {
    wx.getUserInfo({
      success: user => {
        let post = {
          iv: user.iv,
          encryptedData: user.encryptedData
        };
        this.ajax('login/userAuth', post, () => {
          callback(true);
        }, () => {
          callback(false);
        });
      }
    });
  },
  // 设置一些公共信息
  set_common(complete) {
    this.ajax('my/mydetail', null, res => {
      this.aliyun_format(res, 'avatar');

      this.user_data.uid = res.uid;
      this.user_data.nickname = res.nickname || '';
      this.user_data.realname = res.realname || '';
      this.user_data.score = res.score || 0;
      this.user_data.sex = res.sex;
      this.user_data.avatar = res.avatar;
      this.user_data.tel = res.tel || 0;
      this.user_data.user_auth = res.user_auth || 0;
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  },
  redirect_or_switch_or_index(route) {
    if (!route) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    } else {
      switch (route) {
        case 'pages/index/index':
        case 'pages/sort/sort':
        case 'pages/my-cart/my-cart':
        case 'pages/mine/mine':
          wx.switchTab({
            url: '/' + route
          });
          break;
        default:
          wx.redirectTo({
            url: '/' + route
          });
          break;
      }
    }
  },
  // 富文本处理方法
  rich_handle(rich) {
    return rich.replace(/\/ueditor\/php\/upload\//g, this.config.base_url + '/ueditor/php/upload/');
  },
  // 处理阿里云图片路径
  aliyun_format(obj, aliyun_field = 'pic') {
    if (obj instanceof Array) {
      if (typeof obj[0] === 'string') {
        for (let i = 0; i < obj.length; i++) {
          obj[i] = this.aliyun_empty_or(obj[i]);
        }
      } else {
        for (let i = 0; i < obj.length; i++) {
          obj[i][aliyun_field] = this.aliyun_empty_or(obj[i][aliyun_field]);
        }
      }
    } else if (typeof obj === 'object') {
      obj[aliyun_field] = this.aliyun_empty_or(obj[aliyun_field]);
    } else {
      return this.aliyun_empty_or(obj);
    }
  },
  aliyun_empty_or(aliyun) {
    if (aliyun) {
      if (aliyun.indexOf('https') === 0) {
        return aliyun;
      } else {
        return this.config.aliyun_base + '/' + aliyun;
      }
    }
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
  // 处理图像路径
  format_img(obj, img_field = 'pic') {
    if (obj instanceof Array) {
      if (typeof obj[0] === 'string') {
        for (let i = 0; i < obj.length; i++) {
          obj[i] = this.empty_or(obj[i]);
        }
      } else {
        for (let i = 0; i < obj.length; i++) {
          obj[i][img_field] = this.empty_or(obj[i][img_field]);
        }
      }
    } else if (typeof obj === 'object') {
      obj[img_field] = this.empty_or(obj[img_field]);
    } else {
      return this.empty_or(obj);
    }
  },
  empty_or(img) {
    if (img) {
      if (img.indexOf('https') === 0) {
        return img;
      } else {
        return this.config.base_url + '/' + img;
      }
    } else {
      return this.config.default_img;
    }
  },

  // 格式化上传图片，将http前缀去掉
  format_up_img(obj) {
    if (obj instanceof Array) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = obj[i] ? obj[i].replace(this.config.aliyun_base + '/', '') : '';
      }
    } else {
      return obj ? obj.replace(this.config.aliyun_base + '/', '') : '';
    }
  },

  // 时间格式化
  format_time(obj, field, fmt) {
    if (obj instanceof Array) {
      for (let i = 0; i < obj.length; i++) {
        if (fmt) {
          obj[i][field] = utils.date_format(obj[i][field], fmt);
        } else {
          obj[i][field] = utils.date_format(obj[i][field]);
        }
      }
    } else {
      if (fmt) {
        obj[field] = utils.date_format(obj[field], fmt);
      } else {
        obj[field] = utils.date_format(obj[field]);
      }
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

  // 初始化阿里云参数
  aliyun_init(complete) {
    this.ajax('upload/getStsToken', null, res => {
      var options = {
        key: res.bucket,
        filename: res.filename,
        host: 'https://shanhaitest.oss-cn-beijing.aliyuncs.com',
        securityToken: res.SecurityToken,
        ossAccessKeyId: res.AccessKeyId,
        ossAccessKeySecret: res.AccessKeySecret
      };
      aliyunUploadFile.init(options);
      complete();
    });
  },
  // 阿里云上传
  aliyun_upload(temp_img, callback, err) {
    aliyunUploadFile.upload(temp_img, res => {
      callback(res);
    }, error => {
      if (err) {
        err();
      }
      console.error('上传阿里云出错: ', error);
    });
  },
  // 选择图片并返回
  choose_img(count, callback, maxsize = 524288, ext = ['jpg', 'jpeg', 'png', 'gif']) {
    wx.chooseImage({
      count: count,
      sourceType: ['album', 'camera'],
      success: res => {
        let over_text;
        if (maxsize < 1024) {
          over_text = maxsize + 'B';
        } else if (maxsize < 1048576) {
          over_text = Math.floor(maxsize / 1024) + 'KB';
        } else {
          over_text = Math.floor(maxsize / 1048576) + 'M';
        }

        for (let i = 0; i < res.tempFiles.length; i++) {
          if (res.tempFiles[i].size > maxsize) {
            this.modal('选择的图片不能大于' + over_text);
            return callback(false);
          }

          res.tempFiles[i].ext = res.tempFiles[i].path.substr(res.tempFiles[i].path.lastIndexOf('.') + 1);

          if (ext.indexOf(res.tempFiles[i].ext) === -1) {
            this.modal('请上传合法的文件格式');
            return callback(false);
          }
        }

        callback(res.tempFiles);
      }
    })
  },
  // 创建指定数量元素的数组（flex填充用）
  null_arr(number, line_number) {
    let num = (line_number - number % line_number) % line_number;

    let arr = [];
    arr[num - 1] = null;
    return arr;
  },
})