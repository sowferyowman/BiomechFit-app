import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./HomeScreen";
import ChooseWorkoutScreen from "./ChooseWorkoutScreen";
import ConfigureWorkoutScreen from "./ConfigureWorkoutScreen";
// import WorkoutCamScreen from "./WorkoutCamScreen"; // No longer used in this flow
import RecommendationScreen from "./RecommendationScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ChooseWorkout" component={ChooseWorkoutScreen} />
        <Stack.Screen name="ConfigureWorkout" component={ConfigureWorkoutScreen} />
        {/* The WorkoutCam screen is commented out as the analysis now runs directly 
            from the Configure screen via the desktop webcam stream. */}
        {/* <Stack.Screen name="WorkoutCam" component={WorkoutCamScreen} /> */}
        <Stack.Screen name="Recommendation" component={RecommendationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
