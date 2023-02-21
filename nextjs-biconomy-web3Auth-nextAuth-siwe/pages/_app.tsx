import "../styles/globals.css";
import type { AppProps } from "next/app";
import "@biconomy/web3-auth/dist/src/style.css";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { ethers } from "ethers";
import type SocialLogin from "@biconomy/web3-auth";
import type SmartAccount from "@biconomy/smart-account";

declare global {
  interface Window {
    biconomySocialLogin?: SocialLogin;
    biconomySmartAccount?: SmartAccount;
  }
}

const { chains, provider, webSocketProvider } = configureChains(
  [chain.mainnet, chain.polygon, chain.arbitrum],
  [publicProvider()]
);

const client = createClient({
  autoConnect: true,
  provider,
});

export type MyAppProps = { session: Session };

export default function App({ Component, pageProps }: AppProps<MyAppProps>) {
  return (
    <WagmiConfig client={client}>
      <SessionProvider session={pageProps.session} refetchInterval={0}>
        <Component {...pageProps} />
      </SessionProvider>
    </WagmiConfig>
  );
}
