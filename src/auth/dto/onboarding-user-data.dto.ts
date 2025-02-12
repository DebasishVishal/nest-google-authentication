import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class PersonalInfoDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class AccountSetupDto {
  @IsArray()
  @IsNotEmpty()
  platforms: string[];

  @IsArray()
  @IsNotEmpty()
  roles: string[];

  @IsArray()
  @IsNotEmpty()
  businessFocus: string[];

  @IsString()
  @IsOptional()
  otherRole?: string;
}

export class PreferencesDto {
  @IsArray()
  @IsNotEmpty()
  interests: string[];
}

export class AppAndToolDto {
  @IsArray()
  @IsNotEmpty()
  apps: string[];
}

export class OnboardingUserDataDto {
  @IsNotEmpty()
  personalInfo: PersonalInfoDto;

  @IsNotEmpty()
  accountSetup: AccountSetupDto;

  @IsNotEmpty()
  preferences: PreferencesDto;

  @IsNotEmpty()
  appAndTool: AppAndToolDto;
}
