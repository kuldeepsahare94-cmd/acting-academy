import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface DateFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
}

export function DateField({ label, value, onChange, placeholder = "Select date", minimumDate }: DateFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setShow(true)}>
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color="#64748B" />
      </Pressable>
      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={minimumDate}
          onChange={(event, selected) => {
            setShow(false);
            if (event.type === "set" && selected) onChange(selected);
          }}
        />
      )}
    </View>
  );
}

interface TimeFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
}

export function TimeField({ label, value, onChange, placeholder = "Select time" }: TimeFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setShow(true)}>
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ? formatTime(value) : placeholder}
        </Text>
        <Ionicons name="time-outline" size={18} color="#64748B" />
      </Pressable>
      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selected) => {
            setShow(false);
            if (event.type === "set" && selected) onChange(selected);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginTop: 14, marginBottom: 6 },
  field: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff"
  },
  fieldText: { fontSize: 14, color: "#0F172A" },
  placeholder: { color: "#94A3B8" }
});
