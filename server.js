const https = require('https');
const fs = require('fs');
var path = require('path');

const port = 3000;
const hostName = '127.0.0.1';

const options = {
  key: fs.readFileSync('./cert.key'),
  cert: fs.readFileSync('./cert.pem')
};


const prepareURL = (url) => {
    let filePath = '.' + url;
    if (filePath == './') {
        filePath = './index.html';
    }
    return filePath;
}

const getMimeType = (filePath) => {
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4'
    };
    return mimeTypes[extname] || 'application/octet-stream';
}

https.createServer(options, function (req, res) {
    
    const filePath = prepareURL(req.url);
    const contentType = getMimeType(filePath);

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT') {
                fs.readFile('./404.html', function(error, content) {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            }
            else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
            }
        }
        else {
            console.log('file path', filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}).listen(port, hostName, () => {
    console.log(`server is running https://${hostName}:${port}`);
});