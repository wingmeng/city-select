# city-select 中国省、市、县、乡四级行政区级联下拉选取
    @Version: 1.0
    @Author: Wing Meng
    @Update: 2017-12-20
---

**[示例 DEMO](https://wingmeng.github.io/city-select/)**

## 描述

　　citySelect 是一款中国四级行政区级联下拉选取的jQuery插件。
	插件中所用的地区 JSON 数据采集自民政部、国家统计局，采集程序使用 <a href="https://github.com/modood/Administrative-divisions-of-China" target="_blank">Administrative-divisions-of-China</a>，在此对其作者表示感谢！:clap:

## 使用方法及API

1. 根据实际需要编写好 HTML 结构，citySelect 插件根据下拉框控件的数量来生成对应的行政区列表；
1. 初始化：`$(Selector).citySelect(Options)`;

	> 其中 Selector 为包含所有 select 地址下拉框的父容器；Options 为设置参数，具体见后文。

1. 参数（Options）

	| 参数 | 默认值 | 描述 |
	| --- | --- | --- |
	| **search** | `null` | 按 search 指定的内容显示，可以是行政区划代码或地址字符串。示例如下：<br> `$(Selector).citySelect({search:  41900401})`<br>`$(Selector).citySelect({search:  '广东省,深圳市,福田区'})` <br>(注：地区字符串分割符为英文逗号)|
	| **prompt** | `- 请选择 -` | 下拉框缺省提示语。可以是字符串或数组，当为数组时，将按照“省、市、区、街道办”的顺序设置对应下拉框的缺省提示语。|
	| **loading** | `加载中...` | 当插件加载json文件，暂时不可用时的提示语。 |
	| **dataUrl** | `json/` | json 数据文件的相对路径。 |
	| **onchange** | `function(){}` | 每一次下拉选取变更后的回调函数，返回当前 change 后下拉框的地址名和行政代码。 |

1. 取值

	```
    $(Selector).citySelect(function(code, nameArr) {
        /**
         * @param {string} code    - 行政代码
         * @param {array}  nameArr - 地区名称数组
         */
    });
	```

1. 后端对接

	**推荐：** 将行政代码传给后台，保存到数据库即可，前端使用时，后台从数据取出该值，传给前端，前端直接使用该值初始化 citySelect 插件，效率简直不要太好 :zap:。<br>
	还可以将地区名称传给后台，保存到数据库，使用时和上一种方法类似，但效率要低一些。
