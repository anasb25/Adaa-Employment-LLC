interface CarryForwardInfoProps {
  variant?: 'default' | 'compact';
}

export default function CarryForwardInfo({ variant = 'default' }: CarryForwardInfoProps) {
  if (variant === 'compact') {
    return (
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800">
        <div className="flex gap-2">
          <svg
            className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Carry-Forward System:</strong> Employee status remains unchanged until
            explicitly updated. No need to create daily records.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 border border-blue-200 dark:border-blue-800">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            📌 How the Carry-Forward System Works
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <p>
              <strong>Event-Based Records:</strong> We only create records when an employee's
              status changes (mobilization, demobilization, leave, etc.).
            </p>
            <p>
              <strong>Automatic Persistence:</strong> Once set, a status automatically
              "carries forward" to subsequent days until explicitly changed.
            </p>
            <p className="text-xs italic">
              Example: If John was mobilized on Jan 1st, he remains mobilized on Jan 2nd,
              3rd, etc., without creating new records each day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

