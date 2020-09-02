// import drawQrcode from "../../utils/weapp.qrcode.min";

const app = getApp();
var WxParse = require('../../wxParse/wxParse.js');

Page({
  data: {
    id: 0,
    goods: {},
    swiper_current: 0, // swiper的数字标示
    tab_active: 0, // 0.商品详情 1.买家评价
    rich_text: {},
    add_loading: false, // 加入购物车loading
    attr_show: false,
    attr_active: false,
    attr_index: 0, // 选中的参数索引，默认为第一个
    buy_type: 1, // 1.购买 2.购物车
    amount: 0, // 购买数量

    poster_show: false, // 是否显示海报
    poster: '', // 海报图片
    show_set_btn: false,
    line_count: 0, // 标题行数

    page: 1,
    comment_list: [], // 评论列表
    nomore: false,
    nodata: false,
    loading: false,

    user_tel: 0,

    attr_detail: [], //当前规格组的选中、有无库存状态
    attrinfo: {}, //当前选中的规格属性详情
    value_index0: '', //当前选中的一组规格索引值
    value_index1: '', //当前选中的二组规格索引值
    value_index2: '', //当前选中的三组规格索引值

    stock_index_init: []

  },
  onLoad(options) {
    this.data.id = options.id;
    this.setData({
      user_tel: app.user_data.tel
    });

    // // 海报二维码
    // drawQrcode({
    //   width: 150,
    //   height: 150,
    //   correctLevel: 1,
    //   canvasId: 'qrcode',
    //   text: app.my_config.base_url + '/shop-detail?id=' + options.id
    // });

    this.goodsDetail();
    this.goodsCommentList();
  },
  // 商品详情
  goodsDetail() {
    app.ajax('api/goodsDetail', {
      goods_id: this.data.id
    }, (res) => {
      app.aliyun_format(res.pics);
      app.aliyun_format(res, 'avatar');

      this.setData({
        goods: res,
        attrinfo: res,
        line_count: Math.ceil(res.name.length / 18)
      });
      this.attr_stock_init();
      this.attr_search_stock();

      let rich_text = app.rich_handle(res.detail);
      WxParse.wxParse('rich_text', 'html', rich_text, this);
    });
  },

  // swiper滑动
  swiper_change(e) {
    this.setData({
      swiper_current: e.detail.current
    });
  },
  // 切换tab
  tab_change(e) {
    this.setData({
      tab_active: e.currentTarget.dataset.tab
    });
  },
  // 点击购买
  buy() {
    let data = this.data;

    if (data.goods.stock === 0) {
      app.toast('该商品已告罄！');
    } else {
      let amount;
      if (data.goods.use_attr === 1) {
        if (data.amount === 0) {
          amount = data.goods.attr_list[data.attr_index].stock !== 0 ? 1 : 0;
        } else {
          amount = data.amount;
        }
      } else {
        amount = data.amount || 1;
      }

      this.setData({
        attr_show: true,
        buy_type: 1,
        amount: amount
      }, () => {
        this.setData({
          attr_active: true
        });
      });
    }
  },
  // 点击加入购物车
  cartAdd() {
    let data = this.data;

    if (this.data.goods.stock === 0) {
      app.toast('该商品已告罄！');
    } else {
      let amount;
      if (data.goods.use_attr === 1) {
        if (this.data.amount === 0) {
          amount = data.goods.change_stock !== 0 ? 1 : 0;
          amount = 1;
        } else {
          amount = data.amount;
        }
      } else {
        amount = data.amount || 1;
      }

      this.setData({
        attr_show: true,
        buy_type: 2,
        amount: amount
      }, () => {
        this.setData({
          attr_active: true
        });
      });
    }
  },
  // 购买或加入购物车，取决于buy_type的值
  buy_btn() {
    if (this.data.buy_type === 1) {
      if (this.data.amount === 0) {
        app.toast('请至少选择一件商品');
      } else {
        let data = this.data;
        let attr_id;
        if (data.goods.use_attr === 1) {
          attr_id = data.goods.attr_list[data.attr_index].id;
        } else {
          attr_id = 1;
        }
        this.estimate_attr(() => {
          wx.redirectTo({
            url: '/pages/order-create/order-create?id=' + data.id + '&num=' + data.amount + '&attr_id=' + attr_id
          })
        });
      }
    } else {
      if (this.data.amount === 0) {
        app.toast('请至少选择一件商品');
      } else {
        if (!this.data.add_loading) {
          this.data.add_loading = true;

          let data = this.data;
          let post = {
            goods_id: data.id,
            num: data.amount
          };

          if (data.goods.use_attr === 1) {
            post.attr_id = data.goods.attr_list[data.attr_index].id;
          }

          console.log(post);
          this.estimate_attr(() => {
            app.ajax('shop/cartAdd', post, () => {
              let set_data = {
                attr_show: false,
                attr_active: false,
                attr_index: 0,
                amount: 0,
                ['goods.stock']: data.goods.stock - data.amount
              };

              if (data.goods.use_attr === 1) {
                set_data['goods.attr_list[' + data.attr_index + '].stock'] = data.goods.attr_list[data.attr_index].stock - data.amount;
                set_data['attrinfo.stock'] = data.attrinfo.stock - data.amount;
              }

              this.setData(set_data);
              app.toast('已加入购物车~', 2000, 'success');

              let shop_page = app.get_page('pages/shop/shop');
              if (shop_page) {
                shop_page.cartList();
              }
            }, (err) => {
              app.toast(err.message);
            }, () => {
              this.data.add_loading = false;
            });
          });
        }
      }
    }
  },
  // 去我的购物车
  to_shop_car() {
    wx.switchTab({
      url: '/pages/my-cart/my-cart'
    });
  },
  // 隐藏参数框
  hide() {
    this.setData({
      attr_show: false,
      attr_active: false
    });
  },
  // 增加
  add() {
    let data = this.data;
    if (data.goods.use_attr === 1) {
      this.estimate_attr(() => {
        if (data.amount === data.goods.limit || data.amount === data.attrinfo.stock) {
          if (data.amount === data.goods.limit) {
            app.toast('该商品最多限购' + data.goods.limit + '件哦');
          } else {
            app.toast('已经没有这么多商品了');
          }
        } else {
          this.setData({
            amount: data.amount + 1
          });
        }
      });

    } else {
      if (data.amount === data.goods.limit || data.amount === data.goods.stock) {
        if (data.amount === data.goods.limit) {
          app.toast('该商品最多限购' + data.goods.limit + '件哦');
        } else {
          app.toast('已经没有这么多商品了');
        }
      } else {
        this.setData({
          amount: data.amount + 1
        });
      }
    }
  },
  // 减少
  sub() {
    let data = this.data;
    if (this.data.amount !== 1) {
      this.setData({
        amount: data.amount - 1
      });
    }
  },
  // 规格分组判断
  estimate_attr(complete) {
    console.log(this.data.attr_index)
    if (this.data.goods.attr_detail) {
      switch (this.data.goods.attr_group_num) {
        case 1:
          if (this.data.value_index0.toString()) {
            complete();
          } else {
            app.toast('请先选择规格后操作');
            this.data.add_loading = false;
          }
          break;
        case 2:
          if (this.data.value_index0.toString() && this.data.value_index1.toString()) {
            complete();
          } else {
            app.toast('请先选择规格后操作');
            this.data.add_loading = false;
          }
          break;
        case 3:
          if (this.data.value_index0.toString() && this.data.value_index1.toString() && this.data.value_index2.toString()) {
            complete();
          } else {
            app.toast('请先选择规格后操作');
            this.data.add_loading = false;
          }
          break;
      }
    } else {
      complete();
    }
  },

  // 选择参数
  attr_choose(e) {
    let current_index = e.currentTarget.dataset;
    let data = this.data;
    let attrinfo = "";
    if (current_index.disabled) {
      return false;
    }
    let value_index = current_index.level1_index;


    switch (current_index.level0_index) {
      case 0:
        if (value_index === this.data.value_index0) {
          value_index = "";
        }
        this.setData({
          value_index0: value_index
        })
        break;
      case 1:
        if (value_index === this.data.value_index1) {
          value_index = "";
        }
        this.setData({
          value_index1: value_index
        })
        break;
      case 2:
        if (value_index === this.data.value_index2) {
          value_index = "";
        }
        this.setData({
          value_index2: value_index
        })
        break;
    }

    this.attr_search_stock();

    switch (data.goods.attr_group_num) {
      case 1:
        if (data.value_index0 !== '') {
          attrinfo = this.attr_search(data.value_index0);
        }
        break;
      case 2:
        if (data.value_index0 !== '' && data.value_index1 !== '') {
          attrinfo = this.attr_search(data.value_index0 + '_' + data.value_index1);
        }
        break;
      case 3:
        if (data.value_index0 !== '' && data.value_index1 !== '' && data.value_index2 !== '') {
          attrinfo = this.attr_search(data.value_index0 + '_' + data.value_index1 + '_' + data.value_index2);
        }
        break;
      default:
        app.toast('数据异常')
    }

    if (attrinfo !== "") {
      console.log(attrinfo);
      this.setData({
        attrinfo: attrinfo
      });
    }
  },

  // 查找当前选中的规格详情
  attr_search(value_index) {
    let attr_list = this.data.goods.attr_list;
    for (let i = 0; i < attr_list.length; i++) {
      if (attr_list[i].value_index === value_index.toString()) {
        this.setData({
          attr_index: i
        })
        return attr_list[i];
      }
    }
  },

  // 查找数组的交集
  intersection: function (array1, array2) {
    var result = array2.filter(function (v) {
      return array1.indexOf(v) !== -1 // 利用filter方法来遍历是否有相同的元素
    });
    return result;
  },

  //查找可用 有库存的 索引
  attr_search_stock: function () {
    let attr_list = this.data.goods.attr_list;
    let attr_detail = [];
    let value_index0 = this.data.value_index0; //当前
    let value_index1 = this.data.value_index1;
    let value_index2 = this.data.value_index2;


    let stock_index_array = this.attr_search_stock_from_single_index(attr_list, value_index0, value_index1, value_index2);

    console.log(value_index0, value_index1, value_index2, '---------slected value_indexs');
    console.log(stock_index_array, '----------------stock_index_array');

    let stock_index0 = []; //当前可用索引0
    let stock_index1 = []; //当前可用索引0
    let stock_index2 = []; //当前可用索引0

    stock_index0 = stock_index_array[0];
    stock_index1 = stock_index_array[1];
    stock_index2 = stock_index_array[2];



    for (let i = 0; i < this.data.goods.attr_detail.length; i++) {
      let tmp_obj0 = {};
      let list = this.data.goods.attr_detail[i].list;

      tmp_obj0.title = this.data.goods.attr_detail[i].title;
      tmp_obj0.list = [];
      for (let j = 0; j < list.length; j++) {
        let tmp_obj1 = {};
        tmp_obj1.title = list[j];
        if (i === 0) {
          if (!this.in_array(j, stock_index0)) {
            tmp_obj1.disabled = true;
          } else {
            tmp_obj1.disabled = false;
          }
        }
        if (i === 1) {
          if (!this.in_array(j, stock_index1)) {
            tmp_obj1.disabled = true;
          } else {
            tmp_obj1.disabled = false;
          }
        }
        if (i === 2) {
          if (!this.in_array(j, stock_index2)) {
            tmp_obj1.disabled = true;
          } else {
            tmp_obj1.disabled = false;
          }
        }
        tmp_obj0.list.push(tmp_obj1);
      }
      attr_detail.push(tmp_obj0);
    }

    // console.log(attr_detail,'current attr_detail')

    this.setData({
      attr_detail: attr_detail
    })
  },

  //获取初始值
  attr_stock_init: function () {
    let attr_list = this.data.goods.attr_list;
    console.log(attr_list, '-----------------attr_list');
    let stock_index_array_init = [];
    let stock_index0 = [];
    let stock_index1 = [];
    let stock_index2 = [];
    for (let i = 0; i < attr_list.length; i++) {
      if (attr_list[i].stock > 0) {
        stock_index0.push(attr_list[i].value_index0);
        stock_index1.push(attr_list[i].value_index1);
        stock_index2.push(attr_list[i].value_index2);
      }
    }
    stock_index_array_init = [this.unique(stock_index0), this.unique(stock_index1), this.unique(stock_index2)];
    console.log(stock_index_array_init, '---------------------stock_index_array_init');
    this.setData({
      stock_index_init: stock_index_array_init
    })
    // return stock_index_array_init;
  },

  attr_search_stock_from_single_index: function (attr_list, value_index0, value_index1, value_index2) {

    let stock_index_array_init = this.data.stock_index_init;
    let stock_index_array = [];
    for (let i = 0; i < 3; i++) {
      let tmp_array = [];
      let stock_index0 = [];
      let stock_index1 = [];
      let stock_index2 = [];
      for (let j = 0; j < attr_list.length; j++) {
        let equal0 = value_index0 !== '' ? value_index0 === attr_list[j].value_index0 : true;
        let equal1 = value_index1 !== '' ? value_index1 === attr_list[j].value_index1 : true;
        let equal2 = value_index2 !== '' ? value_index2 === attr_list[j].value_index2 : true;

        if (attr_list[j].stock > 0 && i === 0 && equal0) {
          stock_index0.push(attr_list[j].value_index0);
          stock_index1.push(attr_list[j].value_index1);
          stock_index2.push(attr_list[j].value_index2);
        }
        if (attr_list[j].stock > 0 && i === 1 && equal1) {
          stock_index0.push(attr_list[j].value_index0);
          stock_index1.push(attr_list[j].value_index1);
          stock_index2.push(attr_list[j].value_index2);
        }
        if (attr_list[j].stock > 0 && i === 2 && equal2) {
          stock_index0.push(attr_list[j].value_index0);
          stock_index1.push(attr_list[j].value_index1);
          stock_index2.push(attr_list[j].value_index2);
        }
      }
      // console.log(stock_index0,'-----------stock_index0_' + i)
      tmp_array = [this.unique(stock_index0), this.unique(stock_index1), this.unique(stock_index2)];
      stock_index_array.push(tmp_array);
    }
    // return stock_index_array;

    let arr0 = this.intersection(this.intersection(stock_index_array_init[0], stock_index_array[1][0]), stock_index_array[2][0]);
    let arr1 = this.intersection(this.intersection(stock_index_array[0][1], stock_index_array_init[1]), stock_index_array[2][1]);
    let arr2 = this.intersection(this.intersection(stock_index_array[0][2], stock_index_array[1][2]), stock_index_array_init[2]);

    return [arr0, arr1, arr2];
    // return stock_index_array;

  },

  unique: function (arr) {
    return Array.from(new Set(arr));
  },

  in_array: function (ele, arr) {
    let flag = false;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] == ele) {
        flag = true;
        break;
      }
    }
    return flag;
  },

  // 去他人主页
  to_person() {
    app.page_open(() => {
      wx.navigateTo({
        url: '/pages/person-page/person-page?uid=' + this.data.goods.uid
      });
    });
  },
  // 生成海报
  create_poster: function () {
    if (this.data.poster) {
      this.setData({
        poster_show: true
      });
    } else {
      wx.showLoading({
        title: '海报生成中...',
        mask: true
      });

      // 获得商品图片
      let promise1 = new Promise((resolve, reject) => {
        wx.getImageInfo({
          src: this.data.goods.pics[0],
          success: res => {
            resolve(res);
          },
          fail: () => {
            console.log(111)
            app.toast('生成失败，请重试');
          }
        })
      });

      // 生成二维码图片
      let promise2 = new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: 150,
          height: 150,
          destWidth: 150,
          destHeight: 150,
          canvasId: 'qrcode',
          success: res => {
            resolve(res.tempFilePath);
          },
          fail: () => {
            // 生成失败
            app.toast('生成失败，请重试');
          }
        });
      });

      Promise.all([
        promise1, promise2
      ]).then(p_res => {
        let goods_pic = p_res[0].path;
        let qrcode = p_res[1];

        // 创建canvas
        var canvas = wx.createCanvasContext('poster-canvas');

        // 绘制白色背景
        canvas.setFillStyle('#ffffff');
        canvas.rect(0, 0, 457, 697 + 40 * this.data.line_count);
        canvas.fill();
        canvas.draw();

        // 绘制商品图片
        canvas.drawImage(goods_pic, 17, 17, 423, 423);
        canvas.draw(true);

        // 绘制商品名
        canvas.setFontSize(24);
        canvas.setFillStyle("#333333");

        let str = this.data.goods.name;
        let str_index = 0;
        let step = 18;
        let rest = str.substr(str_index, step);
        let str_count = 0;

        while (rest) {
          canvas.fillText(rest, 17, 481 + str_count * 40, 423);
          str_index += step;
          rest = str.substr(str_index, step);
          str_count++;
        }
        canvas.draw(true);

        // 绘制人民币符号
        canvas.setFontSize(30);
        canvas.setFillStyle("#ff4141");
        canvas.fillText('¥', 17, 560 + 40 * this.data.line_count, 20);
        canvas.draw(true);

        // 绘制价格
        canvas.setFontSize(40);
        canvas.setFillStyle("#ff4141");
        canvas.fillText(this.data.goods.price, 40, 560 + 40 * this.data.line_count, 200);
        canvas.draw(true);

        // 绘制二维码
        canvas.drawImage(qrcode, 280, 480 + 40 * this.data.line_count, 150, 150);
        canvas.draw(true);

        // 二维码描述
        canvas.setFontSize(20);
        canvas.setFillStyle("#999999");
        canvas.setTextAlign('center');
        canvas.fillText('扫描或长按二维码', 355, 665 + 40 * this.data.line_count, 150);
        canvas.draw(true);

        setTimeout(() => {
          wx.canvasToTempFilePath({
            x: 0,
            y: 0,
            width: 457,
            height: 697 + 40 * this.data.line_count,
            destWidth: 457,
            destHeight: 697 + 40 * this.data.line_count,
            canvasId: 'poster-canvas',
            success: res => {
              this.setData({
                poster: res.tempFilePath,
                poster_show: true
              });
              wx.hideLoading()
            },
            fail: err => {
              console.log(err, 'cuowu');
              // 生成失败
            }
          })
        }, 500);
      });
    }
  },
  // 关闭海报
  hide_poser() {
    this.setData({
      poster_show: false
    });
  },
  // 保存海报
  save_poster() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.writePhotosAlbum']) {
          wx.saveImageToPhotosAlbum({
            filePath: this.data.poster,
            success: () => {
              app.modal('图片成功保存到相册了，快去分享朋友圈吧', () => {
                this.setData({
                  poster_show: false
                });
              });
            },
            fail: err => {
              if (err.errMsg.indexOf('cancel') !== -1) {
                app.toast('保存已取消');
              } else {
                app.toast('保存失败');
              }
            }
          })
        } else {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.save_poster();
            },
            fail: () => {
              this.setData({
                show_set_btn: true
              });
            }
          });
        }
      }
    });
  },
  // 关闭授权菜单按钮
  hide_set_btn() {
    this.setData({
      show_set_btn: false
    })
  },
  // 分享
  onShareAppMessage() {
    wx.showShareMenu();
    return {
      path: app.share_path()
    };
  },
  // 商品评论列表
  goodsCommentList(complete) {
    let post = {
      goods_id: this.data.id,
      page: this.data.page,
      perpage: 20
    };

    app.ajax('shop/goodsCommentList', post, res => {
      if (res.length === 0) {
        if (this.data.page === 1) {
          this.setData({
            comment_list: [],
            nodata: true,
            nomore: false
          });
        } else {
          this.setData({
            nodata: false,
            nomore: true
          });
        }
      } else {
        app.aliyun_format(res, 'avatar');
        app.time_format(res, 'create_time');
        this.setData({
          comment_list: this.data.comment_list.concat(res)
        });
      }
      this.data.page++;
    }, null, () => {
      if (complete) {
        complete()
      }
    });
  },
  // 下拉刷新
  onPullDownRefresh() {
    if (!this.data.loading) {
      this.data.loading = true;

      this.data.page = 1;
      this.data.comment_list = [];
      this.setData({
        nomore: false,
        nodata: false
      });

      wx.showNavigationBarLoading();
      this.goodsCommentList(() => {
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
        this.goodsCommentList(() => {
          wx.hideNavigationBarLoading();
          this.data.loading = false;
        });
      }
    }
  },
  // 授权获取手机号
  getPhoneNumber(e) {
    console.log(e)
    if (e.detail.iv) {
      let post = {
        iv: e.detail.iv,
        encryptedData: e.detail.encryptedData
      };
      app.ajax('login/getPhoneNumber', post, res => {
        if (res) {
          app.set_common(() => {
            this.setData({
              user_tel: res.purePhoneNumber
            });
          });
        } else {
          app.toast('授权失败，请重新授权');
        }
      });
    }
  }
});