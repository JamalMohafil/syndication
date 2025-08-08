import { IsString } from "class-validator";
import { FileType } from "../../domain/enums/file-type.enum";

export class GenerateDemoFeedDto {

  @IsString()
  tenantId: string;

  @IsString()
  fileType: FileType;
}
