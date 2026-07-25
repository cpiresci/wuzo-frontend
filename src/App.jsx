import { useTranslation } from "react-i18next";
import Ticker from "./components/Ticker";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";

export default function App() {
  const { t } = useTranslation();
  return (
    <>
      <Ticker />
      <div className="shell">
        <Header />
        <p className="wz-note">{t("shell_note")}</p>
      </div>
      <AuthModal />
    </>
  );
}
