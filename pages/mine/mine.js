const app = getApp();
Page({

	data: {
		statusBarHeight: 0,
		topBarHeight: 0,
		user: {},
		goods_list: []
	},

	onLoad: function (options) {
		this.guessYouLikeList();
		this.setData({
			statusBarHeight: app.config.statusBarHeight,
			topBarHeight: app.config.topBarHeight,
		})
	},
	onShow: function () {
		this.mydetail();
	},
	// 获取个人信息
	mydetail(complete) {
		app.set_common(() => {
			this.setData({
				user: {
					id: app.user_data.uid,
					user_auth: app.user_data.user_auth,
					nickname: app.user_data.nickname || '',
					score: app.user_data.score || 0,
					sex: app.user_data.sex,
					avatar: app.user_data.avatar||app.config.default_img,
					tel: app.user_data.tel || '',
				}
			});
			if (complete) {
				complete();
			}
		});
	},
	auth(e) {
		if (e.detail.userInfo) {
			wx.showLoading({
				title: '授权中',
				mask: true
			});

			app.userAuth(res => {
				console.log(res);
				wx.hideLoading();

				if (res) {
					this.mydetail();
				} else {
					app.toast('授权失败，请重新授权');
				}
			});
		}
	},


	// 其他推荐
	guessYouLikeList() {
		app.ajax('my/guessYouLikeList', null, res => {
			for (let i = 0; i < res.length; i++) {
				app.aliyun_format(res[i].pics);
			}
			this.setData({
				goods_list: res
			});
		});
	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: function () {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () {

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
					this.mydetail();
				} else {
					app.toast('授权失败，请重新授权');
				}
			});
		}
	}
})