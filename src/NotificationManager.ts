const translations: Record<string, string> = {
  'Hindi': 'आज का 15 मिनट का अभ्यास पूरा करें। मिस्टर संजू आपका इंतज़ार कर रहे हैं!',
  'Bengali': 'আপনার 15 মিনিটের অনুশীলন সম্পূর্ণ করুন। মিস্টার সঞ্জু আপনার জন্য অপেক্ষা করছেন!',
  'Punjabi': 'ਆਪਣਾ 15 ਮਿੰਟ ਦਾ ਅਭਿਆਸ ਪੂਰਾ ਕਰੋ। ਮਿਸਟਰ ਸੰਜੂ ਤੁਹਾਡੀ ਉਡੀਕ ਕਰ ਰਹੇ ਹਨ!',
  'Gujarati': 'તમારી 15 મિનિટની પ્રેક્ટિસ પૂર્ણ કરો. મિસ્ટર સંજુ તમારી રાહ જોઈ રહ્યા છે!',
  'Marathi': 'तुमचा १५ मिनिटांचा सराव पूर्ण करा. मिस्टर संजू तुमची वाट पाहत आहेत!',
  'Tamil': 'உங்களுக்கான 15 நிமிட பயிற்சியை முடிக்கவும். திரு. சஞ்சு உங்களுக்காக காத்திருக்கிறார்!',
  'Telugu': 'మీ 15 నిమిషాల అభ్యాసాన్ని పూర్తి చేయండి. మిస్టర్ సంజు మీ కోసం వేచి ఉన్నారు!',
  'Malayalam': 'നിങ്ങളുടെ 15 മിനിറ്റ് പരിശീലനം പൂർത്തിയാക്കുക. മിസ്റ്റർ സഞ്ജു നിങ്ങൾക്കായി കാത്തിരിക്കുന്നു!',
  'Kannada': 'ನಿಮ್ಮ 15 ನಿಮಿಷಗಳ ಅಭ್ಯಾಸವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ. ಮಿಸ್ಟರ್ ಸಂಜು ನಿಮಗಾಗಿ ಕಾಯುತ್ತಿದ್ದಾರೆ!'
};

export class NotificationManager {
  private static instance: NotificationManager;
  private intervalId: any = null;
  private lastTriggeredHour: number = -1;

  private constructor() {}

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  public startScheduler(thinkingLanguage: string) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Check every minute
    this.intervalId = setInterval(() => {
      this.checkTimeAndTrigger(thinkingLanguage);
    }, 60000);
    
    // Initial check
    this.checkTimeAndTrigger(thinkingLanguage);
  }

  public simulateTrigger(thinkingLanguage: string, hour: number) {
    this.fireNotification(thinkingLanguage, hour);
  }

  private checkTimeAndTrigger(thinkingLanguage: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Trigger only exactly on the hour (e.g., 09:00) during the first 5 minutes
    if (currentMinute > 5 || this.lastTriggeredHour === currentHour) return;

    const targetHours = [9, 12, 15, 18, 20, 22];
    if (!targetHours.includes(currentHour)) return;

    this.lastTriggeredHour = currentHour;
    this.fireNotification(thinkingLanguage, currentHour);
  }

  private fireNotification(thinkingLanguage: string, currentHour: number) {
    const nativeHours = [9, 15, 20];
    const isNative = nativeHours.includes(currentHour);

    let title = '';
    let body = '';

    if (isNative) {
      title = `${thinkingLanguage} Alert`;
      if (currentHour === 9) {
         body = translations[thinkingLanguage] || translations['Hindi'];
      } else if (currentHour === 15) {
         body = `अपनी सामान्य गलतियों पर ध्यान दें। (Quick check-in for common translation mistakes!)`;
      } else {
         body = `शाम का अभ्यास! (Evening prompt to practice and reflect on your day).`;
      }
    } else {
      title = `Thanks Tutor: English Alert`;
      if (currentHour === 12) {
        body = `Vocabulary Recall: Can you remember the new words from your saved_vocabulary?`;
      } else if (currentHour === 18) {
        body = `Situational Challenge: How would you order a coffee in a busy cafe?`;
      } else {
        body = `Late night challenge! Let's do a quick English recall exercise.`;
      }
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, { body });
      notification.onclick = () => {
        window.focus();
        notification.close();
        // Custom event to force microphone active if needed
        window.dispatchEvent(new CustomEvent('notification-clicked'));
      };
    }
  }
}
