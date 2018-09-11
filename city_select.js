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

		// 不设区城市（直筒子市）
		var noAreaCity = {
			code: [
				'4419',  // 东莞市
				'4420',  // 中山市
				'4604'   // 儋 [dān] 州市
			],
			name: ['东莞市', '中山市', '儋州市']
		};

		var opts = $.extend({}, defaults, options);
		return this.each(function() {
			var self = $(this),
				selects = self.find('select'),
				listKeyWords = ['province', 'city', 'area', 'street'],
				listObjs = {};

			// 取值回调
			if (typeof options === 'function') {
				var matchedSelects = selects.not(':hidden'),
					nameArr = [],
					code = 0;

				matchedSelects.each(function(idx) {
					if ($(this).val() !== '0') {
						nameArr.push($(this).find('option:checked').text());
					}
				});

				for (var i = matchedSelects.length - 1; i >= 0; i--) {
					var curSelect = matchedSelects.eq(i);

					if (curSelect.val() !== '0') {
						code = curSelect.val();
						break;
					}
				}

				options(code, nameArr);
				return;
			}

			// 启动加载状态
			selects.prop('disabled', true)
				.html('<option>' + opts.loading + '</option>');

			for (var i = 0; i < listKeyWords.length; i++) {
				listObjs[listKeyWords[i]] = selects.eq(i);
			}

			var _factory = {
				// 构建
				build: function(typeStr, dataArr) {
					var html = '',
						curSelect = listObjs[typeStr],
						hasDataArr = dataArr && dataArr.length ? true : false;

					if (opts.prompt) {
						var prompt;

						if (typeof opts.prompt === 'string') {
							prompt = opts.prompt;
						} else if (opts.prompt instanceof Array) {
							prompt = opts.prompt[listKeyWords.indexOf(typeStr)];
						}

						html = '<option value="0">' + (prompt || defaults.prompt) + '</option>';
					}

					if (hasDataArr) {
						for (var i = 0; i < dataArr.length; i++) {
							html += '<option value="' + dataArr[i].code + '">'
								+      dataArr[i].name
								+  '</option>';
						}

						curSelect.show();
					} else {
						curSelect.hide();
					}

					if (curSelect) {
						curSelect.html(html);

						if (typeStr === listKeyWords[2] && hasDataArr) {  // area
							if (noAreaCity.code.indexOf(dataArr[0].parent) > -1) {  // 不设区城市（直筒子市处理）
								curSelect.hide().val(dataArr[0].code);
							}
						}

						return curSelect;
					}
				},

				// 返回 code 匹配的数据
				matchCode: function(data, parentCode) {
					if (!data) {
						return;
					}

					return Array.prototype.filter ? data.filter(function(item) {
						return item.parent === parentCode;
					}) : null || (function() {  // 不支持 filter 方法的处理
						var arr = [];

						for (var i = 0; i < data.length; i++) {
							if (data[i].parent === parentCode) {
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
							result.parent = data[i].parent;
							break;
						}
					}

					return result;
				},

				// 绑定 change 事件
				bindChange: function(typeStr, data) {
					listObjs[typeStr].on('change', function() {
						var self = $(this),
							code = self.val(),
							idx = listKeyWords.indexOf(typeStr);

						for (var i = idx; i < listKeyWords.length; i++) {
							var key = listKeyWords[i + 1];

							if (!key) {
								break;
							}

							var curData = i === idx ? _factory.matchCode(data[key], code)
													: null;

							if (typeStr === listKeyWords[1] && key === listKeyWords[3]) {  // city && street
								if (noAreaCity.code.indexOf(code) > -1) {  // 不设区城市（直筒子市处理）
									curData = _factory.matchCode(data[key], code + '00');
								}
							}

							_factory.build(key, curData);  // 构建下一级
						}

						if (typeof opts.onchange === 'function') {
							opts.onchange(
								code,
								self.find('option[value="' + code + '"]').text()
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
						search.data = opts.search.split(/[,|\s+]/);
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
								if (key === listKeyWords[1]) {
									if (noAreaCity.name.indexOf(search.data[i]) > -1) {
										search.data.splice(i, 0, search.data[i]);  // 不设区城市（直筒子市重复插入一项）
									}
								}

								var matchedCode = _factory.matchName(curData, search.data[i]);

								if (i > 0) {
									curData = _factory.matchCode(data[key], matchedCode.parent);
								}

								_factory.build(key, curData).val(matchedCode.code);
							}
						} else {  // 默认初始化
							_factory.build(key, (i === 0 ? curData : null));
						}

						_factory.bindChange(key, data);
					}
				}
			});
		});
	}
}));
