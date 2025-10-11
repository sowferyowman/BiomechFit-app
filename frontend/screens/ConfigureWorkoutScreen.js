import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Alert,
  ActivityIndicator, // Import ActivityIndicator for loading state
} from "react-native";
import axios from "axios";

export default function ConfigureWorkoutScreen({ route, navigation }) {
  const { workout } = route.params;

  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [experience, setExperience] = useState("");
  const [load, setLoad] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New state for loading

  const handleStartExecution = async () => {
    if (!age || !sex || !height || !weight || !experience || !reps || !sets) {
      Alert.alert("Missing Info", "Please fill out all mandatory fields before starting.");
      return;
    }

    setIsLoading(true);
    // Crucial Alert: Tells the user to look at their desktop
    Alert.alert("Analysis Started", "Check your desktop/laptop screen for the live video analysis window. DO NOT close the mobile app until the desktop analysis is complete.");

    try {
        // This axios call BLOCKS until the Python server returns the final analysis result
        const res = await axios.post("http://192.168.1.3:5000/analyze", {
        workout: workout.name,
        user: { age, sex, height, weight, experience, load, sets, reps },
      });

      console.log("Backend response:", res.data);
      
      // *** THE FIX: Pass the entire server response object to the Recommendation screen ***
      navigation.navigate("Recommendation", { analysisResult: res.data });

    } catch (error) {
      console.error("Error executing analysis:", error);
      Alert.alert("Connection Error", "Could not connect to the analysis server. Make sure the Python server is running and the IP address (192.168.1.3:5000) is correct.");
    } finally {
        setIsLoading(false);
    }
  };

  const experienceLevels = ["Beginner", "Intermediate", "Advanced"];

  return (
    <ImageBackground
      source={require("../assets/images/barbell.jpg")}
      style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>CONFIGURE {workout.name.toUpperCase()}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{workout.name}</Text>
          <Text style={styles.cardDesc}>Fill in your details for personalized tracking.</Text>
        </View>

        {/* User Stats */}
        <Text style={styles.sectionTitle}>YOUR STATS</Text>
        <TextInput style={styles.input} placeholder="Age" placeholderTextColor="#999" keyboardType="numeric" value={age} onChangeText={setAge} />
        <TextInput style={styles.input} placeholder="Sex (Male/Female/Other)" placeholderTextColor="#999" value={sex} onChangeText={setSex} />
        <TextInput style={styles.input} placeholder="Height (cm)" placeholderTextColor="#999" keyboardType="numeric" value={height} onChangeText={setHeight} />
        <TextInput style={styles.input} placeholder="Weight (kg)" placeholderTextColor="#999" keyboardType="numeric" value={weight} onChangeText={setWeight} />
        
        <Text style={styles.sectionTitle}>EXPERIENCE LEVEL</Text>
        <View style={styles.experienceRow}>
          {experienceLevels.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.experienceButton,
                experience === level && styles.experienceButtonActive,
              ]}
              onPress={() => setExperience(level)}
            >
              <Text style={[styles.experienceButtonText, experience === level && styles.experienceButtonTextActive]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Workout Parameters */}
        <Text style={styles.sectionTitle}>WORKOUT PARAMETERS</Text>
        <TextInput style={styles.input} placeholder="Target Reps (e.g., 8)" placeholderTextColor="#999" keyboardType="numeric" value={reps} onChangeText={setReps} />
        <TextInput style={styles.input} placeholder="Target Sets (e.g., 3)" placeholderTextColor="#999" keyboardType="numeric" value={sets} onChangeText={setSets} />
        <TextInput style={styles.input} placeholder="Load (Optional, e.g., 100kg)" placeholderTextColor="#999" keyboardType="numeric" value={load} onChangeText={setLoad} />


        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartExecution}
          disabled={isLoading}
        >
          {isLoading ? (
             <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.startButtonText}>START ANALYSIS</Text>
          )}
        </TouchableOpacity>
        
        {isLoading && <Text style={styles.loadingText}>Analyzing... (Check Desktop)</Text>}


      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: "cover" },
  container: { flexGrow: 1, padding: 20, backgroundColor: "rgba(0,0,0,0.7)" },
  title: { fontSize: 26, fontWeight: "bold", color: "#00CFFF", textAlign: "center", marginBottom: 25 },
  card: {
    backgroundColor: "rgba(20,20,20,0.9)",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#00CFFF",
    marginBottom: 25,
  },
  cardTitle: { fontSize: 22, color: "#fff", fontWeight: "bold", textAlign: "center" },
  cardDesc: { fontSize: 16, color: "#bbb", textAlign: "center", marginTop: 5 },
  sectionTitle: { color: "#00CFFF", fontSize: 18, fontWeight: "600", marginVertical: 10 },
  input: {
    backgroundColor: "rgba(34,34,34,0.9)",
    color: "#fff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
    fontSize: 15,
  },
  experienceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  experienceButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#222",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  experienceButtonActive: {
    backgroundColor: "#00CFFF",
    borderColor: "#00CFFF",
    shadowColor: "#00CFFF",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  experienceButtonText: { color: "#ccc", fontWeight: "600" },
  experienceButtonTextActive: { color: "#000", fontWeight: "bold" },
  startButton: {
    backgroundColor: "#00CFFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10,
    shadowColor: "#00CFFF",
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 8,
  },
  startButtonText: { color: "#000", fontSize: 18, fontWeight: "bold" },
  loadingText: { color: "#00CFFF", textAlign: "center", fontSize: 16, fontWeight: "500" },
});
