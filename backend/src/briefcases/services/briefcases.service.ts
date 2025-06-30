import { BadRequestException, Injectable, NotFoundException, RequestTimeoutException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Briefcase } from '../entities/briefcases.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBriefcaseDto } from '../dtos/create-briefcase.dto';
import { Order } from 'src/orders/entities/orders.entity';
import { Asset } from '../entities/assets.entity';
import { AlpacaMarketService } from 'src/alpaca_market/services/alpaca_market.service';

@Injectable()
export class BriefcaseService {
    constructor(
        @InjectRepository(Briefcase)
        private readonly briefcaseRepository: Repository<Briefcase>,

        @InjectRepository(Asset)
        private readonly assetsRepository: Repository<Asset>,
        private readonly alpacaMarketService: AlpacaMarketService
    ) { }

    async createBriefcase(account_id: number) {
        const briefcase = this.briefcaseRepository.create({ account: { id: account_id } })
        try {
            const briefcaseCreated = await this.briefcaseRepository.save(briefcase)
            return briefcaseCreated
        } catch (error) {
            throw new RequestTimeoutException('error el la bd')
        }
    }

    async getBriefcase(accountId: number) {
        const briefcaseFind = await this.briefcaseRepository.findOneBy({ account: { id: accountId } })
        return briefcaseFind
    }

    async getBriefcaseAssets(accountId: number) {
        const briefcase = await this.briefcaseRepository.findOne({
            where: { account: { id: accountId } },
            relations: ['assets']
        })
        if (briefcase?.assets) {
            await Promise.all(
                briefcase.assets.map(async (asset) => {
                    const tradesLastSymbol = await this.alpacaMarketService.getTradesLatest(asset.ticket_share);
                    asset.percentGainLose = (((parseFloat(tradesLastSymbol.trade.p) - asset.order.filled_avg_price!) 
                                            / asset.order.filled_avg_price!) * 100);
                    
                    asset.returnOfMoney = (tradesLastSymbol.trade.p - asset.order.filled_avg_price!) * asset.order.fill_qyt!;
                })
            );
        }
        return briefcase

    }

    async addAssetsBriefcase(order: Order) {
        let briefcase = await this.getBriefcase(order.account.id)
        if (!briefcase) {
            briefcase = await this.createBriefcase(order.account.id)
        }
        const asset = this.assetsRepository.create({
            briefcase: briefcase,
            order: order,
            currentShareQuantity: order.fill_qyt,
            ticket_share: order.share.symbol
        })
        try {
            await this.assetsRepository.save(asset)
        } catch (error) {
            throw new RequestTimeoutException('error e la bd')
        }
    }

}
