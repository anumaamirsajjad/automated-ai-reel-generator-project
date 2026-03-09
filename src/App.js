import { useState } from "react";
import Navbar      from "./components/Navbar";
import Dashboard   from "./pages/Dashboard";
import Create      from "./pages/Create";
import Gallery     from "./pages/Gallery";
import Templates   from "./pages/Templates";
import Settings    from "./pages/Settings";

export default function App() {
  const [page, setPage] = useState("Create");

  const renderPage = () => {
    if (page === "Dashboard") return <Dashboard  setPage={setPage} />;
    if (page === "Create")    return <Create                       />;
    if (page === "Gallery")   return <Gallery     setPage={setPage} />;
    if (page === "Templates") return <Templates   setPage={setPage} />;
    if (page === "Settings")  return <Settings                     />;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8f8ff",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <Navbar page={page} setPage={setPage} />
      <main>{renderPage()}</main>
    </div>
  );
}
