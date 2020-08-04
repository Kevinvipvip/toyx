const app = getApp();

Page({
  data: {
    full_loading: true,

    cartList: [],
    carriage: 0,  // 运费
    total: 0,  // 总计
    check_all: true,
    amount_change_loading: false,

    delBtnWidth: 180,
    startX: ''
  },
  onLoad() {
    this.initEleWidth();
  },
  onShow() {
    this.cartList(() => {
      this.setData({ full_loading: false });
    });
  },
  // 我的购物车
  cartList(complete) {
    let post = {
      token: app.user_data.token
    };
    app.ajax('shop/cartList', post, (res) => {
      app.aliyun_format(res, 'cover');
      for (let i = 0; i < res.length; i++) {
        res[i].checked = true;  // 开始商品是全选的
        res[i].txtStyle = '';  // 左滑样式
      }
      this.setData({ cartList: res }, () => {
        this.price_compute();
      });
    }, null, () => {
      if (complete) {
        complete();
      }
    });
  },
  // 选择要结算的商品
  check(e) {
    let index = e.currentTarget.dataset.index;
    this.setData({ ['cartList[' + index + '].checked']: !this.data.cartList[index].checked });
    this.price_compute();
    this.check_check_all();
  },
  // 检查商品是否全选
  check_check_all() {
    let check_all = true;
    for (let i = 0; i < this.data.cartList.length; i++) {
      if (!this.data.cartList[i].checked) {
        check_all = false;
        break;
      }
    }
    this.setData({ check_all: check_all });
  },
  // 点击check_all按钮
  check_all_click() {
    this.data.check_all = !this.data.check_all;
    for (let i = 0; i < this.data.cartList.length; i++) {
      this.data.cartList[i].checked = this.data.check_all;
    }
    this.setData({
      check_all: this.data.check_all,
      cartList: this.data.cartList
    });
    this.price_compute();
  },
  // 计算价格（运费，总计）
  price_compute() {
    let cartList = this.data.cartList;

    let carriage = 0, total = 0, goods_num = 0;
    for (let i = 0; i < cartList.length; i++) {
      if (cartList[i].checked) {
        goods_num += cartList[i].num;
        carriage += Number(cartList[i].carriage) * cartList[i].num;
        total += Number(cartList[i].total_price) + Number(cartList[i].carriage) * cartList[i].num;
      }
    }
    if (goods_num > 1) {
      total -= carriage;
      carriage = 0;
    }

    this.setData({
      carriage: carriage.toFixed(2),
      total: total.toFixed(2)
    });
  },
  to_cart_order() {
    let cartList = this.data.cartList, ids = [];
    for (let i = 0; i < cartList.length; i++) {
      if (cartList[i].checked) {
        ids.push(cartList[i].id);
      }
    }
    if (ids.length === 0) {
      app.toast('请选择要结算的商品');
    } else {
      console.log(ids);
      wx.navigateTo({ url: '/pages/cart-order-create/cart-order-create?ids=' + encodeURIComponent(ids.toString()) });
    }
  },
  // 数量增加
  cartInc(e) {
    if (!this.data.amount_change_loading) {
      let id = e.currentTarget.dataset.id;
      let index = e.currentTarget.dataset.index;

      if (this.data.cartList[index].num < this.data.cartList[index].limit) {
        this.data.amount_change_loading = true;

        app.ajax('shop/cartInc', { cart_id: id }, (res) => {
          this.setData({
            ['cartList[' + index + '].num']: res.num,
            ['cartList[' + index + '].total_price']: res.total_price
          });
        }, null, () => {
          this.data.amount_change_loading = false;
          this.price_compute();
        });
      } else {
        app.toast('该商品最多限购' + this.data.cartList[index].limit + '件哦');
      }
    }
  },
  // 数量减少
  cartDec(e) {
    if (!this.data.amount_change_loading) {
      let id = e.currentTarget.dataset.id;
      let index = e.currentTarget.dataset.index;

      if (this.data.cartList[index].num > 1) {
        this.data.amount_change_loading = true;

        let post = {
          token: app.user_data.token,
          cart_id: id
        };

        app.ajax('shop/cartDec', post, (res) => {
          this.setData({
            ['cartList[' + index + '].num']: res.num,
            ['cartList[' + index + '].total_price']: res.total_price
          });
        }, null, () => {
          this.data.amount_change_loading = false;
          this.price_compute();
        });
      }
    }
  },
  /* 左滑删除 start */
  initEleWidth() {
    var delBtnWidth = this.getEleWidth(this.data.delBtnWidth);
    this.setData({
      delBtnWidth: delBtnWidth
    });
  },
  touchS: function (e) {
    if (e.touches.length === 1) {
      this.data.startX = e.touches[0].clientX;
    }
  },
  touchM: function (e) {
    if (e.touches.length === 1) {
      //手指移动时水平方向位置
      var moveX = e.touches[0].clientX;
      //手指起始点位置与移动期间的差值
      var disX = this.data.startX - moveX;
      var delBtnWidth = this.data.delBtnWidth;
      var txtStyle = "";
      if (disX === 0 || disX < 0) {//如果移动距离小于等于0，说明向右滑动，文本层位置不变
        txtStyle = "left:0px";
      } else if (disX > 0) {//移动距离大于0，文本层left值等于手指移动距离
        txtStyle = "left:-" + disX + "px";
        if (disX >= delBtnWidth) {
          //控制手指移动距离最大值为删除按钮的宽度
          txtStyle = "left:-" + delBtnWidth + "px";
        }
      }
      //获取手指触摸的是哪一项
      var index = e.currentTarget.dataset.index;
      var cartList = this.data.cartList;
      cartList[index].txtStyle = txtStyle;
      //更新列表的状态
      this.setData({
        cartList: cartList
      });
    }
  },
  touchE: function (e) {
    if (e.changedTouches.length === 1) {
      //手指移动结束后水平位置
      var endX = e.changedTouches[0].clientX;
      //触摸开始与结束，手指移动的距离
      var disX = this.data.startX - endX;
      var delBtnWidth = this.data.delBtnWidth;
      //如果距离小于删除按钮的1/2，不显示删除按钮
      var txtStyle = disX > delBtnWidth / 2 ? "left:-" + delBtnWidth + "px" : "left:0px";
      //获取手指触摸的是哪一项
      var index = e.currentTarget.dataset.index;
      var cartList = this.data.cartList;
      cartList[index].txtStyle = txtStyle;
      //更新列表的状态
      this.setData({
        cartList: cartList
      });
    }
  },
  cartDel(e) {
    let that = this;
    wx.showModal({
      title: '提示',
      content: '确认删除？',
      success(res) {
        if (res.confirm) {
          let index = e.currentTarget.dataset.index;
          let post = {
            cart_id: that.data.cartList[index].id
          };
          app.ajax('shop/cartDel', post, () => {
            that.cartList();
          });
        }
      }
    });
  },
  getEleWidth(w) {
    var real = 0;
    try {
      var res = wx.getSystemInfoSync().windowWidth;
      var scale = (750 / 2) / (w / 2);//以宽度750px设计稿做宽度的自适应
      real = Math.floor(res / scale);
      return real;
    } catch (e) {
      return false;
    }
  },
  /* 左滑删除 end */
  to_goods(e){
    let id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/shop-detail/shop-detail?id=' + id });
  }
});
