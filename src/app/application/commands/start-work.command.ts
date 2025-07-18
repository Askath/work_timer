/**
 * @fileoverview Start work command.
 * @author Work Timer Application
 */

export class StartWorkCommand {
  constructor(
    public readonly startTime: Date = new Date(),
    public readonly userId?: string
  ) {}
}