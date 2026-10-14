import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// Login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Allow admin123 or blank password for demo ease
  if (password && password !== 'admin123' && password !== 'password') {
    return res.status(401).json({ error: 'Invalid password. (Hint: demo password is admin123)' });
  }

  const roleObj = db.roles.find(r => r.id === user.role_id);

  db.logActivity({
    user_name: user.full_name,
    user_role: user.role || 'viewer',
    action: 'USER_LOGIN',
    entity_type: 'user',
    entity_id: user.id,
    description: `User ${user.full_name} logged into PIM system`
  });

  return res.json({
    token: `token-${user.id}-${Date.now()}`,
    user: {
      ...user,
      permissions: roleObj ? roleObj.permissions : []
    }
  });
});

// Current User (Session check)
router.get('/me', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'usr-1';
  const user = db.users.find(u => u.id === userId) || db.users[0];
  const roleObj = db.roles.find(r => r.id === user.role_id);

  return res.json({
    user: {
      ...user,
      permissions: roleObj ? roleObj.permissions : []
    }
  });
});

// Quick Switch Role (For hackathon presentation & placement test demo)
router.post('/switch', (req: Request, res: Response) => {
  const { role } = req.body; // 'admin' | 'editor' | 'viewer'
  const user = db.users.find(u => u.role === role) || db.users[0];
  const roleObj = db.roles.find(r => r.id === user.role_id);

  return res.json({
    token: `token-${user.id}-${Date.now()}`,
    user: {
      ...user,
      permissions: roleObj ? roleObj.permissions : []
    }
  });
});

// List users & roles
router.get('/users', (_req: Request, res: Response) => {
  return res.json({
    users: db.users,
    roles: db.roles
  });
});

export default router;
