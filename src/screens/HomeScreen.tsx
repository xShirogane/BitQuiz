import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function HomeScreen({ route, navigation }: any) {
    const { examData, limit, time, title } = route.params;
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.logo, { color: theme.primary }]}>{examData.id.toUpperCase()}</Text>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.subText }]}>{examData.title}</Text>

            <View style={[styles.infoBox, { backgroundColor: theme.card }]}>
                <Text style={[styles.infoText, { color: theme.text }]}>⏱ {time} minut</Text>
                <Text style={[styles.infoText, { color: theme.text }]}>📝 {limit} pytań</Text>
            </View>

            <TouchableOpacity
                style={[styles.startButton, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('Exam', {
                    apiUrl: examData.apiUrl,
                    limit,
                    time,
                    examData,
                })}
            >
                <Text style={styles.startButtonText}>ROZPOCZNIJ TEST</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={[styles.backButtonText, { color: theme.subText }]}>Wróć do wyboru trybu</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    logo: { fontSize: 40, fontWeight: '900', marginBottom: 5 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
    subtitle: { fontSize: 14, marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 },
    infoBox: { flexDirection: 'row', marginBottom: 50, gap: 20, padding: 15, borderRadius: 12 },
    infoText: { fontSize: 16, fontWeight: '600' },
    startButton: { paddingVertical: 16, paddingHorizontal: 60, borderRadius: 12, elevation: 3, marginBottom: 20, width: '100%', alignItems: 'center' },
    startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
    backButton: { padding: 10 },
    backButtonText: { fontSize: 14 },
});
