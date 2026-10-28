import { createSession } from '../admin/session';

export { AuthError as ManufacturerAuthError } from '../admin/session';

export const manufacturerSession = createSession('grupo_manufacturer_session');
export const { expire: expireManufacturerSession } = manufacturerSession;

export type ManufacturerProfile = {
  id: string;
  companyName: string;
  email: string;
  manufacturerType: 'garments' | 'fabric';
};

export async function manufacturerLogin(email: string, password: string): Promise<void> {
  await manufacturerSession.login('/api/manufacturer/login', { email, password });
}

export function fetchMe(token: string) {
  return manufacturerSession.request<ManufacturerProfile>(token, '/api/manufacturer/me', 'Failed to load your account.');
}
