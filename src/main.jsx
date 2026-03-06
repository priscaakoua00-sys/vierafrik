import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{padding:"40px", color:"white", fontFamily:"Arial"}}>
      <h1>VierAfrik fonctionne !</h1>
      <p>Le déploiement Vercel est réussi.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
