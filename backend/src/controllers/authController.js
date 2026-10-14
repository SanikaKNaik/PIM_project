import { db as memoryDb } from '../../../server/db/database.ts';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'stitch_secret_2026';

export const login = (req, res) => {
  const { username, password } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });

  const user = memoryDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const roleObj = memoryDb.roles.find(r => r.id === user.role_id);

  return res.json({
    token,
    user: {
      ...user,
      permissions: roleObj ? roleObj.permissions : []
    }
  });
};

export const getMe = (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr-1';
  const user = memoryDb.users.find(u => u.id === userId) || memoryDb.users[0];
  const roleObj = memoryDb.roles.find(r => r.id === user.role_id);

  return res.json({
    user: {
      ...user,
      permissions: roleObj ? roleObj.permissions : []
    }
  });
};

export const switchRole = (req, res) => {
  const { role } = req.body;
  const user = memoryDb.users.find(u => u.role === role) || memoryDb.users[0];
  const roleObj = memoryDb.roles.find(r => r.id === user.role_id);

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: {
      ...user,
      permissions: roleObj ? roleObj.permissions : []
    }
  });
};

export const getUsers = (_req, res) => {
  return res.json({
    users: memoryDb.users,
    roles: memoryDb.roles
  });
};
