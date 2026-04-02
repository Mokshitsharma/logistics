import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import BookingPage from "./pages/BookingPage";
import UserWalletPage from "./pages/UserWalletPage";
import CaptainDashboard from "./pages/CaptainDashboard";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/wallet" element={<UserWalletPage />} />
          <Route path="/captain" element={<CaptainDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Layout>
    </Router>
  );
}
