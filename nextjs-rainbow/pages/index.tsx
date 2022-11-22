import styles from "../styles/Home.module.css";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
import { ChainId } from "@biconomy/core-types";
import SmartAccount from "@biconomy/smart-account";
import { useAccount, useSigner } from "wagmi";

const Home = () => {
  const { data: signer } = useSigner();
  const { address } = useAccount();
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null);
  const [scwAddress, setScwAddress] = useState("");
  const [scwLoading, setScwLoading] = useState(false);

  const sAddress = smartAccount?.address;
  console.log("address", sAddress);

  useEffect(() => {
    async function setupSmartAccount() {
      setScwAddress("");
      setScwLoading(true);
      const walletProvider = new ethers.providers.Web3Provider(
        (signer?.provider as any).provider
      );
      const smartAccount = new SmartAccount(walletProvider, {
        activeNetworkId: ChainId.GOERLI,
        supportedNetworksIds: [ChainId.GOERLI],
      });
      await smartAccount.init();
      const context = smartAccount.getSmartAccountContext();
      setScwAddress(context.baseWallet.getAddress());
      setSmartAccount(smartAccount);
      setScwLoading(false);
    }
    if (!!signer?.provider && !!address) {
      setupSmartAccount();
      console.log("Provider...", signer?.provider);
    }
  }, [address, signer?.provider]);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1>Biconomy SDK Next.js Ranibow Example</h1>
        <ConnectButton />

        {scwLoading && <h2>Loading Smart Account...</h2>}

        {scwAddress && (
          <div>
            <h2>Smart Account Address</h2>
            <p>{scwAddress}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
