import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Animated,
  Platform,
  StatusBar,
  Pressable,
  useWindowDimensions, 
} from "react-native";
import { Video, ResizeMode } from "expo-av";

// ── VIDEO ASSETS ──
const VIDEOS = {
  Squat: require("../assets/images/squat.mp4"),
  "Bench Press": require("../assets/images/benchpress.mp4"),
  "Overhead Press": require("../assets/images/overheadpress.mp4"),
};

const workouts = [
  { name: "Squat", desc: "Lower Body Focus", tag: "LEGS", color: "#00CFFF" },
  { name: "Bench Press", desc: "Upper Body Push", tag: "CHEST", color: "#FFB800" },
  { name: "Overhead Press", desc: "Shoulders & Triceps", tag: "SHOULDERS", color: "#22C55E" },
];

// ── HOVER & CLICK ENABLED CARD ──
function WorkoutCard({ workout, onPress, screenWidth }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isTablet = screenWidth >= 768;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 20 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ hovered, pressed }) => [
        styles.card,
        {
          width: isTablet ? 600 : screenWidth - 48,
          borderColor: hovered || pressed ? workout.color : "rgba(255,255,255,0.1)",
          backgroundColor: hovered ? "rgba(255,255,255,0.05)" : "rgba(12,12,18,0.93)",
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: workout.color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <Text style={[styles.cardTag, { color: workout.color }]}>{workout.tag}</Text>
          <Text style={styles.cardName}>{workout.name}</Text>
          <Text style={styles.cardDesc}>{workout.desc}</Text>
        </View>
        <View style={styles.arrowCircle}>
          <Text style={[styles.arrowIcon, { color: workout.color }]}>→</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── VIDEO REFERENCE CARD ──
function VideoCard({ workout, videoWidth }) {
  const videoRef = useRef(null);
  const videoHeight = videoWidth * (16 / 9);

  return (
    <View style={[styles.videoCard, { width: videoWidth, height: videoHeight }]}>
      <Video 
        ref={videoRef} 
        source={VIDEOS[workout.name]} 
        style={styles.videoPlayer} 
        resizeMode={ResizeMode.COVER} 
        isLooping 
        shouldPlay={true}
        isMuted={true}
      />
      <View style={styles.videoLabel}>
        <View style={[styles.labelDot, { backgroundColor: workout.color }]} />
        <Text style={styles.videoLabelText}>{workout.name.toUpperCase()}</Text>
      </View>
    </View>
  );
}

// ── MAIN SCREEN ──
export default function ChooseWorkoutScreen({ navigation }) {
  const [showVideos, setShowVideos] = useState(false);
  const { width: windowWidth } = useWindowDimensions(); 
  
  const isTablet = windowWidth >= 768;

  // UPDATED SIZE LOGIC
  const isThin = windowWidth < 650; 
  const responsiveVideoW = isTablet 
    ? 300                 // Increased from 240
    : isThin 
      ? windowWidth - 60  // Full width when very thin
      : windowWidth * 0.50; // Increased from 0.40

  return (
    <View style={styles.mainContainer}>
      <ImageBackground source={require("../assets/images/barbell.jpg")} style={styles.bg} resizeMode="cover">
        <View style={styles.overlay} />
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={styles.title}>CHOOSE YOUR{"\n"}EXERCISE</Text>
            <View style={styles.titleUnderline} />
          </View>

          <View style={styles.section}>
            <View style={styles.cardsContainer}>
              {workouts.map((w, idx) => (
                <WorkoutCard 
                  key={idx} 
                  workout={w} 
                  screenWidth={windowWidth}
                  onPress={() => navigation.navigate("ConfigureWorkout", { workout: w })} 
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Pressable 
              onPress={() => setShowVideos(!showVideos)}
              style={({ hovered }) => [
                styles.refButton,
                { 
                  width: isTablet ? 600 : windowWidth - 48,
                  backgroundColor: hovered ? "rgba(0,207,255,0.15)" : "rgba(255,255,255,0.05)" 
                }
              ]}
            >
              <Text style={styles.refButtonText}>
                {showVideos ? "HIDE REFERENCE" : "REFERENCE VIDEOS"}
              </Text>
              <Text style={styles.refButtonIcon}>{showVideos ? "▴" : "▾"}</Text>
            </Pressable>

            {showVideos && (
              <View style={styles.videoGridWrapper}>
                <View style={styles.videoWrapRow}>
                  {workouts.map((w, i) => (
                    <VideoCard key={i} workout={w} videoWidth={responsiveVideoW} />
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#000" },
  bg: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(4,4,10,0.85)" },
  
  scrollContent: { 
    paddingTop: 60, 
    paddingBottom: 64, 
    width: "100%",
    alignItems: 'center', 
  },
  
  header: { marginBottom: 36, width: "100%", maxWidth: 800, alignItems: 'center' },
  title: { fontWeight: "900", color: "#FFFFFF", lineHeight: 46, fontSize: 38, textAlign: 'center' },
  titleUnderline: { marginTop: 14, width: 48, height: 3, backgroundColor: "#00CFFF" },
  
  section: { width: "100%", marginBottom: 36, maxWidth: 800, alignItems: 'center' },
  sectionLabel: { fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.28)", marginBottom: 14, textAlign: 'center' },
  
  refButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 10,
    marginBottom: 24,
  },
  refButtonText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  refButtonIcon: { color: '#00CFFF', fontSize: 14 },

  videoGridWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  videoWrapRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    gap: 12, 
    width: '100%'
  },

  videoCard: { borderRadius: 14, overflow: "hidden", backgroundColor: "#111118", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  videoPlayer: { width: "100%", height: "100%" },
  videoLabel: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "rgba(0,0,0,0.7)", gap: 5 },
  labelDot: { width: 6, height: 6, borderRadius: 3 },
  videoLabelText: { fontSize: 9, fontWeight: '700', color: "rgba(255,255,255,0.9)" },

  cardsContainer: { alignItems: "center", gap: 14, width: "100%" },
  card: { borderRadius: 14, borderWidth: 1.5, overflow: "hidden" },
  accentBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  cardContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 22 },
  cardLeft: { flex: 1 },
  cardTag: { fontSize: 10, letterSpacing: 3, marginBottom: 5 },
  cardName: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
  cardDesc: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  arrowCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  arrowIcon: { fontSize: 18, fontWeight: "700" },
});