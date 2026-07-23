import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Switch
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/services/supabase";

export default function AddCourseScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [fees, setFees] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !fees.trim()) {
      Alert.alert("Missing info", "Course name and fees are required.");
      return;
    }
    const feesNumber = Number(fees);
    if (Number.isNaN(feesNumber)) {
      Alert.alert("Invalid fees", "Enter fees as a number, e.g. 25000.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("courses").insert({
        name: name.trim(),
        duration: duration.trim() || null,
        fees: feesNumber,
        description: description.trim() || null,
        active
      });
      if (error) throw error;

      Alert.alert("Course added", `${name} has been added.`, [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert("Couldn't save course", err.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Course Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Acting Foundation" />

      <Text style={styles.label}>Duration</Text>
      <TextInput
        style={styles.input}
        value={duration}
        onChangeText={setDuration}
        placeholder="e.g. 6 months"
      />

      <Text style={styles.label}>Fees (₹) *</Text>
      <TextInput
        style={styles.input}
        value={fees}
        onChangeText={setFees}
        placeholder="e.g. 25000"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]}
        value={description}
        onChangeText={setDescription}
        placeholder="What this course covers..."
        multiline
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Active</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>

      <Pressable
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Course"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff"
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8
  },
  saveButton: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40
  },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 }
});
