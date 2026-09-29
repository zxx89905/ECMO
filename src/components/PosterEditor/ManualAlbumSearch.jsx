import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { FaSearch } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import { getItunesAlbumTracks, searchItunesAlbums } from '../../services/itunesSearch';

const Panel = styled.section`
    margin: 20px 0 28px;
    p { margin-top: 10px; color: rgba(255, 255, 255, 0.72); font-size: 0.83rem; line-height: 1.5; }
`;

const SearchForm = styled.form`
    height: 50px;
    display: flex;
    align-items: center;
    overflow: hidden;
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.05);
    .search-icon {
        flex: none;
        margin-inline: 15px;
        font-size: 1.35em;
        opacity: 0.25;
    }
    .divider {
        flex: none;
        width: 1px;
        height: 70%;
        background: rgba(255, 255, 255, 0.1);
    }
    input {
        min-width: 0;
        flex: 1;
        margin-left: 15px;
        border: 0;
        outline: 0;
        background: transparent;
        font-size: 1.2em;
        font-weight: 600;
        opacity: 0.77;
    }
    select {
        flex: none;
        height: 70%;
        padding: 0 8px;
        border: 0;
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        outline: 0;
        background: transparent;
        cursor: pointer;
        font-size: 0.9em;
        option { background: #22262b; }
    }
    button {
        flex: none;
        display: grid;
        place-items: center;
        width: 50px;
        height: 50px;
        border: 0;
        background: transparent;
        cursor: pointer;
        font-size: 1.35em;
        opacity: 0.6;
        transition: opacity 0.2s, background-color 0.2s;
    }
    button:hover:not(:disabled), button:focus-visible { opacity: 1; background: rgba(255, 255, 255, 0.08); }
    button:disabled { opacity: 0.3; cursor: default; }
    @media (max-width: 480px) {
        .search-icon { margin-inline: 10px; }
        input { margin-left: 10px; font-size: 1em; }
        select { padding-inline: 4px; }
    }
`;

const Results = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 16px;
    @media (max-width: 720px) { grid-template-columns: 1fr; }
`;

const AlbumCard = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 10px;
    border: 1px solid rgba(255, 255, 255, 0.13);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    img { flex: none; width: 58px; height: 58px; border-radius: 6px; object-fit: cover; background: #282d33; }
    .details { min-width: 0; flex: 1; }
    strong, small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    strong { font-size: 0.84rem; }
    small { margin-top: 4px; color: rgba(255, 255, 255, 0.65); font-size: 0.74rem; }
    a { display: inline-block; margin-top: 4px; font-size: 0.72rem; color: #75dfc9; }
    button {
        flex: none;
        padding: 7px 10px;
        border: 1px solid #04c7a6;
        border-radius: 7px;
        background: rgba(4, 199, 166, 0.15);
        cursor: pointer;
        font-size: 0.78rem;
        font-weight: 700;
    }
    button:disabled { opacity: 0.5; cursor: default; }
`;

// eslint-disable-next-line react/prop-types
function ManualAlbumSearch({ onSelect }) {
    const { t } = useTranslation();
    const [term, setTerm] = useState('');
    const [country, setCountry] = useState('us');
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectingId, setSelectingId] = useState(null);
    const [message, setMessage] = useState('');
    const controllerRef = useRef(null);

    useEffect(() => () => controllerRef.current?.abort(), []);

    const handleSearch = async (event) => {
        event.preventDefault();
        if (!term.trim()) return;
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setLoading(true);
        setSelectingId(null);
        setSearched(false);
        setMessage('');
        try {
            const albums = await searchItunesAlbums(term, country, controller.signal);
            if (!controller.signal.aborted) { setResults(albums); setSearched(true); }
        } catch {
            if (!controller.signal.aborted) setMessage(t('ManualSearchError'));
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    };

    const handleSelect = async (album) => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setSelectingId(album.id);
        setMessage('');
        let details = { tracklist: '', runtime: '' };
        try {
            details = await getItunesAlbumTracks(album.id, country, controller.signal);
        } catch {
            if (!controller.signal.aborted) setMessage(t('ManualTracksError'));
        } finally {
            if (!controller.signal.aborted) {
                onSelect({ ...album, ...details });
                setSelectingId(null);
            }
        }
    };

    return (
        <Panel>
            <SearchForm onSubmit={handleSearch}>
                <FaSearch className="search-icon" aria-hidden="true" />
                <span className="divider" aria-hidden="true" />
                <input value={term} onChange={(event) => setTerm(event.target.value)}
                    type="search" placeholder={t('ManualSearchPlaceholder')} aria-label={t('ManualSearchPlaceholder')} />
                <select value={country} onChange={(event) => setCountry(event.target.value)} aria-label={t('ManualSearchCountry')}>
                    <option value="us">US</option><option value="cn">CN</option><option value="jp">JP</option>
                </select>
                <button type="submit" disabled={loading || !term.trim()}
                    aria-label={loading ? t('ManualSearching') : t('ManualSearchButton')} title={t('ManualSearchButton')}>
                    {loading ? '…' : <IoSend aria-hidden="true" />}
                </button>
            </SearchForm>
            {message && <p role="alert" style={{ marginTop: 12 }}>{message}</p>}
            {searched && results.length === 0 && <p style={{ marginTop: 12 }}>{t('ManualNoResults')}</p>}
            {results.length > 0 && (
                <Results>
                    {results.map((album) => (
                        <AlbumCard key={album.id}>
                            <img src={album.thumbnail} alt="" loading="lazy" />
                            <div className="details">
                                <strong title={album.name}>{album.name}</strong>
                                <small title={album.artist}>{album.artist} · {album.releaseDate?.slice(0, 4)} · {album.trackCount} {t('ManualTracks')}</small>
                                {album.storeUrl && <a href={album.storeUrl} target="_blank" rel="noopener noreferrer">Apple Music ↗</a>}
                            </div>
                            <button type="button" disabled={selectingId !== null} onClick={() => handleSelect(album)}>
                                {selectingId === album.id ? t('ManualFilling') : t('ManualFill')}
                            </button>
                        </AlbumCard>
                    ))}
                </Results>
            )}
        </Panel>
    );
}

export default ManualAlbumSearch;
