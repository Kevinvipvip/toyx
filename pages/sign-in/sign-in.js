const utils = require('../../utils/util');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    day_array: [{
      day: '第1天',
      is_sign_in: false
    }, {
      day: '第2天',
      is_sign_in: false
    }, {
      day: '第3天',
      is_sign_in: false
    }, {
      day: '第4天',
      is_sign_in: false
    }, {
      day: '第5天',
      is_sign_in: false
    }, {
      day: '第6天',
      is_sign_in: false
    }, {
      day: '第7天',
      is_sign_in: false
    }],
    is_sign: false,
    sign_in_list: [],
    score: 0
  },
  onLoad: function (options) {
    this.checkSign();
    this.getSignLog();
    this.setData({
      score: app.user_data.score
    })
    // utils.getAdImage(5, (ad) => {
    //   this.setData({
    //     sign_in_role: ad.pic
    //   })
    // });
  },


  // clear_sign_in() {
  //   let post = {
  //     token: app.user_data.token
  //   };

  //   app.ajax(app.config.api + 'my/clearSignLog', post, (res) => {
  //     app.toast('数据已清理')
  //   });
  // },

  getSignLog() {
    let post = {
      token: app.user_data.token
    };

    app.ajax('my/signLog', post, (res) => {
      // let calendar = [],
      //   calendar_item = {};
      // for (let i = 0; i < res.length; i++) {
      //   res[i].year = parseInt(res[i].sign_date.substr(0, 4));
      //   res[i].month = parseInt(res[i].sign_date.substr(5, 2));
      //   res[i].day = parseInt(res[i].sign_date.substr(8, 2));
      //   setTimeout(() => {
      //     let now_year = res[i].year
      //     if (res[i].year === now_year) {
      //       calendar_item.year = res[i].year
      //       calendar_item.date = res
      //     } else {
      //       calendar_item.year = now_year
      //       calendar_item.date = res
      //     }
      //   }, 50);
      // }
      // calendar.push(calendar_item);
      // console.log(calendar)
      this.setData({
        sign_in_list: res
      })
    });
  },

  /**
   * 点击立即签到按钮触发时间
   */
  sign_in_now() {
    let post = {
      token: app.user_data.token
    };
    app.ajax('my/checkin', post, (res) => {
      if (res.days === 7) {
        app.modal(res.desc, () => {
          for (let i = 0; i < res.days; i++) {
            this.data.day_array[i].is_sign_in = true;
          }
          this.setData({
            day_array: this.data.day_array,
            is_sign: true
          });
        });
      } else {
        app.modal('签到成功', () => {
          for (let i = 0; i < res.days; i++) {
            this.data.day_array[i].is_sign_in = true;
          }
          this.getSignLog();
          this.setData({
            day_array: this.data.day_array,
            is_sign: true
          });
        });
      }
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();
    this.data.day_array = [{
      day: '第1天',
      is_sign_in: false
    }, {
      day: '第2天',
      is_sign_in: false
    }, {
      day: '第3天',
      is_sign_in: false
    }, {
      day: '第4天',
      is_sign_in: false
    }, {
      day: '第5天',
      is_sign_in: false
    }, {
      day: '第6天',
      is_sign_in: false
    }, {
      day: '第7天',
      is_sign_in: false
    }];
    this.data.is_sign = false;
    this.getSignLog();
    this.checkSign(() => {
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },
  // 查看签到状态
  checkSign(callback) {
    let post = {
      token: app.user_data.token
    };

    app.ajax('my/checkSign', post, (res) => {
      // console.log(res)
      for (let i = 0; i < res.days; i++) {
        this.data.day_array[i].is_sign_in = true;
      }
      this.setData({
        day_array: this.data.day_array,
        is_sign: res.today
      });
      if (callback) {
        callback();
      }
    });
  }

});