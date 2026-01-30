"use client";

import { MarkformField } from "@/lib/markform-parser";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useCallback, useEffect, useRef, useState } from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";

interface SQLCodeInputProps {
  field: MarkformField;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  value?: string;
}

export default function SQLCodeInput({
  field,
  register,
  setValue,
  value,
}: SQLCodeInputProps) {
  const [mounted, setMounted] = useState(false);
  const [editorHeight, setEditorHeight] = useState(250);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromEditor = useRef(false);

  // Register the field (for form validation)
  register(field.id);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync external value changes to editor (only when not caused by user typing)
  useEffect(() => {
    if (!isUpdatingFromEditor.current && editorRef.current) {
      const currentEditorValue = editorRef.current.getValue();
      const newValue = value ?? "";
      // Only update if the values are actually different
      if (currentEditorValue !== newValue) {
        const position = editorRef.current.getPosition();
        editorRef.current.setValue(newValue);
        // Restore cursor position if possible
        if (position) {
          editorRef.current.setPosition(position);
        }
      }
    }
  }, [value]);

  const handleEditorChange = useCallback(
    (newValue: string | undefined) => {
      const val = newValue ?? "";
      // Mark that we're updating from editor to prevent feedback loop
      isUpdatingFromEditor.current = true;
      // Update form value
      setValue(field.id, val, { shouldDirty: true, shouldTouch: true });
      // Reset flag after update
      setTimeout(() => {
        isUpdatingFromEditor.current = false;
      }, 0);
    },
    [setValue, field.id],
  );

  const handleEditorMount: OnMount = useCallback(
    (editor) => {
      editorRef.current = editor;
      // Set initial value if we have one
      if (value) {
        editor.setValue(value);
      }
    },
    [value],
  );

  // Resize handler
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startHeight = editorHeight;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startY;
        const newHeight = Math.max(150, Math.min(800, startHeight + deltaY));
        setEditorHeight(newHeight);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [editorHeight],
  );

  // Show loading state during SSR/hydration
  if (!mounted) {
    return (
      <div className="bg-app-panel rounded-xl border border-app-header-divide min-h-[250px] flex items-center justify-center">
        <span className="text-menu-h5 text-sm">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="rounded-xl overflow-hidden border border-app-header-divide bg-app-panel">
        <Editor
          height={`${editorHeight}px`}
          defaultLanguage="sql"
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 20, bottom: 20 },
            renderLineHighlight: "line",
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            folding: false,
            glyphMargin: false,
            lineDecorationsWidth: 8,
            lineNumbersMinChars: 3,
          }}
        />
      </div>

      {/* Resize handle */}
      <div
        className="h-3 cursor-ns-resize flex items-center justify-center hover:bg-app-card/50 transition-colors rounded-b-xl"
        onMouseDown={handleMouseDown}
      >
        <div className="w-16 h-1 bg-menu-h5/50 rounded-full" />
      </div>

      {/* Helper Info */}
      {/* <div className="text-xs text-menu-h5 mt-2">
        <span>SQL syntax highlighting enabled • Drag bottom edge to resize</span>
      </div> */}
    </div>
  );
}
