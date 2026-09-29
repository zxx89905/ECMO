import { useEffect, useRef } from 'react';
import styled from 'styled-components';

const IntroFrame = styled.iframe`
  position: fixed;
  inset: 0;
  z-index: 1000;
  width: 100%;
  height: 100%;
  border: 0;
  background: #f8f3e7;
`;

// The animation runs in an isolated frame; only its eye button can enter the app.
// eslint-disable-next-line react/prop-types
function PelicanIntro({ onEnter }) {
  const frameRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source === frameRef.current?.contentWindow && event.data?.type === 'ecmo:intro:enter') {
        onEnter();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEnter]);

  return <IntroFrame
    ref={frameRef}
    src={`${import.meta.env.BASE_URL}pelican-intro.html`}
    title="鹈鹕骑自行车入口页，点击鹈鹕的眼睛进入海报网站"
    sandbox="allow-scripts"
  />;
}

export default PelicanIntro;
