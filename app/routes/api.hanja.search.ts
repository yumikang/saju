import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { 
  searchHanjaFromDB, 
  validateInput,
  type ApiError 
} from "~/lib/hanja-service.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const reading = url.searchParams.get("reading");
  const isSurname = url.searchParams.get("surname") === "true";
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const cursor = url.searchParams.get("cursor") || undefined;
  const sort = url.searchParams.get("sort") as 'popularity' | 'strokes' | 'element' | undefined;
  
  // 입력값 검증
  if (!reading) {
    const error: ApiError = {
      code: 'MISSING_PARAMETER',
      message: 'Reading parameter is required'
    };
    return json(error, { status: 400 });
  }
  
  const validation = validateInput(reading);
  if (!validation.valid) {
    const error: ApiError = {
      code: 'INVALID_INPUT',
      message: validation.error!
    };
    return json(error, { status: 400 });
  }
  
  try {
    // 타임아웃 설정 (5초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const result = await Promise.race([
      searchHanjaFromDB({
        reading,
        isSurname,
        limit,
        cursor,
        sort
      }),
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('Request timeout'));
        });
      })
    ]);
    
    clearTimeout(timeoutId);
    
    return json(result);
  } catch (error: any) {
    console.error("Error searching hanja:", error);
    
    if (error.message === 'Request timeout') {
      const apiError: ApiError = {
        code: 'TIMEOUT',
        message: 'Request timed out after 5 seconds'
      };
      return json(apiError, { status: 504 });
    }
    
    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to search hanja',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
    return json(apiError, { status: 500 });
  }
}