import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Dimensions, Platform } from "react-native";
import { FontAwesome5 } from '@expo/vector-icons';

// Force the background to the actual browser window size
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function RecommendationScreen({ route, navigation }) {
  const { analysisResult } = route.params || {}; 
  const defaultResult = { workout: "Unknown", reps: 0, avg_score: 0, details: [] };
  const { workout, reps, avg_score, details, recommendation } = analysisResult || defaultResult;
  
  const workoutName = workout?.name || workout;
  const score5Point = Math.round(avg_score); 
  let scoreColor = score5Point >= 4 ? "#4CAF50" : score5Point >= 3 ? "#FFC107" : "#F44336";

  return (
    <View style={styles.outermostWrapper}>
      {/* 1. THE FIX: ImageBackground now uses absolute window dimensions */}
      <View style={styles.backgroundContainer}>
        <ImageBackground
          source={require("../assets/images/barbell.jpg")}
          style={{ width: screenWidth, height: screenHeight }}
          resizeMode="cover"
        >
          <View style={styles.darkOverlay} />
        </ImageBackground>
      </View>

      <ScrollView 
        style={styles.fullWidthScroll}
        contentContainerStyle={styles.centerContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveCard}>
          <Text style={styles.title}>ANALYSIS COMPLETE</Text>
          <Text style={styles.subtitle}>{workoutName}</Text>

          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreText, {color: scoreColor}]}>{score5Point}/5</Text>
          </View>

          {/* Added flexWrap so stats stack if the screen is too thin */}
          <View style={styles.flexStatsRow}>
            <View style={styles.flexStatBox}>
              <FontAwesome5 name="check-circle" size={18} color="#00CFFF" />
              <Text style={styles.statVal}>{reps}</Text>
              <Text style={styles.statLab}>Reps</Text>
            </View>
            <View style={styles.flexStatBox}>
              <FontAwesome5 name="star" size={18} color="#00CFFF" />
              <Text style={styles.statVal}>{score5Point}/5</Text>
              <Text style={styles.statLab}>Avg Score</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Rep Breakdown</Text>
          <View style={styles.pillWrap}>
            {(details || []).length > 0 ? (
              details.map((val, idx) => (
                <View key={idx} style={styles.miniPill}>
                  <Text style={styles.pillTxt}>R{idx + 1}: </Text>
                  <Text style={[styles.pillScore, { color: Math.round(val) >= 4 ? "#4CAF50" : "#F44336" }]}>
                    {Math.round(val)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noneText}>No data.</Text>
            )}
          </View>

          {recommendation && (
            <View style={styles.aiBox}>
              <Text style={styles.aiHeader}>AI RECOMMENDATION</Text>
              <View style={styles.aiRow}>
                <View style={styles.aiItem}><Text style={styles.aiVal}>{Math.round(recommendation.recommended_weight)}kg</Text><Text style={styles.aiLab}>Load</Text></View>
                <View style={styles.aiItem}><Text style={styles.aiVal}>{recommendation.recommended_sets}</Text><Text style={styles.aiLab}>Sets</Text></View>
                <View style={styles.aiItem}><Text style={styles.aiVal}>{recommendation.recommended_reps}</Text><Text style={styles.aiLab}>Reps</Text></View>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Home")}>
            <Text style={styles.actionButtonText}>FINISH SESSION</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outermostWrapper: { 
    flex: 1, 
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  },
  darkOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: "rgba(0,0,0,0.88)" 
  },
  fullWidthScroll: { 
    flex: 1, 
    width: '100%' 
  },
  centerContent: { 
    flexGrow: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    paddingVertical: 40,
    width: '100%'
  },
  responsiveCard: {
    width: "90%",
    maxWidth: 380, 
    // Reduced minWidth slightly to help with the "thin mode" inspect window
    minWidth: 180, 
    backgroundColor: "rgba(10, 10, 10, 0.98)",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 207, 255, 0.15)",
  },
  title: { fontSize: 20, color: "#00CFFF", fontWeight: "bold", letterSpacing: 1 },
  subtitle: { fontSize: 13, color: "#555", marginBottom: 15 },
  scoreCircle: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center', marginVertical: 10
  },
  scoreText: { fontSize: 24, fontWeight: 'bold' },
  flexStatsRow: { 
    flexDirection: 'row', 
    width: '100%', 
    justifyContent: 'space-around', 
    marginVertical: 15,
    flexWrap: 'wrap', // Prevent horizontal push on thin screens
  },
  flexStatBox: { alignItems: 'center', marginHorizontal: 10 },
  statVal: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statLab: { fontSize: 9, color: '#444', textTransform: 'uppercase' },
  sectionHeader: { fontSize: 14, color: "#00CFFF", fontWeight: "bold", marginTop: 10, marginBottom: 8 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  miniPill: { 
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.02)', 
    borderRadius: 8, padding: 5, margin: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' 
  },
  pillTxt: { color: '#444', fontSize: 10 },
  pillScore: { fontWeight: 'bold', fontSize: 10 },
  aiBox: { 
    width: '100%', backgroundColor: 'rgba(0, 207, 255, 0.02)', 
    padding: 12, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: 'rgba(0, 207, 255, 0.1)' 
  },
  aiHeader: { fontSize: 9, fontWeight: 'bold', color: '#00CFFF', textAlign: 'center', marginBottom: 10 },
  aiRow: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' },
  aiItem: { alignItems: 'center', marginHorizontal: 5 },
  aiVal: { color: '#fff', fontSize: 13, fontWeight: '700' },
  aiLab: { color: '#444', fontSize: 8, textTransform: 'uppercase' },
  actionButton: { 
    backgroundColor: "#00CFFF", paddingVertical: 14, width: '100%', 
    borderRadius: 8, marginTop: 25, alignItems: 'center' 
  },
  actionButtonText: { fontWeight: "bold", color: "#000", fontSize: 13 },
  noneText: { color: '#222', fontSize: 11 }
});