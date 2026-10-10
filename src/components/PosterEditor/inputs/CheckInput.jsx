/* eslint-disable react/prop-types */
import styled from "styled-components";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    margin: 10px;
`;

const Title = styled.p`
    font-size: 1em;
    font-weight: 500;
    margin-left: 5px;
    margin-bottom: 5px;
`;

const InputBox = styled.label`
    font-size: 0.85em;
    background-color: rgba(255, 255, 255, 0.05);
    border: none;
    padding: 5px;
    border-radius: 7px;
    outline: none;
    overflow: hidden;
    display: flex;
    align-items: center;
    cursor: ${({ $disabled }) => $disabled ? 'default' : 'pointer'};
    opacity: ${({ $disabled }) => $disabled ? 0.55 : 1};
`;

const Input = styled.input`
    appearance: none;
    width: 16px;
    height: 16px;
    margin-left: 10px;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.1);
    outline: none;
    cursor: pointer;
    transition: background-color 0.3s;

    &:checked {
        background-color: var(--PosterfyGreen);
    }
    &:disabled { cursor: default; }
    &:focus-visible { outline: 2px solid var(--PosterfyGreen); outline-offset: 2px; }
`;

// ✅ 修复：这里改成 $active
const Text = styled.span`
    font-size: 0.85em;
    font-weight: bold;
    margin-left: 10px;
    margin-block: auto;
    cursor: pointer;
    opacity: ${({ $active }) => ($active ? 1 : 0.5)};
    transition: opacity 0.3s;
`;

function CheckInput({ title, text, value, onChange, disabled = false }) {
    return (
        <Container>
            <Title>{title}</Title>
            <InputBox $disabled={disabled}>
                <Input 
                    checked={value}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.checked)}
                    type="checkbox"
                />
                {/* ✅ 修复：这里改成 $active */}
                <Text $active={value}>{text}</Text>
            </InputBox>
        </Container>
    );
}

export default CheckInput;
