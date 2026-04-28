/* eslint-disable react/prop-types */
import { useRef, useEffect } from 'react';
import { getSignatureBySpotifyId } from '../../services/signatureService';

const CanvasPoster = ({
    onImageReady,
    posterData,
    generatePoster,
    onTitleSizeAdjust,
    customFont,
    width = 2700,
    height = 4050,
}) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const generatePosterContent = async () => {
            if (!generatePoster) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            posterData.marginSide = parseInt(posterData.marginSide) || 0;
            posterData.marginTop = parseInt(posterData.marginTop) || 0;
            posterData.marginCover = parseInt(posterData.marginCover) || 0;
            const trackOffsetY = parseInt(posterData.trackOffsetY) || 0;

            // ==========================
            // ✅ 修复版签名绘制（不会清空画布）
            // ==========================
            const drawArtistSignature = async () => {
                if (!posterData.showArtistSignature || !posterData.spotifyArtistId) return;

                try {
                    const sig = await getSignatureBySpotifyId(posterData.spotifyArtistId);
                    if (!sig || !sig.url) return;

                    const img = new Image();
                    img.crossOrigin = "anonymous";

                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = sig.url;
                    });

                    const scale = parseInt(posterData.signatureScale || 100) / 100;
                    const offsetX = parseInt(posterData.signatureHorizontalPosition || 0);
                    const offsetY = parseInt(posterData.signatureVerticalPosition || 0);

                    const baseWidth = 480;
                    const signatureWidth = Math.round(baseWidth * scale);
                    const aspect = img.width / img.height;
                    const signatureHeight = Math.round(signatureWidth / aspect);

                    const baseX = Math.round(width * 0.792) - posterData.marginSide;
                    const finalX = baseX + Math.round((signatureWidth / 100) * offsetX);
                    const baseY = Math.round(height * 0.916) - signatureHeight - 20;
                    const finalY = baseY + Math.round((signatureHeight / 100) * offsetY);

                    // ✅ 临时画布染色（不破坏原图）
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCanvas.width = signatureWidth;
                    tempCanvas.height = signatureHeight;

                    tempCtx.drawImage(img, 0, 0, signatureWidth, signatureHeight);
                    tempCtx.globalCompositeOperation = 'source-in';
                    tempCtx.fillStyle = posterData.textColor || '#fff';
                    tempCtx.fillRect(0, 0, signatureWidth, signatureHeight);

                    // ✅ 画回主画布
                    ctx.drawImage(tempCanvas, finalX, finalY);

                } catch (err) {
                    console.log("签名加载失败", err);
                }
            };

            const loadCover = async (url) => {
                const image = new Image();
                image.crossOrigin = "anonymous";
                image.src = url;
                return new Promise((resolve) => {
                    image.onload = () => {
                        ctx.drawImage(
                            image,
                            posterData.marginCover,
                            posterData.marginCover,
                            width - posterData.marginCover * 2,
                            width - posterData.marginCover * 2
                        );
                        if (posterData.useFade) {
                            let verticalFade = ctx.createLinearGradient(0, 0, 0, Math.round(height * 0.80));
                            const rgb = hexToRgb(posterData.backgroundColor);
                            verticalFade.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
                            verticalFade.addColorStop(0.8, posterData.backgroundColor);
                            ctx.fillStyle = verticalFade;
                            ctx.fillRect(0, 0, canvas.width, Math.round(height * 0.71));
                        }
                        resolve();
                    };
                });
            };

            const drawAlbumInfos = async () => {
                let titleFontSize = posterData.titleSize ? parseInt(posterData.titleSize) : Math.round(width * 0.093);
                const fontFamily = customFont || 'Montserrat';
                if (!posterData.userAdjustedTitleSize && !posterData.initialTitleSizeSet) {
                    ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
                    let titleWidth = ctx.measureText(posterData.albumName).width;

                    while (titleWidth > (width - posterData.marginSide * 2)) {
                        titleFontSize -= 1;
                        ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
                        titleWidth = ctx.measureText(posterData.albumName).width;
                    }
                    onTitleSizeAdjust(titleFontSize, true);
                } else {
                    ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
                }
                ctx.fillStyle = posterData.textColor;

                const albumY = posterData.showTracklist
                    ? Math.round(width * 1.045) + posterData.marginTop
                    : Math.round(height * 0.796) + posterData.marginTop;

                ctx.fillText(posterData.albumName, posterData.marginSide, albumY);

                let artistsFontSize = posterData.artistsSize ? parseInt(posterData.artistsSize) : Math.round(width * 0.044);
                ctx.font = `bold ${artistsFontSize}px ${fontFamily}`;

                ctx.fillText(
                    posterData.artistsName,
                    posterData.marginSide,
                    albumY + artistsFontSize * 1.3
                );

                ctx.font = `bold ${Math.round(width * 0.032)}px ${fontFamily}`;
                const infoY = Math.round(height * 0.936);

                ctx.fillText(posterData.titleRelease, posterData.marginSide, infoY);
                let releaseWidth = ctx.measureText(posterData.titleRelease).width;
                ctx.fillText(posterData.titleRuntime, releaseWidth + posterData.marginSide + Math.round(width * 0.04), infoY);

                ctx.globalAlpha = 0.7;
                ctx.font = `bold ${Math.round(width * 0.032)}px ${fontFamily}`;
                ctx.fillText(posterData.runtime, releaseWidth + posterData.marginSide + Math.round(width * 0.04), infoY + Math.round(width * 0.038));
                ctx.fillText(posterData.releaseDate, posterData.marginSide, infoY + Math.round(width * 0.038));
                ctx.globalAlpha = 1;

                const barY = infoY + Math.round(width * 0.032);
                const barW = Math.round(width * 0.064);
                const barH = Math.round(width * 0.014);

                // ✅【修复完成】三个颜色条 等长 + 无空隙 + 位置不变
                const startX = Math.round(width * 0.803) - posterData.marginSide;
                const gap = 0; // 空隙设为 0

                ctx.fillStyle = posterData.color1;
                ctx.fillRect(startX, barY, barW, barH);

                ctx.fillStyle = posterData.color2;
                ctx.fillRect(startX + barW + gap, barY, barW, barH);

                ctx.fillStyle = posterData.color3;
                ctx.fillRect(startX + barW * 2 + gap * 2, barY, barW, barH);
            };

            const drawTracklist = async () => {
                ctx.fillStyle = posterData.textColor;
                let paddingMusic = posterData.marginSide + 10;
                let maxWidth = 0;
                let paddingColumn = 0;
                const fontSize = posterData.tracksSize ? parseInt(posterData.tracksSize) : Math.round(width * 0.02);
                ctx.font = `bold ${fontSize}px ${customFont || 'Montserrat'}`;
                const musicSize = fontSize;

                const marginTop = parseInt(posterData.marginTop || 0);
                const rectY = posterData.artistsSize
                    ? Math.round(width * 1.01) + marginTop + parseInt(posterData.artistsSize) * 1.155 + Math.round(width * 0.095)
                    : Math.round(width * 1.01) + marginTop + Math.round(width * 0.044 * 1.2) + Math.round(width * 0.042);
                
                const rectHeight = Math.round(width * 0.25);
                const rectWidth = width - (posterData.marginSide * 2);
                const rectX = parseInt(posterData.marginSide);
                const maxTextHeight = rectY + rectHeight - 10 - parseInt(posterData.marginTop);

                let textHeight = rectY;

                posterData.tracklist.split('\n').forEach((track) => {
                    if (textHeight + musicSize * 1.3 >= maxTextHeight) {
                        textHeight = rectY;
                        paddingMusic = maxWidth + (musicSize * 2.5) + paddingColumn;
                        if (paddingMusic >= rectX + rectWidth) return;
                        paddingColumn = paddingMusic - (musicSize * 2.5);
                        maxWidth = 0;
                    }
                    const textWidth = ctx.measureText(`${track}`).width + posterData.marginSide;
                    if (textWidth > maxWidth) {
                        maxWidth = textWidth;
                    }
                    ctx.fillText(`${track}`, paddingMusic, textHeight + trackOffsetY);
                    textHeight += (musicSize * 1.3);
                });
            };

            const hexToRgb = (hex) => {
                const bigint = parseInt(hex.replace("#", ""), 16);
                return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
            };

            const getContrast = (rgb) => {
                const luminance = (c) => {
                    const val = c / 255;
                    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
                };
                const lum = 0.2126 * luminance(rgb.r) + 0.7152 * luminance(rgb.g) + 0.0722 * luminance(rgb.b);
                return lum > 0.179 ? "black" : "white";
            };

            const scannable = async () => {
                const rgb = hexToRgb(posterData.backgroundColor);
                const contrastColor = getContrast(rgb);
                const targetColor = posterData.textColor;
                const svgUrl = `https://scannables.scdn.co/uri/plain/svg/${posterData.backgroundColor.replace('#', '')}/${contrastColor}/640/spotify:album:${posterData.albumID}`;
                
                const response = await fetch(svgUrl);
                let svgText = await response.text();
                
                if(contrastColor === 'black'){
                    svgText = svgText.replace(/fill="#000000"/g, `fill="${targetColor}"`);
                } else{
                    svgText = svgText.replace(/fill="#ffffff"/g, `fill="${targetColor}"`);
                }
                
                const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
                const updatedSvgUrl = URL.createObjectURL(svgBlob);
            
                return new Promise((resolve) => {
                    const image = new Image();
                    image.src = updatedSvgUrl;
            
                    image.onload = function () {
                        ctx.drawImage(
                            image,
                            Math.round(width * 0.792) - posterData.marginSide,
                            Math.round(height * 0.916),
                            Math.round(width * 0.214),
                            Math.round(height * 0.035)
                        );
                        const imageUrl = canvas.toDataURL('image/png');
                        onImageReady(imageUrl);
                        resolve();
                    };
                });
            };

            const drawBackground = async () => {
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = posterData.backgroundColor;
                ctx.fillRect(0, 0, width, height);
            };

            await drawBackground();
            if (posterData.useUncompressed) {
                await loadCover(await posterData.uncompressedAlbumCover);
            } else {
                await loadCover(posterData.albumCover);
            }
            await drawAlbumInfos();
            if (posterData.showTracklist) {
                await drawTracklist();
            }
            await drawArtistSignature();
            await scannable();
        };

        generatePosterContent();
    }, [generatePoster, posterData, onImageReady, width, height, customFont, onTitleSizeAdjust]);

    return <canvas ref={canvasRef} width={width} height={height} style={{ display: 'none' }} />;
};

export default CanvasPoster;