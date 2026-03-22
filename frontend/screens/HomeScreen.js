import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions } from "react-native";

// Use Dimensions to help handle responsiveness
const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/barbell.jpg')} 
        style={styles.background}
        // Force cover mode for web
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Text style={styles.title}>READY TO LIFT?</Text>

          {/* Start Workout Button */}
          <TouchableOpacity
            style={styles.startButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("ChooseWorkout")}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  // New container style to lock the size for web and mobile
  container: {
    flex: 1,
    backgroundColor: "#000", // Fallback color
  },
  background: {
    flex: 1,
    // Add width/height 100% specifically for Web browsers
    width: '100%',
    height: '100%',
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    // Slightly darker for better text contrast
    backgroundColor: "rgba(0,0,0,0.7)", 
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: '100%', // Ensure overlay covers the full width
  },
  title: {
    fontSize: width > 768 ? 50 : 34, // Bigger font on desktop
    fontWeight: "900",
    color: "#fff",
    marginBottom: 40,
    textAlign: "center",
    letterSpacing: 2,
  },
  startButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 8,
    // Shadow for a more "app-like" feel
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});