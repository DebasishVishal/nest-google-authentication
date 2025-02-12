import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OnboardingUserDataDocument = OnboardingUserData & Document;

@Schema({ collection: 'onboardingUserData', timestamps: true }) // Set collection name & enable timestamps
export class OnboardingUserData {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, default: false })
  isOnboardingComplete: boolean;

  @Prop({ type: Object, default: null })
  onboardingData?: {
    personalInfo: {
      firstName: string;
      lastName: string;
      phone?: string;
      country: string;
    };
    accountSetup: {
      platforms: string[];
      roles: string[];
      businessFocus: string[];
      otherRole?: string;
    };
    preferences: {
      interests: string[];
    };
    appAndTool: {
      apps: string[];
    };
  };

  // @Prop({ required: true, type: Object })
  // personalInfo: {
  //   firstName: string;
  //   lastName: string;
  //   phone?: string;
  //   country: string;
  // };

  // @Prop({ required: true, type: Object })
  // accountSetup: {
  //   platforms: string[];
  //   roles: string[];
  //   businessFocus: string[];
  //   otherRole?: string;
  // };

  // @Prop({ required: true, type: Object })
  // preferences: {
  //   interests: string[];
  // };

  // @Prop({ required: true, type: Object })
  // appAndTool: {
  //   apps: string[];
  // };
}

export const OnboardingUserDataSchema =
  SchemaFactory.createForClass(OnboardingUserData);
