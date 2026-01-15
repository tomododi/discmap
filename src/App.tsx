import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer } from './components/map/MapContainer';
import { Sidebar } from './components/common/Sidebar';
import { Toolbar } from './components/common/Toolbar';
import { OnboardingProvider, OnboardingOverlay } from './components/onboarding';
import { useCourseStore, useEditorStore, useSettingsStore } from './stores';
import { loadAllCourses, saveCourse } from './utils/storage';
import { createEmptyCourse } from './types/course';

function App() {
  const { i18n } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setCourses = useCourseStore((s) => s.setCourses);
  const courses = useCourseStore((s) => s.courses);
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const setActiveCourse = useEditorStore((s) => s.setActiveCourse);
  const setActiveHole = useEditorStore((s) => s.setActiveHole);
  const autoSave = useSettingsStore((s) => s.autoSave);
  const autoSaveInterval = useSettingsStore((s) => s.autoSaveInterval);

  // Sync language
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  // Load courses from IndexedDB on mount
  useEffect(() => {
    loadAllCourses().then((loadedCourses) => {
      if (Object.keys(loadedCourses).length > 0) {
        setCourses(loadedCourses);
        // Set first course as active
        const firstCourseId = Object.keys(loadedCourses)[0];
        setActiveCourse(firstCourseId);
        const firstHoleId = loadedCourses[firstCourseId].holes[0]?.id;
        if (firstHoleId) {
          setActiveHole(firstHoleId);
        }
      } else {
        // Create a demo course if none exist
        const demoCourse = createEmptyCourse('My First Course', [21.0122, 52.2297]);
        setCourses({ [demoCourse.id]: demoCourse });
        setActiveCourse(demoCourse.id);
        setActiveHole(demoCourse.holes[0].id);
      }
    });
  }, [setCourses, setActiveCourse, setActiveHole]);

  // Auto-save courses to IndexedDB
  useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(() => {
      Object.values(courses).forEach((course) => {
        saveCourse(course);
      });
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [courses, autoSave, autoSaveInterval]);

  // Save on course change
  useEffect(() => {
    if (activeCourseId && courses[activeCourseId]) {
      saveCourse(courses[activeCourseId]);
    }
  }, [activeCourseId, courses]);

  return (
    <OnboardingProvider>
      <div className="h-screen w-screen relative overflow-hidden bg-gray-100">
        <MapContainer />
        <Toolbar />
        <Sidebar />
        <OnboardingOverlay />
      </div>
    </OnboardingProvider>
  );
}

export default App;
