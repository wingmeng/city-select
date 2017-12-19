/**
 * 这是一个 nodejs 脚本文件，用以为当前示例提供 http 服务
 * 需要安装 nodejs，然后运行 node serve
 */

let fs   = require('fs'),
    http = require('http'),
    url  = require('url'),
    path = require('path'),
    mine = {
        'css' : 'text/css',
        'gif' : 'image/gif',
        'html': 'text/html',
        'ico' : 'image/x-icon',
        'jpeg': 'image/jpeg',
        'jpg' : 'image/jpeg',
        'js'  : 'text/javascript',
        'json': 'application/json',
        'pdf' : 'application/pdf',
        'png' : 'image/png',
        'svg' : 'image/svg+xml',
        'tiff': 'image/tiff',
        'txt' : 'text/plain'
    },
    port = 8888;

// 写入页面并启动服务
http.createServer(function(req, res) {
    var pathname = url.parse(req.url).pathname,
        realPath = path.join('./', pathname),
        ext = path.extname(pathname);

    ext = ext ? ext.slice(1) : 'unknown';

    fs.exists(realPath, function(exists) {
        if (!exists) {
            res.writeHead(404, {
                'Content-Type': 'text/plain'
            });

            res.write('This request URL ' + realPath + ' was not found on this server.');
            res.end();
        } else {
            fs.readFile(realPath, 'binary', function(err, file) {
                if (err) {
                    res.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    res.end(err);
                } else {
                    var contentType = mine[ext] || 'text/plain';

                    res.writeHead(200, {
                        'Content-Type': contentType
                    });
                    res.write(file, 'binary');
                    res.end();
                }
            });
        }
    });
}).listen(port);

console.log('HTTP 服务已启动');

// 开启网页
var cmd = require('child_process');
cmd.exec('start http://127.0.0.1:' + port + '/index.html');
