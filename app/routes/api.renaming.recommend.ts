/**
 * Renaming API: Recommend Names
 *
 * POST /api/renaming/recommend
 *
 * Generates name recommendations for renaming (개명) based on existing saju analysis.
 * Uses analysisId from previous analyze-current call.
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { validateRenamingRecommendRequest } from '~/lib/naming/validators';
import { handleRenamingRecommend } from '~/lib/naming/api-handlers';
import { handleApiError } from '~/lib/naming/errors';

/**
 * POST handler for renaming recommendations
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/renaming/recommend \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "analysisId": "550e8400-e29b-41d4-a716-446655440000",
 *     "preferences": {
 *       "minScore": 75,
 *       "maxResults": 20,
 *       "gender": "male",
 *       "avoidCharacters": ["衝", "沖", "病"]
 *     }
 *   }'
 * ```
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate with Zod
    const validatedData = validateRenamingRecommendRequest(body);

    // 3. Execute business logic
    const result = await handleRenamingRecommend(validatedData);

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
