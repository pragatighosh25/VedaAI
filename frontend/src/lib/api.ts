import type { Assignment, QuestionPaper } from "./types";
import { questionPaperSchema } from "./validators";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token =
  typeof window !== "undefined"
    ? JSON.parse(
        localStorage.getItem(
          "veda-auth"
        ) || "{}"
      )?.state?.token
    : null;

  const res = await fetch(
    `${API_URL}${path}`,
    {
      ...options,

      headers: {
        ...(options?.body instanceof FormData
          ? {}
          : {
              "Content-Type":
                "application/json",
            }),

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...options?.headers,
      },
    }
  );

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({
        error: res.statusText,
      }));

    throw new Error(
      err.error ??
        err.message ??
        "Request failed"
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

/* -------------------------------------------------------------------------- */
/*                                   AUTH                                     */
/* -------------------------------------------------------------------------- */

export interface User {
  _id: string;

  name: string;

  email: string;

  avatar?: string;

  schoolName?: string;

  subject?: string;

  className?: string;
}

export interface AuthResponse {
  token: string;

  user: User;
}

export async function signup(data: {
  name: string;
  email: string;
  password: string;
}) {
  return request<AuthResponse>(
    "/api/auth/signup",
    {
      method: "POST",

      body: JSON.stringify(data),
    }
  );
}

export async function login(data: {
  email: string;
  password: string;
}) {
  return request<AuthResponse>(
    "/api/auth/login",
    {
      method: "POST",

      body: JSON.stringify(data),
    }
  );
}

export async function fetchProfile() {
  return request<User>(
    "/api/user/profile"
  );
}

export async function updateProfile(data: {
  name: string;
  schoolName: string;
  subject: string;
  className: string;
  avatar?: string;
}) {
  return request<User>(
    "/api/user/profile",
    {
      method: "PUT",

      body: JSON.stringify(data),
    }
  );
}
export async function downloadPdf(
  id: string
) {
  const token =
    JSON.parse(
      localStorage.getItem(
        "veda-auth"
      ) || "{}"
    )?.state?.token;

  const response = await fetch(
    `${API_URL}/api/assignments/${id}/pdf`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to download PDF"
    );
  }

  const blob =
    await response.blob();

  const url =
    window.URL.createObjectURL(
      blob
    );

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    "question-paper.pdf";

  document.body.appendChild(a);

  a.click();

  a.remove();

  window.URL.revokeObjectURL(
    url
  );
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return request(
    "/api/user/change-password",
    {
      method: "PUT",

      body: JSON.stringify(data),
    }
  );
}

/* -------------------------------------------------------------------------- */
/*                               ASSIGNMENTS                                  */
/* -------------------------------------------------------------------------- */

export async function fetchAssignments(): Promise<
  Assignment[]
> {
  return request<Assignment[]>(
    "/api/assignments"
  );
}

export async function fetchAssignment(
  id: string
): Promise<Assignment> {
  return request<Assignment>(
    `/api/assignments/${id}`
  );
}

export async function deleteAssignment(
  id: string
): Promise<void> {
  return request(
    `/api/assignments/${id}`,
    {
      method: "DELETE",
    }
  );
}

export async function createAssignment(
  formData: FormData
): Promise<Assignment> {
  return request<Assignment>(
    "/api/assignments",
    {
      method: "POST",

      body: formData,
    }
  );
}

export async function regenerateAssignment(
  id: string
): Promise<Assignment> {
  return request<Assignment>(
    `/api/assignments/${id}/regenerate`,
    {
      method: "POST",
    }
  );
}

/* -------------------------------------------------------------------------- */
/*                              QUESTION PAPER                                */
/* -------------------------------------------------------------------------- */

export interface PaperResponse {
  status: string;

  progress: number;

  paper: QuestionPaper | null;

  answerKey: string[];

  totalMarks?: number;

  totalQuestions?: number;

  error?: string;
}

export async function fetchQuestionPaper(
  id: string
): Promise<PaperResponse> {
  const data =
    await request<PaperResponse>(
      `/api/assignments/${id}/paper`
    );

  if (data.paper) {
    const parsed =
      questionPaperSchema.safeParse(
        data.paper
      );

    if (!parsed.success) {
      throw new Error(
        "Invalid question paper structure from server"
      );
    }

    data.paper = parsed.data;
  }

  return data;
}

export function getPdfDownloadUrl(
  id: string
): string {
  return `${API_URL}/api/assignments/${id}/pdf`;
}