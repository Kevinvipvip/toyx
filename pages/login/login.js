const app = getApp();
Page({
	data: {
		route: ''
	},
	onLoad: function (options) {
		if (options.route) {
			this.data.route = decodeURIComponent(options.route);
		} else if (options.q) {
			this.data.route = this.q_format(options.q);
		}
		app.login((res) => {
			app.user_data.token = res.token;
			app.user_data.uid = res.uid;

			app.redirect_or_switch_or_index(this.data.route);
			// 设置一些公共信息
			app.set_common();
		}, options.scene || 0);
	},
	// 格式化通过二维码扫描进来的链接
	q_format(q) {
		q = decodeURIComponent(q);
		q = q.replace(app.my_config.base_url + '/', '').split('?');
		let page = q[0],
			search = q[1];

		return search ? `pages/${page}/${page}?${search}` : `pages/${page}/${page}`;
	}
});