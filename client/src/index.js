import React from "react";
import ReactDOM from "react-dom/client"; // Use the 'client' from react-dom for React 18
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

// Create a root using ReactDOM.createRoot
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the App component inside the root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
