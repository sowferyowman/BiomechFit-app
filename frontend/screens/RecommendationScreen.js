import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from "react-native";
import { FontAwesome5 } from '@expo/vector-icons'; // Assuming you have Expo Vector Icons

export default function RecommendationScreen({ route, navigation }) {
  // *** THE FIX: Get the analysis result, not just the workout name ***
  const { analysisResult } = route.params; 
  
  // Use a default structure if the result is somehow missing or malformed
  const defaultResult = { workout: "Unknown", reps: 0, avg_score: 0, details: [] };
  const { workout, reps, avg_score, details } = analysisResult || defaultResult;
  
  // Check if we have a workout name, otherwise use the default.
  const workoutName = workout?.name || workout;
  
  const scorePercent = Math.round(avg_score * 100);
  
  let feedbackMessage;
  let scoreColor;

  if (scorePercent >= 90) {
    feedbackMessage = "Exceptional Form! You nailed the technique.";
    scoreColor = "#4CAF50"; // Green
  } else if (scorePercent >= 75) {
    feedbackMessage = "Great job! A few minor points to refine.";
    scoreColor = "#FFC107"; // Yellow
  } else {
    feedbackMessage = "Good start! Focus on the key issues for improvement.";
    scoreColor = "#F44336"; // Red
  }

  // Generate a simple list of performance details from the 'details' array
  const repDetails = (details || []).map((score, index) => ({
    rep: index + 1,
    score: score,
    repColor: score >= 0.9 ? "#4CAF50" : (score >= 0.7 ? "#FFC107" : "#F44336"),
  }));

  return (
    <ImageBackground
        source={require("../assets/images/barbell.jpg")}
        style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
            <Text style={styles.title}>ANALYSIS COMPLETE</Text>
            <Text style={styles.subtitle}>Workout: {workoutName}</Text>

            {/* Overall Score */}
            <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
                <Text style={[styles.scoreText, {color: scoreColor}]}>{scorePercent}%</Text>
            </View>
            <Text style={[styles.feedback, { color: scoreColor }]}>{feedbackMessage}</Text>

            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <FontAwesome5 name="check-circle" size={24} color="#00CFFF" />
                    <Text style={styles.statNumber}>{reps}</Text>
                    <Text style={styles.statLabel}>Reps Tracked</Text>
                </View>
                <View style={styles.statBox}>
                    <FontAwesome5 name="chart-line" size={24} color="#00CFFF" />
                    <Text style={styles.statNumber}>{scorePercent}%</Text>
                    <Text style={styles.statLabel}>Avg Form Score</Text>
                </View>
            </View>

            {/* Rep Breakdown */}
            <Text style={styles.breakdownTitle}>Rep-by-Rep Breakdown</Text>
            <View style={styles.repContainer}>
                {repDetails.length > 0 ? (
                    repDetails.map((item) => (
                        <View key={item.rep} style={styles.repPill}>
                            <Text style={styles.repText}>Rep {item.rep}: </Text>
                            <Text style={[styles.repScore, { color: item.repColor }]}>{Math.round(item.score * 100)}%</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.text}>No detailed rep scores recorded.</Text>
                )}
            </View>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Home")}>
                <Text style={styles.buttonText}>Finish Session</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: "cover" },
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40, backgroundColor: "rgba(0,0,0,0.7)" },
  card: {
    width: "90%",
    backgroundColor: "rgba(10, 10, 10, 0.95)",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00CFFF55",
    shadowColor: "#00CFFF",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  title: { fontSize: 28, color: "#00CFFF", fontWeight: "bold", marginBottom: 10, letterSpacing: 1.5 },
  subtitle: { fontSize: 18, color: "#ddd", marginBottom: 20 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  scoreText: {
    fontSize: 40,
    fontWeight: 'bold',
    // Removed fixed white color so it picks up the dynamic scoreColor
  },
  feedback: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 25,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#bbb',
    textTransform: 'uppercase',
  },
  breakdownTitle: {
    fontSize: 20,
    color: "#00CFFF",
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#00CFFF33",
    paddingBottom: 5,
    width: '100%',
    textAlign: 'center',
  },
  repContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  repPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    margin: 6,
    alignItems: 'center',
  },
  repText: {
    color: '#ddd',
    fontSize: 16,
  },
  repScore: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: { 
    backgroundColor: "#00CFFF", 
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10, 
    marginTop: 30,
  },
  buttonText: { fontWeight: "bold", color: "#000", fontSize: 16 },
  text: { fontSize: 16, color: "white", marginBottom: 10, textAlign: 'center' },
});
