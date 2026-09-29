/* eslint-disable react/prop-types */
import { forwardRef, useCallback, useImperativeHandle, useRef, useEffect } from 'react';
import { getSignatureBySpotifyId } from '../../services/signatureService';
import { drawSpotifyCode } from '../../utils/spotifyCode';

const parseNumeric = (value, fallback = 0) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const CanvasPoster = forwardRef(function CanvasPoster({ onImageReady, posterData, generatePoster, onTitleSizeAdjust, customFont }, ref) {
    const canvasRef = useRef(null);

    const generatePosterContent = useCallback(async (canvas, outputWidth = 2480, outputHeight = 3508, forPreview = false) => {
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            const ctx = canvas.getContext('2d');
            const width = 2480;
            const height = 3508;
            ctx.setTransform(outputWidth / width, 0, 0, outputHeight / height, 0, 0);
            
            const marginSide = parseNumeric(posterData.marginSide);
            const marginTop = parseNumeric(posterData.marginTop);
            const marginCover = parseNumeric(posterData.marginCover);
            const trackOffsetY = parseNumeric(posterData.trackOffsetY);

            const safeText = (value) => (typeof value === 'string' ? value : '');

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

                    const scale = parseNumeric(posterData.signatureScale, 100) / 100;
                    const offsetX = parseNumeric(posterData.signatureHorizontalPosition, 0);
                    const offsetY = parseNumeric(posterData.signatureVerticalPosition, 0);

                    const baseWidth = 480;
                    const signatureWidth = Math.round(baseWidth * scale);
                    const aspect = img.width / img.height;
                    const signatureHeight = Math.round(signatureWidth / aspect);

                    const baseX = 2020 - marginSide;
                    const finalX = baseX + Math.round((signatureWidth / 100) * offsetX);
                    const baseY = 3235 - signatureHeight - 30;
                    const finalY = baseY + Math.round((signatureHeight / 100) * offsetY);

                    // ✅ 修复：创建临时画布染色，不破坏主画布
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCanvas.width = signatureWidth;
                    tempCanvas.height = signatureHeight;

                    tempCtx.drawImage(img, 0, 0, signatureWidth, signatureHeight);
                    tempCtx.globalCompositeOperation = 'source-in';
                    tempCtx.fillStyle = posterData.textColor || '#ffffff';
                    tempCtx.fillRect(0, 0, signatureWidth, signatureHeight);

                    // ✅ 画回主画布（不会清空内容）
                    ctx.drawImage(tempCanvas, finalX, finalY);

                } catch (err) {
                    console.log("签名加载失败", err);
                }
            };

            const loadCover = async (url) => {
                if (!url) return;
                const image = new Image();
                image.crossOrigin = "anonymous";
                return new Promise((resolve) => {
                    image.onload = () => {
                        ctx.drawImage(
                            image,
                            marginCover,
                            marginCover,
                            width - marginCover * 2,
                            width - marginCover * 2
                        );
                        if (posterData.useFade) {
                            let verticalFade = ctx.createLinearGradient(0, 0, 0, 3000);
                            const rgb = hexToRgb(posterData.backgroundColor);
                            verticalFade.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
                            verticalFade.addColorStop(0.8, posterData.backgroundColor);
                            ctx.fillStyle = verticalFade;
                            ctx.fillRect(0, 0, width, 2500);
                        }
                        resolve();
                    };
                    image.onerror = resolve;
                    image.src = url;
                });
            };

            const drawAlbumInfos = async () => {
                let titleFontSize = posterData.titleSize ? parseNumeric(posterData.titleSize, 180) : 180;
                const fontFamily = customFont || 'Montserrat';
                if (!posterData.userAdjustedTitleSize && !posterData.initialTitleSizeSet) {
                    ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
                    let titleWidth = ctx.measureText(safeText(posterData.albumName)).width;
                    while (titleWidth > (2480 - marginSide * 2)) {
                        titleFontSize -= 1;
                        ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
                        titleWidth = ctx.measureText(safeText(posterData.albumName)).width;
                    }
                    if (forPreview) onTitleSizeAdjust(titleFontSize, true);
                } else {
                    ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
                }
                ctx.fillStyle = posterData.textColor;

                if (posterData.showTracklist) {
                    ctx.fillText(safeText(posterData.albumName), marginSide, 2500 + marginTop);
                } else {
                    ctx.fillText(safeText(posterData.albumName), marginSide, 2790 + marginTop);
                }

                let artistsFontSize = posterData.artistsSize ? parseNumeric(posterData.artistsSize, 110) : 110;
                ctx.font = `bold ${artistsFontSize}px ${customFont || 'Montserrat'}`;

                if (posterData.showTracklist) {
                    ctx.fillText(
                        safeText(posterData.artistsName),
                        marginSide,
                        (2500 + marginTop) + artistsFontSize * 1.3
                    );
                } else {
                    ctx.fillText(
                        safeText(posterData.artistsName),
                        marginSide,
                        (2820 + marginTop) + artistsFontSize
                    );
                }

                ctx.font = `bold 70px ${customFont || 'Montserrat'}`;
                ctx.fillText(safeText(posterData.titleRelease), marginSide, 3310);
                let releaseWidth = ctx.measureText(safeText(posterData.titleRelease)).width;
                ctx.fillText(safeText(posterData.titleRuntime), releaseWidth + marginSide + 100, 3310);

                ctx.globalAlpha = 0.7;
                ctx.font = `bold 60px ${customFont || 'Montserrat'}`;
                ctx.fillText(safeText(posterData.runtime), releaseWidth + marginSide + 100, 3390);
                ctx.fillText(safeText(posterData.releaseDate), marginSide, 3390);
                ctx.globalAlpha = 1;

                ctx.fillStyle = posterData.color1;
                ctx.fillRect(2045 - marginSide, 3368, 145, 30);
                ctx.fillStyle = posterData.color2;
                ctx.fillRect(2190 - marginSide, 3368, 145, 30);
                ctx.fillStyle = posterData.color3;
                ctx.fillRect(2335 - marginSide, 3368, 145, 30);
            };

            const drawTracklist = async () => {
                const tracklistText = safeText(posterData.tracklist);
                if (!tracklistText) return;

                ctx.fillStyle = posterData.textColor || '#ffffff';
                let baseFontSize = posterData.tracksSize ? parseNumeric(posterData.tracksSize, 50) : 50;
                let fontSize = baseFontSize;

                const baseMarginTop = parseNumeric(posterData.marginTop);
                const baseArtistsSize = parseNumeric(posterData.artistsSize, 110);
                const rectY = Math.round(2500 + baseMarginTop + baseArtistsSize * 1.3 + 130);
                const releaseDateY = 3310;
                const maxTextHeight = releaseDateY - 50;

                const tracks = tracklistText.split('\n').filter(t => t.trim() !== '');
                if (!tracks.length) return;

                ctx.font = `bold ${fontSize}px ${customFont || 'Montserrat'}`;
                const baseMusicSize = baseFontSize * 1.3;
                const musicSizeIncrement = baseMusicSize;
                
                let paddingMusic = marginSide + 7;
                let maxWidthInColumn = 0;
                let textHeight = rectY;

                tracks.forEach((track) => {
                    if (textHeight + musicSizeIncrement >= maxTextHeight) {
                        textHeight = rectY;
                        paddingMusic = paddingMusic + maxWidthInColumn + fontSize;
                        maxWidthInColumn = 0;
                    }
                    
                    const textWidth = ctx.measureText(`${track}`).width;
                    
                    if (textWidth > maxWidthInColumn) {
                        maxWidthInColumn = textWidth;
                    }
                    
                    ctx.fillText(`${track}`, paddingMusic, textHeight + trackOffsetY);
                    
                    textHeight += musicSizeIncrement;
                });
            };

            const hexToRgb = (hex) => {
                const bigint = parseInt(hex.replace("#", ""), 16);
                return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
            };

            const drawBackground = async () => {
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = posterData.backgroundColor;
                ctx.fillRect(0, 0, width, height);
            };

            await drawBackground();
            if (posterData.useUncompressed) {
                await loadCover(posterData.uncompressedAlbumCover);
            } else {
                await loadCover(posterData.albumCover);
            }

            await drawAlbumInfos();
            if (posterData.showTracklist) {
                await drawTracklist();
            }
            await drawArtistSignature();
            const codeRendered = await drawSpotifyCode(ctx, {
                albumId: posterData.codeAlbumId,
                playlistId: posterData.codePlaylistId,
                backgroundColor: posterData.backgroundColor,
                textColor: posterData.textColor,
                x: 2020 - marginSide,
                y: 3235,
                width: 480,
                height: 120,
            });
            if (forPreview) onImageReady(canvas.toDataURL('image/png'), codeRendered);
            return canvas;
    }, [posterData, onImageReady, onTitleSizeAdjust, customFont]);

    useImperativeHandle(ref, () => ({
        renderExport: async (outputWidth, outputHeight) =>
            generatePosterContent(document.createElement('canvas'), outputWidth, outputHeight),
    }), [generatePosterContent]);

    useEffect(() => {
        if (generatePoster) generatePosterContent(canvasRef.current, 2480, 3508, true);
    }, [generatePoster, generatePosterContent]);

    return <canvas ref={canvasRef} width={2480} height={3508} style={{ display: 'none' }} />;
});

export default CanvasPoster;
