import { ApiProperty } from '@nestjs/swagger';

export class PublishEventResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Generated event UUID',
  })
  eventId!: string;

  @ApiProperty({
    example: 'published',
    description: 'Publishing operation status',
  })
  status!: string;
}
