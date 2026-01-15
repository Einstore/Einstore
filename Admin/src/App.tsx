import { AlertsProvider } from "./lib/alerts";
import { I18nProvider } from "./lib/i18n";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <I18nProvider>
      <AlertsProvider>
        <AppRoutes />
      </AlertsProvider>
    </I18nProvider>
  );
};

export default App;
