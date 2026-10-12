import { llmsIndex, markdownResponse } from '@/lib/discovery';
export const dynamic = 'force-static';
export function GET() {
  return markdownResponse(llmsIndex());
}
