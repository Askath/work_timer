/**
 * @fileoverview Stop work command.
 * @author Work Timer Application
 */

export class StopWorkCommand {
  constructor(
    public readonly endTime: Date = new Date(),
    public readonly userId?: string
  ) {}
}