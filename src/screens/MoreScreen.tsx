import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const ITEMS: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  description: string;
  screen: string;
}[] = [
  {
    icon: "book",
    label: "Courses",
    description: "Manage course catalog, fees, and duration",
    screen: "CoursesList"
  },
  {
    icon: "people",
    label: "Students",
    description: "Enrolled students, converted from admitted leads",
    screen: "StudentsList"
  },
  {
    icon: "easel",
    label: "Workshops",
    description: "Schedule workshops and track attendance",
    screen: "WorkshopsList"
  }
];

export default function MoreScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>More</Text>
      {ITEMS.map((item) => (
        <Pressable
          key={item.screen}
          style={styles.row}
          onPress={() => navigation.navigate(item.screen)}
        >
          <View style={styles.iconBadge}>
            <Ionicons name={item.icon} size={20} color="#0F172A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowDescription}>{item.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  heading: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  rowLabel: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  rowDescription: { fontSize: 12, color: "#64748B", marginTop: 2 }
});
