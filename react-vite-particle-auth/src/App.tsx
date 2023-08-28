import { useState, useEffect } from "react";
import {
  ParticleAuthModule,
  ParticleProvider,
  BiconomyAccountModule,
} from "@biconomy-devx/particle-auth";
import { ethers } from "ethers";

const particle = new ParticleAuthModule.ParticleNetwork({
  projectId: "dc8fc110-da0e-4b55-b4c6-04af3aa9cb99",
  clientKey: "cZmQiTMX9UJdPf7Dw9aA65d7skboxDqOAJXzzepq",
  appId: "d461bb0f-9ddb-4f26-981e-a82f574d11af",
  chainName: "Ethereum", //optional: current chain name, default Ethereum.
  chainId: 5, //optional: current chain id, default 1.
  wallet: {
    //optional: by default, the wallet entry is displayed in the bottom right corner of the webpage.
    displayWalletEntry: true, //show wallet entry when connect particle.
    defaultWalletEntryPosition: ParticleAuthModule.WalletEntryPosition.BR, //wallet entry position
    uiMode: "dark", //optional: light or dark, if not set, the default is the same as web auth.
    supportChains: [
      { id: 1, name: "Ethereum" },
      { id: 5, name: "Ethereum Goerli" },
    ], // optional: web wallet support chains.
    customStyle: {}, //optional: custom wallet style
  },
});
function App() {
  const [account, setAccount] = useState("");
  const [eoaLoading, setEoaLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [scwLoading, setScwLoading] = useState(false);
  const [scwAddress, setScwAddress] = useState("");
  const [smartAccount, setSmartAccount] = useState<any>(null);
  const [txHash, setTxHash] = useState("");

  // for particle auth
  const connect = async () => {
    try {
      setDisabled(true);
      const userInfo = await particle.auth.login();
      console.log("Logged in user:", userInfo);
      const particleProvider = new ParticleProvider(particle.auth);
      const ethersProvider = new ethers.providers.Web3Provider(
        particleProvider,
        "any"
      );
      const accounts = await ethersProvider.listAccounts();
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
    localStorage.removeItem("user"); // Remove user from local storage
    setAccount(""); // Reset the account state
  };

  // for smart-account
  const getSmartAccount = async () => {
    if (particle.auth === undefined) return;
    const particleProvider = new ParticleProvider(particle.auth);
    const wallet = new BiconomyAccountModule.SmartAccount(particleProvider, {
      projectId: "dc8fc110-da0e-4b55-b4c6-04af3aa9cb99",
      clientKey: "cZmQiTMX9UJdPf7Dw9aA65d7skboxDqOAJXzzepq",
      appId: "d461bb0f-9ddb-4f26-981e-a82f574d11af",
      networkConfig: [
        {
          dappAPIKey: "Y3IP08j-B.b36406f9-26f3-4ddd-b590-1c872ada1b81",
          chainId: 5,
        },
      ],
    });
    // AA address
    const address = await wallet.getAddress();
    // EOA address
    // const address = await smartAccount.getOwner();
    // load account more info.
    // const accountInfo = await smartAccount.getAccount();
    setScwAddress(address);
    setSmartAccount(wallet);
  };

  const doAATX = async () => {
    setScwLoading(true);
    const nftInterface = new ethers.utils.Interface([
      "function safeMint(address _to)",
    ]);
    const data = nftInterface.encodeFunctionData("safeMint", [scwAddress]);
    const nftAddress = "0xdd526eba63ef200ed95f0f0fb8993fe3e20a23d0"; // nft contract for goerli and mumbai
    const tx = {
      to: nftAddress,
      data: data,
      value: 0,
    };
    const wrapProvider = new BiconomyAccountModule.BiconomyWrapProvider(
      smartAccount,
      BiconomyAccountModule.SendTransactionMode.Gasless
    );
    const provider = new ethers.providers.Web3Provider(wrapProvider, "any");
    const signer = provider.getSigner();
    const txResponse = await signer.sendTransaction(tx);
    console.log("Tx Response", txResponse);
    const txReceipt = await txResponse.wait();
    console.log("Tx hash", txReceipt.transactionHash);
    setTxHash(txReceipt.transactionHash);
    setScwLoading(false);
  };

  useEffect(() => {
    // Reset txHash when the account state changes
    setTxHash("");
  }, [account]);

  return (
    <main className="App">
      <h1>Biconomy ↔ Particle Auth</h1>
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
          <p>{scwAddress}</p>
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
          <a
            href={`https://goerli.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <p>{txHash}</p>
          </a>
        </div>
      )}
    </main>
  );
}

export default App;
