import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <ImageBackground
      source={require('../assets/images/barbell.jpg')} 
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>READY TO LIFT?</Text>

        {/* Start Workout Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate("ChooseWorkout")}
        >
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>

        {/* Bottom Links */}
        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={() => navigation.navigate("Progress")}>
            <Text style={styles.linkText}>View Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <Text style={styles.linkText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)", // dark overlay
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
    textAlign: "center",
  },
  startButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 80,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
  },
  linksContainer: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "70%",
  },
  linkText: {
    fontSize: 16,
    color: "#fff",
    textDecorationLine: "underline",
    marginHorizontal: 10,
  },
});
