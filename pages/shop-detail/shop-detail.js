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
    attr_id: 0, // 选中的规格id
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

    value_index: [],
    // value_index0: 0,
    // value_index1: 0,
    // value_index2: 0,
    value_index0_checked: false,
    value_index1_checked: false,
    value_index2_checked: false

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

      // console.log(res.attr_detail);
      if (res.attr_detail) {
        for (let i = 0; i < res.attr_detail.length; i++) {

          let attr_arr = [];
          for (let j = 0; j < res.attr_detail[i].list.length; j++) {
            let attr = {
              title: res.attr_detail[i].list[j],
              checked: false
            }
            attr_arr.push(attr);
          }
          res.attr_detail[i].list = attr_arr;
        }
        res.change_price = res.price;
        res.change_stock = 0;
      }

      this.setData({
        goods: res,
        line_count: Math.ceil(res.name.length / 18)
      });

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
      // if (data.goods.use_attr === 1) {
      //   if (data.amount === 0) {
      //     amount = data.goods.attr_list[data.attr_index].stock !== 0 ? 1 : 0;
      //   } else {
      //     amount = data.amount;
      //   }
      // } else {
      amount = data.amount || 1;
      // }

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
      // if (data.goods.use_attr === 1) {
      //   if (this.data.value_index0_checked && this.data.value_index1_checked && this.data.value_index2_checked) {
      //     if (this.data.amount === 0) {
      //       // amount = data.goods.change_stock !== 0 ? 1 : 0;
      //       amount = 1;
      //     } else {
      //       amount = data.amount;
      //     }
      //   }
      // } else {
      amount = data.amount || 1;
      // }

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
          attr_id = data.attr_id;
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
            post.attr_id = data.attr_id;
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
                set_data['goods.change_stock'] = data.goods.change_stock - data.amount;
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
        if (data.amount === data.goods.limit || data.amount === data.goods.change_stock) {
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
    // console.log(this.data.goods.attr_detail.length);
    if (this.data.goods.attr_detail) {
      switch (this.data.goods.attr_detail.length) {
        case 1:
          if (this.data.value_index0_checked) {
            complete();
          } else {
            app.toast('请先选择规格后操作');
            this.data.add_loading = false;
          }
          break;
        case 2:
          if (this.data.value_index0_checked && this.data.value_index1_checked) {
            complete();
          } else {
            app.toast('请先选择规格后操作');
            this.data.add_loading = false;
          }
          break;
        case 3:
          if (this.data.value_index0_checked && this.data.value_index1_checked && this.data.value_index2_checked) {
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
    let index1 = e.currentTarget.dataset.index_one;
    let index2 = e.currentTarget.dataset.index_two;
    let data = this.data.goods;


    for (let i = 0; i < data.attr_detail[index1].list.length; i++) {
      if (i === index2) {
        data.attr_detail[index1].list[i].checked = !data.attr_detail[index1].list[i].checked;
      } else {
        data.attr_detail[index1].list[i].checked = false;
      }
      switch (index1) {
        case 0:
          this.data.value_index[index1] = index2;
          // this.data.value_index0 = index2;
          this.data.value_index0_checked = data.attr_detail[0].list[index2].checked;
          this.search_attr_list(data, index1, i);
          break;
        case 1:
          this.data.value_index[index1] = index2;
          // this.data.value_index1 = index2;
          this.data.value_index1_checked = data.attr_detail[1].list[index2].checked;
          this.search_attr_list(data, index1, i);
          break;
        case 2:
          this.data.value_index[index1] = index2;
          // this.data.value_index2 = index2;
          this.data.value_index2_checked = data.attr_detail[2].list[index2].checked;
          this.search_attr_list(data, index1, i);
          break;
      }
    }



    // if (data.goods.attr_list[index].stock === 0) {
    //   app.toast('该商品已告罄！');
    // } else if (data.goods.attr_list[index].stock < data.amount) {
    //   app.toast('“' + data.goods.attr_list[index].value + '”只有' + data.goods.attr_list[index].stock + '件了');
    //   this.setData({
    //     amount: data.goods.attr_list[index].stock,
    //     attr_index: index
    //   });
    // } else {
    //   this.setData({
    //     attr_index: index
    //   });
    // }
  },


  // 选择规格组后查找id
  search_attr_list(obj, detail_index1, detail_index2) {
    // console.log(detail_index1, detail_index2)
    let index = '';
    let that = this;

    switch (obj.attr_detail.length) {
      case 1:
        // console.log('1组规格');
        // index = this.data.value_index0;
        index = that.data.value_index[0] + '';
        if (that.data.value_index0_checked) {

          for (let i = 0; i < obj.attr_list.length; i++) {
            if (obj.attr_list[i].value_index === index) {
              if (obj.attr_list[i].stock === 0) {
                app.toast('该商品已告罄！');
                obj.attr_detail[detail_index1].list[detail_index2].checked = false;
                that.data.value_index[detail_index1] = undefined;
                // console.log(that.data.value_index[detail_index1], '111')
              } else {
                // console.log(obj.attr_list[i].id);
                that.data.attr_id = obj.attr_list[i].id;
                obj.change_price = obj.attr_list[i].price;
                obj.change_stock = obj.attr_list[i].stock;
              }
            }
          }
        } else {
          obj.change_price = obj.price;
          obj.change_stock = 0;
        }
        break;
      case 2:
        // console.log('2组规格');
        // index = this.data.value_index0 + '_' + this.data.value_index1;
        index = that.data.value_index[0] + '_' + that.data.value_index[1];
        if (that.data.value_index0_checked && that.data.value_index1_checked) {

          for (let i = 0; i < obj.attr_list.length; i++) {
            if (obj.attr_list[i].value_index === index) {
              if (obj.attr_list[i].stock === 0) {
                app.toast('该商品已告罄！');
                obj.attr_detail[detail_index1].list[detail_index2].checked = false;
                that.data.value_index[detail_index1] = undefined;
                // console.log(that.data.value_index[detail_index1], '111')
              } else {
                // console.log(obj.attr_list[i].id);
                that.data.attr_id = obj.attr_list[i].id;
                obj.change_price = obj.attr_list[i].price;
                obj.change_stock = obj.attr_list[i].stock;
              }
            }
          }
        } else {
          obj.change_price = obj.price;
          obj.change_stock = 0;
        }
        break;
      case 3:
        // console.log('3组规格');
        // index = this.data.value_index0 + '_' + this.data.value_index1 + '_' + this.data.value_index2;
        index = that.data.value_index[0] + '_' + that.data.value_index[1] + '_' + that.data.value_index[2];
        if (that.data.value_index0_checked && that.data.value_index1_checked && that.data.value_index2_checked) {

          for (let i = 0; i < obj.attr_list.length; i++) {
            if (obj.attr_list[i].value_index === index) {
              if (obj.attr_list[i].stock === 0) {
                app.toast('该商品已告罄！');
                obj.attr_detail[detail_index1].list[detail_index2].checked = false;
                that.data.value_index[detail_index1] = undefined;
                // console.log(that.data.value_index[detail_index1], '111')
              } else {
                // console.log(obj.attr_list[i].id);
                that.data.attr_id = obj.attr_list[i].id;
                obj.change_price = obj.attr_list[i].price;
                obj.change_stock = obj.attr_list[i].stock;
              }
            }
          }
        } else {
          obj.change_price = obj.price;
          obj.change_stock = 0;
        }
        break;
    }
    // console.log(index);
    // console.log(obj);
    this.setData({
      goods: obj,
      amount: obj.change_stock === 0 ? obj.change_stock : 1,
      value_index: this.data.value_index
    });
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