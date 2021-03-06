var express = require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var session = require('express-session');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var http = require('http').Server(app);
var io = require('socket.io')(http);
var CORS = require('cors')();

// 마찬가지로 app.use(router)전에 삽입한다
app.use(CORS);

// database
mongoose.connect(process.env.MONGO_DB);
var db = mongoose.connection;
db.once("open", function() {
    console.log("DB connected!");
});
db.on("error", function(err) {
    console.log("DB ERROR :", err);
});

// view engine
app.set("view engine", 'ejs');

// middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(methodOverride("_method"));
app.use(flash());
app.use(session({
    secret: 'MySecret'
}));

// passport
var passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session({
    secret: 'MySecret',
    cookie: {
        _expires: 60000000
    }, // time im ms
}));

var allowCrossDomain = function(req, res, next) {
    if ('OPTIONS' == req.method) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
      res.send(200);
    }
    else {
      next();
    }
};

app.use(allowCrossDomain);

// routes
app.use('/', require('./routes/home'));
app.use('/users', require('./routes/users'));
app.use('/posts', require('./routes/posts'));
app.use('/chats', require('./routes/chats'));

var count = 1;
io.on('connection', function(socket) {
    socket.on('join', function(data) {
        socket.broadcast.emit('join message', {
            name: data.name
        });
    });

    console.log('user connected: ', socket.id);
    var name = "user" + count++;
    io.to(socket.id).emit('change name', name);

    socket.on('disconnect', function() {
        console.log('user disconnected: ', socket.id);
    });

    socket.on('send message', function(name, text) {
        socket.emit('my message', text);
        socket.broadcast.emit('other message', name + ' : ' + text);
        //var msg = name + ' : ' + text;
        //console.log(msg);
        //io.emit('receive message', msg);
    });
});

var port = process.env.PORT || 3000;

http.listen(port, function() {
    console.log('Server On!');
});
