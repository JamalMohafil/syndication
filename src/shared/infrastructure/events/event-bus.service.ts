import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBusService {
  private logger = new Logger(EventBusService.name);
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publishEvent<T extends object>(
    event: T,
    eventName: string,
  ): Promise<void> {
    this.logger.debug(`Publishing event ${eventName}`, event);
    this.eventEmitter.emit(eventName, event);
  }
}
