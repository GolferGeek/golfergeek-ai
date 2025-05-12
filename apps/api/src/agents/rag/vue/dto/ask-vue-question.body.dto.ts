import { IsString, IsNotEmpty } from 'class-validator';

export class AskVueQuestionBodyDto {
  @IsString()
  @IsNotEmpty()
  question: string;
} 