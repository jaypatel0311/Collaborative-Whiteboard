// client/src/App.tsx
import React from "react";
import { Whiteboard } from "./components/Whiteboard";
import "./App.css";

function App() {
  return (
    <div className="App">
      <h1>Collaborative Whiteboard</h1>
      <Whiteboard />
    </div>
  );
}

export default App;
