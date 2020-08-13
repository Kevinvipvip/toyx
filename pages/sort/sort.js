const app = getApp();

Page({
  data: {
    full_loading: true,

    active_index: 999999,
    cate_list: [], // 商品分类
    goods_list: [], // 商品列表

    nodata: false
  },
  onShow() {
    this.cateList(() => {
      wx.nextTick(() => {
        if (app.cate.change) {
          this.goodsList({
            cate_id: app.cate.cate_id,
            perpage: 1000
          }, () => {
            this.setData({
              full_loading: false
            });
          });
          for (let i = 0; i < this.data.cate_list.length; i++) {
            if (this.data.cate_list[i].id === app.cate.cate_id) {
              this.setData({
                active_index: i
              });
              app.cate.change = false;
            }
          }
        } else {
          if (this.data.active_index === 999999) {
            this.goodsList({
              type: 1,
              perpage: 1000
            }, () => {
              this.setData({
                full_loading: false
              });
            })
          } else {
            this.goodsList({
              cate_id: this.data.cate_list[this.data.active_index].id,
              perpage: 1000
            }, () => {
              this.setData({
                full_loading: false
              });
            })
          }
        }
      });
    });
  },
  tab_change(e) {
    this.setData({
      active_index: e.currentTarget.dataset.index
    }, () => {
      if (this.data.active_index == 999999) {
        this.goodsList({
          type: 1,
          perpage: 1000
        })
      } else {
        this.goodsList({
          cate_id: this.data.cate_list[this.data.active_index].id,
          perpage: 1000
        })
      }
    });
  },
  // 商品分类列表
  cateList(complete) {
    app.ajax('api/cateList', null, res => {
      app.aliyun_format(res, 'icon');
      this.setData({
        cate_list: res
      });
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  },
  // 商品列表
  goodsList(post, complete) {
    app.ajax('api/goodsList', post, res => {
      for (let i = 0; i < res.length; i++) {
        app.aliyun_format(res[i].pics);
      }
      if (res.length === 0) {
        this.setData({
          goods_list: [],
          nodata: true
        });
      } else {
        this.setData({
          goods_list: res,
          nodata: false
        });
      }
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  }
});