/* eslint-disable react/prop-types */
import styled from 'styled-components';
import { FaSearch } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const Container = styled.div`
    width: 100%;
`

const Bar = styled.form`
    background-color: rgba(255, 255, 255, 0.05);
    width: 80%;
    margin-inline: auto;
    height: 50px;
    margin-block: 20px;
    border-radius: 15px;
    display: flex;
    flex-direction: row;
    align-items: center;

    @media (max-width: 900px) {
        width: 90%;
    }
`

const SearchIcon = styled(FaSearch)`
    font-size: 1.35em;
    opacity: .25;
    margin-inline: 15px;
`
const SendIcon = styled(IoSend)`
    font-size: 1.35em;
`
const SearchButton = styled.button`
    display: grid;
    place-items: center;
    flex: none;
    width: 50px;
    height: 50px;
    border: 0;
    border-radius: 0 15px 15px 0;
    background: transparent;
    opacity: 0.6;
    cursor: pointer;
    transition: opacity 0.2s, background-color 0.2s;

    &:hover, &:focus{
        opacity: 1;
        background: rgba(255, 255, 255, 0.08);
    }
`
const Spanbar = styled.span`
    width: 1px;
    height: 70%;
    opacity: 0.1;
    background-color: white;
`

const Input = styled.input`
    background-color: transparent;
    text-decoration: none;
    border: none;
    margin-left: 15px;
    font-size: 1.2em;
    font-weight: 600;
    outline: none;
    opacity: 0.77;
    width: 100%;
    min-width: 0;
    flex: 1;
`

function Searchbar({ onSearch }) {
    const { t } = useTranslation();
    const [searchValue, setSearchValue] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        onSearch(searchValue.trim());
    };

    return (
        <Container>
            <Bar onSubmit={handleSubmit}>
                <SearchIcon />
                <Spanbar />
                <Input
                    type="search"
                    aria-label={t('SearchPlaceholder')}
                    placeholder={t('SearchPlaceholder')}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
                <SearchButton type="submit" aria-label={t('SearchSubmit')}><SendIcon /></SearchButton>
            </Bar>
        </Container>
    );
}

export default Searchbar;
