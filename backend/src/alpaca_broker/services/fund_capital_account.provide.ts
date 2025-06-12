import { HttpService } from "@nestjs/axios";
import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Axios, AxiosResponse } from "axios";
import { firstValueFrom } from "rxjs";
import { CreateACHRelationDto } from "../dtos/create-ach-relation.dto";
import { infoBankACH } from "../consts/info-bank-ach-relation.const";
import { CreateTransferAchDto } from "../dtos/create-tranfer-ach.dto";
import { infoTranferAch } from "../consts/info_tranfer_ach.const";
import { response } from "express";

@Injectable()
export class FundCapitalAccount {
    private path = 'v1/accounts/:account_id/ach_relationships'

    constructor(
        private readonly httpservice: HttpService
    ) { }


    public async fundCapital(accountIdAlpaca: string, amountTransfer:number = 2000) {
        const resolvePath = this.path.replace(':account_id', accountIdAlpaca)
        let achRelation: null | string   = await this.checkACHRelation(accountIdAlpaca, resolvePath)
        if (achRelation === null) {
            achRelation = await this.createACHRelation(accountIdAlpaca, resolvePath)
        }
        return this.transferCash(amountTransfer, achRelation, resolvePath)
    }


    private async transferCash(amountTransfer: number, achRelation: string, resolvePath: string): Promise<string>{
        const resolvePathAlter = resolvePath.replace('ach_relationships', 'transfers')
        const data = new CreateTransferAchDto({
            transfer_type: infoTranferAch.transfer_type,
            relationship_id: achRelation,
            amount: amountTransfer,
            direction: infoTranferAch.direction
        })
        console.log(data)
        try {
            const response: AxiosResponse<any> = await firstValueFrom(
              this.httpservice.post(resolvePathAlter, data)
            )
            if (!response.data.id)
                throw new HttpException('transaccion erronea vuelva a intentar', HttpStatus.BAD_REQUEST)
            return response.data.id

        } catch (error) {
            throw new HttpException(error.response.data, HttpStatus.BAD_REQUEST)
        }

   
    }

    private async createACHRelation(accountIdAlpaca: string, resolvePath: string): Promise<string> {
        const data = new CreateACHRelationDto({
            account_owner_name: accountIdAlpaca,
            bank_account_number: accountIdAlpaca,
            bank_account_type: infoBankACH.bank_account_type,
            bank_routing_number: infoBankACH.bank_routing_number,
            nickname: infoBankACH.nickname
        })
        try {
            const response: AxiosResponse<any> = await firstValueFrom(
                this.httpservice.post(resolvePath, data)
            )
            return response.data.id
        }
        catch (error) {
            throw new HttpException(error.response.data, HttpStatus.BAD_REQUEST)
        }
    }


    private async checkACHRelation(accountIdAlpaca: string, resolvePath: string): Promise<string | null> {
        try {
            const response: AxiosResponse<any> = await firstValueFrom(
                this.httpservice.get(resolvePath))
            const achRelation: any[] = response.data
            if (achRelation.length == 0) {
                return null
            }
            return response.data[0].id
        } catch (error) {
            throw new HttpException(error.response.data, HttpStatus.BAD_REQUEST)
        }
    }
}