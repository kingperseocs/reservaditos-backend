import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class InterpretMessageDto {
  @ApiProperty({ example: 'quiero la parrilla el sábado de 7 a 10 pm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;
}

export class IntentDto {
  @ApiProperty({ example: 'grill', nullable: true, type: String })
  areaId: string | null;

  @ApiProperty({ example: 'Parrilla', nullable: true, type: String })
  areaName: string | null;

  @ApiProperty({ example: '2026-11-14', nullable: true, type: String })
  date: string | null;

  @ApiProperty({ example: '19:00', nullable: true, type: String })
  startTime: string | null;

  @ApiProperty({ example: '22:00', nullable: true, type: String })
  endTime: string | null;
}

export class InterpretationDto {
  @ApiProperty({
    example: true,
    description:
      'Area, date and a free slot are known; ready for POST /v1/reservations',
  })
  complete: boolean;

  @ApiProperty({ type: IntentDto })
  intent: IntentDto;

  @ApiProperty({
    enum: ['area', 'date', 'slot'],
    nullable: true,
    example: null,
  })
  missing: 'area' | 'date' | 'slot' | null;

  @ApiProperty({
    example: null,
    nullable: true,
    type: String,
    description: 'Question the assistant asks the resident; null when complete',
  })
  question: string | null;

  @ApiProperty({
    example:
      'Listo: Parrilla el sábado 14/11 de 19:00 a 22:00. Total S/ 150. ¿Confirmas la reserva?',
    description: 'Text to show in the chat: the question, or a confirmation',
  })
  reply: string;
}
