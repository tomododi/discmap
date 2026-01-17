import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload, FileJson, Loader2, AlertCircle, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { useCourseStore, useEditorStore } from '../../stores';
import { validateCourseJSON, importCourseFromJSON, saveCourse, downloadCourseJSON } from '../../utils/storage';
import { Button } from '../common/Button';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { t } = useTranslation();
  const addCourse = useCourseStore((s) => s.addCourse);
  const courses = useCourseStore((s) => s.courses);
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const setActiveCourse = useEditorStore((s) => s.setActiveCourse);
  const setActiveHole = useEditorStore((s) => s.setActiveHole);

  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ name: string; holes: number } | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentCourse = activeCourseId ? courses[activeCourseId] : null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);
    setFileContent(null);

    try {
      const content = await file.text();
      const validation = validateCourseJSON(content);

      if (!validation.valid) {
        setError(validation.error || t('import.invalidJson', 'Invalid JSON file'));
        return;
      }

      if (validation.course) {
        setPreview({
          name: validation.course.name,
          holes: validation.course.holes?.length || 0,
        });
        setFileContent(content);
        // Show confirmation if there's a current course
        if (currentCourse) {
          setShowConfirmation(true);
        }
      }
    } catch {
      setError(t('import.readError', 'Could not read file'));
    }
  };

  const handleDownloadCurrent = () => {
    if (currentCourse) {
      downloadCourseJSON(currentCourse);
    }
  };

  const handleProceedWithImport = () => {
    setShowConfirmation(false);
    handleImport();
  };

  const handleImport = async () => {
    if (!fileContent) return;

    setIsImporting(true);
    setError(null);

    try {
      const course = importCourseFromJSON(fileContent);
      addCourse(course);
      await saveCourse(course);

      // Switch to the imported course
      setActiveCourse(course.id);
      if (course.holes.length > 0) {
        setActiveHole(course.holes[0].id);
      }

      onOpenChange(false);
      resetState();
    } catch {
      setError(t('import.importError', 'Failed to import course'));
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setError(null);
    setPreview(null);
    setFileContent(null);
    setShowConfirmation(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-[400px] z-50">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileJson size={24} className="text-blue-600" />
              {t('import.title', 'Import Course')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          {/* File Input */}
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('import.selectFile', 'Select JSON file')}
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 ${
                preview ? 'border-green-400 bg-green-50/50' : 'border-gray-300'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              {preview ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle size={32} className="text-green-500" />
                  <span className="text-sm font-medium text-gray-900">{preview.name}</span>
                  <span className="text-xs text-gray-500">
                    {t('import.holesCount', '{{count}} holes', { count: preview.holes })}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {t('import.dropOrClick', 'Click to select file')}
                  </span>
                  <span className="text-xs text-gray-400">.json</span>
                </div>
              )}
            </div>
          </section>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Confirmation Warning */}
          {showConfirmation && currentCourse && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {t('import.confirmTitle', 'Import will switch to new course')}
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    {t('import.confirmMessage', 'You are currently editing "{{name}}". If you haven\'t saved it, download a backup first.', { name: currentCourse.name })}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleDownloadCurrent}
              >
                <Download size={16} className="mr-2" />
                {t('import.downloadCurrent', 'Download current course ({{name}})', { name: currentCourse.name })}
              </Button>
            </div>
          )}

          {/* Info */}
          {!showConfirmation && (
            <p className="text-xs text-gray-500 mb-6">
              {t('import.hint', 'The course will be imported with a new ID to avoid conflicts.')}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Dialog.Close asChild>
              <Button variant="secondary" className="flex-1">
                {t('import.cancel', 'Cancel')}
              </Button>
            </Dialog.Close>
            {showConfirmation ? (
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleProceedWithImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {t('import.importing', 'Importing...')}
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    {t('import.confirmImport', 'Yes, Import')}
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                className="flex-1"
                onClick={currentCourse ? () => setShowConfirmation(true) : handleImport}
                disabled={isImporting || !fileContent}
              >
                {isImporting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {t('import.importing', 'Importing...')}
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    {t('import.import', 'Import')}
                  </>
                )}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
