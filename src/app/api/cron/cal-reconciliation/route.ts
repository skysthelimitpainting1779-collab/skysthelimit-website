import { handleCalReconciliationCron } from './handler';

export async function GET(request: Request): Promise<Response> {
  return handleCalReconciliationCron(request);
}
