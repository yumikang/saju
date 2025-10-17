/**
 * Renaming API: Analyze Current Name
 *
 * POST /api/renaming/analyze-current
 *
 * Analyzes the user's current name against their 사주 (Four Pillars).
 * Returns comprehensive analysis including score, problems, and recommendations.
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { validateAnalyzeCurrentRequest } from '~/lib/naming/validators';
import { handleAnalyzeCurrent } from '~/lib/naming/api-handlers';
import { handleApiError } from '~/lib/naming/errors';

/**
 * POST handler for current name analysis
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/renaming/analyze-current \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "birthDate": "1990-05-15",
 *     "birthTime": "14:30",
 *     "isLunar": false,
 *     "currentName": {
 *       "lastName": "김",
 *       "firstName": ["민", "준"]
 *     },
 *     "gender": "male"
 *   }'
 * ```
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate with Zod
    const validatedData = validateAnalyzeCurrentRequest(body);

    // 3. Execute business logic
    const result = await handleAnalyzeCurrent(validatedData);

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
