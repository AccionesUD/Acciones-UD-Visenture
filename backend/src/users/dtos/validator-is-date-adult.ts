import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isDateAdult', async: false })
export class IsDateAdult implements ValidatorConstraintInterface {
  private ageMin = 18;
  validate(date: Date): boolean {
    if (
      new Date().getTime() - new Date(date).getTime() >=
      this.ageMin / 3.1566e-11
    ) {
      return true;
    }
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage?(validationArguments?: ValidationArguments): string {
    return 'No tienes la edad para registrarte';
  }
}
