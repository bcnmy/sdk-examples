import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { connectWallet } from "../utils/ConnectWallet";
import { useWalletConnect } from "@walletconnect/react-native-dapp";

const Homepage = () => {
  const [eoa, setEoa] = useState("0x42138576848E839827585A3539305774D36B9602");
  const [socialLoginSDK, setSocialLoginSDK] = useState();
  const [smartAccountSDK, setSmartAccountSDK] = useState();
  const [socailLoading, setSocailLoading] = useState(false);
  const [scwLoading, setScwLoading] = useState(false);

  const connector = useWalletConnect();

  const connectWallet = React.useCallback(() => {
    return connector.connect();
  }, [connector]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.mainText}>Biconomy SDK Example</Text>

      <View style={styles.smallCont}>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => connectWallet()}
        >
          <Text style={styles.buttonText}>Connect Wallet</Text>
        </TouchableOpacity>
        <Text style={styles.text}>Wallet Info:</Text>
        <Text style={styles.text}>{eoa}</Text>
      </View>

      {/* <View
        style={{
          height: 1,
          width: "100%",
          backgroundColor: "black",
          marginTop: 50,
        }}
      >
        <Text></Text>
      </View> */}

      <View style={styles.smallCont}>
        <TouchableOpacity style={styles.buttonContainer} onPress={() => {}}>
          <Text style={styles.buttonText}>Init Smart Account</Text>
        </TouchableOpacity>
        <Text style={styles.text}>SCW Info:</Text>
        <Text style={styles.text}>{eoa}</Text>
      </View>
    </ScrollView>
  );
};

export default Homepage;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  mainText: {
    fontSize: 26,
    marginTop: 30,
    color: "#051d5f",
  },
  smallCont: {
    marginTop: 50,
    width: "70%",
  },
  buttonContainer: {
    marginBottom: 10,
    padding: 10,
    paddingLeft: 15,
    paddingRight: 15,
    alignSelf: "center",
    borderRadius: 50,
    backgroundColor: "#2e64e5",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  text: {
    fontSize: 14,
    color: "#051d5f",
    marginBottom: 10,
  },
});
