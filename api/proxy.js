export default async (req, res) => {
  // 获取国家代码
  const country = req.headers['x-vercel-ip-country'] || '未知';
  
  // 允许的地区
  const allowedRegions = ['CN', 'HK', 'MO', 'TW'];
  
  // 检查是否来自允许的地区
  if (!allowedRegions.includes(country)) {
    // 重定向到拦截页面
    res.writeHead(302, {
      'Location': '/blocked',
      'X-Country-Code': country
    });
    return res.end();
  }
  
  // 构建目标URL
  const targetUrl = new URL(req.url, 'https://downloads.immortalwrt.org');
  
  // 重定向到代理路径
  res.writeHead(302, {
    'Location': `/proxy${targetUrl.pathname}${targetUrl.search}`,
    'X-Proxy-Redirect': 'true'
  });
  res.end();
}