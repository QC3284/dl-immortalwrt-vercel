export default async (req, res) => {
  const country = req.headers['x-country-code'] || '未知';
  const clientIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '未知';
  
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>访问受限</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
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
      background: #e74c3c;
      padding: 30px;
      color: white;
    }
    .header h1 {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .content {
      padding: 30px;
    }
    .message {
      font-size: 1.1rem;
      margin-bottom: 20px;
      background: #f9f9ff;
      padding: 15px;
      border-left: 4px solid #e74c3c;
      border-radius: 0 8px 8px 0;
    }
    .region-code {
      display: inline-block;
      background: #e74c3c22;
      color: #e74c3c;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-family: monospace;
    }
    .footer {
      padding: 20px 30px;
      text-align: center;
      color: #777;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>区域访问限制</h1>
      <p>服务区域访问限制</p>
    </div>
    
    <div class="content">
      <div class="message">
        我们检测到您正从 <span class="region-code">${country}</span> 地区访问，
        当前服务仅面向中国大陆及港澳台用户开放。
      </div>
      
      <h3>📌 常见问题</h3>
      <ul style="padding-left: 20px; margin: 15px 0;">
        <li style="margin-bottom: 8px;">为什么会出现此页面？ - 您的访问IP不在服务区域范围内</li>
        <li style="margin-bottom: 8px;">支持哪些地区？ - 中国大陆、香港、澳门及台湾</li>
        <li>如何解除限制？ - 使用支持地区的网络环境访问</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>如有特殊访问需求，请联系 support@example.com</p>
      <p style="margin-top: 10px; font-size: 0.9em; color: #999;">
        ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} | 
        IP: ${clientIp}
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