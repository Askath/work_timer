/**
 * @fileoverview WorkSession REST API routes
 * @author Work Timer Application
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fileStorage = require('../services/fileStorage');

const router = express.Router();
const SESSIONS_FILE = 'sessions.json';

/**
 * GET /api/sessions - Get all sessions (optionally filtered by date)
 */
router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;
    const sessions = await fileStorage.readFile(SESSIONS_FILE);
    
    if (date) {
      const filteredSessions = sessions.filter(session => session.date === date);
      return res.json(filteredSessions);
    }
    
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/:id - Get specific session by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const sessions = await fileStorage.readFile(SESSIONS_FILE);
    
    const session = sessions.find(s => s.id === id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions - Create or update session
 */
router.post('/', async (req, res, next) => {
  try {
    const sessionData = req.body;
    
    // Validate required fields
    if (!sessionData.date || !sessionData.startTime) {
      return res.status(400).json({ error: 'Date and startTime are required' });
    }
    
    const sessions = await fileStorage.readFile(SESSIONS_FILE);
    
    // Generate ID if not provided
    if (!sessionData.id) {
      sessionData.id = uuidv4();
    }
    
    // Find existing session or create new one
    const existingIndex = sessions.findIndex(s => s.id === sessionData.id);
    
    if (existingIndex >= 0) {
      // Update existing
      sessions[existingIndex] = {
        ...sessions[existingIndex],
        ...sessionData,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new
      const newSession = {
        ...sessionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      sessions.push(newSession);
    }
    
    // Sort by date and start time (newest first)
    sessions.sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(b.date) - new Date(a.date);
      }
      return new Date(b.startTime) - new Date(a.startTime);
    });
    
    await fileStorage.writeFile(SESSIONS_FILE, sessions);
    
    const savedSession = sessions.find(s => s.id === sessionData.id);
    res.json(savedSession);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/sessions/:id - Delete session
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const sessions = await fileStorage.readFile(SESSIONS_FILE);
    
    const initialLength = sessions.length;
    const filteredSessions = sessions.filter(s => s.id !== id);
    
    if (filteredSessions.length === initialLength) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    await fileStorage.writeFile(SESSIONS_FILE, filteredSessions);
    
    res.json({ message: 'Session deleted successfully', id });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/sessions/by-date/:date - Delete all sessions for a specific date
 */
router.delete('/by-date/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const sessions = await fileStorage.readFile(SESSIONS_FILE);
    
    const initialLength = sessions.length;
    const filteredSessions = sessions.filter(s => s.date !== date);
    
    const deletedCount = initialLength - filteredSessions.length;
    
    if (deletedCount === 0) {
      return res.status(404).json({ error: 'No sessions found for this date' });
    }
    
    await fileStorage.writeFile(SESSIONS_FILE, filteredSessions);
    
    res.json({ 
      message: `Deleted ${deletedCount} sessions for date ${date}`, 
      date,
      deletedCount 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;