import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/services/supabase";
import { registerForPushNotificationsAsync } from "@/services/notifications";

import LoginScreen from "@/screens/LoginScreen";
import DashboardScreen from "@/screens/DashboardScreen";
import LeadsListScreen from "@/screens/LeadsListScreen";
import LeadDetailScreen from "@/screens/LeadDetailScreen";
import FollowupsScreen from "@/screens/FollowupsScreen";
import AddLeadScreen from "@/screens/AddLeadScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#0F172A" },
        headerTintColor: "#fff",
        tabBarActiveTintColor: "#0F172A",
        tabBarInactiveTintColor: "#94A3B8"
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen
        name="Leads"
        component={LeadsListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen
        name="Followups"
        component={FollowupsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          )
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      registerForPushNotificationsAsync(session.user.id).catch((err) =>
        console.warn("Push registration failed", err)
      );
    }
  }, [session]);

  if (initializing) return null; // could render a splash/loading screen here

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#0F172A" }, headerTintColor: "#fff" }}>
        {!session ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="LeadDetail"
              component={LeadDetailScreen}
              options={{ title: "Lead Details" }}
            />
            <Stack.Screen
              name="AddLead"
              component={AddLeadScreen}
              options={{ title: "Add Lead" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
