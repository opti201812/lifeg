const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 代理 API 请求到后端服务器
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3030',
      changeOrigin: true,
      // 保持 Cookie 和认证信息
      cookieDomainRewrite: 'localhost',
      onProxyReq: (proxyReq, req, res) => {
        // 确保转发 Cookie
        if (req.headers.cookie) {
          proxyReq.setHeader('Cookie', req.headers.cookie);
        }
      },
    })
  );
  
  // 注意：WebSocket 代理需要在 WebSocketHandler 中配置
  // 如果使用代理，WebSocket URL 应该是：ws://localhost:3000（前端端口）
  // 然后通过代理转发到 ws://localhost:3030
};

