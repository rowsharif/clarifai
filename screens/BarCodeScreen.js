import { ScrollView, StyleSheet } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import React, { useState, useEffect } from "react";
import { Text, View, Button } from "react-native";

export default function BarCodeScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    //alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    const response = await fetch(
      `https://api.barcodelookup.com/v2/products?barcode=${data}&formatted=y&key=22j05mzltfwjeijxedkeozr45ngee6`
    );
    const json = await response.json();

    alert(`Product is ${json.products[0].product_name}`);
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "flex-end"
      }}
    >
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      {scanned && (
        <Button title={"Tap to Scan Again"} onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

BarCodeScreen.navigationOptions = {
  title: "BarCode"
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: "#fff"
  }
});
