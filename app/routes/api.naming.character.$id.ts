/**
 * Naming API: Character Lookup
 *
 * GET /api/naming/character/:id
 *
 * Returns detailed information about a specific 한자 character.
 * Supports both UUID and character lookup.
 */

import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { validateCharacterParams, validateCharacterQuery } from '~/lib/naming/validators';
import { handleCharacterLookup } from '~/lib/naming/api-handlers';
import { handleApiError } from '~/lib/naming/errors';

/**
 * GET handler for character details
 *
 * @example By character
 * ```bash
 * curl http://localhost:3000/api/naming/character/智
 * ```
 *
 * @example By UUID
 * ```bash
 * curl http://localhost:3000/api/naming/character/550e8400-e29b-41d4-a716-446655440000
 * ```
 *
 * @example With additional readings
 * ```bash
 * curl http://localhost:3000/api/naming/character/智?include=readings
 * ```
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  try {
    // 1. Validate path parameters
    const validatedParams = validateCharacterParams(params);

    // 2. Parse query string
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const validatedQuery = validateCharacterQuery(queryParams);

    // 3. Execute business logic
    const result = await handleCharacterLookup(validatedParams, validatedQuery);

    // 4. Return successful response
    return json(result, { status: 200 });
  } catch (error) {
    // 5. Handle errors with user-friendly Korean messages
    return handleApiError(error);
  }
}

// Disable POST/PUT/DELETE requests for this endpoint
export async function action() {
  return json(
    {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'GET 요청만 허용됩니다',
    },
    { status: 405 }
  );
}
