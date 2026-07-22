import { Route, Routes } from 'react-router-dom';
import DesignFoundationsPage from './pages/DesignFoundationsPage';
import { AnalyticsDashboardPage } from './pages/AnalyticsDashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DesignFoundationsPage />} />
      <Route path="/analytics" element={<AnalyticsDashboardPage />} />
    </Routes>
  );
}

export default App;
