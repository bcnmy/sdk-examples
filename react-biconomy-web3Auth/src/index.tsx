import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@biconomy/web3-auth/dist/src/style.css"
import { Web3AuthProvider } from "./contexts/SocialLoginContext";
import { SmartAccountProvider } from "./contexts/SmartAccountContext";

const element = document.getElementById("root");
const root = createRoot(element!);

const Index = () => {
  return (
    <Web3AuthProvider>
      <SmartAccountProvider>
        <App />
      </SmartAccountProvider>
    </Web3AuthProvider>
  );
};

root.render(<Index />);
