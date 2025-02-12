import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OnboardingUserData,
  OnboardingUserDataDocument,
} from '../schemas/onboarding-user-data.schema';
import { OnboardingUserDataDto } from 'src/auth/dto/onboarding-user-data.dto';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(OnboardingUserData.name)
    private readonly onboardingModel: Model<OnboardingUserDataDocument>,
  ) {}

  async findUserByEmail(email: string): Promise<OnboardingUserData | null> {
    return await this.onboardingModel.findOne({ email });
  }

  async createUser(data: any): Promise<OnboardingUserData> {
    const createdUser = new this.onboardingModel(data);
    return await createdUser.save();
  }

  async updateUser(
    email: string,
    updateData: any,
  ): Promise<OnboardingUserData> {
    const updatedUser = await this.onboardingModel.findOneAndUpdate(
      { email },
      {
        $set: {
          onboardingData: updateData,
          isOnboardingComplete: true, // Explicitly update isOnboardingComplete to true
        },
      },
      { new: true },
    );
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  async saveOnboardingData(data: any): Promise<OnboardingUserData> {
    try {
      // Check if onboarding data already exists for this email
      // const existingData = await this.onboardingModel.findOne({ email });

      // if (existingData) {
      //   return existingData; // Return existing data if found
      // }

      // Create and save new onboarding data

      const createdData = new this.onboardingModel(data);
      return await createdData.save();
    } catch (error) {
      console.error('Error saving onboarding data:', error); // Log the error
      throw error;
    }
  }
}
