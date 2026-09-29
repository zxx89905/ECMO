import Navbar from './components/Navbar/Navbar';
import Searchbar from './components/Searchbar';
import { useState, useEffect, useRef, useCallback } from 'react';
import styled from "styled-components";
import Loading from './components/Loading';
import Footer from './components/Footer';
import Grid from './components/Grid';
import PosterEditor from './components/PosterEditor/PosterEditor';
import PelicanIntro from './components/PelicanIntro';
import { parseSpotifyAlbumId } from './utils/spotifyCode';

const SIZE_PRESETS = [
  { key: "A尺寸", label: "A尺寸 (2480x3508)", width: 2480, height: 3508 },
  { key: "2-3", label: "2:3 (2700x4050)", width: 2700, height: 4050 },
];

const StyledSelect = styled.select`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1.5px solid #38ef7d;
  background: rgba(35, 32, 37, 0.15);
  color: #fff;
  font-size: 1em;
  font-family: inherit;
  margin-left: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  outline: none;
  transition: border 0.2s, background 0.2s;
  appearance: none;
  cursor: pointer;

  &:focus {
    border: 1.5px solid #38ef7d;
    background: rgba(35,32,37,0.25);
  }
  option {
    background: rgba(35, 32, 37, 0.85);
    color: #fff;
  }
`;

const ContentContainer = styled.div`
  padding-top: 80px;
  min-height: calc(100vh - 80px); 
`;

const ModeBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin: 18px auto;
`;

const ModeButton = styled.button`
  padding: 11px 20px;
  border: 1px solid ${({ $active }) => $active ? 'rgba(4, 199, 166, .55)' : 'rgba(255, 255, 255, .22)'};
  border-radius: 9px;
  background: ${({ $active }) => $active ? 'rgba(4, 199, 166, .16)' : 'rgba(0, 0, 0, .38)'};
  color: ${({ $active }) => $active ? '#e9fff9' : 'rgba(255, 255, 255, .88)'};
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s, border-color .2s;
  &:hover { background: ${({ $active }) => $active ? 'rgba(4, 199, 166, .22)' : 'rgba(255, 255, 255, .1)'}; }
  &:focus-visible { outline: 2px solid var(--PosterfyGreen); outline-offset: 3px; }
`;

const Notice = styled.p`
  width: min(90%, 800px);
  margin: 8px auto 20px;
  color: #fff;
  text-align: center;
  line-height: 1.5;
`;

function App() {
  const [entered, setEntered] = useState(() => {
    try { return window.sessionStorage.getItem('ecmo-intro-entered') === '1'; }
    catch { return false; }
  });
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('spotify');
  const [apiError, setApiError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [query, setQuery] = useState('');
  const [albumId, setAlbumId] = useState(null);
  const editorRef = useRef(null);

  const [sizeKey, setSizeKey] = useState("A尺寸");
  const size = SIZE_PRESETS.find(s => s.key === sizeKey) || SIZE_PRESETS[0];

  const enterSite = useCallback(() => {
    try { window.sessionStorage.setItem('ecmo-intro-entered', '1'); }
    catch { /* Browsing with storage disabled still allows entry. */ }
    setEntered(true);
  }, []);

  function onClickAlbum(id) {
    setSearchError('');
    setAlbumId(id);
  }

  function handleClickBack() {
    setAlbumId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mode === 'spotify' && albumId) editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [albumId, mode]);

  const onSearch = (value) => {
    const input = value.trim();
    if (!input) {
      setSearchError('');
      setAlbumId(null);
      setQuery('');
      return;
    }

    const directAlbumId = parseSpotifyAlbumId(input);
    if (directAlbumId) {
      setSearchError('');
      setApiError('');
      setAlbumId(directAlbumId);
      return;
    }

    if (/^(?:https?:\/\/|spotify:|(?:open|play)\.spotify\.com\/)/i.test(input)) {
      setSearchError('请输入有效的 Spotify 专辑链接，例如 https://open.spotify.com/album/...');
      return;
    }

    setSearchError('');
    setApiError('');
    setAlbumId(null);
    setQuery(input);
  };

  return (
    entered ? <>
      {loading ? <Loading /> : (
        <>
          <Navbar />
          <ContentContainer>
            <ModeBar>
              <ModeButton $active={mode === 'spotify'} aria-pressed={mode === 'spotify'} onClick={() => setMode('spotify')}>Spotify 搜索</ModeButton>
              <ModeButton $active={mode === 'manual'} aria-pressed={mode === 'manual'} onClick={() => { setMode('manual'); setAlbumId(null); }}>本地手动制作</ModeButton>
            </ModeBar>
            {mode === 'spotify' && (
              <>
                <Searchbar onSearch={onSearch} />
                {searchError && <Notice role="alert">{searchError}</Notice>}
                {apiError && <Notice role="alert">{apiError}。你仍可切换到“本地手动制作”，上传封面并填写专辑信息。</Notice>}
                {!albumId && <Grid query={query || undefined} onclick={onClickAlbum} onApiError={setApiError} />}
              </>
            )}
            {(mode === 'manual' || albumId) && (
              <>
                <div ref={editorRef} style={{
                  position: 'relative', 
                  top: mode === 'manual' ? '0' : '80px',
                  margin: '0 auto',
                  width: 'fit-content',
                  zIndex: 10,
                  scrollMarginTop: '100px'
                }}> 
                  <label>
                    选择海报尺寸:
                    <StyledSelect
                      value={sizeKey}
                      onChange={(e) => setSizeKey(e.target.value)}
                    >
                      {SIZE_PRESETS.map(preset => (
                        <option key={preset.key} value={preset.key}>{preset.label}</option>
                      ))}
                    </StyledSelect>
                  </label>
                </div>
                <PosterEditor
                  key={mode === 'manual' ? 'manual' : albumId}
                  manual={mode === 'manual'}
                  albumID={albumId}
                  handleClickBack={handleClickBack}
                  onSwitchToManual={() => { setMode('manual'); setAlbumId(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  posterWidth={size.width}
                  posterHeight={size.height}
                  posterRatio={sizeKey}
                />
              </>
            )}
          </ContentContainer>
          <Footer />
        </>
      )}
    </> : <PelicanIntro onEnter={enterSite} />
  );
}

export default App;
