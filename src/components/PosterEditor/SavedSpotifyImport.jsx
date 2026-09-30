import { useId, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { parseSavedSpotifyPageHtml } from '../../services/savedSpotifyPage';
import { IoDocumentTextOutline } from 'react-icons/io5';

const Panel = styled.section`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px 14px;
    margin: 20px 0 14px;
    .status {
        padding: 6px 10px;
        border-radius: 8px;
        background: rgba(18, 30, 38, 0.22);
        color: #fff;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
        font-size: 0.83rem;
        line-height: 1.5;
    }
    input { position: absolute; width: 1px; height: 1px; opacity: 0; }
    label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 16px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 11px;
        background: rgba(255, 255, 255, 0.12);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        color: #fff;
        font-weight: 700;
        font-size: 0.9rem;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
        svg { font-size: 1.2rem; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5)); }
        cursor: pointer;
    }
    label:hover { background: rgba(255, 255, 255, 0.2); border-color: rgba(86, 218, 197, 0.65); }
    input:focus-visible + label { outline: 2px solid var(--PosterfyGreen); outline-offset: 3px; }
`;

function importError(error, t) {
    if (error.message === 'PLAYLIST_TOO_LONG') return t('PlaylistTooLong');
    if (error.message === 'SAVED_PLAYLIST_INCOMPLETE') return t('PlaylistIncomplete');
    if (error.message === 'SAVED_PLAYLIST_COUNT_UNKNOWN') return t('PlaylistCountUnknown');
    if (error.message === 'SAVED_PLAYLIST_INVALID') return t('PlaylistInvalidFile');
    return t('PlaylistImportError');
}

// eslint-disable-next-line react/prop-types
function SavedSpotifyImport({ onSelect }) {
    const { t } = useTranslation();
    const inputId = useId();
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [failed, setFailed] = useState(false);

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setBusy(true);
        setMessage('');
        setFailed(false);
        try {
            if (!/\.html?$/i.test(file.name)) throw new Error('SAVED_PLAYLIST_INVALID');
            const page = parseSavedSpotifyPageHtml(await file.text());
            await onSelect(page);
            const notices = [t('PlaylistSuccess', { count: page.trackCount, runtime: page.runtime })];
            if (page.durationEstimated) notices.push(t('PlaylistDurationEstimated'));
            else if (page.durationPrecision !== 'second') notices.push(t('PlaylistDurationRounded'));
            if (!page.artwork) notices.push(t('PlaylistCoverMissing'));
            setMessage(notices.join(' '));
        } catch (error) {
            setMessage(importError(error, t));
            setFailed(true);
        } finally {
            setBusy(false);
        }
    };

    return <Panel>
        <input id={inputId} type="file" accept=".html,.htm,text/html" onChange={handleFileChange} disabled={busy} />
        <label htmlFor={inputId}><IoDocumentTextOutline aria-hidden="true" />{busy ? t('PlaylistImporting') : t('PlaylistImportButton')}</label>
        {message && <p className="status" role={failed ? 'alert' : 'status'}>{message}</p>}
    </Panel>;
}

export default SavedSpotifyImport;
