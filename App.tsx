import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import LearnMoreScreen from './screens/LearnMoreScreen';
import FlashcardsScreen from './screens/FlashcardsScreen';
import PracticeSessionScreen from './screens/PracticeSessionScreen';
import GoalsScreen from './screens/GoalsScreen';
import WellbeingScreen from './screens/WellbeingScreen';
import PomodoroScreen from './screens/PomodoroScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsModal from './components/SettingsModal';
import NotificationCenter from './components/NotificationCenter';
import ReflectionsScreen from './screens/ReflectionsScreen'; 
import ElaborationScreen from './screens/ElaborationScreen';
import InterleavingScreen from './screens/InterleavingScreen';
import DrawingScreen from './screens/DrawingScreen';
import ScheduleScreen from './screens/ScheduleScreen'; // Import ScheduleScreen
import TestScreen from './screens/TestScreen'; // Import TestScreen
import useDarkMode from './hooks/useDarkMode';
import useSmartNotifications from './hooks/useSmartNotifications';
import { initializeStorage, migrateFromLocalStorage } from './storage/init';
import { Theme } from './types';


const App: React.FC = () => {
  const location = useLocation();
  const [theme, setTheme] = useDarkMode();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [storageInitialized, setStorageInitialized] = useState(false);
  
  // Initialize storage system
  useEffect(() => {
    const initStorage = async () => {
      try {
        await initializeStorage();
        await migrateFromLocalStorage();
        setStorageInitialized(true);
        console.log('🚀 Sistema de almacenamiento Sense inicializado');
      } catch (error) {
        console.error('Error inicializando almacenamiento:', error);
        setStorageInitialized(true); // Continue even if storage fails
      }
    };

    initStorage();
  }, []);
  
  // Initialize smart notifications with empty events array (will be updated from individual components)
  const {
    notifications,
    settings: notificationSettings,
    activeNotifications,
    unreadCount,
    hasPermission,
    requestPermission,
    dismissNotification,
    dismissAllNotifications,
    updateSettings
  } = useSmartNotifications([]);
  
  const showBottomNavPaths = [
    "/", 
    "/strategies", 
    "/flashcards", 
    "/calendar",
    "/goals", 
    "/wellbeing", 
    "/pomodoro", 
    "/reflections",
    "/elaboration",
    "/interleaving",
    "/drawing",
    "/schedule" // Add schedule path
  ]; 
  const showBottomNav = showBottomNavPaths.includes(location.pathname);

  const handleThemeChange = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
  };
  
  const toggleSettingsModal = () => setIsSettingsModalOpen(!isSettingsModalOpen);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <main className={`flex-grow ${showBottomNav ? 'pb-20 sm:pb-16' : ''} max-w-2xl mx-auto w-full`}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/strategies" element={<LearnMoreScreen />} />
          <Route path="/flashcards" element={<FlashcardsScreen />} />
          <Route path="/flashcards/practice" element={<PracticeSessionScreen />} />
          <Route path="/calendar" element={<CalendarScreen />} />
          <Route path="/pomodoro" element={<PomodoroScreen />} />
          <Route path="/goals" element={<GoalsScreen />} />
          <Route path="/wellbeing" element={<WellbeingScreen />} />
          <Route path="/reflections" element={<ReflectionsScreen />} /> 
          <Route path="/elaboration" element={<ElaborationScreen />} />
          <Route path="/interleaving" element={<InterleavingScreen />} />
          <Route path="/drawing" element={<DrawingScreen />} />
          <Route path="/schedule" element={<ScheduleScreen />} /> {/* Add ScheduleScreen route */}
          <Route path="/test" element={<TestScreen />} /> {/* Add TestScreen route */}
        </Routes>
      </main>
      {showBottomNav && <BottomNav onSettingsClick={toggleSettingsModal} />}
      <NotificationCenter 
        notifications={activeNotifications}
        settings={notificationSettings}
        unreadCount={unreadCount}
        hasPermission={hasPermission}
        onRequestPermission={requestPermission}
        onDismiss={dismissNotification}
        onDismissAll={dismissAllNotifications}
        onUpdateSettings={updateSettings}
      />
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={toggleSettingsModal}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
      />
    </div>
  );
};

export default App;
