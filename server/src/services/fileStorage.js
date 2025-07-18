/**
 * @fileoverview File storage service with atomic operations and error handling
 * @author Work Timer Application
 */

const fs = require('fs-extra');
const path = require('path');

class FileStorageService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.ensureDataDir();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDir() {
    fs.ensureDirSync(this.dataDir);
  }

  /**
   * Get full path for a data file
   */
  getFilePath(filename) {
    return path.join(this.dataDir, filename);
  }

  /**
   * Atomically write data to file
   * Uses temp file + rename pattern to prevent corruption
   */
  async writeFile(filename, data) {
    const filePath = this.getFilePath(filename);
    const tempPath = `${filePath}.tmp`;
    const backupPath = `${filePath}.backup`;

    try {
      // Create backup of existing file if it exists
      if (await fs.pathExists(filePath)) {
        await fs.copy(filePath, backupPath);
      }

      // Write to temporary file
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(tempPath, jsonData, 'utf8');

      // Atomic rename (replaces original file)
      await fs.move(tempPath, filePath);

      console.log(`Successfully wrote ${filename}`);
    } catch (error) {
      // Clean up temp file if it exists
      if (await fs.pathExists(tempPath)) {
        await fs.remove(tempPath);
      }

      // Restore from backup if write failed and backup exists
      if (await fs.pathExists(backupPath)) {
        try {
          await fs.move(backupPath, filePath);
          console.log(`Restored ${filename} from backup after write failure`);
        } catch (restoreError) {
          console.error(`Failed to restore backup for ${filename}:`, restoreError);
        }
      }

      throw new Error(`Failed to write ${filename}: ${error.message}`);
    }
  }

  /**
   * Read and parse JSON file
   */
  async readFile(filename) {
    const filePath = this.getFilePath(filename);

    try {
      if (!(await fs.pathExists(filePath))) {
        // Return empty array for missing files
        return [];
      }

      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Failed to read ${filename}:`, error);
      
      // Try to restore from backup
      const backupPath = `${filePath}.backup`;
      if (await fs.pathExists(backupPath)) {
        try {
          console.log(`Attempting to restore ${filename} from backup`);
          const backupData = await fs.readFile(backupPath, 'utf8');
          const parsedData = JSON.parse(backupData);
          
          // Restore the main file from backup
          await fs.copy(backupPath, filePath);
          console.log(`Successfully restored ${filename} from backup`);
          
          return parsedData;
        } catch (backupError) {
          console.error(`Failed to restore from backup:`, backupError);
        }
      }

      // If all else fails, return empty array
      console.warn(`Returning empty array for corrupted ${filename}`);
      return [];
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filename) {
    const filePath = this.getFilePath(filename);
    return await fs.pathExists(filePath);
  }

  /**
   * Delete file
   */
  async deleteFile(filename) {
    const filePath = this.getFilePath(filename);
    
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      console.log(`Deleted ${filename}`);
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(filename) {
    const filePath = this.getFilePath(filename);
    
    if (await fs.pathExists(filePath)) {
      return await fs.stat(filePath);
    }
    
    return null;
  }

  /**
   * List all data files
   */
  async listDataFiles() {
    try {
      const files = await fs.readdir(this.dataDir);
      return files.filter(file => file.endsWith('.json') && !file.endsWith('.backup') && !file.endsWith('.tmp'));
    } catch (error) {
      console.error('Failed to list data files:', error);
      return [];
    }
  }
}

module.exports = new FileStorageService();