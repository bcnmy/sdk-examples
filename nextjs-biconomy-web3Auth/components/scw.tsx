import styles from "../styles/Home.module.css";
import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { ChainId } from "@biconomy/core-types";
import SocialLogin from "@biconomy/web3-auth";
import SmartAccount from "@biconomy/smart-account";
import { usePrivy, useWallets } from "@privy-io/react-auth";

const Home = () => {
  const {ready, authenticated, login, logout} = usePrivy();
  const {wallets} = useWallets();
  const [provider, setProvider] = useState<any>();
  const [account, setAccount] = useState<string>();
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null);
  const [scwAddress, setScwAddress] = useState("");
  const [scwLoading, setScwLoading] = useState(false);
  const [socialLoginSDK, setSocialLoginSDK] = useState<SocialLogin | null>(
    null
  );

  const onCreateSmartAccount = async () => {
    const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
    const provider = await embeddedWallet?.getEthersProvider();
    if (!provider) {
      console.error('Unable to retrieve ethers provider from embedded wallet.');
      return;
    }
    let options = {
      activeNetworkId: ChainId.GOERLI,
      supportedNetworksIds: [ ChainId.GOERLI ]}

     let smartAccount = new SmartAccount(provider, options);
     smartAccount = await smartAccount.init();

  }
  // // if wallet already connected close widget
  // useEffect(() => {
  //   console.log("hidelwallet");
  //   if (socialLoginSDK && socialLoginSDK.provider) {
  //     socialLoginSDK.hideWallet();
  //   }
  // }, [account, socialLoginSDK]);

  // // after metamask login -> get provider event
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     if (account) {
  //       clearInterval(interval);
  //     }
  //     if (socialLoginSDK?.provider && !account) {
  //       connectWeb3();
  //     }
  //   }, 1000);
  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [account, connectWeb3, socialLoginSDK]);

  // const disconnectWeb3 = async () => {
  //   if (!socialLoginSDK || !socialLoginSDK.web3auth) {
  //     console.error("Web3Modal not initialized.");
  //     return;
  //   }
  //   await socialLoginSDK.logout();
  //   socialLoginSDK.hideWallet();
  //   setProvider(undefined);
  //   setAccount(undefined);
  //   setScwAddress("");
  // };

  // useEffect(() => {
  //   async function setupSmartAccount() {
  //     setScwAddress("");
  //     setScwLoading(true);
  //     const smartAccount = new SmartAccount(provider, {
  //       activeNetworkId: ChainId.GOERLI,
  //       supportedNetworksIds: [ChainId.GOERLI],
  //     });
  //     await smartAccount.init();
  //     const context = smartAccount.getSmartAccountContext();
  //     setScwAddress(context.baseWallet.getAddress());
  //     setSmartAccount(smartAccount);
  //     setScwLoading(false);
  //   }
  //   if (!!provider && !!account) {
  //     setupSmartAccount();
  //     console.log("Provider...", provider);
  //   }
  // }, [account, provider]);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1>Biconomy SDK Next.js Web3Auth Example</h1>
        <button disabled={!ready} onClick={!authenticated ? login : logout}>
          {!authenticated ? "Login" : "Logout"}
        </button>
        {(ready && authenticated) && (
          <button onClick={onCreateSmartAccount}>
            Create smart account
          </button>
        )}

        {account && (
          <div>
            <h2>EOA Address</h2>
            <p>{account}</p>
          </div>
        )}

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
