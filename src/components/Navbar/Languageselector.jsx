import { useState, useEffect } from "react"
import styled from "styled-components"
import ReactCountryFlag from "react-country-flag"
import { useTranslation } from "react-i18next"

const LanguageSelectorContainer = styled.div`
  position: relative;
`

const FlagButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px; /* 由圆形改为略微圆角的长方形，可以用0改为直角 */
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`

const FlagWrapper = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 6px; /* 由50%改为6px或0，长方形 */
  width: 2.5em;
  height: 1.5em; /* 更接近国旗比例 */
  display: flex;
  align-items: center;
  justify-content: center;
  
  & > span {
    transform: scale(1.2);
    width: 100%!important;
    height: 100%!important;
    object-fit: cover;
    border-radius: 0!important;
  }
`

const DropdownMenu = styled.div`
  position: absolute;
  right: 0;
  margin-top: 8px;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 50;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const Triangle = styled.div`
  position: absolute;
  top: 0;
  right: 20px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid rgba(0, 0, 0, 0.9);
  transform: translateY(-100%);
`

const DropdownContent = styled.div`
  padding: 8px 4px;
`

const LanguageOption = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: white;
  font-size: 14px;
  text-align: left;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`

const FlagIcon = styled(ReactCountryFlag)`
  margin-right: 8px;
  width: 2em !important;
  height: 1.3em !important;
  border-radius: 4px !important;
  object-fit: cover;
  /* 由圆形变成长方形 */
`

function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const { i18n } = useTranslation()

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage)
    }

    const handleClickOutside = (e) => {
      if (!e.target.closest(".language-selector")) {
        setIsOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [i18n])

  const toggleDropdown = (e) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem("language", lang)
    setIsOpen(false)
  }

  // 当前国旗：中文 -> 中国国旗；英文 -> 英国国旗（GB）；其他默认 GB
  const getCurrentFlag = () => {
    switch (i18n.language) {
      case "zh":
        return "CN"
      case "en":
        return "GB"
      default:
        return "GB"
    }
  }

  return (
    <LanguageSelectorContainer className="language-selector">
      <FlagButton onClick={toggleDropdown} aria-label="Select language">
        <FlagWrapper>
          <ReactCountryFlag countryCode={getCurrentFlag()} svg style={{ width: "100%", height: "100%" }} />
        </FlagWrapper>
      </FlagButton>

      {isOpen && (
        <DropdownMenu>
          <Triangle />
          <DropdownContent>
            <LanguageOption onClick={() => changeLanguage("zh")}>
              <FlagIcon countryCode="CN" svg />
              中文
            </LanguageOption>
            <LanguageOption onClick={() => changeLanguage("en")}>
              <FlagIcon countryCode="GB" svg />
              English
            </LanguageOption>
          </DropdownContent>
        </DropdownMenu>
      )}
    </LanguageSelectorContainer>
  )
}

export default LanguageSelector