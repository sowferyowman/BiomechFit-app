  import React from "react";
  import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ImageBackground,
  } from "react-native";

  const workouts = [
    { name: "Squat", desc: "Lower Body Focus" },
    { name: "Deadlift", desc: "Posterior Chain & Core" },
    { name: "Bench Press", desc: "Upper Body Push" },
    { name: "Overhead Press", desc: "Shoulders & Triceps" },
    { name: "Row", desc: "Back & Upper Pull" },
  ];

  export default function ChooseWorkoutScreen({ navigation }) {
    return (
      <ImageBackground
        source={require("../assets/images/barbell.jpg")}
        style={styles.background}
      >
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>CHOOSE YOUR WORKOUT</Text>

            {workouts.map((w, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate("ConfigureWorkout", { workout: w })}
              >
                <Text style={styles.cardTitle}>{w.name}</Text>
                <Text style={styles.cardDesc}>{w.desc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ImageBackground>
    );
  }

  const styles = StyleSheet.create({
    background: {
      flex: 1,
      resizeMode: "cover",
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.75)", // dark overlay for contrast
    },
    container: {
      flexGrow: 1,
      padding: 20,
      alignItems: "center",
    },
    title: {
      fontSize: 28,
      color: "#00CFFF",
      fontWeight: "bold",
      marginVertical: 30,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    card: {
      width: "90%",
      backgroundColor: "rgba(20,20,20,0.9)",
      borderRadius: 15,
      paddingVertical: 25,
      paddingHorizontal: 20,
      marginBottom: 20,
      borderWidth: 1.5,
      borderColor: "#00CFFF",
      shadowColor: "#00CFFF",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 8,
      elevation: 5,
      alignItems: "center",
    },
    cardTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 8,
      textAlign: "center",
    },
    cardDesc: {
      fontSize: 16,
      color: "#bbb",
      textAlign: "center",
    },
  });
