'use client';

interface FormSubmitProps {
  isSubmitting: boolean;
}

export default function FormSubmit({ isSubmitting }: FormSubmitProps) {
  return (
    <div className="bg-app-card rounded-lg shadow-lg p-8 border border-app-header-divide sticky bottom-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-menu-h4">
          <p className="font-medium text-menu-h2 mb-1">Ready to submit?</p>
          <p>Your answers will be emailed to the evaluation team for review.</p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-8 py-3 rounded-lg font-medium transition-all ${
            isSubmitting
              ? 'bg-menu-h5/30 text-menu-h5 cursor-not-allowed'
              : 'bg-brand text-menu-active-text hover:bg-brand/80 hover:shadow-lg transform hover:-translate-y-0.5'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Assessment'
          )}
        </button>
      </div>
    </div>
  );
}
