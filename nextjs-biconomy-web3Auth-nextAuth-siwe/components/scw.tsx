import styles from "../styles/Home.module.css";
import { useCallback, useEffect, useState, useMemo } from "react";
import { ethers } from "ethers";
import { ChainId } from "@biconomy/core-types";
import SocialLogin from "@biconomy/web3-auth";
import SmartAccount from "@biconomy/smart-account";

import { useSession, signIn, signOut, getCsrfToken } from "next-auth/react";
import { SiweMessage } from "siwe";
import { useNetwork } from "wagmi";
import useBiconomyStore from "../store/useBiconomyStore";

const Home = (req: any, res: any) => {
  const { chain } = useNetwork();
  const { data: session, status } = useSession();

  const setProviderAndAccount = useBiconomyStore.use.setProviderAndAccount();
  const smartAccountLoading = useBiconomyStore.use.smartAccountLoading();
  // const provider = useBiconomyStore.use.provider();
  const smartAccountAddress = useBiconomyStore.use.smartAccountAddress();
  const account = useBiconomyStore.use.account();
  const setSmartAccount = useBiconomyStore.use.setSmartAccount();
  const resetBiconomyStore = useBiconomyStore.use.reset();
  const signer = useBiconomyStore.use.signer();

  // wrap the initialization of 'sdk' in its own useMemo() to avoid rerender
  const sdk = useMemo(() => new SocialLogin(), []);
  const Mumbai = 80001;

  // init biconomy sdk on load, if get provider means user is logged in so init provider and account
  useEffect(() => {
    const handleLogin = async () => {
      try {
        if (!account || !signer) throw new Error("No account or signer");
        const message = new SiweMessage({
          domain: window.location.host,
          address: account as string,
          statement: "Sign in with Ethereum to the app.",
          uri: window.location.origin,
          version: "1",
          chainId: Mumbai,
          nonce: await getCsrfToken(),
        });
        const signature = await signer?.signMessage(message.prepareMessage());
        signIn("credentials", {
          message: JSON.stringify(message),
          redirect: false,
          signature,
          callbackUrl: window.location.href,
        });
      } catch (error) {
        console.error(error);
      }
    };
    const init = async () => {
      await sdk.init({
        chainId: ethers.utils.hexValue(Mumbai),
      });
      // TODO handle case where next auth or biconomy session is expired
      if (sdk.provider) {
        await setProviderAndAccount(sdk);
        await setSmartAccount(Mumbai as ChainId);
        if (!session) await handleLogin();
      }
    };
    init().catch(console.error);
  }, [
    sdk,
    sdk.provider,
    session,
    signer,
    account,
    setProviderAndAccount,
    setSmartAccount,
  ]);

  // user intend to log in, show wallet widget
  const connectWeb3 = useCallback(async () => {
    sdk.showWallet();
  }, [sdk]);

  // get the event after biconomy wallet is connected
  useEffect(() => {
    const interval = setInterval(async () => {
      if (account) {
        clearInterval(interval);
        sdk.hideWallet();
      }
      if (sdk?.provider && !account) {
        setProviderAndAccount(sdk);
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [account, setProviderAndAccount, sdk]);

  const disconnectWeb3 = async () => {
    await sdk.logout();
    sdk.hideWallet();
    resetBiconomyStore();
    // signout from next auth
    signOut();
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1>Biconomy SDK Next.js Web3Auth Example</h1>
        <button onClick={!account ? connectWeb3 : disconnectWeb3}>
          {!account ? "Connect Wallet" : "Disconnect Wallet"}
        </button>

        {session && (
          <h2>
            Signed in with Next Auth as {session.user?.id} <br />
          </h2>
        )}

        {account && (
          <div>
            <h2>EOA Address</h2>
            <p>{account}</p>
          </div>
        )}

        {smartAccountLoading && <h2>Loading Smart Account...</h2>}

        {smartAccountAddress && (
          <div>
            <h2>Smart Account Address</h2>
            <p>{smartAccountAddress}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
