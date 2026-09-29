import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { HexColorPicker } from 'react-colorful';
import { useTranslation } from 'react-i18next';

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(5, 8, 12, 0.12);
`;

const Panel = styled.div`
    position: absolute;
    width: min(400px, calc(100vw - 20px));
    max-height: calc(100dvh - 32px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 18px;
    background: rgba(25, 29, 34, 0.96);
    box-shadow: 0 22px 70px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);

`;

const Header = styled.header`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 20px 12px;
    h2 { font-size: 1.15rem; margin-bottom: 5px; }
    p { font-size: 0.82rem; line-height: 1.45; color: rgba(255, 255, 255, 0.68); }
    button {
        flex: none;
        width: 32px;
        height: 32px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 9px;
        background: rgba(255, 255, 255, 0.08);
        cursor: pointer;
        font-size: 1.2rem;
    }
`;

const Tabs = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin: 0 20px 14px;
    padding: 4px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.07);
    button {
        padding: 9px 6px;
        border: 1px solid transparent;
        border-radius: 8px;
        background: transparent;
        color: rgba(255, 255, 255, 0.72);
        cursor: pointer;
        font-weight: 600;
    }
    button[aria-selected='true'] {
        border-color: rgba(4, 199, 166, 0.7);
        background: rgba(4, 199, 166, 0.2);
        color: #fff;
    }
    button:disabled { opacity: 0.4; cursor: default; }
`;

const Body = styled.div`
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
    padding: 0 20px 18px;
    p { margin-top: 9px; color: rgba(255, 255, 255, 0.68); font-size: 0.78rem; line-height: 1.5; }
`;

const Picker = styled(HexColorPicker)`
    && { width: 100%; height: 260px; }
`;

const ImageViewport = styled.div`
    box-sizing: border-box;
    width: 100%;
    height: min(280px, 36vh);
    overflow: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 10px;
    background: #101216;
    img { display: block; max-width: none; margin: 0 auto; cursor: crosshair; user-select: none; -webkit-user-drag: none; }
`;

const ZoomControls = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
    font-size: 0.88rem;
    button {
        min-width: 38px;
        min-height: 32px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 7px;
        background: rgba(255, 255, 255, 0.1);
        cursor: pointer;
        font-size: 1.1rem;
    }
    button:disabled { opacity: 0.4; cursor: default; }
`;

const Swatches = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 12px;
    button {
        width: 30px;
        height: 30px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        cursor: pointer;
    }
    button[aria-pressed='true'] { border-color: #fff; box-shadow: 0 0 0 2px #04c7a6; }
`;

const HexRow = styled.label`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 18px;
    font-size: 0.88rem;
    font-weight: 600;
    span { flex: none; width: 32px; height: 32px; border: 1px solid rgba(255, 255, 255, 0.35); border-radius: 8px; }
    input {
        min-width: 0;
        flex: 1;
        padding: 9px 11px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.26);
        font: inherit;
    }
    input:focus { outline: 2px solid #04c7a6; outline-offset: 1px; }
`;

const Actions = styled.footer`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 14px 20px 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(20, 23, 27, 0.96);
    button { min-height: 38px; padding: 0 16px; border-radius: 8px; cursor: pointer; font-weight: 700; }
    .cancel { border: 1px solid rgba(255, 255, 255, 0.24); background: rgba(255, 255, 255, 0.08); }
    .apply { border: 1px solid #04c7a6; background: #079e86; }
    .apply:disabled { opacity: 0.45; cursor: default; }
`;

function ColorSelector({ DefaultColor, image, predefinedColors, anchorRef, onDone, onClose }) {
    const { t } = useTranslation();
    const [color, setColor] = useState(DefaultColor);
    const [hexInput, setHexInput] = useState(DefaultColor);
    const [mode, setMode] = useState('palette');
    const [zoom, setZoom] = useState(1);
    const [imageSize, setImageSize] = useState({ width: 300, height: 300 });
    const [sampleError, setSampleError] = useState('');
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const viewportRef = useRef(null);
    const closeRef = useRef(null);
    const panelRef = useRef(null);
    const [placement, setPlacement] = useState(null);
    const validHex = /^#[0-9a-f]{6}$/i.test(hexInput);

    useLayoutEffect(() => {
        const updatePlacement = () => {
            const preview = anchorRef?.current?.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const gap = 12;
            const edge = 16;
            const maxWidth = 400;
            const minWidth = 220;
            const rightSpace = preview ? viewportWidth - preview.right - gap - edge : 0;
            const leftSpace = preview ? preview.left - gap - edge : 0;
            let next;

            if (!preview || viewportWidth <= 600 || Math.max(rightSpace, leftSpace) < minWidth) {
                next = { bottomSheet: true };
            } else {
                const useRight = rightSpace >= leftSpace;
                const width = Math.min(maxWidth, useRight ? rightSpace : leftSpace);
                const left = useRight ? preview.right + gap : preview.left - gap - width;
                const panelHeight = panelRef.current?.offsetHeight || 0;
                const top = Math.max(edge, Math.min(
                    preview.top + (preview.height - panelHeight) / 2,
                    viewportHeight - panelHeight - edge
                ));
                next = { bottomSheet: false, left: Math.round(left), top: Math.round(top), width: Math.round(width) };
            }
            setPlacement((previous) => previous && Object.keys(next).every((key) => previous[key] === next[key]) ? previous : next);
        };

        updatePlacement();
        window.addEventListener('resize', updatePlacement);
        window.addEventListener('scroll', updatePlacement, { passive: true });
        const observer = new ResizeObserver(updatePlacement);
        if (panelRef.current) observer.observe(panelRef.current);
        if (anchorRef?.current) observer.observe(anchorRef.current);
        return () => {
            window.removeEventListener('resize', updatePlacement);
            window.removeEventListener('scroll', updatePlacement);
            observer.disconnect();
        };
    }, [anchorRef]);

    useEffect(() => {
        const oldOverflow = document.body.style.overflow;
        const previousFocus = document.activeElement;
        document.body.style.overflow = 'hidden';
        closeRef.current?.focus();
        const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = oldOverflow;
            window.removeEventListener('keydown', onKeyDown);
            previousFocus?.focus?.();
        };
    }, [onClose]);

    const chooseColor = (value) => { setColor(value); setHexInput(value); };

    const handleImageLoad = () => {
        const img = imageRef.current;
        const canvas = canvasRef.current;
        if (!img?.naturalWidth || !canvas) return;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const size = Math.min(340, viewportRef.current?.clientWidth || 300, viewportRef.current?.clientHeight || 300);
        const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
        setImageSize({ width: Math.round(img.naturalWidth * scale), height: Math.round(img.naturalHeight * scale) });
    };

    const handleImageClick = (event) => {
        const canvas = canvasRef.current;
        const rect = imageRef.current?.getBoundingClientRect();
        if (!canvas?.width || !rect) return;
        const x = Math.min(canvas.width - 1, Math.max(0, Math.floor((event.clientX - rect.left) * canvas.width / rect.width)));
        const y = Math.min(canvas.height - 1, Math.max(0, Math.floor((event.clientY - rect.top) * canvas.height / rect.height)));
        try {
            const pixel = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
            chooseColor(`#${Array.from(pixel).slice(0, 3).map((part) => part.toString(16).padStart(2, '0')).join('')}`);
            setSampleError('');
        } catch {
            setSampleError(t('ColorSampleError'));
        }
    };

    return createPortal(
        <Overlay onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <Panel ref={panelRef} role="dialog" aria-modal="true" aria-label={t('ColorSelectTitle')}
                style={placement?.bottomSheet
                    ? { left: 10, right: 10, bottom: 10, width: 'auto', maxHeight: '55dvh' }
                    : placement
                        ? { left: placement.left, top: placement.top, width: placement.width }
                        : { visibility: 'hidden' }}>
                <Header>
                    <div><h2>{t('ColorSelectTitle')}</h2><p>{t('ColorSelectHelp')}</p></div>
                    <button ref={closeRef} type="button" onClick={onClose} aria-label={t('ColorClose')}>×</button>
                </Header>
                <Tabs role="tablist">
                    <button type="button" role="tab" aria-selected={mode === 'palette'} onClick={() => setMode('palette')}>{t('ColorPaletteTab')}</button>
                    <button type="button" role="tab" aria-selected={mode === 'cover'} disabled={!image} onClick={() => setMode('cover')}>{t('ColorCoverTab')}</button>
                </Tabs>
                <Body>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    {mode === 'palette' ? <Picker color={color} onChange={chooseColor} /> : (
                        <>
                            <ImageViewport ref={viewportRef}>
                                <img ref={imageRef} src={image} crossOrigin="anonymous" draggable="false"
                                    style={{ width: imageSize.width * zoom, height: imageSize.height * zoom }}
                                    onLoad={handleImageLoad} onError={() => setSampleError(t('ColorSampleError'))}
                                    onClick={handleImageClick} />
                            </ImageViewport>
                            <ZoomControls>
                                <button type="button" disabled={zoom === 1} onClick={() => setZoom(zoom / 2)} aria-label={t('ColorZoomOut')}>−</button>
                                <span>{zoom}×</span>
                                <button type="button" disabled={zoom === 8} onClick={() => setZoom(zoom * 2)} aria-label={t('ColorZoomIn')}>+</button>
                            </ZoomControls>
                            <p>{t('ColorCoverHint')}</p>
                            {sampleError && <p role="alert">{sampleError}</p>}
                        </>
                    )}
                    <p>{t('ColorSuggested')}</p>
                    <Swatches>
                        {predefinedColors.map((swatch, index) => (
                            <button key={`${swatch}-${index}`} type="button" style={{ backgroundColor: swatch }}
                                aria-pressed={color.toLowerCase() === swatch.toLowerCase()}
                                onClick={() => chooseColor(swatch)} aria-label={`${t('ColorUse')} ${swatch}`} />
                        ))}
                    </Swatches>
                    <HexRow>
                        HEX
                        <span style={{ backgroundColor: color }} />
                        <input type="text" value={hexInput} maxLength={7} aria-label={t('ColorHexInput')}
                            onChange={(event) => {
                                const value = event.target.value;
                                setHexInput(value);
                                if (/^#[0-9a-f]{6}$/i.test(value)) setColor(value);
                            }} />
                    </HexRow>
                    {!validHex && <p role="alert">{t('ColorInvalidHex')}</p>}
                </Body>
                <Actions>
                    <button type="button" className="cancel" onClick={onClose}>{t('ColorCancel')}</button>
                    <button type="button" className="apply" disabled={!validHex} onClick={() => onDone(hexInput)}>{t('ColorApply')}</button>
                </Actions>
            </Panel>
        </Overlay>,
        document.body
    );
}

export default ColorSelector;
