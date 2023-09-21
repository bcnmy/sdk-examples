import { useEffect, useState } from "react";
import { Magic } from "magic-sdk";
import SmartAccount from "@biconomy/smart-account";
import { ethers } from "ethers";

const magic = new Magic("pk_live_3247E1E1BB785715", {
  network: "goerli",
});

function App() {
  const [account, setAccount] = useState("");
  const [eoaLoading, setEoaLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [scwLoading, setScwLoading] = useState(false);
  const [scwAddress, setScwAddress] = useState("");
  const [smartAccount, setSmartAccount] = useState<any>(null);
  const [txHash, setTxHash] = useState("");

  // for magic link
  const connect = async () => {
    try {
      setDisabled(true);
      const accounts = await magic.wallet.connectWithUI();
      setDisabled(false);
      console.log("Logged in user:", accounts[0]);
      localStorage.setItem("user", accounts[0]);
      setAccount(accounts[0]);
    } catch (error) {
      setDisabled(false);
      console.error(error);
    }
  };
  const disconnect = async () => {
    await magic.wallet.disconnect();
    localStorage.removeItem("user");
    setAccount("");
  };

  // for smart-account
  const getSmartAccount = async () => {
    if (magic.rpcProvider === undefined) return;
    const provider = new ethers.providers.Web3Provider(
      magic.rpcProvider as any
    );
    const wallet = new SmartAccount(provider, {
      debug: false,
      activeNetworkId: 80001,
      supportedNetworksIds: [80001],
      networkConfig: [
        {
          chainId: 80001,
          dappAPIKey: "59fRCMXvk.8a1652f0-b522-4ea7-b296-98628499aee3",
        },
      ],
    });
    await wallet.init();
    setScwAddress(wallet.address);
    setSmartAccount(wallet);
  };
  const doAATX = async () => {
    setScwLoading(true);
    const nftInterface = new ethers.utils.Interface([
      "function safeMint(address _to)",
    ]);
    const data = nftInterface.encodeFunctionData("safeMint", [
      smartAccount.address,
    ]);
    const nftAddress = "0xdd526eba63ef200ed95f0f0fb8993fe3e20a23d0"; // nft contract for goerli and mumbai
    const tx = {
      to: nftAddress,
      data: data,
      value: 0,
    };
    // Transaction events subscription
    smartAccount.on("txHashGenerated", (response: any) => {
      console.log("txHashGenerated event received via emitter", response);
    });
    smartAccount.on("txMined", (response: any) => {
      console.log("txMined event received via emitter", response);
    });
    smartAccount.on("error", (response: any) => {
      console.log("error event received via emitter", JSON.stringify(response));
    });
    // Sending transaction
    const txResponse = await smartAccount.sendGaslessTransaction({
      transaction: tx,
    });
    console.log("Tx Response", txResponse);
    const txReciept = await txResponse.wait();
    console.log("Tx hash", txReciept.transactionHash);
    setScwLoading(false);
  };

  return (
    <main className="App">
      <h1>Biconomy SDK + Magic Link</h1>
      <button onClick={!account ? connect : disconnect} disabled={disabled}>
        {!account ? "Connect Wallet" : "Disconnect Wallet"}
      </button>

      {eoaLoading && <h2>Loading EOA...</h2>}

      {account && (
        <div>
          <h2>EOA Address</h2>
          <p>{account}</p>
        </div>
      )}
      {account && <button onClick={getSmartAccount}>Load SmartAccount</button>}

      {smartAccount && account && (
        <div>
          <h2>Smart Account Address</h2>
          <p>{smartAccount.address}</p>
        </div>
      )}

      {smartAccount && account && (
        <button onClick={doAATX} disabled={scwLoading}>
          Gasless Trx
        </button>
      )}
      {scwLoading && <h2>Minting Nft...</h2>}

      {txHash && (
        <div>
          <h2>Transaction Hash</h2>
          <p>{txHash}</p>
        </div>
      )}
    </main>
  );
}

export default App;
