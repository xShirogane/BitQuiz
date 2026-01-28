import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

// Konfiguracja zachowania powiadomień (dodano brakujące pola dla TS)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    // Nie blokujemy, ale zwracamy false - obsłużymy to w UI
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  return true;
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleExamReminder(weekday: number, hours: number, minutes: number) {
  // weekday: 1=Niedziela ... 7=Sobota
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Czas na naukę! 🎓",
      body: "Twój egzamin sam się nie zda. Rozwiąż szybki quiz!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: weekday,
      hour: hours,
      minute: minutes,
    },
  });
}