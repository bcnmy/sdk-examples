import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WalletConnectProvider from "@walletconnect/react-native-dapp";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();

import Homepage from "./screens/Homepage";

export default function App() {
  return (
    <WalletConnectProvider
      bridge="https://bridge.walletconnect.org"
      clientMeta={{
        description: "Connect with WalletConnect",
        url: "https://walletconnect.org",
        icons: ["https://walletconnect.org/walletconnect-logo.png"],
        name: "WalletConnect",
      }}
      redirectUrl={
        Platform.OS === "web" ? window.location.origin : "yourappscheme://"
      }
      storageOptions={{
        asyncStorage: AsyncStorage as any,
      }}
    >
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={Homepage} />
        </Stack.Navigator>
      </NavigationContainer>
    </WalletConnectProvider>
  );
}
