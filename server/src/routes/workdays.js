/**
 * @fileoverview WorkDay REST API routes
 * @author Work Timer Application
 */

const express = require('express');
const fileStorage = require('../services/fileStorage');

const router = express.Router();
const WORKDAYS_FILE = 'workdays.json';

/**
 * GET /api/workdays - Get all work days
 */
router.get('/', async (req, res, next) => {
  try {
    const workdays = await fileStorage.readFile(WORKDAYS_FILE);
    res.json(workdays);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/workdays/:date - Get specific work day by date
 */
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const workdays = await fileStorage.readFile(WORKDAYS_FILE);
    
    const workday = workdays.find(wd => wd.date === date);
    
    if (!workday) {
      return res.status(404).json({ error: 'Work day not found' });
    }
    
    res.json(workday);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/workdays - Create or update work day
 */
router.post('/', async (req, res, next) => {
  try {
    const workdayData = req.body;
    
    // Validate required fields
    if (!workdayData.date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const workdays = await fileStorage.readFile(WORKDAYS_FILE);
    
    // Find existing work day or create new one
    const existingIndex = workdays.findIndex(wd => wd.date === workdayData.date);
    
    if (existingIndex >= 0) {
      // Update existing
      workdays[existingIndex] = {
        ...workdays[existingIndex],
        ...workdayData,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new
      const newWorkday = {
        ...workdayData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      workdays.push(newWorkday);
    }
    
    // Sort by date (newest first)
    workdays.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    await fileStorage.writeFile(WORKDAYS_FILE, workdays);
    
    const savedWorkday = workdays.find(wd => wd.date === workdayData.date);
    res.json(savedWorkday);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/workdays/:date - Delete work day
 */
router.delete('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const workdays = await fileStorage.readFile(WORKDAYS_FILE);
    
    const initialLength = workdays.length;
    const filteredWorkdays = workdays.filter(wd => wd.date !== date);
    
    if (filteredWorkdays.length === initialLength) {
      return res.status(404).json({ error: 'Work day not found' });
    }
    
    await fileStorage.writeFile(WORKDAYS_FILE, filteredWorkdays);
    
    res.json({ message: 'Work day deleted successfully', date });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/workdays/:date/exists - Check if work day exists
 */
router.get('/:date/exists', async (req, res, next) => {
  try {
    const { date } = req.params;
    const workdays = await fileStorage.readFile(WORKDAYS_FILE);
    
    const exists = workdays.some(wd => wd.date === date);
    
    res.json({ exists });
  } catch (error) {
    next(error);
  }
});

module.exports = router;