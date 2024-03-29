/**
 * @description 网站入口
 * @since 2015-1-12
 * @author xiyangbaixue
 */

var express = require('express'),
    path = require('path'),
    favicon = require('static-favicon'),
    // logger = require('morgan'),

    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    // RedisStore = require('connect-redis')(session),
    // redis = require('redis'),
    // redisCfg = require('./config/redis'),
    // redisClient = redis.createClient(redisCfg.port, redisCfg.host),

    bodyParser = require('body-parser'),
    // multer = require('multer'),
    compress = require('compression'),
    less = require('less-middleware'),
    debug = require('debug'),
    ejs = require('ejs'),
    markdown = require('markdown-js'),
    config = require('./src/config/core'),
    main = require('./src/business/routes/main'),
    english = require('./src/business/routes/english'),
    routes = require('./src/business/routes/routes'),
    socketio = require('socket.io'),
    http = require('http'),
    ueditor = require('ueditor'),
    // 读取文件模块
    fs = require('fs'),
    app = express(),
    server,
    io,
    cluster = require('cluster'),
    numCPUs = require('os').cpus().length,
    // todoDao = require("./config/db"),

    // 日志调试
    log = require('./src/config/log/app'),


    cpuIdx;
//@formatter:on

// redisClient.auth(redisCfg.passwd, function (err) {
//     //@formatter:off
//     'use strict';
//     //@formatter:on
//     if (err) {
//         // throw err;
//         console.log(err);
//     }
// });

//设置视图文件路径
app.set('views', path.join(__dirname, 'src/web/views'));

//修改模板后缀
app.set('view engine', 'html');

//设置ejs分隔符
ejs.open = '{{';
ejs.close = '}}';

//设置模板引擎
app.engine('.php', ejs.__express);
app.engine('.html', ejs.__express);
app.engine('.htm', ejs.__express);
app.engine('.shtml', ejs.__express);

app.engine('.md', function(path, options, fn){
  fs.readFile(path, 'utf8', function(err, str){
    if (err) return fn(err);
    str = markdown.parse(str).toString();
    fn(null, str);
  });
});

//设置favicon.ico
app.use(favicon(path.join(__dirname, 'src/web/public', 'favicon.ico')));

//在console中输出访问日志
// app.use(logger(':date - :remote-addr - :method :status :url - :response-time ms'));

app.use(compress());

//通过req.cookies调用cookie
app.use(cookieParser(config.authCookieName));
// app.use(session({store:new RedisStore({client:redisClient}), key:'jsid', secret:config.sessionSecret}));
app.use(bodyParser());
// app.use(bodyParser.json()); // for parsing application/json
// app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
// app.use(multer()); // for parsing multipart/form-data

// LESS编译
app.use(less({
    src: path.join(__dirname, 'src/web/public/less'),
    dest: path.join(__dirname, 'src/web/public/css'),
    prefix: '/css',
    force: true,
    compress: true
}));

//设置全局响应头
app.use(function (req, res, next) {
    //@formatter:off
    'use strict';
    //@formatter:on
    res.setHeader('Server', config.name + '/' + config.version);
    res.setHeader('X-Powered-By', 'xiyangbaixue');
    next();
});

//静态文件路径，须在响应头设置之后，否则仍将为默认值
app.use(express.static(path.join(__dirname, 'src/web/public')));
app.use(express.static(path.join(__dirname, 'src/web/views/jquery')));
app.use(express.static(path.join(__dirname, 'src/web/views/javascript')));
// app.use(express.static(path.join(__dirname, 'views/css3.0')));
//即时刷新功能，结合grunt watch任务使用
// if (config.liveReload) {
//     var liveReload = require('./helper/livereload');
//     app.use(liveReload());
// }

app.use("/ueditor/ue", ueditor(path.join(__dirname, 'src/web/public'), function(req, res, next) {
    // ueditor 客户发起上传图片请求
    if (req.query.action === 'uploadimage') {
        var foo = req.ueditor;

        var imgname = req.ueditor.filename;

        var img_url = '/images/ueditor/' ;
        res.ue_up(img_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
    }
    //  客户端发起图片列表请求
    else if (req.query.action === 'listimage') {
        var dir_url = '/images/ueditor/';
        res.ue_list(dir_url); // 客户端会列出 dir_url 目录下的所有图片
    }
    // 客户端发起其它请求
    else {
        // console.log('config.json')
        res.setHeader('Content-Type', 'application/json');
        res.redirect('/ueditor/nodejs/config.json');
    }
    return;
}));



app.get('/test', function(req, res) {
    res.render('test.md', {title: "CSS",layout: 'head'});
});

// 主路由处理，包括首页、404、管理页
main(app);

// 子路由
english(app);
routes(app);
log.use(app);
// todoDao.connect(function(error){
//     if (error) throw error;
// });
// app.on('close', function(errno) {
//     todoDao.close(function(err) { });
// });
if (cluster.isMaster) {
    for ( cpuIdx = 0; cpuIdx < numCPUs; cpuIdx += 1) {
        cluster.fork();
    }

    cluster.on('exit', function (worker, code, signal) {
        //@formatter:off
        'use strict';
        //@formatter:on
        console.log('worker ' + worker.process.pid + ' exit');
        process.nextTick(function () {
            cluster.fork();
        });
    });
    // watch只需要执行一次，所以放在主进程中
    require('./src/controller/helper/watch').init(config);
} else {
    server = http.createServer(app);
    io = socketio.listen(server);
    // require('./controllers/socket').initSocket(io);

    server.listen(config.port, config.host, function () {
        //@formatter:off
        'use strict';
        //@formatter:on
        console.log('Server listening on: ' + config.host + ', port ' + config.port);
    });
}

module.exports = app;