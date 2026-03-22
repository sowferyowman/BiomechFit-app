import React, { useState } from "react";
import { Picker } from "@react-native-picker/picker";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Pressable,
  useWindowDimensions,
} from "react-native";
import axios from "axios";

export default function ConfigureWorkoutScreen({ route, navigation }) {
  const { workout } = route.params;
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;

  // === MAX WEIGHT LIMITS (Logic preserved) ===
  const exerciseMaxLoad = {
    "Squat": 150,
    "Bench Press": 101,
    "Overhead Press": 70,
  };

  const showError = (title, message) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const maxLoadAllowed = exerciseMaxLoad[workout.name] || 200;

  // USER INPUT STATES
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [load, setLoad] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ERROR STATES
  const [ageError, setAgeError] = useState("");
  const [heightError, setHeightError] = useState("");
  const [setsError, setSetsError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [repsError, setRepsError] = useState("");
  const [weightError, setWeightError] = useState("");

  // === INPUT HANDLERS (LOGIC UNCHANGED) ===
  const handleAgeChange = (value) => {
    const numeric = value.replace(/[^0-9]/g, "");
    const num = parseInt(numeric, 10);
    if (!numeric) { setAge(""); setAgeError(""); } 
    else if (!isNaN(num) && num >= 15 && num <= 70) { setAge(numeric); setAgeError(""); } 
    else { setAge(numeric); setAgeError("Age must be 15-70."); }
  };

  const handleHeightChange = (value) => {
    const numeric = value.replace(/[^0-9]/g, "");
    const num = parseInt(numeric, 10);
    if (!numeric) { setHeight(""); setHeightError(""); } 
    else if (!isNaN(num) && num >= 100 && num <= 230) { setHeight(numeric); setHeightError(""); } 
    else { setHeight(numeric); setHeightError("Height: 100-230cm."); }
  };

  const handleWeightChange = (value) => {
    const numeric = value.replace(/[^0-9]/g, "");
    const num = parseInt(numeric, 10);
    if (!numeric) { setWeight(""); setWeightError(""); } 
    else if (!isNaN(num) && num >= 18 && num <= 100) { setWeight(numeric); setWeightError(""); } 
    else { setWeight(numeric); setWeightError("Weight: 18-100kg."); }
  };

  const handleSetsChange = (value) => {
    const numeric = value.replace(/[^0-9]/g, "");
    const num = parseInt(numeric, 10);
    if (!numeric) { setSets(""); setSetsError(""); } 
    else if (!isNaN(num) && num <= 5) { setSets(numeric); setSetsError(""); } 
    else { setSets(numeric); setSetsError("Max 5 sets."); }
  };

  const handleRepsChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    const repsNumber = parseInt(numericValue, 10);
    if (!numericValue) { setReps(""); setRepsError(""); } 
    else if (!isNaN(repsNumber) && repsNumber >= 1 && repsNumber <= 12) { setReps(numericValue); setRepsError(""); } 
    else { setReps(numericValue); setRepsError("Reps: 1-12."); }
  };

  const handleLoadChange = (value) => {
    const numeric = value.replace(/[^0-9]/g, "");
    const num = parseInt(numeric, 10);
    if (!numeric) { setLoad(""); setLoadError(""); } 
    else if (!isNaN(num) && num >= 5 && num <= maxLoadAllowed) { setLoad(numeric); setLoadError(""); } 
    else { setLoad(numeric); setLoadError(`Range: 5-${maxLoadAllowed}kg`); }
  };

  const handleStartExecution = async () => {
    if (!age || !sex || !height || !weight || !reps || !sets) {
      showError("Missing Info", "Please fill out all mandatory fields.");
      return;
    }
    if (ageError || heightError || weightError || repsError || setsError || loadError) {
      showError("Invalid Input", "Please fix errors before starting.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post("http://172.16.12.42:5000/analyze", {
        workout: workout.name,
        user: { age, sex, height, weight, load, sets, reps },
      });
      navigation.navigate("Recommendation", { analysisResult: res.data });
    } catch (error) {
      showError("Connection Error", "Could not connect to analysis server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ImageBackground source={require("../assets/images/barbell.jpg")} style={styles.bg} resizeMode="cover">
        <View style={styles.overlay} />
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Back Navigation */}
          <Pressable 
            style={({ hovered }) => [styles.backBtn, hovered && { backgroundColor: 'rgba(255,255,255,0.1)' }]} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>←  BACK</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>CONFIGURE{"\n"}{workout.name.toUpperCase()}</Text>
            <View style={[styles.titleUnderline, { backgroundColor: workout.color || '#00CFFF' }]} />
          </View>

          <View style={[styles.mainCard, { borderColor: workout.color || '#00CFFF' }]}>
            
            {/* SECTION: BIOMETRICS */}
            <Text style={styles.sectionLabel}>▸ BIOMETRICS</Text>
            
            <View style={styles.row}>
              <View style={styles.inputWrap}>
                <Text style={styles.fieldLabel}>Age (15-70)</Text>
                <TextInput
                  style={[styles.input, ageError && styles.inputError]}
                  placeholder="--"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={handleAgeChange}
                  maxLength={2}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>
              
              <View style={styles.inputWrap}>
                <Text style={styles.fieldLabel}>Sex</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={sex}
                    onValueChange={(val) => setSex(val)}
                    style={styles.picker}
                    dropdownIconColor="#00CFFF"
                  >
                    <Picker.Item label="Select" value="" color="#999" />
                    <Picker.Item label="Male" value="M" color="#000" />
                    <Picker.Item label="Female" value="F" color="#000" />
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.inputWrap}>
                <Text style={styles.fieldLabel}>Height (100-230cm)</Text>
                <TextInput
                  style={[styles.input, heightError && styles.inputError]}
                  placeholder="--"
                  keyboardType="numeric"
                  value={height}
                  onChangeText={handleHeightChange}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.fieldLabel}>Weight (18-100kg)</Text>
                <TextInput
                  style={[styles.input, weightError && styles.inputError]}
                  placeholder="--"
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={handleWeightChange}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>
            </View>

            {(ageError || heightError || weightError) ? (
               <Text style={styles.miniError}>{ageError || heightError || weightError}</Text>
            ) : null}

            <View style={styles.divider} />

            {/* SECTION: WORKOUT DATA */}
            <Text style={styles.sectionLabel}>▸ WORKOUT DATA</Text>

            <View style={styles.row}>
              <View style={styles.inputWrap}>
                <Text style={styles.fieldLabel}>Sets (Max 1 )</Text>
                <TextInput
                  style={[styles.input, setsError && styles.inputError]}
                  placeholder="--"
                  keyboardType="numeric"
                  value={sets}
                  onChangeText={handleSetsChange}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.fieldLabel}>Reps (1-12)</Text>
                <TextInput
                  style={[styles.input, repsError && styles.inputError]}
                  placeholder="--"
                  keyboardType="numeric"
                  value={reps}
                  onChangeText={handleRepsChange}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>
            </View>

            <View style={styles.inputWrapFull}>
                <Text style={styles.fieldLabel}>Weight Load (5 - {maxLoadAllowed}kg)</Text>
                <TextInput
                  style={[styles.input, loadError && styles.inputError]}
                  placeholder="Enter Weight"
                  keyboardType="numeric"
                  value={load}
                  onChangeText={handleLoadChange}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
                {loadError ? <Text style={styles.miniError}>{loadError}</Text> : null}
            </View>

            <Pressable
              onPress={handleStartExecution}
              disabled={isLoading}
              style={({ pressed, hovered }) => [
                styles.startButton,
                { backgroundColor: workout.color || '#00CFFF' },
                (pressed || isLoading) && { transform: [{ scale: 0.98 }], opacity: 0.8 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.startButtonText}>START AI ANALYSIS</Text>
              )}
            </Pressable>

            {isLoading && (
              <Text style={styles.loadingText}>Running Biomechanical Audit... (Check Desktop)</Text>
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
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(4,4,10,0.88)" },
  scrollContent: { paddingTop: 60, paddingBottom: 64, alignItems: 'center' },
  
  backBtn: { alignSelf: 'flex-start', marginLeft: 24, padding: 10, borderRadius: 8, marginBottom: 20 },
  backBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 2, fontWeight: '700' },

  header: { marginBottom: 30, width: "100%", maxWidth: 600, alignItems: 'center' },
  title: { fontWeight: "900", color: "#FFFFFF", lineHeight: 40, fontSize: 32, textAlign: 'center' },
  titleUnderline: { marginTop: 12, width: 40, height: 4, borderRadius: 2 },
  
  mainCard: {
    width: '90%',
    maxWidth: 600,
    backgroundColor: "rgba(15,15,25,0.8)",
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    ...Platform.select({ web: { backdropFilter: 'blur(10px)' } }),
  },

  sectionLabel: { fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.3)", marginBottom: 20, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  inputWrap: { flex: 1 },
  inputWrapFull: { width: '100%', marginBottom: 15 },
  fieldLabel: { color: '#fff', fontSize: 12, marginBottom: 8, fontWeight: '600', opacity: 0.8 },
  
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 16,
  },
  inputError: { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  
  pickerContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  picker: { color: "#fff", width: '100%', height: 50, backgroundColor: 'transparent' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  
  miniError: { color: '#ef4444', fontSize: 11, marginTop: -5, marginBottom: 10, fontWeight: '500' },

  startButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#00CFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  startButtonText: { color: "#000", fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  loadingText: { color: "rgba(255,255,255,0.5)", textAlign: "center", fontSize: 12, marginTop: 15, fontWeight: '500' },
});