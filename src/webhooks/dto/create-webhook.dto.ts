import { ArrayNotEmpty, IsArray, IsIn, IsUrl } from 'class-validator';
import { ADMIN_NOTIFICATION_EVENTS } from '../../notifications/admin-notification.events';

const EVENTOS_VALIDOS = Object.values(ADMIN_NOTIFICATION_EVENTS);

export class CreateWebhookDto {
  @IsUrl({ require_tld: false }, { message: 'url deve ser uma URL válida' })
  url: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'informe ao menos um evento para assinar' })
  @IsIn(EVENTOS_VALIDOS, { each: true, message: `eventos válidos: ${EVENTOS_VALIDOS.join(', ')}` })
  eventos: string[];
}
