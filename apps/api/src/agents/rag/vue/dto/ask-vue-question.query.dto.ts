import { IsString, IsNotEmpty } from 'class-validator';

export class AskVueQuestionQueryDto {
  @IsString()
  @IsNotEmpty()
  question: string;
} 