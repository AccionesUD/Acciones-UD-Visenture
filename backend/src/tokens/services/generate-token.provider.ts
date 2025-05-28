import {Injectable} from "@nestjs/common";
import { randomInt } from "crypto";


@Injectable()
export class GenerateToken2MFA{

    public generateToken(): string{
        const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        let token: string = ''
        for (let i=0; i<6; i++){
            token += characters.charAt(Math.floor(randomInt(0, characters.length)))
        }
        return token
    }
}