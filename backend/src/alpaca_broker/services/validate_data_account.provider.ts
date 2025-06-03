import { Injectable } from "@nestjs/common";
import { CreateAccountAlpacaDto } from "../dtos/create-account-alpaca.dto";
import { CreateUserDto } from "src/users/dtos/create-user.dto";
import { defaultAccountAlpacaEnum } from "../enums/default-values-account-alpaca.enum";

@Injectable()
export class ValidateDataAccountProvider {
    constructor() { }

    async validate(createUserDto: CreateUserDto) {
        const createAccountAlpacaDto = new CreateAccountAlpacaDto()
        createAccountAlpacaDto.contact = {
            email_address: createUserDto.account.email,
            phone_number: createUserDto.phone,
            street_address: createUserDto.address,
            city: defaultAccountAlpacaEnum.CONTACT_CITY,
        }

        createAccountAlpacaDto.identity = {
            given_name: createUserDto.first_name,
            family_name: createUserDto.last_name,
            date_of_birth: createUserDto.birthdate,
            tax_id: createUserDto.identity_document,
            tax_id_type: defaultAccountAlpacaEnum.IDENTITY_TAX_ID,
            country_of_tax_residence: defaultAccountAlpacaEnum.COUNTRY_OF_TAX_RESIDENCE
        }

        createAccountAlpacaDto.disclosures = {
            is_control_person: Boolean(defaultAccountAlpacaEnum.DISCLOSURES_IS_CONTROL_PERSON),
            is_affiliated_exchange_or_finra: Boolean(defaultAccountAlpacaEnum.DISCLOSURES_IS_AFFILIATED),
            is_politically_exposed: Boolean(defaultAccountAlpacaEnum.DISCLOSURES_IS_POLITICALLY_EXPOSED),
            immediate_family_exposed: Boolean(defaultAccountAlpacaEnum.DISCLOSURES_IS_IMMEDIATE_FAMILY_EXPOSED),
        }

        createAccountAlpacaDto.agreements = [
            {
                agreement: defaultAccountAlpacaEnum.AGREEMENTS_AGREEMENT,
                signed_at: new Date().toISOString(),
                ip_address: defaultAccountAlpacaEnum.AGREEMENTS_AGREEMENT_IP_ADDRESS
            },
        ]

        return createAccountAlpacaDto
    }
}