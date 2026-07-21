import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView
} from "react-native";
import SelectField from "@/components/SelectField";
import { INDIA_STATES, CITIES_BY_STATE } from "@/constants/indiaStatesCities";

export interface LeadFilters {
  dateFrom: string; // YYYY-MM-DD or ""
  dateTo: string; // YYYY-MM-DD or ""
  source: string; // "" means any
  state: string; // "" means any
  city: string; // "" means any
}

export const EMPTY_LEAD_FILTERS: LeadFilters = {
  dateFrom: "",
  dateTo: "",
  source: "",
  state: "",
  city: ""
};

// Common sources for the acting-academy niche — Facebook/Instagram lead ads
// feed in automatically per the spec, plus the usual manual channels.
const SOURCE_OPTIONS = [
  "Facebook Ads",
  "Instagram Ads",
  "Walk-in",
  "Referral",
  "Website",
  "Google Ads"
];

interface Props {
  visible: boolean;
  initialFilters: LeadFilters;
  onClose: () => void;
  onApply: (filters: LeadFilters) => void;
}

export default function LeadFiltersModal({
  visible,
  initialFilters,
  onClose,
  onApply
}: Props) {
  const [filters, setFilters] = useState<LeadFilters>(initialFilters);

  useEffect(() => {
    if (visible) setFilters(initialFilters);
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters(EMPTY_LEAD_FILTERS);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView>
            <Text style={styles.title}>Filter Leads</Text>

            <Text style={styles.label}>Date Created</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="From (YYYY-MM-DD)"
                value={filters.dateFrom}
                onChangeText={(v) => setFilters((f) => ({ ...f, dateFrom: v }))}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="To (YYYY-MM-DD)"
                value={filters.dateTo}
                onChangeText={(v) => setFilters((f) => ({ ...f, dateTo: v }))}
              />
            </View>

            <Text style={styles.label}>Lead Source</Text>
            <View style={styles.chipWrap}>
              {SOURCE_OPTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() =>
                    setFilters((f) => ({
                      ...f,
                      source: f.source === s ? "" : s
                    }))
                  }
                  style={[
                    styles.chip,
                    filters.source === s && styles.chipActive
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filters.source === s && styles.chipTextActive
                    ]}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Or type a custom source..."
              value={
                SOURCE_OPTIONS.includes(filters.source) ? "" : filters.source
              }
              onChangeText={(v) => setFilters((f) => ({ ...f, source: v }))}
            />

            <SelectField
              label="State"
              placeholder="Any state"
              value={filters.state}
              options={INDIA_STATES}
              onSelect={(v) =>
                setFilters((f) => ({ ...f, state: v, city: "" }))
              }
            />

            <SelectField
              label="City"
              placeholder={filters.state ? "Any city" : "Select a state first"}
              value={filters.city}
              options={filters.state ? CITIES_BY_STATE[filters.state] ?? [] : []}
              disabled={!filters.state}
              disabledHint="Select a state first"
              onSelect={(v) => setFilters((f) => ({ ...f, city: v }))}
            />

            <Pressable style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </Pressable>
            <Pressable style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: "85%"
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#0F172A" },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginTop: 14, marginBottom: 6 },
  row: { flexDirection: "row" },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 10,
    marginTop: 8
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8
  },
  chipActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  chipText: { fontSize: 12, color: "#334155" },
  chipTextActive: { color: "#fff" },
  applyButton: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 22
  },
  applyButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  clearButton: { alignItems: "center", paddingVertical: 12 },
  clearButtonText: { color: "#DC2626", fontSize: 13, fontWeight: "600" },
  cancelButton: { alignItems: "center", paddingVertical: 4 },
  cancelButtonText: { color: "#64748B", fontSize: 14 }
});
