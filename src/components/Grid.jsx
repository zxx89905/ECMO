/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Album from "./Album";
import LoadingDiv from "./LoadingDiv";
import { searchSpotifyAlbums } from '../services/spotifyClient';

const Container = styled.div`
    width: 81%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    margin: 0 auto;
    padding: 0;
    box-sizing: border-box;
    gap: 20px;
    justify-content: center;
    justify-items: center;

    @media (max-width: 650px) {
        display: flex;
        overflow-x: scroll;
        gap: 15px;
        flex-direction: column;
        width: 89%;
    }
`;

const LoadMoreButton = styled.button`
    width: 81%;
    margin: 20px auto;
    padding: 8px 17px;
    background-color: #1DB954;
    color: #fff;
    border: none;
    border-radius: 25px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
    display: block;

    &:hover {
        background-color: #1ed760;
    }

    &:disabled {
        background-color: #666;
        cursor: not-allowed;
    }

    @media (max-width: 650px) {
        width: 89%;
    }
`;

const EmptyContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 40px;
    color: #aaa;
`;

const EmptyText = styled.p`
    font-size: 1em;
    font-weight: 600;
    opacity: 0.5;
    margin: 0;
    margin-top: 20px;
`;

const PaginationContainer = styled.div`
    width: 30%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
    margin-inline: auto;
    opacity: ${props => props.$visible ? 1 : 0};
    transform: translateY(${props => props.$visible ? '0' : '10px'});
    transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
                transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
`;

function Grid({ query, onclick, onApiError }) {
    const [albums, setAlbums] = useState([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [previousAlbumsCount, setPreviousAlbumsCount] = useState(0);
    const [showButton, setShowButton] = useState(false);
    const limit = 10;
    const revealTimer = useRef(null);
    const loadMoreController = useRef(null);

    useEffect(() => {
        loadMoreController.current?.abort();
        clearTimeout(revealTimer.current);
        setAlbums([]);
        setOffset(0);
        setHasMore(true);
        setPreviousAlbumsCount(0);
        setShowButton(false);
        setLoadingMore(false);
    }, [query]);

    useEffect(() => () => {
        loadMoreController.current?.abort();
        clearTimeout(revealTimer.current);
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const fetchAlbums = async () => {
            setLoading(true);
            try {
                const data = await searchSpotifyAlbums(query, limit, 0, controller.signal);
                if (controller.signal.aborted) return;
                onApiError?.('');
                const newAlbums = (data.albums?.items || []).filter(Boolean).map(album => ({
                    id: album.id,
                    title: album.name,
                    artist: album.artists?.map(artist => artist.name).join(', '),
                    cover: album.images?.[0]?.url
                }));
                setShowButton(false);
                setPreviousAlbumsCount(0);
                setAlbums(newAlbums);
                clearTimeout(revealTimer.current);
                revealTimer.current = setTimeout(() => setShowButton(true), Math.max(0, newAlbums.length - 1) * 80 + 800);
                const totalResults = data.albums?.total || 0;
                setHasMore(newAlbums.length < totalResults && newAlbums.length === limit);
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error(err);
                onApiError?.(err.message === 'Missing Spotify credentials' || err.message.startsWith('Spotify token:')
                    ? 'Spotify 授权暂时不可用' : 'Spotify 专辑列表暂时无法加载');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        fetchAlbums();
        return () => {
            controller.abort();
            clearTimeout(revealTimer.current);
        };
    }, [query, onApiError]);

    const loadMoreAlbums = async () => {
        if (!hasMore || loadingMore) return;

        const newOffset = offset + limit;
        const controller = new AbortController();
        loadMoreController.current = controller;
        try {
            setLoadingMore(true);
            const data = await searchSpotifyAlbums(query, limit, newOffset, controller.signal);
            if (controller.signal.aborted) return;
            onApiError?.('');
            const albumsData = (data.albums?.items || []).filter(album => album !== null && album !== undefined);
            
            const newAlbums = albumsData.map(album => ({
                id: album.id,
                title: album.name,
                artist: album.artists?.map(artist => artist.name).join(', '),
                cover: album.images?.[0]?.url
            }));

            setShowButton(false);
            setPreviousAlbumsCount(albums.length);
            setAlbums(prevAlbums => [...prevAlbums, ...newAlbums]);
            setOffset(newOffset);

            const lastAlbumDelay = (newAlbums.length - 1) * 80;
            const animationDuration = 800;
            clearTimeout(revealTimer.current);
            revealTimer.current = setTimeout(() => {
                setShowButton(true);
            }, Math.max(0, lastAlbumDelay) + animationDuration);

            const totalResults = data.albums?.total || 0;
            const currentTotal = albums.length + newAlbums.length;
            setHasMore(currentTotal < totalResults && newAlbums.length === limit);
            
        } catch (err) {
            if (controller.signal.aborted) return;
            console.error(err);
            onApiError?.('Spotify 后续结果暂时无法加载');
        } finally {
            if (!controller.signal.aborted) setLoadingMore(false);
        }
    };
    

    return (
        <>
            {loading && albums.length === 0 ? (
                <LoadingDiv/>
            ) : !loading && albums.length === 0 ? (
                <EmptyContainer>
                    <EmptyText>No results found</EmptyText>
                </EmptyContainer>
            ) : (
                <>
                    <Container>
                        {albums.map((album, index) => {
                            const relativeIndex = index >= previousAlbumsCount ? index - previousAlbumsCount : index;
                            return (
                                <Album 
                                    key={album.id} 
                                    onClick={() => onclick(album.id)} 
                                    cover={album.cover} 
                                    title={album.title} 
                                    artist={album.artist} 
                                    id={album.id}
                                    animationDelay={relativeIndex * 80}
                                />
                            );
                        })}
                    </Container>
                    {hasMore && (
                        <PaginationContainer $visible={showButton}>
                            <LoadMoreButton 
                                onClick={loadMoreAlbums} 
                                disabled={loadingMore}
                            >
                                {loadingMore ? "Loading..." : "Load More"}
                            </LoadMoreButton>
                        </PaginationContainer>
                    )}
                </>
            )}
        </>
    );
}

export default Grid;
