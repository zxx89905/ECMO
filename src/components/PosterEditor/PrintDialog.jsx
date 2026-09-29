import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 16px;
  box-sizing: border-box;
  background: rgba(3, 7, 11, .56);
`;

const Panel = styled.section`
  box-sizing: border-box;
  width: min(540px, 100%);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 18px;
  background: #171d23;
  box-shadow: 0 24px 72px rgba(0, 0, 0, .55);
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, .1);
  h2 { font-size: 1.15rem; }
  p { margin-top: 5px; font-size: .82rem; color: rgba(255, 255, 255, .65); }
  button {
    flex: none;
    width: 32px;
    height: 32px;
    border: 1px solid rgba(255, 255, 255, .18);
    border-radius: 8px;
    background: rgba(255, 255, 255, .07);
    cursor: pointer;
    font-size: 1.15rem;
  }
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 17px 14px;
  padding: 22px 24px;
  label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    font-size: .86rem;
    font-weight: 600;
  }
  label:first-child { grid-column: 1 / -1; }
  input, select {
    box-sizing: border-box;
    width: 100%;
    height: 42px;
    padding: 0 12px;
    border: 1px solid rgba(255, 255, 255, .2);
    border-radius: 9px;
    background: #232a31;
    font: inherit;
  }
  input:focus, select:focus { outline: 2px solid var(--PosterfyGreen); outline-offset: 1px; }
  option { background: #232a31; }
`;

const PrintDetails = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  span {
    padding: 5px 9px;
    border-radius: 6px;
    background: rgba(255, 255, 255, .08);
    color: rgba(255, 255, 255, .8);
    font-size: .8rem;
    white-space: nowrap;
  }
`;

const FilePreview = styled.p`
  grid-column: 1 / -1;
  padding: 11px 12px;
  border-radius: 8px;
  background: rgba(4, 199, 166, .1);
  color: rgba(255, 255, 255, .8);
  font-size: .85rem;
  overflow-wrap: anywhere;
  strong { color: #fff; }
`;

const Notice = styled.p`
  grid-column: 1 / -1;
  color: ${({ $warning }) => $warning ? '#ffd08a' : 'rgba(255, 255, 255, .68)'};
  font-size: .82rem;
  line-height: 1.5;
`;

const Actions = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(255, 255, 255, .1);
  button {
    min-height: 40px;
    padding: 0 17px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
  }
  .cancel { border: 1px solid rgba(255, 255, 255, .22); background: rgba(255, 255, 255, .07); }
  .download { border: 1px solid var(--PosterfyGreen); background: #079e86; }
  button:disabled { opacity: .55; cursor: default; }
`;

function PrintDialog({ albumName, exportName, onNameChange, printPresets, selectedPreset, onSizeChange, format, onFormatChange, coverPrintPpi, fileName, ready, busy, error, onDownload, onClose }) {
  const { t } = useTranslation();
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  onCloseRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busyRef.current) onCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus?.();
    };
  }, []);

  return createPortal(
    <Overlay onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <Panel role="dialog" aria-modal="true" aria-labelledby="print-dialog-title">
        <Header>
          <div>
            <h2 id="print-dialog-title">{t('PrintTitle')}</h2>
            <p>{t('PrintHelp')}</p>
          </div>
          <button ref={closeRef} type="button" aria-label={t('PrintClose')} onClick={onClose} disabled={busy}>×</button>
        </Header>
        <Body>
          <label>
            {t('ExportName')}
            <input type="text" value={exportName} onChange={(event) => onNameChange(event.target.value)} placeholder={albumName} />
          </label>
          <label>
            {t('ExportSize')}
            <select value={selectedPreset.label} onChange={(event) => onSizeChange(event.target.value)}>
              {printPresets.map((preset) => <option key={preset.label} value={preset.label}>{preset.label}</option>)}
            </select>
          </label>
          <label>
            {t('ExportFormat')}
            <select value={format} onChange={(event) => onFormatChange(event.target.value)}>
              <option value="tif">TIF</option>
              <option value="jpg">JPG</option>
            </select>
          </label>
          <PrintDetails>
            <span>{selectedPreset.physical}</span>
            <span>{selectedPreset.width} × {selectedPreset.height} px</span>
            <span>{selectedPreset.ppi} PPI</span>
            {format === 'tif' && <span>≈{Math.round(selectedPreset.width * selectedPreset.height * 3 / 1000000)} MB</span>}
          </PrintDetails>
          <FilePreview>{t('ExportFilename')}： <strong>{fileName}</strong></FilePreview>
          {coverPrintPpi > 0 && coverPrintPpi < 150 && <Notice $warning>{t('ExportCoverWarning', { ppi: coverPrintPpi })}</Notice>}
          {['11X17', '27X40'].includes(selectedPreset.label) && <Notice>{t('ExportRatioNotice')}</Notice>}
          {error && <Notice role="alert" $warning>{error}</Notice>}
        </Body>
        <Actions>
          <button className="cancel" type="button" onClick={onClose} disabled={busy}>{t('ColorCancel')}</button>
          <button className="download" type="button" onClick={onDownload} disabled={busy || !ready}>{busy ? t('Exporting') : t('PrintDownload')}</button>
        </Actions>
      </Panel>
    </Overlay>,
    document.body,
  );
}

export default PrintDialog;
