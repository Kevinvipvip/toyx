const app = getApp();
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		bg_img_src: app.config.aliyun_base + 'static/mp-customer-bg.png',
		name: '',
		tel: '',
		c_name: '',
		c_address: '',
		submit_text: '提交',
		is_revise: 1,

		pics: [],
		flex_pad: []
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		app.set_common(() => {
			this.setData({
				tel: app.user_data.tel || '',
			});
		});
		// app.ajax('api/test', null, res => {},null,null);
		this.cooperationinfo()
	},
	// 上传图片
	up_pics() {
		app.choose_img(9 - this.data.pics.length, res => {
			if (res) {
				let up_succ = 0;

				wx.showLoading({
					title: '上传中',
					mask: true
				});

				for (let i = 0; i < res.length; i++) {
					app.aliyun_init(() => {
						app.aliyun_upload(res[i].path, path => {
							this.data.pics.push({
								pic: app.config.aliyun_base + '/' + path
							});
							this.setData({
								pics: this.data.pics,
								flex_pad: app.null_arr(this.data.pics.length + 1, 3)
							});
							up_succ++;

							if (up_succ === res.length) {
								wx.hideLoading();
							}
						}, null, () => {
							wx.hideLoading();
						});
					});
				}
			}
		}, 1024 * 1024);
	},

	img_load(e) {
		this.setData({
			['pics[' + e.currentTarget.dataset.index + '].width']: e.detail.width,
			['pics[' + e.currentTarget.dataset.index + '].height']: e.detail.height
		});
	},

	// 删除图片
	img_delete(e) {
		console.log(e);
		let that = this;
		let index = e.currentTarget.dataset.index;
		let pics = this.data.pics;
		pics.splice(index, 1);
		that.setData({
			pics: pics,
			flex_pad: app.null_arr(pics.length + 1, 3)
		});
	},

	// 获取展位合作信息
	cooperationinfo(complete) {
		app.ajax('api/cooperationinfo', null, res => {
			// console.log(res);
			if (res) {
				app.aliyun_format(res.pics);
				let imgs = [];
				for (let i = 0; i < res.pics.length; i++) {
					imgs.push({
						pic: res.pics[i]
					});
				}
				// console.log(imgs);
				this.setData({
					name: res.name,
					tel: res.tel,
					c_name: res.company,
					c_address: res.address,
					submit_text: '修改',
					pics: imgs,
					is_revise: 2,
					flex_pad: app.null_arr(imgs.length + 1, 3)
				});
			}
		}, null, () => {
			if (complete) {
				complete();
			}
		});
	},

	//点击提交按钮后事件
	submit(e) {
		let post = {
			name: e.detail.value.name,
			tel: e.detail.value.tel,
			company: e.detail.value.c_name,
			address: e.detail.value.c_address,
			pics: this.get_img_arr()
		}
		if (!post.name.trim()) {
			app.toast('请输入您的姓名');
		} else if (!post.tel.trim()) {
			app.toast('请输入您的联系方式');
		} else if (!post.company.trim()) {
			app.toast('请输入您的公司名称');
		} else if (!post.address.trim()) {
			app.toast('请输入您的公司地址');
		} else if (!app.config.reg.tel.test(post.tel)) {
			app.toast('手机号格式不正确');
		} else {
			console.log(post);
			app.ajax('api/cooperation', post, res => {
				if (res) {
					console.log(res);
					wx.redirectTo({
						url: '/pages/customer-tip/customer-tip?tip=' + this.data.is_revise,
					})
				}
			}, null, () => {});
		}
	},

	get_img_arr() {
		var img_arr = [];
		for (let i = 0; i < this.data.pics.length; i++) {
			img_arr.push(app.format_up_img(this.data.pics[i].pic));
		}
		return img_arr;
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
							tel: app.user_data.tel
						});
					})
				} else {
					app.toast('授权失败，请重新授权');
				}
			});
		}
	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	}
})