import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Course,
  Hole,
  DiscGolfFeature,
  CourseStyle,
  TournamentLayout,
  TerrainFeature,
  PathFeature,
  CourseLandmarkFeature,
} from '../types/course';
import { createEmptyHole as createHole, createEmptyCourse as createCourse } from '../types/course';
import type { CourseSnapshot } from '../types/editor';

interface CourseState {
  courses: Record<string, Course>;
  undoStack: CourseSnapshot[];
  redoStack: CourseSnapshot[];
}

interface CourseActions {
  // Course CRUD
  addCourse: (course: Course) => void;
  createCourse: (name: string, coordinates: [number, number]) => string;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  setCourses: (courses: Record<string, Course>) => void;

  // Hole management
  addHole: (courseId: string) => string;
  updateHole: (courseId: string, holeId: string, updates: Partial<Hole>) => void;
  deleteHole: (courseId: string, holeId: string) => void;
  reorderHoles: (courseId: string, fromIndex: number, toIndex: number) => void;

  // Feature management
  addFeature: (courseId: string, holeId: string, feature: DiscGolfFeature) => void;
  updateFeature: (courseId: string, holeId: string, featureId: string, updates: Partial<DiscGolfFeature['properties']>) => void;
  deleteFeature: (courseId: string, holeId: string, featureId: string) => void;
  updateFeatureGeometry: (courseId: string, holeId: string, featureId: string, coordinates: unknown) => void;

  // Terrain feature management (course-level)
  addTerrainFeature: (courseId: string, feature: TerrainFeature) => void;
  updateTerrainFeature: (courseId: string, featureId: string, updates: Partial<TerrainFeature['properties']>) => void;
  deleteTerrainFeature: (courseId: string, featureId: string) => void;
  updateTerrainFeatureGeometry: (courseId: string, featureId: string, coordinates: unknown) => void;

  // Path feature management (course-level)
  addPathFeature: (courseId: string, feature: PathFeature) => void;
  updatePathFeature: (courseId: string, featureId: string, updates: Partial<PathFeature['properties']>) => void;
  deletePathFeature: (courseId: string, featureId: string) => void;
  updatePathFeatureGeometry: (courseId: string, featureId: string, coordinates: unknown) => void;

  // Landmark feature management (course-level)
  addLandmarkFeature: (courseId: string, feature: CourseLandmarkFeature) => void;
  updateLandmarkFeature: (courseId: string, featureId: string, updates: Partial<CourseLandmarkFeature['properties']>) => void;
  deleteLandmarkFeature: (courseId: string, featureId: string) => void;
  updateLandmarkFeatureGeometry: (courseId: string, featureId: string, coordinates: unknown) => void;

  // Style
  updateStyle: (courseId: string, style: Partial<CourseStyle>) => void;
  updateCourseStyle: (courseId: string, style: Partial<CourseStyle>) => void;

  // Layouts
  addLayout: (courseId: string, layout: TournamentLayout) => void;
  updateLayout: (courseId: string, layoutId: string, updates: Partial<TournamentLayout>) => void;
  deleteLayout: (courseId: string, layoutId: string) => void;
  setActiveLayout: (courseId: string, layoutId: string | undefined) => void;

  // Undo/Redo
  saveSnapshot: (courseId: string) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

type CourseStore = CourseState & CourseActions;

export const useCourseStore = create<CourseStore>()(
  immer((set, get) => ({
    courses: {},
    undoStack: [],
    redoStack: [],

    // Course CRUD
    addCourse: (course) => {
      set((state) => {
        state.courses[course.id] = course;
      });
    },

    createCourse: (name, coordinates) => {
      const course = createCourse(name, coordinates);
      set((state) => {
        state.courses[course.id] = course;
      });
      return course.id;
    },

    updateCourse: (courseId, updates) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course) {
          Object.assign(course, updates, { updatedAt: new Date().toISOString() });
        }
      });
    },

    deleteCourse: (courseId) => {
      set((state) => {
        delete state.courses[courseId];
      });
    },

    setCourses: (courses) => {
      set((state) => {
        state.courses = courses;
      });
    },

    // Hole management
    addHole: (courseId) => {
      const hole = createHole(get().courses[courseId]?.holes.length + 1 || 1);
      set((state) => {
        const course = state.courses[courseId];
        if (course) {
          course.holes.push(hole);
          course.totalHoles = course.holes.length;
          course.updatedAt = new Date().toISOString();
        }
      });
      return hole.id;
    },

    updateHole: (courseId, holeId, updates) => {
      set((state) => {
        const course = state.courses[courseId];
        const hole = course?.holes.find((h) => h.id === holeId);
        if (hole) {
          Object.assign(hole, updates, { updatedAt: new Date().toISOString() });
          course!.updatedAt = new Date().toISOString();
        }
      });
    },

    deleteHole: (courseId, holeId) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course) {
          course.holes = course.holes.filter((h) => h.id !== holeId);
          // Renumber remaining holes
          course.holes.forEach((h, i) => {
            h.number = i + 1;
          });
          course.totalHoles = course.holes.length;
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    reorderHoles: (courseId, fromIndex, toIndex) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course) {
          const [hole] = course.holes.splice(fromIndex, 1);
          course.holes.splice(toIndex, 0, hole);
          // Renumber
          course.holes.forEach((h, i) => {
            h.number = i + 1;
          });
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    // Feature management
    addFeature: (courseId, holeId, feature) => {
      set((state) => {
        const course = state.courses[courseId];
        const hole = course?.holes.find((h) => h.id === holeId);
        if (hole) {
          hole.features.push(feature);
          hole.updatedAt = new Date().toISOString();
          course!.updatedAt = new Date().toISOString();
        }
      });
    },

    updateFeature: (courseId, holeId, featureId, updates) => {
      set((state) => {
        const course = state.courses[courseId];
        const hole = course?.holes.find((h) => h.id === holeId);
        const feature = hole?.features.find((f) => f.properties.id === featureId);
        if (feature) {
          Object.assign(feature.properties, updates, { updatedAt: new Date().toISOString() });
          hole!.updatedAt = new Date().toISOString();
          course!.updatedAt = new Date().toISOString();
        }
      });
    },

    deleteFeature: (courseId, holeId, featureId) => {
      set((state) => {
        const course = state.courses[courseId];
        const hole = course?.holes.find((h) => h.id === holeId);
        if (hole) {
          hole.features = hole.features.filter((f) => f.properties.id !== featureId);
          hole.updatedAt = new Date().toISOString();
          course!.updatedAt = new Date().toISOString();
        }
      });
    },

    updateFeatureGeometry: (courseId, holeId, featureId, coordinates) => {
      set((state) => {
        const course = state.courses[courseId];
        const hole = course?.holes.find((h) => h.id === holeId);
        const feature = hole?.features.find((f) => f.properties.id === featureId);
        if (feature) {
          (feature.geometry as { coordinates: unknown }).coordinates = coordinates;
          feature.properties.updatedAt = new Date().toISOString();
          hole!.updatedAt = new Date().toISOString();
          course!.updatedAt = new Date().toISOString();
        }
      });
    },

    // Terrain feature management (course-level)
    addTerrainFeature: (courseId, feature) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course) {
          if (!course.terrainFeatures) {
            course.terrainFeatures = [];
          }
          course.terrainFeatures.push(feature);
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    updateTerrainFeature: (courseId, featureId, updates) => {
      set((state) => {
        const course = state.courses[courseId];
        const feature = course?.terrainFeatures?.find((f) => f.properties.id === featureId);
        if (feature) {
          Object.assign(feature.properties, updates, { updatedAt: new Date().toISOString() });
          course!.updatedAt = new Date().toISOString();
        }
      });
    },

    deleteTerrainFeature: (courseId, featureId) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course && course.terrainFeatures) {
          course.terrainFeatures = course.terrainFeatures.filter((f) => f.properties.id !== featureId);
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    updateTerrainFeatureGeometry: (courseId, featureId, coordinates) => {
      set((state) => {
        const course = state.courses[courseId];
        const feature = course?.terrainFeatures?.find((f) => f.properties.id === featureId);
        if (feature) {
          (feature.geometry as { coordinates: unknown }).coordinates = coordinates;
          feature.properties.updatedAt = new Date().toISOString();
          course!.updatedAt = new Date().toISOString();
        }
      });
    },

    // Path feature management (course-level)
    addPathFeature: (courseId, feature) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course) {
          if (!course.pathFeatures) {
            course.pathFeatures = [];
          }
          course.pathFeatures.push(feature);
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    updatePathFeature: (courseId, featureId, updates) => {
      set((state) => {
        const course = state.courses[courseId];
        const feature = course?.pathFeatures?.find((f) => f.properties.id === featureId);
        if (feature) {
          Object.assign(feature.properties, updates, { updatedAt: new Date().toISOString() });
          course!.updatedAt = new Date().toISOString();
        }
      });
    },

    deletePathFeature: (courseId, featureId) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course && course.pathFeatures) {
          course.pathFeatures = course.pathFeatures.filter((f) => f.properties.id !== featureId);
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    updatePathFeatureGeometry: (courseId, featureId, coordinates) => {
      set((state) => {
        const course = state.courses[courseId];
        const feature = course?.pathFeatures?.find((f) => f.properties.id === featureId);
        if (feature) {
          (feature.geometry as { coordinates: unknown }).coordinates = coordinates;
          feature.properties.updatedAt = new Date().toISOString();
          course!.updatedAt = new Date().toISOString();
        }
      });
    },

    // Landmark feature management (course-level)
    addLandmarkFeature: (courseId, feature) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course) {
          if (!course.landmarkFeatures) {
            course.landmarkFeatures = [];
          }
          course.landmarkFeatures.push(feature);
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    updateLandmarkFeature: (courseId, featureId, updates) => {
      set((state) => {
        const course = state.courses[courseId];
        const feature = course?.landmarkFeatures?.find((f) => f.properties.id === featureId);
        if (feature) {
          Object.assign(feature.properties, updates, { updatedAt: new Date().toISOString() });
          course!.updatedAt = new Date().toISOString();
        }
      });
    },

    deleteLandmarkFeature: (courseId, featureId) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course && course.landmarkFeatures) {
          course.landmarkFeatures = course.landmarkFeatures.filter((f) => f.properties.id !== featureId);
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    updateLandmarkFeatureGeometry: (courseId, featureId, coordinates) => {
      set((state) => {
        const course = state.courses[courseId];
        const feature = course?.landmarkFeatures?.find((f) => f.properties.id === featureId);
        if (feature) {
          (feature.geometry as { coordinates: unknown }).coordinates = coordinates;
          feature.properties.updatedAt = new Date().toISOString();
          course!.updatedAt = new Date().toISOString();
        }
      });
    },

    // Style
    updateStyle: (courseId, style) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course) {
          Object.assign(course.style, style);
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    updateCourseStyle: (courseId, style) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course) {
          Object.assign(course.style, style);
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    // Layouts
    addLayout: (courseId, layout) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course) {
          course.layouts.push(layout);
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    updateLayout: (courseId, layoutId, updates) => {
      set((state) => {
        const course = state.courses[courseId];
        const layout = course?.layouts.find((l) => l.id === layoutId);
        if (layout) {
          Object.assign(layout, updates);
          course!.updatedAt = new Date().toISOString();
        }
      });
    },

    deleteLayout: (courseId, layoutId) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course) {
          course.layouts = course.layouts.filter((l) => l.id !== layoutId);
          if (course.activeLayoutId === layoutId) {
            course.activeLayoutId = undefined;
          }
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    setActiveLayout: (courseId, layoutId) => {
      set((state) => {
        const course = state.courses[courseId];
        if (course) {
          course.activeLayoutId = layoutId;
          course.updatedAt = new Date().toISOString();
        }
      });
    },

    // Undo/Redo
    saveSnapshot: (courseId) => {
      const course = get().courses[courseId];
      if (!course) return;

      const snapshot: CourseSnapshot = {
        courseId,
        data: structuredClone(course),
        timestamp: new Date().toISOString(),
      };

      set((state) => {
        state.undoStack.push(snapshot);
        state.redoStack = [];
        // Limit stack size
        if (state.undoStack.length > 50) {
          state.undoStack.shift();
        }
      });
    },

    undo: () => {
      const { undoStack, courses } = get();
      if (undoStack.length === 0) return;

      const snapshot = undoStack[undoStack.length - 1];
      const currentState = structuredClone(courses[snapshot.courseId]);

      set((state) => {
        state.undoStack.pop();
        if (currentState) {
          state.redoStack.push({
            courseId: snapshot.courseId,
            data: currentState,
            timestamp: new Date().toISOString(),
          });
        }
        state.courses[snapshot.courseId] = snapshot.data;
      });
    },

    redo: () => {
      const { redoStack, courses } = get();
      if (redoStack.length === 0) return;

      const snapshot = redoStack[redoStack.length - 1];
      const currentState = structuredClone(courses[snapshot.courseId]);

      set((state) => {
        state.redoStack.pop();
        if (currentState) {
          state.undoStack.push({
            courseId: snapshot.courseId,
            data: currentState,
            timestamp: new Date().toISOString(),
          });
        }
        state.courses[snapshot.courseId] = snapshot.data;
      });
    },

    clearHistory: () => {
      set((state) => {
        state.undoStack = [];
        state.redoStack = [];
      });
    },
  }))
);
