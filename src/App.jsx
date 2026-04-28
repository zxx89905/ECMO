import { searchAlbums, getAlbum } from './spotify.js'
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar/Navbar';
import Searchbar from './components/Searchbar';
import { useState, useEffect } from 'react';
import styled from "styled-components";
import Loading from './components/Loading';
import Footer from './components/Footer';
import Grid from './components/Grid';
import PosterEditor from './components/PosterEditor/PosterEditor';

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

function App() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [albumId, setAlbumId] = useState(null);

  const [sizeKey, setSizeKey] = useState("A尺寸");
  const size = SIZE_PRESETS.find(s => s.key === sizeKey) || SIZE_PRESETS[0];

  function onClickAlbum(id) {
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

  const onSearch = (newQuery) => setQuery(newQuery);

  return (
    <>
      {loading ? <Loading /> : (
        <>
          <Navbar />
          <ContentContainer>
            <Searchbar onSearch={onSearch} />
            {query && <Grid query={query} onclick={onClickAlbum} />}
            <div style={{ display: query ? 'none' : 'block' }}>
              <Grid onclick={onClickAlbum} />
            </div>
            {albumId && (
              <>
                <div style={{ 
                  position: 'relative', 
                  top: '80px',
                  margin: '0 auto',
                  width: 'fit-content',
                  zIndex: 10
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
                  albumID={albumId}
                  handleClickBack={handleClickBack}
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
    </>
  );
}

export default App;