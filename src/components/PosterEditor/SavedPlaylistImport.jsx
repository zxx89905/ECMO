import { useId, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { parseSavedSpotifyPlaylistHtml } from '../../services/savedSpotifyPlaylist';

const Panel = styled.section`
    margin: 20px 0 24px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, 0.13);
    border-radius: 14px;
    background: rgba(15, 20, 24, 0.56);
    .status { margin: 10px 0 0; color: rgba(255, 255, 255, 0.72); font-size: 0.83rem; line-height: 1.5; }
    input { position: absolute; width: 1px; height: 1px; opacity: 0; }
    label {
        display: inline-flex;
        align-items: center;
        min-height: 42px;
        padding: 0 16px;
        border: 1px solid rgba(4, 199, 166, 0.55);
        border-radius: 9px;
        background: rgba(4, 199, 166, 0.13);
        color: #fff;
        font-weight: 700;
        cursor: pointer;
    }
    label:hover { background: rgba(4, 199, 166, 0.22); }
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
function SavedPlaylistImport({ onSelect }) {
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
            const playlist = parseSavedSpotifyPlaylistHtml(await file.text());
            onSelect(playlist);
            const notices = [t('PlaylistSuccess', { count: playlist.trackCount, runtime: playlist.runtime })];
            if (playlist.durationEstimated) notices.push(t('PlaylistDurationEstimated'));
            if (!playlist.artwork) notices.push(t('PlaylistCoverMissing'));
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
        <label htmlFor={inputId}>{busy ? t('PlaylistImporting') : t('PlaylistImportButton')}</label>
        {message && <p className="status" role={failed ? 'alert' : 'status'}>{message}</p>}
    </Panel>;
}

export default SavedPlaylistImport;
