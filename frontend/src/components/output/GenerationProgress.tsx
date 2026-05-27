"use client";

interface GenerationProgressProps {
  progress: number;
  status: string;
}

const steps = [
  { label: "Queued", threshold: 0 },
  { label: "Building prompt", threshold: 20 },
  { label: "Generating questions", threshold: 50 },
  { label: "Validating structure", threshold: 80 },
  { label: "Ready", threshold: 100 },
];

export function GenerationProgress({ progress, status }: GenerationProgressProps) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white/10 p-8 text-center text-white backdrop-blur">
      <div className="relative mx-auto mb-6 h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#FF6B00"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress * 2.64} 264`}
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
          {progress}%
        </span>
      </div>

      <h3 className="text-lg font-semibold">Generating your question paper</h3>
      <p className="mt-2 text-sm text-gray-300 capitalize">{status.replace("_", " ")}</p>

      <ul className="mt-6 space-y-2 text-left text-sm">
        {steps.map((step) => (
          <li
            key={step.label}
            className={`flex items-center gap-2 ${
              progress >= step.threshold ? "text-white" : "text-gray-500"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                progress >= step.threshold ? "bg-veda-orange" : "bg-gray-600"
              }`}
            />
            {step.label}
          </li>
        ))}
      </ul>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-veda-orange to-red-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
