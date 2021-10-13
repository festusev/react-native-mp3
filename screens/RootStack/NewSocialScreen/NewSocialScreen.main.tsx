import React, { useState, useEffect } from "react";
import { Platform, View, ScrollView } from "react-native";
import { Appbar, TextInput, Snackbar, Button } from "react-native-paper";
import { getFileObjectAsync, uuid } from "../../../Utils";

// See https://github.com/mmazzarolo/react-native-modal-datetime-picker
// Most of the date picker code is directly sourced from the example.
import DateTimePickerModal from "react-native-modal-datetime-picker";

// See https://docs.expo.io/versions/latest/sdk/imagepicker/
// Most of the image picker code is directly sourced from the example.
import * as ImagePicker from "expo-image-picker";
import { styles } from "./NewSocialScreen.styles";

import firebase from "firebase/app";
import "firebase/firestore";
import { SocialModel } from "../../../models/social";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../RootStackScreen";

interface Props {
  navigation: StackNavigationProp<RootStackParamList, "NewSocialScreen">;
}

export default function NewSocialScreen({ navigation }: Props) {
  /* TODO: Declare state variables for all of the attributes 
           that you need to keep track of on this screen.
    
     HINTS:

      1. There are five core attributes that are related to the social object.
      2. There are two attributes from the Date Picker.
      3. There is one attribute from the Snackbar.
      4. There is one attribute for the loading indicator in the submit button.
  
  */
  const [date, setDate] = useState();
  const [time, setTime] = useState();
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // TODO: Follow the Expo Docs to implement the ImagePicker component.
  // https://docs.expo.io/versions/latest/sdk/imagepicker/
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  // TODO: Follow the GitHub Docs to implement the react-native-modal-datetime-picker component.
  // https://github.com/mmazzarolo/react-native-modal-datetime-picker

  // TODO: Follow the SnackBar Docs to implement the Snackbar component.
  // https://callstack.github.io/react-native-paper/snackbar.html

  const saveEvent = async () => {
    // TODO: Validate all fields (hint: field values should be stored in state variables).
    // If there's a field that is missing data, then return and show an error
    // using the Snackbar.

    // Otherwise, proceed onwards with uploading the image, and then the object.
    if(!eventName) {
      setSnackbarMessage("Add event name.");
      return;
    } else if(!location) {
      setSnackbarMessage("Add event location.");
      return;
    } else if(!description) {
      setSnackbarMessage("Add event description.");
      return;
    } else if(!date) {
      setSnackbarMessage("Add event date.");
      return;
    } else if(!image) {
      setSnackbarMessage("Add event image.");
      return;
    }

    try {
      // NOTE: THE BULK OF THIS FUNCTION IS ALREADY IMPLEMENTED FOR YOU IN HINTS.TSX.
      // READ THIS TO GET A HIGH-LEVEL OVERVIEW OF WHAT YOU NEED TO DO, THEN GO READ THAT FILE!
      // (0) Firebase Cloud Storage wants a Blob, so we first convert the file path
      // saved in our eventImage state variable to a Blob.
      // (1) Write the image to Firebase Cloud Storage. Make sure to do this
      // using an "await" keyword, since we're in an async function. Name it using
      // the uuid provided below.
      // (2) Get the download URL of the file we just wrote. We're going to put that
      // download URL into Firestore (where our data itself is stored). Make sure to
      // do this using an async keyword.
      // (3) Construct & write the social model to the "socials" collection in Firestore.
      // The eventImage should be the downloadURL that we got from (3).
      // Make sure to do this using an async keyword.
      // (4) If nothing threw an error, then go back to the previous screen.
      //     Otherwise, show an error.
      if(savingEvent) return;

      setSavingEvent(true);
      setSnackbarMessage("Saving...");
      
      console.log("Name: " + eventName);
      console.log("Location: " + location);
      console.log("Description: " + description);
      console.log("Date: " + date.toString());
      console.log("Image: " + image);

      const asyncAwaitNetworkRequests = async () => {
        const object = await getFileObjectAsync(image);
        const result = await firebase
          .storage()
          .ref()
          .child(uuid() + ".jpg")
          .put(object as Blob);
        const downloadURL = await result.ref.getDownloadURL();
        const doc: SocialModel = {
          eventName: eventName,
          eventDate: date.getTime(),
          eventLocation: location,
          eventDescription: description,
          eventImage: downloadURL
        };
        await firebase.firestore().collection("socials").doc().set(doc);
        console.log("Finished social creation.");
      };
      asyncAwaitNetworkRequests().then(()=>{
        console.log("Returned from server");
        navigation.goBack();
        setSnackbarMessage("");
      }).catch((e)=>{
        console.log("Error: " + e);
        setSnackbarMessage(e);
      }).finally(()=>{
        setSavingEvent(false);
      });
    } catch (e) {
      console.log("Error while writing social:", e);
      setSnackbarMessage(e);
    }
  };

  const Bar = () => {
    return (
      <Appbar.Header>
        <Appbar.Action onPress={navigation.goBack} icon="close" />
        <Appbar.Content title="Socials" />
      </Appbar.Header>
    );
  };

  return (
    <>
      <Bar />
      <ScrollView style={{ ...styles.container, padding: 20 }}>
        {<TextInput
          label="Event Name"
          value={eventName}
          onChangeText={text => setEventName(text)}
        />}
        {<TextInput
          label="Event Location"
          value={location}
          onChangeText={text => setLocation(text)}
        />}
        {<TextInput
          label="Event Description"
          value={description}
          onChangeText={text => setDescription(text)}
        />}
        {<Button
            onPress={()=>{setIsDatePickerVisible(true)}}
          >{date ? date.toString() : "Choose a Date"}</Button>}
        { 
          <Button
            onPress={pickImage}
          >Pick an image from camera roll</Button>
            /* {image && (
              <Image
                source={{ uri: image }}
                style={{ width: 200, height: 200 }}
              />
            )} */
        }
        {          <Button
            onPress={saveEvent}
          >Save Event</Button>}
        {<DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={(date: Date)=>{
            setIsDatePickerVisible(false);
            setDate(date);
          }}
          onCancel={() => {
            setIsDatePickerVisible(false);
          }}
        />}
      </ScrollView>
        {/* Snackbar */
          <Snackbar
          visible={snackbarMessage}
          onDismiss={()=>{setSnackbarMessage(false);}}
          >
        {snackbarMessage}
      </Snackbar>
      }
  </>
  );
}
