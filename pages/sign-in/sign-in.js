const utils = require('../../utils/util');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    day_array: [{
      day: '1天',
      is_sign_in: false
    }, {
      day: '2天',
      is_sign_in: false
    }, {
      day: '3天',
      is_sign_in: false
    }, {
      day: '4天',
      is_sign_in: false
    }, {
      day: '5天',
      is_sign_in: false
    }, {
      day: '6天',
      is_sign_in: false
    }, {
      day: '7天',
      is_sign_in: false
    }],
    is_sign: false,
    sign_in_list: [],
    score: 0,

    total_days: 0, //连续签到的天数

    days_color: []

  },
  onLoad: function (options) {
    this.checkSign();
    this.getSignLog();
    this.setData({
      score: app.user_data.score
    });
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
      let calendar = [],
        now_month = new Date().getMonth() + 1;
      for (let i = 0; i < res.length; i++) {
        if (parseInt(res[i].sign_date.substr(5, 2)) === now_month) {
          if (res[i].sign) {
            calendar.push({
              month: 'current',
              day: res[i].sign_date.substr(8, 2),
              color: '#ffffff',
              background: '#fbab3b'
            });
          } else {
            calendar.push({
              month: 'current',
              day: res[i].sign_date.substr(8, 2),
              color: '#333333',
              background: 'transparent'
            });
          }
        }
      }
      // console.log(res)
      // console.log(calendar)
      this.setData({
        days_color: calendar
      })
    });
  },

  /**
   * 点击立即签到按钮触发事件
   */
  sign_in_now() {
    let post = {
      token: app.user_data.token
    };
    app.ajax('my/checkin', post, (res) => {
      console.log(res);
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
            total_days: res.days,
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
        total_days: res.days,
        day_array: this.data.day_array,
        is_sign: res.today
      });
      if (callback) {
        callback();
      }
    });
  }

});