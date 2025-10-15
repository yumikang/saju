/**
 * Naming API: Analyze Birth Data
 *
 * POST /api/naming/analyze
 *
 * Analyzes birth data to calculate 사주 (Four Pillars).
 * Returns saju analysis with unique ID for future reference.
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { validateAnalyzeRequest } from '~/lib/naming/validators';
import { handleAnalyze } from '~/lib/naming/api-handlers';
import { handleApiError } from '~/lib/naming/errors';

/**
 * POST handler for saju analysis
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/naming/analyze \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "birthDate": "1990-05-15",
 *     "birthTime": "14:30",
 *     "isLunar": false,
 *     "gender": "male"
 *   }'
 * ```
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate with Zod
    const validatedData = validateAnalyzeRequest(body);

    // 3. Execute business logic
    const result = await handleAnalyze(validatedData);

    // 4. Return successful response
    return json(result, { status: 200 });
  } catch (error) {
    // 5. Handle errors with user-friendly Korean messages
    return handleApiError(error);
  }
}

// Disable GET requests for this endpoint
export async function loader() {
  return json(
    {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'POST 요청만 허용됩니다',
    },
    { status: 405 }
  );
}
