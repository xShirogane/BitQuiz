// src/components/XPInfoModal.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { XP_REWARDS, LEVEL_THRESHOLDS } from '../utils/xpManager';

interface XPInfoModalProps {
    visible: boolean;
    onClose: () => void;
}

const XPRow = ({ icon, label, xp, color, theme }: any) => (
    <View style={[styles.row, { backgroundColor: theme.card }]}>
        <View style={[styles.rowIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.rowLabel, { color: theme.text }]} numberOfLines={2}>{label}</Text>
        <Text style={[styles.rowXP, { color: '#FFD700' }]}>+{xp}</Text>
    </View>
);

export const XPInfoModal: React.FC<XPInfoModalProps> = ({ visible, onClose }) => {
    const { theme, isDark } = useTheme();

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.background }]}>

                    {/* NAGŁÓWEK */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>🏅 Jak zdobywać XP?</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>

                        {/* EGZAMINY */}
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>📝 Egzaminy</Text>
                        <XPRow icon="checkmark-circle" label="Ukończenie egzaminu" xp={XP_REWARDS.EXAM_COMPLETE} color="#4CAF50" theme={theme} />
                        <XPRow icon="school" label="Egzamin 40+ pytań" xp={XP_REWARDS.EXAM_LONG} color="#2196F3" theme={theme} />
                        <XPRow icon="trophy" label="Zdany egzamin (≥50%)" xp={XP_REWARDS.EXAM_PASSED_BONUS} color="#FF9800" theme={theme} />
                        <XPRow icon="star" label="Perfekcyjny wynik (100%)" xp={XP_REWARDS.EXAM_PERFECT_BONUS} color="#FFD700" theme={theme} />
                        <XPRow icon="sunny" label="Pierwszy egzamin dnia" xp={XP_REWARDS.FIRST_EXAM_OF_DAY} color="#FF5722" theme={theme} />

                        {/* SERIA */}
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>🔥 Seria (Streak)</Text>
                        <XPRow icon="flame" label="Codzienna seria" xp={XP_REWARDS.DAILY_STREAK_PER_DAY} color="#FF9500" theme={theme} />
                        <XPRow icon="ribbon" label="Seria 7 dni (bonus)" xp={XP_REWARDS.STREAK_7_BONUS} color="#E040FB" theme={theme} />
                        <XPRow icon="diamond" label="Seria 30 dni (bonus)" xp={XP_REWARDS.STREAK_30_BONUS} color="#00BCD4" theme={theme} />

                        {/* WYZWANIA */}
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>🎯 Wyzwania</Text>
                        <XPRow icon="flash" label="Wyzwanie dnia" xp={XP_REWARDS.DAILY_CHALLENGE} color="#FF9800" theme={theme} />
                        <XPRow icon="build" label="Poprawiony błąd (za szt.)" xp={XP_REWARDS.MISTAKE_REVIEW_PER} color="#9C27B0" theme={theme} />
                        <XPRow icon="medal" label="Wszystkie pytania z kwalifikacji" xp={XP_REWARDS.QUALIFICATION_COMPLETE} color="#4CAF50" theme={theme} />

                        {/* MULTIPLAYER */}
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>⚔️ Multiplayer</Text>
                        <XPRow icon="people" label="Wygrana 1vs1" xp={XP_REWARDS.MULTIPLAYER_WIN} color="#F44336" theme={theme} />

                        {/* PROGI POZIOMÓW */}
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>📊 Progi poziomów</Text>
                        <View style={[styles.levelsBox, { backgroundColor: theme.card }]}>
                            {LEVEL_THRESHOLDS.map((lvl) => (
                                <View key={lvl.level} style={styles.levelRow}>
                                    <Text style={[styles.levelNum, { color: '#A050FF' }]}>Lvl {lvl.level}</Text>
                                    <Text style={[styles.levelName, { color: theme.text }]}>{lvl.name}</Text>
                                    <Text style={[styles.levelXP, { color: theme.subText }]}>{lvl.xp.toLocaleString()} XP</Text>
                                </View>
                            ))}
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
        marginLeft: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 6,
    },
    rowIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rowLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    rowXP: {
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    levelsBox: {
        borderRadius: 12,
        padding: 12,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    levelNum: {
        width: 50,
        fontSize: 14,
        fontWeight: '700',
    },
    levelName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    levelXP: {
        fontSize: 13,
        fontWeight: '600',
    },
});
