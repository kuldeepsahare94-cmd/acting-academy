import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  RefreshControl
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "@/services/supabase";
import { Lead, LeadStatus } from "@/types";
import LeadFiltersModal, {
  LeadFilters,
  EMPTY_LEAD_FILTERS
} from "@/components/LeadFiltersModal";

const STATUS_FILTERS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "followup_scheduled", label: "Followups" },
  { value: "interested", label: "Interested" },
  { value: "admission_confirmed", label: "Admitted" }
];

export default function LeadsListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [createdToday, setCreatedToday] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<LeadFilters>(EMPTY_LEAD_FILTERS);
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);

  const activeFilterCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.source,
    filters.state,
    filters.city
  ].filter((v) => v.trim().length > 0).length;

  // Dashboard cards navigate here with params like { statusFilter, createdToday,
  // unassignedOnly }. Every time we arrive with a fresh set of params, adopt
  // them as the active filters, then clear the params so a manual chip tap
  // afterwards isn't fighting leftover drill-down state.
  useEffect(() => {
    if (!route.params) return;
    const { statusFilter: sf, createdToday: ct, unassignedOnly: uo } = route.params;
    if (sf !== undefined) setStatusFilter(sf);
    if (ct !== undefined) setCreatedToday(ct);
    if (uo !== undefined) setUnassignedOnly(uo);
    if (sf !== undefined || ct !== undefined || uo !== undefined) {
      navigation.setParams({ statusFilter: undefined, createdToday: undefined, unassignedOnly: undefined });
    }
  }, [route.params, navigation]);

  const fetchLeads = useCallback(async () => {
    let query = supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (unassignedOnly) {
      query = query.is("assigned_user_id", null);
    }
    if (createdToday) {
      query = query.gte("created_at", new Date().toISOString().slice(0, 10));
    }
    if (filters.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters.dateTo) {
      // Include the whole "to" day by pushing to end-of-day.
      query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
    }
    if (filters.source.trim()) {
      query = query.ilike("lead_source", `%${filters.source.trim()}%`);
    }
    if (filters.state) {
      query = query.eq("state", filters.state);
    }
    if (filters.city) {
      query = query.eq("city", filters.city);
    }
    if (search.trim()) {
      query = query.or(
        `name.ilike.%${search}%,mobile.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (!error && data) setLeads(data as Lead[]);
  }, [search, statusFilter, unassignedOnly, createdToday, filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.search, { flex: 1, marginRight: 8, marginBottom: 0 }]}
          placeholder="Search name, mobile, email..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchLeads}
        />
        <Pressable
          style={styles.filterButton}
          onPress={() => setFiltersModalVisible(true)}
        >
          <Text style={styles.filterButtonText}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {(activeFilterCount > 0) && (
        <View style={styles.drillBanner}>
          <Text style={styles.drillBannerText} numberOfLines={1}>
            {[
              filters.dateFrom && `From ${filters.dateFrom}`,
              filters.dateTo && `To ${filters.dateTo}`,
              filters.source && `Source: ${filters.source}`,
              filters.state && `State: ${filters.state}`,
              filters.city && `City: ${filters.city}`
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <Pressable onPress={() => setFilters(EMPTY_LEAD_FILTERS)}>
            <Text style={styles.drillBannerClear}>Clear</Text>
          </Pressable>
        </View>
      )}

      {(unassignedOnly || createdToday) && (
        <View style={styles.drillBanner}>
          <Text style={styles.drillBannerText}>
            {unassignedOnly ? "Unassigned" : ""}
            {unassignedOnly && createdToday ? " · " : ""}
            {createdToday ? "Today" : ""}
          </Text>
          <Pressable
            onPress={() => {
              setUnassignedOnly(false);
              setCreatedToday(false);
            }}
          >
            <Text style={styles.drillBannerClear}>Clear</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setStatusFilter(item.value)}
            style={[
              styles.filterChip,
              statusFilter === item.value && styles.filterChipActive
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === item.value && styles.filterChipTextActive
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.leadRow}
            onPress={() => navigation.navigate("LeadDetail", { leadId: item.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.leadName}>{item.name}</Text>
              <Text style={styles.leadMeta}>
                {item.mobile} · {item.course_interested ?? "No course set"}
              </Text>
              <Text style={styles.leadStatus}>{item.status.replace(/_/g, " ")}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No leads match this filter.</Text>
        }
      />

      <LeadFiltersModal
        visible={filtersModalVisible}
        initialFilters={filters}
        onClose={() => setFiltersModalVisible(false)}
        onApply={(f) => setFilters(f)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
    marginBottom: 8
  },
  search: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  filterButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  filterBadge: {
    backgroundColor: "#fff",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    marginLeft: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  filterBadgeText: { color: "#0F172A", fontSize: 10, fontWeight: "800" },
  drillBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    marginHorizontal: 12,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  drillBannerText: { color: "#3730A3", fontWeight: "600", fontSize: 12 },
  drillBannerClear: { color: "#3730A3", fontWeight: "700", fontSize: 12, textDecorationLine: "underline" },
  filterRow: { paddingHorizontal: 12, marginBottom: 8, flexGrow: 0 },
  filterChip: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    height: 34
  },
  filterChipActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  filterChipText: { color: "#334155", fontSize: 13 },
  filterChipTextActive: { color: "#fff" },
  leadRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  leadName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  leadMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  leadStatus: { fontSize: 11, color: "#0F172A", marginTop: 4, fontWeight: "600" },
  empty: { textAlign: "center", color: "#94A3B8", marginTop: 40 }
});
