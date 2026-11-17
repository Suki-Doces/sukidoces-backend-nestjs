import { Expose } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsIn, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DomainEventNames } from '../../../domain/events/domain-events';

const VALID_EVENTS = Object.values(DomainEventNames);

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://example.com/webhooks/orders' })
  @IsUrl({ require_tld: false }, { message: 'url must be a valid URL' })
  url: string;

  @ApiProperty({ name: 'eventos', type: [String], enum: VALID_EVENTS })
  @Expose({ name: 'eventos' })
  @IsArray()
  @ArrayNotEmpty({ message: 'subscribe to at least one event' })
  @IsIn(VALID_EVENTS, { each: true, message: `valid events: ${VALID_EVENTS.join(', ')}` })
  events: string[];
}
