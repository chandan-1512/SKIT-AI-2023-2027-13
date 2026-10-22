const API_BASE_URL = '/api';

export async function predictLoan(applicantData) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicantData),
    });
  } catch {
    throw new Error(
      'Backend se connection nahi ho paya. Check karo ki FastAPI server running hai.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data.detail;

    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(', ')
      : typeof detail === 'string'
        ? detail
        : 'Loan prediction request failed.';

    throw new Error(message);
  }

  return data;
}
