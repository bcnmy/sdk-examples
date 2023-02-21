import styles from "../styles/Home.module.css";
import { useCallback, useEffect, useState, useMemo } from "react";
import { ethers } from "ethers";
import { ChainId } from "@biconomy/core-types";
import SocialLogin from "@biconomy/web3-auth";

import { useSession, signIn, signOut, getCsrfToken } from "next-auth/react";
import { SiweMessage } from "siwe";
import { useNetwork } from "wagmi";
import useBiconomyStore from "../store/useBiconomyStore";

const Home = (req: any, res: any) => {
  const { chain } = useNetwork();
  const { data: session, status } = useSession();

  const smartAccountLoading = useBiconomyStore.use.smartAccountLoading();
  const smartAccountAddress = useBiconomyStore.use.smartAccountAddress();
  const setupBiconomy = useBiconomyStore.use.setupBiconomy();
  const account = useBiconomyStore.use.account();
  const resetBiconomyStore = useBiconomyStore.use.reset();

  // wrap the initialization of 'sdk' in its own useMemo() to avoid rerender
  const sdk = useMemo(() => new SocialLogin(), []);
  const Mumbai = 80001;

  // signin with siwe to provide a JWT through next-auth
  const handleSiwe = useCallback(async () => {
    try {
      // here mean waiting for smart account to be setup
      if (!account || !window.biconomySmartAccount) return;
      const signer = window.biconomySmartAccount.getsigner();
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
  }, [account]);

  const handleBiconomy = useCallback(async () => {
    if (!window.biconomySocialLogin) {
      await sdk.init({
        chainId: ethers.utils.hexValue(Mumbai),
      });
      // store the sdk on the window object
      window.biconomySocialLogin = sdk;
      console.log("initial setup of sdk", window.biconomySocialLogin);
    }
    if (!window.biconomySmartAccount && window.biconomySocialLogin.provider) {
      await setupBiconomy(Mumbai as ChainId);
      console.log("smartAccount", window.biconomySmartAccount);
    }
  }, [sdk, setupBiconomy]);

  // init biconomy sdk on load, if get provider means user is logged in so init provider and account
  useEffect(() => {
    const init = async () => {
      // TODO handle case where next auth or biconomy session is expired
      await handleBiconomy();
      // if user session for biconomy is active and user is not logged in to next auth, then login to next auth
      if (!session && window.biconomySmartAccount) await handleSiwe();
      // // if user is logged in to next auth and biconomy session is inactive, then logout from next auth and reset biconomy store
      // else if (session && !window.biconomySmartAccount) {
      //   await disconnectWeb3();
      // }
    };
    init().catch((error) => console.error(error));
  }, [session, account, handleSiwe, handleBiconomy]);

  // user intend to log in, show wallet widget
  const connectWeb3 = useCallback(async () => {
    sdk.showWallet();
  }, [sdk]);

  // get the event after biconomy wallet is connected
  useEffect(() => {
    const interval = setInterval(async () => {
      if (account) {
        clearInterval(interval);
        window.biconomySocialLogin?.hideWallet();
      }
      if (window.biconomySocialLogin?.provider && !account) {
        await handleBiconomy();
      }
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, [account, handleBiconomy]);

  // signout from biconomy and next auth
  const disconnectWeb3 = async () => {
    if (window.biconomySocialLogin?.provider)
      await window.biconomySocialLogin.logout();
    window.biconomySocialLogin?.hideWallet();
    resetBiconomyStore();
    // signout from next auth
    signOut({ callbackUrl: window.location.href, redirect: false });
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
