/**
 * Naming API: Recommend Names
 *
 * POST /api/naming/recommend
 *
 * Generates name recommendations based on 사주 analysis.
 * Returns scored candidates with detailed analysis.
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { validateRecommendRequest } from '~/lib/naming/validators';
import { handleRecommendation } from '~/lib/naming/api-handlers';
import { handleApiError } from '~/lib/naming/errors';

/**
 * POST handler for name recommendations
 *
 * @example Using existing saju data
 * ```bash
 * curl -X POST http://localhost:3000/api/naming/recommend \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "sajuDataId": "550e8400-e29b-41d4-a716-446655440000",
 *     "lastName": "김",
 *     "preferences": {
 *       "minScore": 65,
 *       "maxResults": 50,
 *       "gender": "male"
 *     }
 *   }'
 * ```
 *
 * @example Calculating saju on-the-fly
 * ```bash
 * curl -X POST http://localhost:3000/api/naming/recommend \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "birthData": {
 *       "birthDate": "1990-05-15",
 *       "birthTime": "14:30",
 *       "isLunar": false,
 *       "gender": "male"
 *     },
 *     "lastName": "김",
 *     "preferences": {
 *       "minScore": 60,
 *       "maxResults": 100
 *     }
 *   }'
 * ```
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate with Zod
    const validatedData = validateRecommendRequest(body);

    // 3. Execute business logic (Phase 1 integration)
    const result = await handleRecommendation(validatedData);

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
