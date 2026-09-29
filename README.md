<p align="center">
  <img src="public/ico.png" width="150" height="150" alt="Posterfy Logo">
</p>

<p align="center">
  <em>Create album posters with Spotify search or by entering everything yourself.</em>
</p>

This project is educational, non-commercial, and fully open to contributions. Rights to the album images and music data belong to their respective owners.

## 本地启动

在 `E:\ZJT-Github\ECMO` 运行 `npm install` 和 `npm run dev -- --open`，或双击项目中的 `start-local.bat`。启动脚本使用自身所在目录，换电脑后无需修改路径。

首次打开时会显示鹈鹕骑车入口页；点击鹈鹕的黑色眼睛进入海报制作页，同一浏览器标签刷新后保持在制作页。入口动画改编自 [Vulcan575/pelican-riding-bicycle](https://github.com/Vulcan575/pelican-riding-bicycle)，其 MIT 许可保存在 `public/pelican-intro-LICENSE.txt`。

## 两种制作方式

- **Spotify 搜索**：搜索专辑名，或在搜索框粘贴 Spotify 专辑链接直接打开指定专辑并自动填入资料。需要可用的 Spotify API 凭据。
- **本地手动制作**：可通过 iTunes 搜索专辑并填入封面、日期、曲目和时长，也可自行填写所有信息、上传本地封面。还可在 Spotify 歌单页面使用浏览器的“另存为”保存 HTML，然后在手动模式上传该 HTML，读取歌单名称、封面、歌曲名和总时长；最多支持 50 首，无需 Spotify API。

手动模式可选填 `https://open.spotify.com/album/...`、`https://open.spotify.com/playlist/...` 链接或相应 URI，再点击“应用”把 Spotify 扫码条形码加入海报。此步骤需要能访问 Spotify 的条形码图片服务；服务不可用时仍可生成无条形码的海报。保存网页导入只读取 HTML 中实际保存的歌单曲目，不会把页面里的“推荐歌曲”误认为歌单内容。若 Spotify 只保存了部分滚动加载的歌曲，页面会提示文件不完整，不会填入错误的总时长。封面优先使用保存页中的 Spotify 图片地址；离线时也可在编辑区上传本地封面。

页面底部可切换压缩后的图片主题，或选择“纯色”并输入 HEX 色值。编辑海报颜色时，打开取色弹窗并切换“封面取色”；用 `+` / `−` 放大或缩小封面，滚动到目标区域后点击取色，再点“应用颜色”。弹窗保持打开，可一边查看清晰的海报预览一边反复调整。海报下载以专辑名命名，封面下载在专辑名后加 `Cover`。

## 打印导出

编辑页的“海报”按钮下载 PNG；点击底部“打印”打开打印窗口，可自定义文件名和尺寸，选择 TIF（默认）或 JPG。打印文件名为“自定义名字 尺寸”，例如 `专辑名 16X24.tif`。TIF 和 JPG 都写入所选 PPI；TIF 为未压缩 RGB，文件会较大。

- A 模版：A0–A5，分别为 80、100、120、180、200、210 PPI。
- 2:3 模版：8X12、10X15、11X17、12X18、14X21、16X24、20X30、24X36、27X40、32X48 英寸，分别为 200、180、180、180、180、160、120、100、90、90 PPI。

所有尺寸的导出像素短边都低于 3000。海报文字和图形按目标尺寸重新绘制；封面受原图分辨率限制，低于 150 PPI 时编辑页会提示上传更清晰的封面。11X17 和 27X40 与严格的 2:3 比例略有差异，导出时会轻微调整画面比例。

当前 Spotify 搜索模式在浏览器中使用 `VITE_SPOTIFY_CLIENT_SECRET`。Vite 会把这类变量写入公开的前端构建文件，不能把它当作私密凭据。发布前应将授权迁移到受保护的服务端，并更换已经发布过的密钥。
