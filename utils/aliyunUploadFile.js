const base64 = require('base64.js'); //Base64,hmac,sha1,crypto相关算法
require('hmac.js');
require('sha1.js');
const Crypto = require('crypto.js');

var config = {
	key: '',
	host: '',
	filename: '',
	securityToken: '',
	ossAccessKeyId: '',
	ossAccessKeySecret: ''
}

module.exports = {
	init: init,
	upload: uploadFile,
}

// 在整个程序生命周期中，只需要 init 一次即可
// 如果需要变更参数，再调用 init 即可
function init(options) {
	config = {
		key: '',
		host: '',
		filename: '',
		securityToken: '',
		ossAccessKeyId: '',
		ossAccessKeySecret: ''
	};
	updateConfigWithOptions(options);
}

const updateConfigWithOptions = (options) => {
	if (options.key) {
		config.key = options.key;
	} else if (options.securityToken) {} else if (options.ossAccessKeyId) {} else if (options.ossAccessKeySecret) {}
	if (options.host) {
		config.host = options.host;
	}
	config.securityToken = options.securityToken;
	config.ossAccessKeyId = options.ossAccessKeyId;
	config.ossAccessKeySecret = options.ossAccessKeySecret;
	config.filename = options.filename
	// console.log(config, '222')
}

function uploadFile(filePath, successc, failc) {
	if (!filePath || filePath.length < 9) {
		wx.showModal({
			title: '图片错误',
			content: '请重试',
			showCancel: false,
		})
		return;
	}

	console.log('上传图片.....');
	// 获取上传的文件类型
	let fileTypeIndex = filePath.lastIndexOf('.');
	let fileType = filePath.substring(fileTypeIndex);

	//图片名字 可以自行定义，     这里是采用当前的时间戳 + 150内的随机数来给图片命名的
	// const aliyunFileKey = dir + new Date().getTime() + Math.floor(Math.random() * 150) + '.png';
	const aliyunFileKey = config.filename + fileType;

	const aliyunServerURL = config.host; //OSS地址，需要https
	const accessid = config.ossAccessKeyId;
	const policyBase64 = getPolicyBase64();
	const signature = getSignature(policyBase64); //获取签名
	// wx.uploadFile({
	// 	url: aliyunServerURL, //开发者服务器 url
	// 	filePath: filePath, //要上传文件资源的路径
	// 	name: 'file', //必须填file
	// 	formData: {
	// 		'key': aliyunFileKey,
	// 		'policy': policyBase64,
	// 		'OSSAccessKeyId': accessid,
	// 		'signature': signature,
	// 		'success_action_status': 200,
	// 	},
	// 	success: function (res) {
	// 		if (res.statusCode != 200) {
	// 			failc(new Error('上传错误:' + JSON.stringify(res)))
	// 			return;
	// 		}
	// 		successc(aliyunServerURL + aliyunFileKey);
	// 	},
	// 	fail: function (err) {
	// 		err.wxaddinfo = aliyunServerURL;
	// 		failc(err);
	// 	},
	// })
	wx.uploadFile({
		url: aliyunServerURL, // 开发者服务器的URL。
		filePath: filePath,
		name: 'file', // 必须填file。
		formData: {
			'key': aliyunFileKey,
			'policy': policyBase64,
			'OSSAccessKeyId': accessid,
			'signature': signature,
			'x-oss-security-token': config.securityToken // 使用STS签名时必传。
		},
		success: (res) => {
			if (res.statusCode === 204) {
				console.log('上传成功');
				successc(aliyunFileKey);
			} else {
				failc(res);
				return;
			}
		},
		fail: err => {
			err.wxaddinfo = aliyunServerURL;
			failc(err);
		}
	});
}

// function getPolicyBase64() {
// 	let date = new Date();
// 	// 设置policy过期时间。
// 	date.setHours(date.getHours() + 1);
// 	let srcT = date.toISOString();
// 	const policyText = {
// 		expiration: srcT,
// 		conditions: [
// 			// 限制上传文件大小。
// 			["content-length-range", 0, 2 * 1024 * 1024],
// 		],
// 	};
// 	const buffer = new Buffer(JSON.stringify(policyText));
// 	return buffer.toString("base64");
// }
function getPolicyBase64() {
	let date = new Date();
	date.setHours(date.getHours() + 1);
	let srcT = date.toISOString();
	const policyText = {
		"expiration": srcT, //设置该Policy的失效时间，超过这个失效时间之后，就没有办法通过这个policy上传文件了 
		"conditions": [
			["content-length-range", 0, 1024 * 1024] // 设置上传文件的大小限制,1mb
		]
	};

	const policyBase64 = base64.encode(JSON.stringify(policyText));
	return policyBase64;
}
// function signature(policy) {
// 	return crypto.enc.Base64.stringify(
// 		crypto.HmacSHA1(policy, this.accessKeySecret)
// 	);
// }
function getSignature(policyBase64) {
	const accesskey = config.ossAccessKeySecret;
	// console.log(config)
	const bytes = Crypto.HMAC(Crypto.SHA1, policyBase64, accesskey, {
		asBytes: true
	});
	const signature = Crypto.util.bytesToBase64(bytes);

	return signature;
}