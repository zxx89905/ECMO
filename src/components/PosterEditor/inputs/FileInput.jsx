/* eslint-disable react/prop-types */
import styled from "styled-components";
import { FaFile } from "react-icons/fa6";

const Container = styled.label`
    display: flex;
    flex-direction: column;
    margin: 10px;
    cursor: pointer;
`;

const Title = styled.p`
    font-size: 1em;
    font-weight: 500;
    margin-left: 5px;
    margin-bottom: 5px;
`;

const InputBox = styled.div`
    position: relative;
    font-size: 0.85em;
    background-color: rgba(255, 255, 255, 0.05);
    border: none;
    padding: 5px;
    border-radius: 7px;
    outline: none;
    overflow: hidden;
    display: flex;
    align-items: center;
`;

const Input = styled.input`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
`;

// ✅ 修复：active → $active
const Text = styled.p`
    font-size: 0.85em;
    font-weight: bold;
    margin-left: 10px;
    margin-block: auto;
    cursor: pointer;
    opacity: ${({ $active }) => ($active ? 1 : 0.5)};
    transition: opacity 0.3s;
    width: 100%;
    margin-right: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const IconFile = styled(FaFile)`
    width: 16px;
    height: 16px;
    margin-left: 10px;
`

function FileInput({ title, text, onChange }) {
    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onChange(file);
            e.target.value = '';
        }
    };

    return (
        <Container>
            <Title>{title}</Title>
            <InputBox>
                <IconFile />
                <Input
                    type="file"
                    accept="image/*"
                    aria-label={title}
                    onChange={handleChange}
                />
                {/* ✅ 修复：active → $active */}
                <Text $active={true}>{text}</Text>
            </InputBox>
        </Container>
    );
}

export default FileInput;
