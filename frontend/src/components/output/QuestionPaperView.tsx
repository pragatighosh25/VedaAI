import type { QuestionPaper } from "@/lib/types";
import { DifficultyBadge } from "./DifficultyBadge";

interface QuestionPaperViewProps {
  paper: QuestionPaper;
  answerKey?: string[];
  schoolName?: string;
  subject?: string;
  className?: string;
  timeAllowed?: string;
  maxMarks?: number;
}

export function QuestionPaperView({
  paper,
  answerKey = [],
  schoolName = "Delhi Public School, Sector-4, Bokaro",
  subject = "English",
  className = "5th",
  timeAllowed = "45 minutes",
  maxMarks = 20,
}: QuestionPaperViewProps) {
  let questionNumber = 1;

  return (
    <div className="mx-auto w-full max-w-[720px] rounded-2xl bg-white px-6 py-8 shadow-xl sm:px-10 sm:py-10 print:shadow-none">
      <header className="text-center">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {schoolName}
        </h1>
        <p className="mt-2 text-base font-medium text-gray-800">
          Subject: {subject}
        </p>
        <p className="text-base font-medium text-gray-800">Class: {className}</p>
      </header>

      <div className="mt-6 flex flex-col justify-between gap-2 text-sm sm:flex-row">
        <span>Time Allowed: {timeAllowed}</span>
        <span>Maximum Marks: {maxMarks}</span>
      </div>

      <p className="mt-4 text-sm text-gray-700">
        All questions are compulsory unless stated otherwise.
      </p>

      <div className="mt-6 space-y-3 text-sm">
        <p>
          Name: <span className="inline-block min-w-[200px] border-b border-gray-400" />
        </p>
        <p>
          Roll Number:{" "}
          <span className="inline-block min-w-[180px] border-b border-gray-400" />
        </p>
        <p>
          Class: {className} Section:{" "}
          <span className="inline-block min-w-[120px] border-b border-gray-400" />
        </p>
      </div>

      {paper.sections.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="text-center text-lg font-bold text-gray-900">
            {section.title}
          </h2>
          <p className="mt-1 text-center text-sm font-semibold italic text-gray-700">
            {section.instruction}
          </p>

          <ol className="mt-4 list-none space-y-4">
            {section.questions.map((q) => {
              const num = questionNumber++;
              return (
                <li key={`${section.title}-${num}`} className="text-sm leading-relaxed text-gray-900">
                  <span className="font-medium">{num}. </span>
                  <DifficultyBadge difficulty={q.difficulty} />
                  <span className="ml-1.5">{q.text}</span>
                  <span className="ml-1 font-medium text-gray-600">
                    [{q.marks} Mark{q.marks > 1 ? "s" : ""}]
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <p className="mt-10 text-center text-sm font-bold text-gray-900">
        End of Question Paper
      </p>

      {answerKey.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-6 print:break-before-page">
          <h3 className="font-bold text-gray-900">Answer Key:</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
            {answerKey.map((ans, i) => (
              <li key={i}>{ans.replace(/^\d+\.\s*/, "")}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
