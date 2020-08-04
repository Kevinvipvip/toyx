const app = getApp();

Page({
  data: {
    user: {
      id: 0,
      user_auth: 0,
      nickname: '',
      realname: '',
      sex: 0,
      avatar: '',
      tel: '',
      secret_tel: ''
    },

    sex: -1,
    sex_list: [{
        name: '男',
        value: 1
      },
      {
        name: '女',
        value: 2
      }
    ],

    show_input: false,
    input_index: -1, // 0.昵称 1.姓名 2.电话
    input_value: ''
  },
  onLoad() {
    this.mydetail();
  },
  // 获取个人信息
  mydetail() {
    app.set_common(() => {
      let secret_tel;
      if (app.user_data.tel) {
        secret_tel = app.user_data.tel.slice(0, 3) + '****' + app.user_data.tel.slice(-4);
      } else {
        secret_tel = '';
      }

      let sex;
      switch (app.user_data.sex) {
        case 1:
          sex = 0;
          break;
        case 2:
          sex = 1;
          break;
        default:
          sex = -1;
          break;
      }

      this.setData({
        user: {
          id: app.user_data.uid,
          user_auth: app.user_data.user_auth,
          nickname: app.user_data.nickname,
          realname: app.user_data.realname,
          sex: app.user_data.sex,
          avatar: app.user_data.avatar,
          tel: app.user_data.tel || '',
          secret_tel: secret_tel
        },
        sex: sex
      });
    });
  },
  // 上传头像
  // up_avatar() {
  //   app.choose_img(1, pic_res => {
  //     wx.showLoading({
  //       title: '上传中',
  //       mask: true
  //     });

  //     wx.uploadFile({
  //       url: app.my_config.api + 'upload/uploadImage',
  //       filePath: pic_res[0].path,
  //       name: 'file',
  //       formData: {
  //         token: app.user_data.token
  //       },
  //       success: res => {
  //         res.data = JSON.parse(res.data);
  //         let avatar = app.format_img(res.data.data.path);
  //         this.setData({ ['user.avatar']: avatar });
  //       },
  //       fail() {
  //         app.toast('上传失败');
  //       },
  //       complete() {
  //         wx.hideLoading();
  //       }
  //     });
  //   });
  // },
  // 修改个人信息
  modMyInfo() {
    let data = this.data;
    // if (!data.user.avatar) {
    //   app.toast('请上传头像');
    // } else 
    if (!data.user.nickname.trim()) {
      app.toast('请填写昵称');
      // } else if (!data.user.realname.trim()) {
      //   app.toast('请填写姓名');
    } else if (data.sex === -1) {
      app.toast('请选择性别');
      // }  else if (!data.user.tel.trim()) {
      //   app.toast('请填写电话');
      // } else if (!app.my_config.reg.tel.test(data.user.tel)) {
      //   app.toast('手机号格式不正确');
    } else {
      wx.showModal({
        title: '提示',
        content: '确定保存？',
        success: res => {
          if (res.confirm) {
            wx.showLoading({
              title: '保存中',
              mask: true
            });

            let post = {
              // avatar: app.format_img_reverse(data.user.avatar),
              nickname: data.user.nickname,
              // realname: data.user.realname,
              sex: data.sex_list[data.sex].value,
              // tel: data.user.tel,
            };

            app.ajax('my/modMyInfo', post, () => {
              app.modal('已保存', () => {
                this.mydetail();
                wx.navigateBack({
                  delta: 1
                })
              });
            }, null, () => {
              wx.hideLoading();
            });
          }
        }
      });
    }
  },
  // 性别选择
  sex_choose(e) {
    this.setData({
      sex: parseInt(e.detail.value)
    });
  },
  // 显示输入框
  show_input(e) {
    let input_index = e.currentTarget.dataset.input_index;
    let input_value;
    switch (input_index) {
      case 0:
        input_value = this.data.user.nickname;
        break;
      case 1:
        input_value = this.data.user.realname;
        break;
      case 2:
        input_value = this.data.user.tel;
        break;
    }

    this.setData({
      input_index: input_index,
      show_input: true,
      input_value: input_value
    })
  },
  // 隐藏输入框
  hide_input() {
    this.setData({
      show_input: false
    });
  },
  // 确定
  confirm() {
    switch (this.data.input_index) {
      case 0:
        this.setData({
          ['user.nickname']: this.data.input_value,
          show_input: false
        });
        break;
      case 1:
        this.setData({
          ['user.realname']: this.data.input_value,
          show_input: false
        });
        break;
      case 2:
        if (this.data.input_value) {
          if (!app.my_config.reg.tel.test(this.data.input_value)) {
            app.toast('手机号格式不正确');
          } else {
            let secret_tel = this.data.input_value.slice(0, 3) + '****' + this.data.input_value.slice(-4);
            this.setData({
              ['user.tel']: this.data.input_value,
              ['user.secret_tel']: secret_tel,
              show_input: false
            });
          }
        } else {
          this.setData({
            ['user.tel']: '',
            ['user.secret_tel']: '',
            show_input: false
          })
        }
        break;
    }
  },
  bind_input(e) {
    app.bind_input(e, this);
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
});