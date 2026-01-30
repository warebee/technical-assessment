"use client";

import { MarkformField } from "@/lib/markform-parser";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { FieldError, UseFormRegister, UseFormSetValue } from "react-hook-form";
import SQLCodeInput from "./SQLCodeInput";

interface FormFieldProps {
  field: MarkformField;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  error?: FieldError;
  value?: any;
  commentValue?: string;
  taskNumber?: number;
  compact?: boolean;
}

export default function FormField({
  field,
  register,
  setValue,
  error,
  value,
  commentValue,
  taskNumber,
  compact = false,
}: FormFieldProps) {
  const isBonus = field.label.toUpperCase().includes("BONUS");
  const [showComment, setShowComment] = useState(!!commentValue);

  return (
    <div
      className={`space-y-4 ${isBonus ? "border-l-4 border-yellow-500/50 pl-5 -ml-1" : ""}`}
    >
      {/* Label */}
      <div className="task-header">
        <label
          htmlFor={field.id}
          className={`block font-medium text-menu-h2 ${compact ? "text-sm" : "text-base"}`}
        >
          {taskNumber && (
            <span className="text-brand font-semibold mr-2">
              Task {taskNumber}:
            </span>
          )}
          {field.label}
          {field.required && <span className="task-required">*</span>}
          {isBonus && <span className="task-bonus">* BONUS</span>}
        </label>
      </div>

      {/* Field Type-Specific Input */}
      <div className="task-body">
        {renderField(field, register, setValue, value)}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <svg
            className="w-4 h-4 text-red-400 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-400">{error.message}</p>
        </div>
      )}

      {/* Optional Comment Section */}
      <div className="pt-4 mt-4 border-t border-app-header-divide/50">
        <button
          type="button"
          onClick={() => setShowComment(!showComment)}
          className="flex items-center gap-2 text-sm text-menu-h4 hover:text-brand transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          {showComment ? "Hide comments" : "Add extra comments or notes"}
        </button>

        {showComment && (
          <div className="mt-4 space-y-2">
            <textarea
              id={`${field.id}_comment`}
              {...register(`${field.id}_comment`)}
              rows={3}
              className="form-textarea text-sm min-h-[100px]"
              placeholder="Add any additional comments, explanations, or notes about your answer..."
            />
            <p className="text-xs text-menu-h5">
              Optional: Explain your reasoning, assumptions, or alternative
              approaches
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function renderField(
  field: MarkformField,
  register: UseFormRegister<any>,
  setValue: UseFormSetValue<any>,
  value?: any,
) {
  switch (field.kind) {
    case "string":
      // Use SQL editor for fields with SQL-related labels or long maxLength
      const isSQLField =
        field.label.toLowerCase().includes("sql") ||
        field.label.toLowerCase().includes("query") ||
        field.label.toLowerCase().includes("write a") ||
        (field.maxLength && field.maxLength >= 1000);

      if (isSQLField) {
        return (
          <SQLCodeInput
            field={field}
            register={register}
            setValue={setValue}
            value={value}
          />
        );
      }

      // Short text input
      if (!field.maxLength || field.maxLength <= 500) {
        return (
          <input
            type="text"
            id={field.id}
            {...register(field.id)}
            className="form-input"
            placeholder="Enter your answer..."
          />
        );
      }

      // Long text textarea
      return (
        <textarea
          id={field.id}
          {...register(field.id)}
          rows={6}
          className="form-code-textarea min-h-[160px]"
          placeholder="Enter your answer..."
        />
      );

    case "single_select":
      return (
        <div className="space-y-3">
          {field.options?.map((option) => (
            <label key={option.id} className="option-card">
              <input type="radio" {...register(field.id)} value={option.id} />
              <div className="flex-1">
                <span className="text-base font-medium text-menu-h2">
                  {option.label}
                </span>
                {option.description && (
                  <p className="text-sm text-menu-h4 mt-1">
                    {option.description}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      );

    case "checkboxes":
      return (
        <div className="space-y-3">
          {field.options?.map((option) => (
            <label key={option.id} className="option-card">
              <input
                type="checkbox"
                {...register(field.id)}
                value={option.id}
                className="rounded"
              />
              <div className="flex-1">
                <span className="text-base font-medium text-menu-h2">
                  {option.label}
                </span>
                {option.description && (
                  <p className="text-sm text-menu-h4 mt-1">
                    {option.description}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      );

    case "number":
      return (
        <input
          type="number"
          id={field.id}
          {...register(field.id, { valueAsNumber: true })}
          className="form-input"
          placeholder="Enter a number..."
        />
      );

    default:
      return (
        <input
          type="text"
          id={field.id}
          {...register(field.id)}
          className="form-input"
          placeholder="Enter your answer..."
        />
      );
  }
}
