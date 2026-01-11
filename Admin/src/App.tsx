import { AlertsProvider } from "./lib/alerts";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <AlertsProvider>
      <AppRoutes />
    </AlertsProvider>
  );
};

export default App;
