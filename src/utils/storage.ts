import { get, set, del, keys } from 'idb-keyval';
import type { Course } from '../types/course';
import { DEFAULT_COURSE_STYLE } from '../types/course';

const STORAGE_KEY_PREFIX = 'discmap_course_';

// Migrate course style to include new properties
function migrateCourseStyle(course: Course): Course {
  return {
    ...course,
    style: {
      ...DEFAULT_COURSE_STYLE,
      ...course.style,
    },
  };
}

export async function saveCourse(course: Course): Promise<void> {
  await set(`${STORAGE_KEY_PREFIX}${course.id}`, course);
}

export async function loadCourse(courseId: string): Promise<Course | undefined> {
  const course = await get(`${STORAGE_KEY_PREFIX}${courseId}`) as Course | undefined;
  return course ? migrateCourseStyle(course) : undefined;
}

export async function deleteCourse(courseId: string): Promise<void> {
  await del(`${STORAGE_KEY_PREFIX}${courseId}`);
}

export async function loadAllCourses(): Promise<Record<string, Course>> {
  const allKeys = await keys();
  const courseKeys = allKeys.filter(
    (k) => typeof k === 'string' && k.startsWith(STORAGE_KEY_PREFIX)
  );

  const courses: Record<string, Course> = {};
  for (const key of courseKeys) {
    const course = (await get(key as string)) as Course;
    if (course) {
      courses[course.id] = migrateCourseStyle(course);
    }
  }
  return courses;
}

export function exportCourseToJSON(course: Course): string {
  return JSON.stringify(course, null, 2);
}

export function downloadCourseJSON(course: Course): void {
  const json = exportCourseToJSON(course);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = course.name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  a.download = `${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importCourseFromJSON(json: string): Course {
  const course = JSON.parse(json) as Course;
  // Generate new ID to avoid conflicts
  course.id = crypto.randomUUID();
  course.createdAt = new Date().toISOString();
  course.updatedAt = new Date().toISOString();
  return course;
}

export function validateCourseJSON(json: string): { valid: boolean; error?: string; course?: Course } {
  try {
    const data = JSON.parse(json);

    // Check required fields
    if (!data.name || typeof data.name !== 'string') {
      return { valid: false, error: 'Missing or invalid course name' };
    }
    if (!data.holes || !Array.isArray(data.holes)) {
      return { valid: false, error: 'Missing or invalid holes array' };
    }
    if (!data.style || typeof data.style !== 'object') {
      return { valid: false, error: 'Missing or invalid style object' };
    }

    return { valid: true, course: data as Course };
  } catch {
    return { valid: false, error: 'Invalid JSON format' };
  }
}
