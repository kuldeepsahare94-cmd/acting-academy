import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/services/supabase";
import { DateField, TimeField, formatDate, formatTime } from "@/components/DateTimeFields";

export default function AddWorkshopScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [venue, setVenue] = useState("");
  const [trainer, setTrainer] = useState("");
  const [capacity, setCapacity] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !date || !startTime || !endTime) {
      Alert.alert("Missing info", "Name, date, start time, and end time are required.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("workshops").insert({
        name: name.trim(),
        date: formatDate(date),
        start_time: formatTime(startTime),
        end_time: formatTime(endTime),
        venue: venue.trim() || null,
        trainer: trainer.trim() || null,
        capacity: capacity.trim() ? Number(capacity) : null
      });
      if (error) throw error;

      Alert.alert("Workshop scheduled", `${name} has been added.`, [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert("Couldn't save workshop", err.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Workshop Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Stage Combat Basics" />

      <View style={styles.row}>
        <DateField label="Date *" value={date} onChange={setDate} minimumDate={new Date()} />
      </View>

      <View style={styles.row}>
        <TimeField label="Start Time *" value={startTime} onChange={setStartTime} />
        <View style={{ width: 8 }} />
        <TimeField label="End Time *" value={endTime} onChange={setEndTime} />
      </View>

      <Text style={styles.label}>Venue</Text>
      <TextInput style={styles.input} value={venue} onChangeText={setVenue} placeholder="e.g. Studio 2" />

      <Text style={styles.label}>Trainer</Text>
      <TextInput style={styles.input} value={trainer} onChangeText={setTrainer} placeholder="Trainer's name" />

      <Text style={styles.label}>Capacity</Text>
      <TextInput
        style={styles.input}
        value={capacity}
        onChangeText={setCapacity}
        placeholder="e.g. 20"
        keyboardType="numeric"
      />

      <Pressable
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Workshop"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginTop: 14, marginBottom: 6 },
  row: { flexDirection: "row" },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff"
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
