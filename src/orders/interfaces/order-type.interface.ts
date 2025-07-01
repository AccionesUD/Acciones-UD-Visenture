
export interface IOrderTypeStrategy{
    valid(): void | Promise<void>
    calculateAmountOrder(): number | Promise<number>
}