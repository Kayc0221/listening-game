// asset.js — public/ 底下檔案的網址。部署在子路徑 (例如 GitHub Pages 的 /<repo>/) 時要加上 PUBLIC_URL
export const asset = (path) => `${process.env.PUBLIC_URL}${path}`;
