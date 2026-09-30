/* eslint-disable react/prop-types */
import styled from 'styled-components';
import { FaSearch } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import SearchForm from './SearchForm';

const Container = styled.div`
    width: 100%;
`

const Bar = styled(SearchForm)`
    width: 80%;
    margin-inline: auto;
    margin-block: 20px;

    @media (max-width: 900px) {
        width: 90%;
    }
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
                <FaSearch className="search-icon" aria-hidden="true" />
                <span className="divider" aria-hidden="true" />
                <input
                    type="search"
                    aria-label={t('SearchPlaceholder')}
                    placeholder={t('SearchPlaceholder')}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
                <button type="submit" aria-label={t('SearchSubmit')}><IoSend aria-hidden="true" /></button>
            </Bar>
        </Container>
    );
}

export default Searchbar;
