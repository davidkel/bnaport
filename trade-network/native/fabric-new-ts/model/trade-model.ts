
// only finds the module because the file that imports this file
// has already imported fabric-contract-api.
// The type definitions of fabric-contract-api rely on fabric-shim
// but fabric-contract-api doesn't rely directly on it.
import {Object, Property} from 'fabric-contract-api';

/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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

export abstract class Resource {
    $class?: string;
};

@Object()
export class Commodity extends Resource {
    @Property()
    tradingSymbol: Identifier;
    @Property()
    description: string;
    @Property()
    mainExchange: string;
    @Property()
    quantity: number;
    @Property()
    owner: Reference;
};

@Object()
export class Trader extends Resource {
    @Property()
    tradeId: Identifier;
    @Property()
    firstName: string;
    @Property()
    lastName: string;
};

// the transaction definition modelled rather than just
// provide parameters to the method invocation
@Object()
export class Trade extends Resource {
    @Property()
    commodityId: string;
    @Property()
    newOwnerId: string;
};

// this event format does differ from composer but there is
// no need for it to be identical.
@Object()
export class CommodityEvent {
    @Property()
    action: string;
    @Property()
    commodity: Commodity;
}
