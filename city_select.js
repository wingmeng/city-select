;(function(factory) {
	if (typeof define === 'function' && (define.amd || define.cmd) && !jQuery) {
		define(['jquery'], factory);  // AMD 或 CMD
	} else if (typeof module === 'object' && module.exports) {
		// Node/CommonJS
		module.exports = function(root, jQuery) {
			if (jQuery === undefined) {
				if (typeof window !== 'undefined') {
					jQuery = require('jquery');
				} else {
					jQuery = require('jquery')(root);
				}
			}
			factory(jQuery);
			return jQuery;
		};
	} else {
		factory(jQuery);
	}
}(function($) {
	$.fn.citySelect = function(options) {
		var defaults = {
			search: null,
			prompt: '- 请选择 -',
			loading: '加载中...',
			dataUrl: 'json/',
			onchange: function(){}
		};

		var opts = $.extend({}, defaults, options);
		return this.each(function() {
			var self = $(this),
				selects = self.find('select'),
				listKeyWords = ['province', 'city', 'area', 'street'],
				listObjs = {};

			selects.prop('disabled', true)
				.html('<option>' + opts.loading + '</option>');

			for (var i = 0; i < listKeyWords.length; i++) {
				listObjs[listKeyWords[i]] = selects.eq(i);
			}

			var _factory = {
				// 构建
				build: function(typeStr, dataArr) {
					var html = '';
					if (opts.prompt) {
						var prompt;

						if (typeof opts.prompt === 'string') {
							prompt = opts.prompt;
						} else if (opts.prompt instanceof Array) {
							prompt = opts.prompt[listKeyWords.indexOf(typeStr)];
						}

						html = '<option value="0">' + (prompt || defaults.prompt) + '</option>';
					}

					if (dataArr) {
						for (var i = 0; i < dataArr.length; i++) {
							html += '<option value="' + dataArr[i].code + '">'
								+      dataArr[i].name
								+  '</option>';
						}
					}

					if (listObjs[typeStr].length) {
						listObjs[typeStr].html(html);
						return listObjs[typeStr];
					}
				},

				// 返回 code 匹配的数据
				matchCode: function(data, code) {
					if (!data) {
						return;
					}

					return Array.prototype.filter ? data.filter(function(item) {
						return item.parent_code === code;
					}) : null || (function() {  // 不支持 filter 方法的处理
						var arr = [];

						for (var i = 0; i < data.length; i++) {
							if (data[i].parent_code === code) {
								arr.push(data[i]);
							}
						}

						return arr;
					})();
				},

				// 返回 name 匹配的数据
				matchName: function(data, name) {
					if (!data) {
						return;
					}

					var result = {};

					for (var i = 0; i < data.length; i++) {
						if (data[i].name === name) {
							result.code = data[i].code;
							result.parent_code = data[i].parent_code;
							break;
						}
					}

					return result;
				},

				// 绑定 change 事件
				bind: function(typeStr, data) {
					listObjs[typeStr].on('change', function() {
						var code = $(this).val(),
							idx = listKeyWords.indexOf(typeStr);

						for (var i = idx; i < listKeyWords.length; i++) {
							var key = listKeyWords[i + 1];

							if (!key) {
								break;
							}

							var curData = i === idx ? _factory.matchCode(data[key], code)
													: null;

							_factory.build(key, curData);
						}

						if (typeof opts.onchange === 'function') {
							opts.onchange(
								code,
								$(this).find('option[value="' + code + '"]').text()
							);
						}
					});
				}
			};

			// 获取行政 code 数组（格式化）
			var getCodeArr = function(code) {
				var rule = 'xx-xx-xx-xxx',  // 省-市-区-街道办
					arr = String(code).split(''),
					codeArr = [];

				for (var i = 0; i < arr.length; i++) {
					rule = rule.replace('x', arr[i]);
				}

				arr = rule.split('-');
				rule = '';

				for (var i = 0; i < arr.length; i++) {
					if (arr[i].indexOf('x') === -1) {  // 过滤
						rule += arr[i];
						codeArr.push(rule);
					}
				}

				return codeArr;
			};

			// ajax 请求 JSON 数据
			var reqJsonData = function(fileName) {
				var fileType = 'json',
					req = null;

				if (listObjs[fileName].length) {
					req = $.ajax({
						url: opts.dataUrl + fileName + '.' + fileType,
						dataType: fileType
					});
				}

				return req;
			};

			$.when(
				reqJsonData(listKeyWords[0]),
				reqJsonData(listKeyWords[1]),
				reqJsonData(listKeyWords[2]),
				reqJsonData(listKeyWords[3])
			).then(function(provinceData, cityData, areaData, streetData) {
				selects.prop('disabled', false);

				var getDataArr = function(data) {
					return data ? data[0] : null;
				};

				var data = {
					province: getDataArr(provinceData),
					city: getDataArr(cityData),
					area: getDataArr(areaData),
					street: getDataArr(streetData)
				};

				var search = {};
				if (opts.search) {
					if (isNaN(opts.search)) {  // 地址字符串
						search.type = 'name';
						search.data = opts.search.split(',');
					} else {  // 行政区划code
						search.type = 'code';
						search.data = getCodeArr(opts.search);
					}
				}

				for (var i = 0; i < listKeyWords.length; i++) {
					var key = listKeyWords[i],
						curData = data[key];  // dataArr || null

					if (curData) {
						if (opts.search) {  // 按搜索初始化
							if (search.type === 'code') {
								if (i > 0) {
									curData = _factory.matchCode(data[key], search.data[i - 1]);
								}

								_factory.build(key, curData).val(search.data[i]);
							} else if (search.type === 'name') {
								var matchedCode = _factory.matchName(curData, search.data[i]);

								if (i > 0) {
									curData = _factory.matchCode(data[key], matchedCode.parent_code);
								}

								_factory.build(key, curData).val(matchedCode.code);
							}

						} else {  // 默认初始化
							_factory.build(key, (i === 0 ? curData : null));
						}

						_factory.bind(key, data);
					}
				}
			});
		});
	}
}));
