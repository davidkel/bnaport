export type Identifier = string;
export type Reference = string;

const AssetType = 'Asset';
const ParticipantType = 'Participant';

export const Namespace = 'org.example.trading';
export const CommodityType = AssetType;
export const CommodityClass = Namespace + '.Commodity';
export const CommodityIdField = 'tradingSymbol';
export const TraderType = ParticipantType;
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

// the transaction definition modelled rather than just
// provide parameters to the method invocation
export interface Trade extends Resource {
    commodityId: string;
    newOwnerId: string;
};

// this event format does differ from composer but there is
// no need for it to be identical.
export interface CommodityEvent {
    action: string;
    commodity: Commodity;
}
