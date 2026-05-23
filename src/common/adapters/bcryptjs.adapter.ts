import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';

@Injectable()
export class BcryptJsAdapter {
  private readonly bcryptjs: typeof bcrypt = bcrypt;

  public hash(password: string, saltNumber: number = 10): string {
    return this.bcryptjs.hashSync(password, saltNumber);
  }

  public check(password: string, hashedPassword: string): boolean {
    return this.bcryptjs.compareSync(password, hashedPassword);
  }
}
