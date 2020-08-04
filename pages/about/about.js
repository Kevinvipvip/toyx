var WxParse = require('../../wxParse/wxParse.js');
const app = getApp();

Page({
  data: {
  },
  onLoad() {
    this.aboutUs();
  },
  aboutUs() {
    app.ajax('api/aboutUs', null, res => {
      let rich_text = app.rich_handle(res.intro);
      WxParse.wxParse('rich_text', 'html', rich_text, this);
    });
  }
});