import "../styles/globals.css";
import type { AppProps } from "next/app";
import "@biconomy/web3-auth/dist/src/style.css"
import {PrivyProvider} from '@privy-io/react-auth'

export default function App({ Component, pageProps }: AppProps) {
  return(
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      apiUrl={process.env.NEXT_PUBLIC_PRIVY_API_URL || 'https://auth.privy.io'}
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
