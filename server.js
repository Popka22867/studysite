const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer(function(req, res) {
    // Обработка запроса на список книг
    if (req.url === '/api/books') {
        const booksDir = path.join(__dirname, 'books');
        
        fs.readdir(booksDir, function(err, files) {
            if (err) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'Папка books не найдена'}));
                return;
            }
            
            const books = files.map(function(file) {
                return {
                    name: file.replace(/\.[^.]+$/, ''),
                    fileName: file,
                    url: '/books/' + file
                };
            });
            
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(books));
        });
        return;
    }
    
    // Обработка запроса на список расписания
    if (req.url === '/api/schedule') {
        const scheduleDir = path.join(__dirname, 'schedule');
        
        fs.readdir(scheduleDir, function(err, files) {
            if (err) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'Папка schedule не найдена'}));
                return;
            }
            
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(files));
        });
        return;
    }
    
    // Отдача статических файлов
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.css': contentType = 'text/css'; break;
        case '.js': contentType = 'text/javascript'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpeg'; break;
        case '.pdf': contentType = 'application/pdf'; break;
    }
    
    fs.readFile(filePath, function(err, content) {
        if (err) {
            res.writeHead(404);
            res.end('Файл не найден');
        } else {
            res.writeHead(200, {'Content-Type': contentType});
            res.end(content);
        }
    });
});

server.listen(PORT, function() {
    console.log('Сервер запущен: http://localhost:' + PORT);
});