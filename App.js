//@refresh restart
import { AppLoading } from "expo";
import { Asset } from "expo-asset";
import * as Font from "expo-font";
import React, { useState, useEffect } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  CameraRoll
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppNavigator from "./navigation/AppNavigator";

import { Camera } from "expo-camera";
import * as FaceDetector from "expo-face-detector";
import * as Permissions from "expo-permissions";
import * as ImageManipulator from "expo-image-manipulator";
import Auth from "./auth.js";

import Clarifai from "clarifai";

const app = new Clarifai.App({
  apiKey: "e02c1b3436ca4a699442e0fdb7c77dda"
});
process.nextTick = setImmediate;

const makeInput = async base64 => {
  // create new array based on inputs to use below
  console.log("response base64", `data:image/jpg;${base64}`.substring(0, 20));
  const response = await app.inputs.create({
    base64,
    concepts: [{ id: "me" }]
  });
  console.log("response", response);
  return response;
};

const makeModel = async () => {
  const response = await app.models.create("faces1", [{ id: "me" }]);
  console.log("model response", response);
  return response;
};

const trainModel = async () => {
  const response = await app.models.train("faces1");
  console.log("train result", response);
  return response;
};

const predictModel = async base64 => {
  const response = await app.models.predict({ id: "faces1" }, { base64 });
  console.log("predict result", response);
  return response;
};

export default function App(props) {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [allowedIn, setAllowedIn] = useState(false);
  Auth.init(setAllowedIn);

  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const askPermission = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    setHasCameraPermission(status === "granted");
  };

  useEffect(() => {
    askPermission();
  }, []);

  const [FACES, setFACES] = useState(false); // model
  const [numInputs, setNumInputs] = useState(0); // counting new inputs
  const [uploadInProgress, setUploadInProgress] = useState(false);

  const findModel = async () => {
    try {
      setFACES(await app.models.get("faces1"));
    } catch (error) {
      setFACES(null);
      console.log("faces no model", error);
    }
  };

  useEffect(() => {
    findModel();
  }, []);

  const handleFacesDetectedOld = async ({ faces }) => {
    if (FACES) {
      console.log("faces model", FACES);
      const uri = await capturePhoto();
      const base64 = await resize(uri);
      const predict = await predictModel(base64);
      console.log("predict result", predict);
      // use predict, check value field of result for high number
    } else {
      console.log("no model, adding an input, number of inputs", numInputs);
      if (numInputs >= 10) {
        const response2 = await makeModel();
        const response3 = await trainModel();
        const response4 = await findModel();
        console.log("findModel", response4);
      } else if (faces.length > 0) {
        const uri = await capturePhoto();
        const base64 = await resize(uri);
        console.log("base64 length", base64.length);
        console.log("base64 length", base64.substring(0, 20));
        const response1 = await makeInput(base64);
        setNumInputs(numInputs + 1);
      }
    }
    //otherwise start collecting images as inputs...
    if (faces.length > 0) {
      console.log("faces detected", faces);
      //setFaces(faces);
    }
  };

  const handleFacesDetected = async () => {
    setUploadInProgress(true);
    console.log("no model, adding an input, number of inputs", numInputs);
    if (FACES) {
      const uri = await capturePhoto();
      const base64 = await resize(uri);
      const predict = await predictModel(base64);
      console.log("predict result", predict);
      const result = 1 * predict.outputs[0].data.concepts[0].value;
      console.log(
        "***** predict result",
        predict.outputs[0].data.concepts[0].value
      );
      if (result > 0.9) {
        setAllowedIn(true);
      }

      // use predict, check value field of result for high number
    } else {
      if (numInputs >= 10) {
        const response2 = await makeModel();
        const response3 = await trainModel();
        const response4 = await findModel();
        console.log("findModel", response4);
      } else {
        const uri = await capturePhoto();
        const base64 = await resize(uri);
        console.log("base64 length", base64.length);
        const response1 = await makeInput(base64);
        setNumInputs(numInputs + 1);
      }
    }
    setUploadInProgress(false);
  };

  //method to resize and return the byted image.
  const resize = async uri => {
    let manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { height: 300, width: 300 } }],
      { base64: true }
    );
    return manipulatedImage.base64;
  };

  const capturePhoto = async () => {
    const photo = await this.camera.takePictureAsync();
    console.log("uri of photo capture", photo.uri);
    return photo.uri;
  };

  if (FACES === false || (!isLoadingComplete && !props.skipLoadingScreen)) {
    return (
      <AppLoading
        startAsync={loadResourcesAsync}
        onError={handleLoadingError}
        onFinish={() => handleFinishLoading(setLoadingComplete)}
      />
    );
  } else if (!allowedIn) {
    //use camera, show current picture, include a button "take photo"
    // -- keep track of how many, after 10? , do train, etc.
    return (
      <View style={{ flex: 1 }}>
        <Camera
          ref={ref => {
            this.camera = ref;
          }}
          style={{ flex: 1 }}
          type={Camera.Constants.Type.front}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "transparent",
              flexDirection: "column",
              justifyContent: "flex-end"
            }}
          >
            <TouchableOpacity
              disabled={uploadInProgress}
              style={{
                flex: 0.1,
                alignItems: "center",
                backgroundColor: "black",
                height: "10%"
              }}
              onPress={handleFacesDetected}
            >
              <Text style={{ fontSize: 30, color: "white", padding: 15 }}>
                {FACES ? "Recognize me" : `Take Photo ${numInputs + 1}`}
              </Text>
            </TouchableOpacity>
          </View>
        </Camera>
      </View>
      // <Camera
      //   ref={ref => {
      //     this.camera = ref;
      //   }}
      //   type={Camera.Constants.Type.front}
      //   onFacesDetected={handleFacesDetected}
      //   faceDetectorSettings={{
      //     mode: FaceDetector.Constants.Mode.fast,
      //     detectLandmarks: FaceDetector.Constants.Landmarks.none,
      //     runClassifications: FaceDetector.Constants.Classifications.none,
      //     minDetectionInterval: 5000,
      //     tracking: true
      //   }}
      // />
    );
  } else {
    return (
      <View style={styles.container}>
        {Platform.OS === "ios" && <StatusBar barStyle="default" />}
        <AppNavigator setAllowedIn={setAllowedIn} />
      </View>
    );
  }
}

async function loadResourcesAsync() {
  await Promise.all([
    Asset.loadAsync([
      require("./assets/images/robot-dev.png"),
      require("./assets/images/robot-prod.png")
    ]),
    Font.loadAsync({
      // This is the font that we are using for our tab bar
      ...Ionicons.font,
      // We include SpaceMono because we use it in HomeScreen.js. Feel free to
      // remove this if you are not using it in your app
      "space-mono": require("./assets/fonts/SpaceMono-Regular.ttf")
    })
  ]);
}

function handleLoadingError(error) {
  // In this case, you might want to report the error to your error reporting
  // service, for example Sentry
  console.warn(error);
}

function handleFinishLoading(setLoadingComplete) {
  setLoadingComplete(true);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  }
});
