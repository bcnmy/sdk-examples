import "../styles/globals.css";
import type { AppProps } from "next/app";
import "@biconomy/web3-auth/dist/src/style.css"
import {PrivyProvider} from '@privy-io/react-auth'

export default function App({ Component, pageProps }: AppProps) {
  return(
    <PrivyProvider
      appId='cla06f34x0001mh08l8nsr496'
      apiUrl='https://auth.staging.privy.io'
      config={{
        embeddedWallets: {
          createOnLogin: 'all-users'
        }
      }}
    >
      <Component {...pageProps} />
    </PrivyProvider>
  );
}
