import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";
import axios from "axios";

export default function WorkoutCamScreen({ route, navigation }) {
  const { workout } = route.params;
  const [hasPermission, setHasPermission] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState("Initializing system...");
  const [reps, setReps] = useState(0);
  const [totalReps] = useState(10);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      setFeedback("Camera system ready");
    })();
  }, []);

  // Neon glow pulsing effect
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const captureAndAnalyze = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      setFeedback("Analyzing form...");

      // NOTE: This single-frame analysis path is currently unused by the final desktop flow, 
      // but is kept here for reference if you want to switch back to mobile frame submission.
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      
      // The old '/analyze' endpoint now expects a full session, not single frames.
      // This is simulated here. In a real single-frame setup, you'd need a different server endpoint.
      const response = await axios.post("http://192.168.1.3:5000/analyze_frame", {
        workout: workout.name,
        image: photo.base64,
      });

      const data = response.data;
      console.log("Server response:", data);

      setFeedback(data.result?.feedback || "Form looks solid!");
      setReps((prev) => (prev < totalReps ? prev + 1 : totalReps));
    } catch (error) {
      console.error("Error analyzing frame:", error);
      Alert.alert("Error", "Unable to analyze frame.");
      setFeedback("Connection issue. Check backend.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishSet = () => {
    // When finishing early, navigate to Recommendation screen
    // with placeholder data that matches the expected structure.
    const analysisResult = {
        workout: workout.name,
        reps: reps, // Show reps completed before stopping
        avg_score: 0.75, // Placeholder score
        details: []
    };
    navigation.navigate("Recommendation", { analysisResult });
  };

  if (hasPermission === null)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CFFF" />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );

  if (hasPermission === false)
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>⚠️ Camera access denied</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={Camera.Constants.Type.front}
        ref={cameraRef}
        ratio="16:9"
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.workoutTitle}>{workout.name.toUpperCase()}</Text>

        <View style={styles.statsContainer}>
          <Text style={styles.repCounter}>
            {reps} / {totalReps}
          </Text>
          <Text style={styles.repLabel}>REPS</Text>
        </View>

        <Text style={styles.feedbackText}>{feedback}</Text>

        <View style={styles.buttonContainer}>
          {isProcessing ? (
            <ActivityIndicator size="large" color="#00CFFF" />
          ) : (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={styles.neonButton} onPress={captureAndAnalyze}>
                <Text style={styles.buttonText}>ANALYZE FRAME</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <TouchableOpacity
            style={[styles.neonButton, styles.finishButton]}
            onPress={handleFinishSet}
            disabled={isProcessing}
          >
            <Text style={[styles.buttonText, { color: "#00CFFF" }]}>FINISH SET</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(10, 10, 10, 0.85)",
    alignItems: "center",
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: "#00CFFF44",
  },
  workoutTitle: {
    color: "#00CFFF",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    letterSpacing: 2,
    textShadowColor: "#00CFFF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  statsContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  repCounter: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    textShadowColor: "#00CFFF",
    textShadowRadius: 10,
  },
  repLabel: { color: "#bbb", fontSize: 14, letterSpacing: 3 },
  feedbackText: {
    color: "#00CFFF",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginVertical: 10,
    width: "85%",
  },
  buttonContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: 10,
  },
  neonButton: {
    backgroundColor: "#00CFFF",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: "#00CFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  finishButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#00CFFF",
    shadowOpacity: 0.4,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#00CFFF",
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 18,
    fontWeight: "bold",
  },
});
