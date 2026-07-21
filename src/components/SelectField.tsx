import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  label: string;
  placeholder?: string;
  value: string; // "" means nothing selected
  options: string[];
  disabled?: boolean;
  disabledHint?: string; // shown instead of options when disabled
  onSelect: (value: string) => void;
}

export default function SelectField({
  label,
  placeholder = "Select...",
  value,
  options,
  disabled,
  disabledHint,
  onSelect
}: Props) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      options.filter((o) => o.toLowerCase().includes(search.trim().toLowerCase())),
    [options, search]
  );

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={() => !disabled && setVisible(true)}
      >
        <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]}>
          {value || (disabled ? disabledHint ?? placeholder : placeholder)}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={disabled ? "#CBD5E1" : "#64748B"}
        />
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <TextInput
              style={styles.search}
              placeholder="Search..."
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {value !== "" && (
              <Pressable
                style={styles.clearRow}
                onPress={() => {
                  onSelect("");
                  setSearch("");
                  setVisible(false);
                }}
              >
                <Text style={styles.clearRowText}>Clear selection</Text>
              </Pressable>
            )}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSelect(item);
                    setSearch("");
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item === value && styles.optionTextActive
                    ]}
                  >
                    {item}
                  </Text>
                  {item === value && (
                    <Ionicons name="checkmark" size={18} color="#0F172A" />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>No matches.</Text>
              }
            />
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setSearch("");
                setVisible(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    justifyContent: "space-between"
  },
  fieldDisabled: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
  fieldText: { fontSize: 14, color: "#0F172A" },
  fieldPlaceholder: { color: "#94A3B8" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%"
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 10 },
  search: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8
  },
  clearRow: { paddingVertical: 10 },
  clearRowText: { color: "#DC2626", fontWeight: "600", fontSize: 13 },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  optionText: { fontSize: 14, color: "#334155" },
  optionTextActive: { color: "#0F172A", fontWeight: "700" },
  empty: { textAlign: "center", color: "#94A3B8", paddingVertical: 20 },
  cancelButton: { alignItems: "center", paddingVertical: 14 },
  cancelButtonText: { color: "#64748B", fontSize: 14, fontWeight: "600" }
});
