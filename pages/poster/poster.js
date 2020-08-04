const app = getApp();

Page({
  data: {
    full_loading: true,

    rule: '',
    invite_list: [],
    total: '0.00', // 总计

    person: {}, // 被查看邀请列表的人
    sub_invite_list: [], // TA的邀请记录
    sub_total: '0.00', // 被查看人总计

    poster: '',
    poster_show: false,

    il_height: 0, // iinvite-list的高度
    modal_show: false, // 被邀请人详情
    show_set_btn: false,

    loading: false
  },
  onLoad() {
    this.getInviteList(0, res => {
      app.format_time(res.list, 'create_time');
      app.format_img(res.list, 'avatar');

      let total = 0;
      for (let i = 0; i < res.list.length; i++) {
        total += Number(res.list[i].score);
      }

      this.setData({
        rule: res.rule,
        invite_list: res.list,
        total: total.toFixed(2),
        full_loading: false
      });
    });

    this.create_poster();
  },
  // 获取邀请记录
  getInviteList(uid, succ, complete) {
    let post = {};
    if (uid !== 0) {
      post.uid = uid;
    }
    app.ajax('my/getInviteList', post, res => {
      succ(res);
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  },
  // 给 iinvite-list 设置高度
  set_iL_wh() {
    const query = wx.createSelectorQuery();
    query.select('.il-wrapper').boundingClientRect(res => {
      this.setData({
        il_height: res.height
      });
    }).exec();
  },
  // 显示被邀请框
  show_modal(e) {
    wx.showLoading({
      title: '查询中...',
      mask: true
    });

    let index = e.currentTarget.dataset.index;

    this.setData({
      person: this.data.invite_list[index]
    }, () => {
      this.getInviteList(this.data.person.uid, res => {
        app.format_time(res.list, 'create_time');
        app.format_img(res.list, 'avatar');

        let sub_total = 0;
        for (let i = 0; i < res.list.length; i++) {
          sub_total += Number(res.list[i].score);
        }

        this.setData({
          modal_show: true,
          sub_invite_list: res.list,
          sub_total: sub_total.toFixed(2),
        }, () => {
          wx.hideLoading();
          this.set_iL_wh();
        })
      })
    });
  },
  // 关闭被邀请框
  hide_modal() {
    this.setData({
      modal_show: false
    });
  },
  // 生成海报
  create_poster() {
    let promise1 = new Promise((resolve) => {
      wx.getImageInfo({
        src: app.config.base_url + '/static/src/image/qrcode-bg.jpg',
        success: res => {
          resolve(res.path);
        }
      })
    });

    let promise2 = new Promise((resolve) => {
      app.ajax('my/getShareQrcode', null, res => {
        res = app.format_img(res);
        wx.getImageInfo({
          src: res,
          success: res => {
            resolve(res.path);
          }
        })
      });
    });

    Promise.all([
      promise1, promise2
    ]).then(p_res => {
      let qrcode_bg = p_res[0];
      let qrcode = p_res[1];

      // 创建canvas
      var canvas = wx.createCanvasContext('poster-canvas');

      // 绘制白色背景
      canvas.setFillStyle('#ffffff');
      canvas.rect(0, 0, 500, 800);
      canvas.fill();
      canvas.draw();

      // 绘制背景
      canvas.drawImage(qrcode_bg, 0, 0, 500, 800);
      canvas.draw(true);

      // 绘制小程序码
      canvas.drawImage(qrcode, 277, 563, 200, 200);
      canvas.draw(true);

      setTimeout(() => {
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: 500,
          height: 800,
          destWidth: 500,
          destHeight: 800,
          canvasId: 'poster-canvas',
          success: res => {
            this.setData({
              poster: res.tempFilePath
            });
          },
          fail: err => {
            console.log(err, '生成失败');
            // app.toast(JSON.stringify(err));
            // 生成失败
          }
        })
      }, 500);
    });
  },
  // 打开海报
  show_poster() {
    this.setData({
      poster_show: true
    });
  },
  // 关闭海报
  hide_poster() {
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
    });
  },
  // 下拉刷新
  onPullDownRefresh() {
    if (!this.data.loading) {
      this.data.loading = true;

      wx.showNavigationBarLoading();
      this.getInviteList(0, res => {
        app.format_time(res.list, 'create_time');
        app.format_img(res.list, 'avatar');

        let total = 0;
        for (let i = 0; i < res.list.length; i++) {
          total += Number(res.list[i].score);
        }

        this.setData({
          rule: res.rule,
          invite_list: res.list,
          total: total.toFixed(2)
        }, () => {
          this.data.loading = false;
          wx.hideNavigationBarLoading();
          wx.stopPullDownRefresh();
        });
      });
    }
  }
});