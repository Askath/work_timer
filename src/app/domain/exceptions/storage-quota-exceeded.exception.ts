/**
 * @fileoverview Domain exception for storage quota exceeded scenarios.
 * @author Work Timer Application
 */

export class StorageQuotaExceededException extends Error {
  constructor(
    message: string = 'Storage quota exceeded. Unable to save data.',
    public readonly key?: string
  ) {
    super(message);
    this.name = 'StorageQuotaExceededException';
  }
}