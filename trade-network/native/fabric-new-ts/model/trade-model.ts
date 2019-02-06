export type Identifier = string;
export type Reference = string;

export const Namespace = 'org.example.trading';
export const CommodityClass = Namespace + '.Commodity';
export const CommodityIdField = 'tradingSymbol';
export const TraderClass = Namespace + '.Trader';
export const TraderIdField = 'tradeId';

export interface Resource {
    $class?: string;
};

export interface Commodity extends Resource {
    tradingSymbol: Identifier;
    description: string;
    mainExchange: string;
    quantity: number;
    owner: Reference;
};

export interface Trader extends Resource {
    tradeId: Identifier;
    firstName: string;
    lastName: string;
};

export interface Trade extends Resource {
    commodityId: string;
    newOwnerId: string;
};
  