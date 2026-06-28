import type { Request, Response } from 'express';
import { PERMISSIONS, type AuthenticatedUser } from 'cityops-ai-shared';
import { HttpError } from '../errors/HttpError';
import { requireAuthentication } from '../middleware/authenticate';
import { requirePermissions, requireRoles } from '../middleware/authorize';
import { mapDecodedTokenToUser, resolveRole } from '../services/auth/authService';
import type { AuthService } from '../services/auth/types';

interface MockRequestOverrides {
  header?: (name: string) => string | string[] | undefined;
  get?: (name: string) => string | undefined;
  user?: AuthenticatedUser;
}

function createMockRequest(overrides: MockRequestOverrides = {}): Request {
  const headers = new Map<string, string>();

  return {
    header: overrides.header ?? ((name: string) => headers.get(name.toLowerCase())),
    get: overrides.get ?? ((name: string) => headers.get(name.toLowerCase())),
    ...overrides,
  } as Request;
}

function createMockResponse(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('authentication middleware', () => {
  it('stores authenticated user context on the request', async () => {
    const user: AuthenticatedUser = {
      uid: 'citizen-123',
      role: 'citizen',
      permissions: [...CITIZEN_PERMISSIONS],
      email: 'citizen@example.com',
      displayName: 'Citizen User',
    };
    const req = createMockRequest({
      header: (name: string) => (name.toLowerCase() === 'authorization' ? 'Bearer valid-token' : undefined),
    });
    const res = createMockResponse();
    const next = jest.fn();
    const authService: AuthService = {
      verifyIdToken: jest.fn().mockResolvedValue(user),
    };
    await requireAuthentication(authService)(req, res, next);

    expect(authService.verifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects missing authorization headers', async () => {
    const req = createMockRequest({
      header: () => undefined,
    });
    const res = createMockResponse();
    const next = jest.fn();

    await requireAuthentication({ verifyIdToken: jest.fn() })(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(HttpError));
    expect((next.mock.calls[0][0] as HttpError).code).toBe('AUTH_TOKEN_MISSING');
  });

  it('surfaces invalid token errors', async () => {
    const req = createMockRequest({
      header: (name: string) => (name.toLowerCase() === 'authorization' ? 'Bearer invalid-token' : undefined),
    });
    const res = createMockResponse();
    const next = jest.fn();
    const authService: AuthService = {
      verifyIdToken: jest.fn().mockRejectedValue(new HttpError(401, 'AUTH_TOKEN_INVALID', 'Invalid token.')),
    };
    await requireAuthentication(authService)(req, res, next);

    expect((next.mock.calls[0][0] as HttpError).code).toBe('AUTH_TOKEN_INVALID');
  });

  it('surfaces expired token errors', async () => {
    const req = createMockRequest({
      header: (name: string) => (name.toLowerCase() === 'authorization' ? 'Bearer expired-token' : undefined),
    });
    const res = createMockResponse();
    const next = jest.fn();
    const authService: AuthService = {
      verifyIdToken: jest.fn().mockRejectedValue(new HttpError(401, 'AUTH_TOKEN_EXPIRED', 'Expired token.')),
    };
    await requireAuthentication(authService)(req, res, next);

    expect((next.mock.calls[0][0] as HttpError).code).toBe('AUTH_TOKEN_EXPIRED');
  });
});

describe('authorization middleware', () => {
  it('rejects users without the required role', () => {
    const req = createMockRequest({
      user: {
        uid: 'citizen-456',
        role: 'citizen',
        permissions: [...CITIZEN_PERMISSIONS],
      },
    });
    const res = createMockResponse();
    const next = jest.fn();

    requireRoles('authority')(req, res, next);

    expect((next.mock.calls[0][0] as HttpError).code).toBe('AUTHORIZATION_ROLE_DENIED');
  });

  it('rejects users without the required permission', () => {
    const req = createMockRequest({
      user: {
        uid: 'authority-123',
        role: 'authority',
        permissions: [PERMISSIONS.viewOwnProfile],
      },
    });
    const res = createMockResponse();
    const next = jest.fn();

    requirePermissions(PERMISSIONS.accessDashboard)(req, res, next);

    expect((next.mock.calls[0][0] as HttpError).code).toBe('AUTHORIZATION_PERMISSION_DENIED');
  });

  it('allows users with the required permission', () => {
    const req = createMockRequest({
      user: {
        uid: 'authority-456',
        role: 'authority',
        permissions: [PERMISSIONS.viewOwnProfile, PERMISSIONS.accessDashboard],
      },
    });
    const res = createMockResponse();
    const next = jest.fn();

    requirePermissions(PERMISSIONS.accessDashboard)(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});

describe('auth service helpers', () => {
  it('defaults users without a custom role claim to citizen', () => {
    expect(resolveRole({ uid: 'citizen-789' } as never)).toBe('citizen');
  });

  it('maps decoded Firebase tokens into shared authenticated users', () => {
    const user = mapDecodedTokenToUser({
      uid: 'authority-789',
      role: 'authority',
      email: 'authority@example.com',
      name: 'Authority User',
    } as never);

    expect(user).toEqual({
      uid: 'authority-789',
      role: 'authority',
      permissions: expect.arrayContaining([PERMISSIONS.accessDashboard]),
      email: 'authority@example.com',
      displayName: 'Authority User',
    });
  });
});

const CITIZEN_PERMISSIONS: AuthenticatedUser['permissions'] = [
  PERMISSIONS.submitReport,
  PERMISSIONS.readOwnReports,
  PERMISSIONS.viewResolutionSummaries,
  PERMISSIONS.confirmReport,
  PERMISSIONS.trackReportStatus,
  PERMISSIONS.viewOwnProfile,
];
