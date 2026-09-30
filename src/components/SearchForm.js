import styled from 'styled-components';

const SearchForm = styled.form`
    height: 50px;
    display: flex;
    align-items: center;
    overflow: hidden;
    border-radius: 15px;
    background: rgba(18, 30, 38, 0.26);
    border: 1px solid rgba(255, 255, 255, 0.24);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    color: #fff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    &:focus-within { border-color: rgba(86, 218, 197, 0.7); background: rgba(18, 30, 38, 0.34); }
    .search-icon {
        flex: none;
        margin-inline: 15px;
        font-size: 1.35em;
        opacity: 0.9;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
    }
    .divider {
        flex: none;
        width: 1px;
        height: 70%;
        background: rgba(255, 255, 255, 0.25);
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
        color: #fff;
        text-shadow: inherit;
        &::placeholder { color: rgba(255, 255, 255, 0.86); opacity: 1; }
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
        color: #fff;
        font-weight: 600;
        text-shadow: inherit;
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
        color: #fff;
        opacity: 0.9;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
        transition: opacity 0.2s, background-color 0.2s;
    }
    button:hover:not(:disabled), button:focus-visible { opacity: 1; background: rgba(255, 255, 255, 0.08); }
    button:disabled { opacity: 0.55; cursor: default; }
    @media (max-width: 480px) {
        .search-icon { margin-inline: 10px; }
        input { margin-left: 10px; font-size: 1em; }
        select { padding-inline: 4px; }
    }
`;

export default SearchForm;
