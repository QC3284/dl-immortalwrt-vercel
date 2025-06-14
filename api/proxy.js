const TARGET_BASE = 'https://downloads.immortalwrt.org';
const ALLOWED_REGIONS = ['CN', 'HK', 'MO', 'TW'];

// 主处理函数
module.exports = async (req, res) => {
  try {
    // 获取客户端信息
    const country = req.headers['x-vercel-ip-country'] || '未知';
    const clientIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // 区域限制检查
    if (!ALLOWED_REGIONS.includes(country)) {
      return sendBlockedResponse(req, res, country, clientIp);
    }
    
    // 构建目标URL
    const targetUrl = new URL(req.url, TARGET_BASE);
    
    // 准备代理请求
    const proxyOptions = {
      method: req.method,
      headers: { ...req.headers },
      redirect: 'manual'
    };
    
    // 清理请求头
    delete proxyOptions.headers.host;
    delete proxyOptions.headers.origin;
    delete proxyOptions.headers.referer;
    
    // 设置超时
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    proxyOptions.signal = controller.signal;
    
    // 发送代理请求
    const proxyRes = await fetch(targetUrl.toString(), proxyOptions);
    clearTimeout(timeout);
    
    // 处理重定向
    if ([301, 302, 303, 307, 308].includes(proxyRes.status)) {
      const location = proxyRes.headers.get('location');
      if (location) {
        const redirectUrl = new URL(location, TARGET_BASE);
        res.setHeader('Location', redirectUrl.toString());
        return res.status(proxyRes.status).end();
      }
    }
    
    // 设置响应头
    const headers = Object.fromEntries(proxyRes.headers.entries());
    delete headers['content-security-policy'];
    delete headers['x-frame-options'];
    headers['access-control-allow-origin'] = '*';
    
    // 流式传输响应
    res.writeHead(proxyRes.status, headers);
    const reader = proxyRes.body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    
    res.end();
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    return sendErrorResponse(req, res, error);
  }
};

// 发送拦截响应
function sendBlockedResponse(req, res, country, clientIp) {
  const templates = [
    { 
      title: "区域访问限制",
      content: "尊敬的访客，根据服务政策限制，您所在的地区（代码: ${code}）不在服务范围内。",
      footer: "如有特殊访问需求，请联系 qc3284@xcqcoo.top",
      color: "#2c3e50"
    },
    { 
      title: "温馨提示",
      content: "🌏 我们检测到您正从 ${code} 地区访问，当前服务仅面向中国大陆及港澳台用户开放。",
      footer: "感谢您的理解与支持",
      color: "#3498db"
    },
    { 
      title: "403 - 区域限制",
      content: "访问被拒绝 [Region: ${code}]",
      footer: "Allowed: CN, HK, MO, TW",
      color: "#1abc9c"
    },
    { 
      title: "空间跳跃失败 ✨",
      content: "我们的服务尚未抵达 ${code} 区域，目前仅在中国大陆及港澳台提供服务",
      footer: "技术支持: qc3284@xcqcoo.top",
      color: "#9b59b6"
    }
  ];
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  const regionDisplay = country || '未知地区';
  
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>访问受限 - ${template.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 650px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: ${template.color};
      padding: 30px 40px;
      color: white;
    }
    .header h1 {
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .content {
      padding: 40px;
    }
    .message {
      font-size: 1.3rem;
      margin-bottom: 30px;
      background: #f9f9ff;
      padding: 20px;
      border-left: 4px solid ${template.color};
      border-radius: 0 8px 8px 0;
    }
    .region-code {
      display: inline-block;
      background: ${template.color}22;
      color: ${template.color};
      padding: 2px 10px;
      border-radius: 4px;
      font-weight: 700;
      font-family: monospace;
    }
    .footer {
      padding: 20px 40px 30px;
      text-align: center;
      color: #777;
      border-top: 1px solid #eee;
    }
    @media (max-width: 600px) {
      .header, .content { padding: 25px; }
      .header h1 { font-size: 1.8rem; }
      .message { font-size: 1.1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${template.title}</h1>
      <p>服务区域访问限制</p>
    </div>
    
    <div class="content">
      <div class="message">
        ${template.content.replace('${code}', `<span class="region-code">${regionDisplay}</span>`)}
      </div>
      
      <h3>📌 常见问题</h3>
      <ul style="padding-left: 25px; margin-top: 10px; margin-bottom: 25px;">
        <li style="margin-bottom: 8px;">为什么会出现此页面？ - 您的访问IP不在服务区域范围内</li>
        <li style="margin-bottom: 8px;">支持哪些地区？ - 中国大陆、香港、澳门及台湾</li>
        <li>如何解除限制？ - 使用支持地区的网络环境访问</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>${template.footer}</p>
      <p style="margin-top: 10px; font-size: 0.9em; color: #999;">
        ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} | 
        IP: ${clientIp || '未知'}
      </p>
    </div>
  </div>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(403).send(html);
}

// 发送错误响应
function sendErrorResponse(req, res, error) {
  const clientIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>代理服务错误</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    .card {
      max-width: 650px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #e74c3c;
      padding: 30px 40px;
      color: white;
    }
    .header h1 {
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .content {
      padding: 40px;
    }
    .info {
      background: #f9f9ff;
      padding: 20px;
      border-left: 4px solid #e74c3c;
      border-radius: 0 8px 8px 0;
      margin-bottom: 20px;
    }
    .code {
      display: inline-block;
      background: #e74c3c22;
      color: #e74c3c;
      padding: 2px 10px;
      border-radius: 4px;
      font-weight: 700;
      font-family: monospace;
    }
    .footer {
      padding: 20px 40px 30px;
      text-align: center;
      color: #777;
      border-top: 1px solid #eee;
    }
    @media (max-width: 600px) {
      .header, .content { padding: 25px; }
      .header h1 { font-size: 1.8rem; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🚧 代理服务暂时不可用</h1>
      <p>无法完成您的请求</p>
    </div>
    
    <div class="content">
      <div class="info">
        <p><strong>错误信息:</strong> ${escapeHTML(error.message || '未知错误')}</p>
        <p><strong>请求路径:</strong> ${escapeHTML(req.url)}</p>
        <p><strong>客户端IP:</strong> ${escapeHTML(clientIp || '未知')}</p>
      </div>
      
      <h3>📌 建议操作</h3>
      <ul style="padding-left: 25px; margin-top: 10px;">
        <li style="margin-bottom: 10px;">稍后重试 - 可能是临时网络问题</li>
        <li style="margin-bottom: 10px;">检查URL - 确保请求地址正确</li>
        <li>联系支持 qc3284@xcqcoo.top 提供上方错误信息</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
      <p style="margin-top: 10px; font-size: 0.9em; color: #999;">
        ImmortalWrt Mirror Service
      </p>
    </div>
  </div>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(504).send(html);
}

// HTML转义函数
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[tag] || tag));
}