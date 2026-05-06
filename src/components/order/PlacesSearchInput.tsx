import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, ActivityIndicator,
  StyleSheet, ViewStyle, Modal,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';

const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  placeholder?: string;
  initialValue?: string;
  onSelect: (place: PlaceDetails) => void;
  containerStyle?: ViewStyle;
  autoFocus?: boolean;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
}

export function PlacesSearchInput({
  placeholder = 'Rechercher une adresse…',
  initialValue = '',
  onSelect,
  containerStyle,
  autoFocus,
}: Props): React.ReactElement {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<View>(null);

  function measureAndShow(): void {
    containerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownPos({ top: y + height + 2, left: x, width });
    });
  }

  const search = useCallback(async (text: string) => {
    if (text.length < 3) { setResults([]); return; }
    setLoading(true);
    measureAndShow();
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${PLACES_KEY}&language=fr&components=country:sn|country:ci|country:ml|country:bf|country:bj|country:tg|country:ng|country:gh|country:gn|country:ne`;
      const res = await fetch(url);
      const json = await res.json() as { predictions: PlacePrediction[] };
      setResults(json.predictions ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function onChangeText(text: string): void {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void search(text), 350);
  }

  function dismissDropdown(): void {
    setResults([]);
    setDropdownPos(null);
  }

  async function onPressPrediction(pred: PlacePrediction): Promise<void> {
    setQuery(pred.description);
    dismissDropdown();
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pred.place_id}&fields=geometry,formatted_address&key=${PLACES_KEY}`;
      const res = await fetch(url);
      const json = await res.json() as {
        result: { formatted_address: string; geometry: { location: { lat: number; lng: number } } };
      };
      onSelect({
        address: json.result.formatted_address,
        lat: json.result.geometry.location.lat,
        lng: json.result.geometry.location.lng,
      });
    } catch {
      onSelect({ address: pred.description, lat: 0, lng: 0 });
    }
  }

  const showDropdown = results.length > 0 && dropdownPos !== null;

  return (
    <View ref={containerRef} style={[styles.wrapper, containerStyle]}>
      <View style={styles.inputRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
          autoFocus={autoFocus}
          returnKeyType="search"
          onBlur={() => {
            // small delay so onPress on a result fires before blur dismisses
            setTimeout(dismissDropdown, 150);
          }}
        />
        {loading && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />}
        {query.length > 0 && !loading && (
          <Pressable onPress={() => { setQuery(''); dismissDropdown(); }} hitSlop={8}>
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        )}
      </View>

      <Modal
        visible={showDropdown}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={dismissDropdown}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissDropdown} />
        {dropdownPos && (
          <View
            style={[
              styles.results,
              {
                position: 'absolute',
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
              },
            ]}
          >
            <FlatList
              data={results}
              keyExtractor={(item) => item.place_id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.resultRow, pressed && styles.rowPressed]}
                  onPress={() => void onPressPrediction(item)}
                >
                  <Text style={styles.resultIcon}>📍</Text>
                  <View style={styles.resultText}>
                    <Text style={styles.mainText} numberOfLines={1}>
                      {item.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.secondaryText} numberOfLines={1}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  </View>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING[4],
    gap: SPACING[2],
    minHeight: 52,
    ...SHADOWS.sm,
  },
  searchIcon: { fontSize: 16 },
  input: {
    flex: 1,
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.dark,
    paddingVertical: SPACING[3],
  },
  clearIcon: { fontSize: 14, color: COLORS.gray400, paddingRight: 4 },

  results: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    ...SHADOWS.md,
    overflow: 'hidden',
    maxHeight: 280,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    gap: SPACING[3],
  },
  rowPressed: { backgroundColor: COLORS.gray100 },
  resultIcon: { fontSize: 16 },
  resultText: { flex: 1 },
  mainText: { ...TYPOGRAPHY.body, color: COLORS.dark, fontWeight: '600' },
  secondaryText: { ...TYPOGRAPHY.label, color: COLORS.gray400, marginTop: 2 },
  separator: { height: 1, backgroundColor: COLORS.gray100 },
});
