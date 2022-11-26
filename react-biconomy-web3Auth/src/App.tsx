import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { useSmartAccountContext } from "./contexts/SmartAccountContext";
import { useWeb3AuthContext } from "./contexts/SocialLoginContext";
import Button from "./components/Button";

const App: React.FC = () => {
  const classes = useStyles();
  const {
    address,
    loading: eoaLoading,
    userInfo,
    connect,
    disconnect,
    getUserInfo,
  } = useWeb3AuthContext();
  const {
    selectedAccount,
    loading: scwLoading,
    setSelectedAccount,
  } = useSmartAccountContext();

  console.log("address", address);

  return (
    <div className={classes.bgCover}>
      <main className={classes.container}>
        <h1>Biconomy SDK React Web3Auth Example</h1>
        <Button
          onClickFunc={
            !address
              ? connect
              : () => {
                  setSelectedAccount(null);
                  disconnect();
                }
          }
          title={!address ? "Connect Wallet" : "Disconnect Wallet"}
        />

        {eoaLoading && <h2>Loading EOA...</h2>}

        {address && (
          <div>
            <h2>EOA Address</h2>
            <p>{address}</p>
          </div>
        )}

        {scwLoading && <h2>Loading Smart Account...</h2>}

        {selectedAccount && address && (
          <div>
            <h2>Smart Account Address</h2>
            <p>{selectedAccount.smartAccountAddress}</p>
          </div>
        )}

        {address && (
          <Button onClickFunc={() => getUserInfo()} title="Get User Info" />
        )}

        {userInfo && (
          <div style={{ maxWidth: 800, wordBreak: "break-all" }}>
            <h2>User Info</h2>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
};

const useStyles = makeStyles(() => ({
  bgCover: {
    backgroundColor: "#1a1e23",
    backgroundSize: "cover",
    width: "100%",
    minHeight: "100vh",
    color: "#fff",
    fontStyle: "italic",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minHeight: "80vh",
    height: 'auto',
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: 50,
    fontSize: 60,
    background: "linear-gradient(90deg, #12ECB8 -2.21%, #00B4ED 92.02%)",
    "-webkit-background-clip": "text",
    "-webkit-text-fill-color": "transparent",
  },
  animateBlink: {
    animation: "$bottom_up 2s linear infinite",
    "&:hover": {
      transform: "scale(1.2)",
    },
  },
  "@keyframes bottom_up": {
    "0%": {
      transform: "translateY(0px)",
    },
    "25%": {
      transform: "translateY(20px)",
    },
    "50%": {
      transform: "translateY(0px)",
    },
    "75%": {
      transform: "translateY(-20px)",
    },
    "100%": {
      transform: "translateY(0px)",
    },
  },
}));

export default App;
