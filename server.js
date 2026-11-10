// 외부 설치 없이 Node.js 기본 기능만으로 작동하는 초간단 로컬 웹 서버
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url === '/' ? '/index.html' : req.url;
  let filePath = path.join(__dirname, reqPath);
  let ext = path.extname(filePath).toLowerCase();
  let contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 파일을 찾을 수 없어요');
      } else {
        res.writeHead(500);
        res.end(`서버 에러: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🧭 [우리 동네 안심 효도 지도] 로컬 서버가 시작되었어요!`);
  console.log(`👉 브라우저 주소창에 입력하세요: http://localhost:${PORT}`);
  console.log(`(종료하려면 키보드의 Ctrl + C 키를 누르면 돼요)`);
  console.log(`====================================================`);
});
