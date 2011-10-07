var
    port = +process.argv[2] || 8080,

    sanitizer = require('validator').sanitize,
    express = require('express'),

    server = express.createServer(),
    io = require('socket.io').listen(server),
    chat = io.of('/chat'),
    canvas = io.of('/canvas')
;

function sanitize(string) {
    return sanitizer(string).entityDecode()
}

server.listen(port);

server.get(/(^\/.*$)/, function(request, response) {
    var fileName = request.params[0];
    console.log(fileName);
    if (fileName == '/')
        fileName = '/index.html';
    response.sendfile(__dirname + '/client' + fileName);
});

chat.on('connection', function(socket) {
    socket.on('setName', function (name) {
        name = sanitize(name);
        socket.set('name', name);
        socket.broadcast.emit('receive', {
            sender:'Server',
            message:name + ' has joined.'
        })
    });

    socket.on('send', function (message) {
        socket.get('name', function(error, name) {
            if (name)
                socket.broadcast.emit('receive', {
                    sender:name,
                    message:sanitize(message)
                })
        })
    });

    socket.on('disconnect', function() {
        socket.get('name', function(error, name) {
            if (name)
                socket.broadcast.emit('receive', {
                    sender:'Server',
                    message:name + ' has left.'
                })
        })
    });
});

canvas.on('connection', function(socket) {
    socket.on('draw', function (command) {
        canvas.emit('draw', command)
    });
});
