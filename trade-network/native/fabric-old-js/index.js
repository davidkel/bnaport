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
'use strict';
const shim = require('fabric-shim');


const AssetType = 'Asset';
const ParticipantType = 'Participant';

const Namespace = 'org.example.trading';
const CommodityType = AssetType;
const CommodityClass = Namespace + '.Commodity';
const CommodityIdField = 'tradingSymbol';
const TraderType = ParticipantType;
const TraderClass = Namespace + '.Trader';
const TraderIdField = 'tradeId';

const selectCommodities = `{"selector":{"\\\\$class":"${CommodityClass}"}}`;
const selectCommoditiesByExchange = `{"selector":{"\\\\$class":"${CommodityClass}","mainExchange":"%1"}}`;
const selectCommoditiesByOwner = `{"selector":{"\\\\$class":"${CommodityClass}","owner":"%1"}}`;
const selectCommoditiesWithHighQuantity = `{"selector":{"\\\\$class":"${CommodityClass}","quantity":{"$gt":60}}}`;
const queryMap = {
    selectCommodities,
    selectCommoditiesByExchange,
    selectCommoditiesByOwner,
    selectCommoditiesWithHighQuantity,
};


class TradeNetwork {

    // ------------------------------------
    // boilerplate function dispatcher code
    //-------------------------------------
    async dispatch(stub) {
        const {fcn, params} = stub.getFunctionAndParameters();
        if (this[fcn]) {
            console.log('dispatching', fcn, params);
            try {
                const res = await this[fcn](stub, ...params);
                console.log(res);
                if (res) {
                    switch (typeof res) {
                    case 'string':
                        return shim.success(Buffer.from(res));
                    case 'object':
                        return shim.success(Buffer.from(JSON.stringify(res)));
                    default:
                        return shim.success(Buffer.from(res.toString()));
                    }
                } else {
                    return shim.success();
                }
            } catch(error) {
                return shim.error(error);
            }
        } else {
            console.log('did not dispatch');
            const noFNError = new Error(`The function ${fcn} does not exist`);
            return shim.error(noFNError);
        }
    }

    async Init(stub) {
        return await this.dispatch(stub);
    }

    async Invoke(stub) {
        console.log('received invoke');
        return await this.dispatch(stub);
    }

    // ---------------------------------------
    // ---------------------------------------
    // ---------------------------------------

    // ---------------------------------------
    // actual business logic implementation
    // ---------------------------------------

    async instantiate(stub) {
        console.info('instantiate');
    }

    // ------------------------------------------------------
    // methods to replicate in-built composer capability
    // ------------------------------------------------------

    async addTrader(stub, traderStr) {
        return this.CRUDTrader(stub, traderStr, 'c');
    }
    async updateTrader(stub, traderStr) {
        return this.CRUDTrader(stub, traderStr, 'u');
    }
    async deleteTrader(stub, tradeId) {
        return this.CRUDTrader(stub, `{"${TraderIdField}": "${tradeId}"}`, 'd');
    }
    async getTrader(stub, tradeId) {
        return this.CRUDTrader(stub, `{"${TraderIdField}": "${tradeId}"}`, 'r');
    }
    async getTraderHistory(stub, tradeId) {
        return this._historyForResource(stub, TraderType, TraderClass, tradeId);
    }
    async existsTrader(stub, tradeId) {
        return this.CRUDTrader(stub, `{"${TraderIdField}": "${tradeId}"}`, 'e');
    }

    async addCommodity(stub, commodityStr) {
        return this.CRUDCommodity(stub, commodityStr, 'c');
    }
    async updateCommodity(stub, commodityStr) {
        return this.CRUDCommodity(stub, commodityStr, 'u');
    }
    async deleteCommodity(stub, tradingSymbol) {
        return this.CRUDCommodity(stub, `{"${CommodityIdField}": "${tradingSymbol}"}`, 'd');
    }
    async getCommodity(stub, tradingSymbol) {
        return this.CRUDCommodity(stub, `{"${CommodityIdField}": "${tradingSymbol}"}`, 'r');
    }
    async getCommodityHistory(stub, tradingSymbol) {
        return this._historyForResource(stub, CommodityType, CommodityClass, tradingSymbol);
    }
    async existsCommodity(stub, tradingSymbol) {
        return this.CRUDCommodity(stub, `{"${CommodityIdField}": "${tradingSymbol}"}`, 'e');
    }

    async CRUDTrader(stub, traderStr, action) {
        const trader = JSON.parse(traderStr);
        trader.$class = TraderClass;
        return this.CRUDResource(stub, TraderType, trader, 'tradeId', action);
    }

    async CRUDCommodity(stub, commodityStr, action) {
        const commodity = JSON.parse(commodityStr);
        commodity.$class = CommodityClass;
        return this.CRUDResource(stub, CommodityType, commodity, 'tradingSymbol', action);
    }

    async runDynamicQuery(stub, mango) {
        // not good for large datasets as this code will load
        // the complete result set into memory then return it
        // should consider pagination if the result set is going
        // to ge large
        const iterator = await stub.getQueryResult(mango);
        const results = await this.getAllResults(stub, iterator);
        return results;
    }

    async runQuery(stub, queryName, queryParams) {
        let mango = queryMap[queryName];
        if (mango) {
            if (mango.indexOf('%1') > 0 && queryParams && queryParams.length > 0) {
                mango = mango.replace('%1', queryParams[0]);
            }
            return await this.runDynamicQuery(stub, mango);
        }
        throw new Error(`query ${queryName} does not exist`);
    }

    async resolveResource(stub, resource, type) {
        // this doesn't perform a nested resolve (ie only does 1 deep as trade-network doesn't need it)
        if (resource.startsWith('resource:')) {
            resource = resource.substr(9);
        }
        const keys = resource.split('#');
        const compositeKey = stub.createCompositeKey(type + ':' + keys[0], [keys[1]]);
        const state = await stub.getState(compositeKey);
        if (state.length) {
            return JSON.parse(state.toString('utf8'));
        }
        throw new Error(`${type}:${keys[0]} with id ${keys[1]} does not exist`);
    }

    // ------------------------------------------------------
    // ------------------------------------------------------
    // ------------------------------------------------------

    // ------------------------------------------------------
    // equivalent of the TP functions in trade-network
    // ------------------------------------------------------

    async tradeCommodity(stub, tradeStr) {
        // note, there is no runtime validation of the
        // data, you need to do this yourself.
        const trade = JSON.parse(tradeStr);
        const commodityToUpdate = await this.resolveResource(stub, `${CommodityClass}#${trade.commodityId}`, CommodityType);
        commodityToUpdate.owner = `resource:${TraderClass}#${trade.newOwnerId}`;

        // update the commodity
        const compositeKey = stub.createCompositeKey(`${CommodityType}:${CommodityClass}`, [commodityToUpdate.tradingSymbol]);
        await stub.putState(compositeKey, Buffer.from(JSON.stringify(commodityToUpdate)));
        //        await this._CRUDResource(stub, CommodityType, commodityToUpdate, CommodityIdField, 'u');


        // fire the chaincode event
        const event = [{action: 'trade', commodity: commodityToUpdate}];
        stub.setEvent('trade-network', Buffer.from(JSON.stringify(event)));
    }

    async removeHighQuantityCommodities(stub) {
        const results = await this.runQuery(stub, 'selectCommoditiesWithHighQuantity', null);

        // since all registry requests have to be serialized anyway, there is no benefit to calling Promise.all
        // on an array of promises
        const events = [];
        for (const commodity of results) {
            await this.deleteCommodity(stub, commodity.tradingSymbol);
            const event = {action: 'remove', commodity: commodity};
            events.push(event);
        }
        stub.setEvent('trade-network', Buffer.from(JSON.stringify(events)));
    }

    // ------------------------------------------------------
    // ------------------------------------------------------
    // ------------------------------------------------------

    // ------------------------------------------------------
    // Private methods, not TP functions to be called. These
    // provide equivalent composer capabilities not directly
    // exposed
    // ------------------------------------------------------
    async _historyForResource(stub, type, $class, id) {
        const compositeKey = stub.createCompositeKey(type + ':' + $class, [id]);
        const historyIterator = await stub.getHistoryForKey(compositeKey);
        return await this._getAllHistoryResults(stub, historyIterator);
    }

    async CRUDResource(stub, type, resource, idField, action) {
        const compositeKey = stub.createCompositeKey(type + ':' + resource.$class, [resource[idField]]);
        const state = await stub.getState(compositeKey);
        switch (action) {
        case 'c':
            if (state.length !== 0) {
                throw new Error(`Resource ${resource.$class} with id ${resource[idField]} exists`);
            }
            await stub.putState(compositeKey, Buffer.from(JSON.stringify(resource)));
            return resource;
        case 'u':
            if (state.length === 0) {
                throw new Error(`Resource ${resource.$class} with id ${resource[idField]} doesn't exist`);
            }
            await stub.putState(compositeKey, Buffer.from(JSON.stringify(resource)));
            return resource;
        case 'd':
            if (state.length === 0) {
                throw new Error(`Resource ${resource.$class} with id ${resource[idField]} doesn't exist`);
            }
            await stub.deleteState(compositeKey);
            return;
        case 'r':
            if (state.length) {
                return JSON.parse(state.toString('utf8'));
            }
            throw new Error(`${type}:${resource.$class} with id ${resource[idField]} does not exist`);
        case 'e':
            return state.length !== 0;
        }
    }

    async _getAllHistoryResults(stub, iterator) {
        const results = [];
        let res = {done: false, value: null};
        while (!res.done) {
            res = await iterator.next();
            const itVal = res.value;
            if (itVal) {
                let resp = {
                    timestamp: itVal.timestamp,
                    txid: itVal.tx_id
                };
                if (itVal.is_delete) {
                    resp.data = 'DELETED';
                } else {
                    resp.data = JSON.parse(itVal.value.toString('utf8'));
                }
                results.push(resp);
            }
            if (res && res.done) {
                try {
                    await iterator.close();
                } catch (err) {
                    console.log(err);
                }
                return results;
            }
        }
    }

    async getAllResults(stub, iterator) {
        const results = [];
        let res = {done: false, value: null};
        while (!res.done) {
            res = await iterator.next();
            if (res && res.value && res.value.value) {
                const val = res.value.value.toString('utf8');
                if (val.length > 0) {
                    results.push(JSON.parse(val));
                }
            }
            if (res && res.done) {
                try {
                    await iterator.close();
                } catch (err) {
                    console.log(err);
                }
                return results;
            }
        }
    }

    // ------------------------------------------------------
    // ------------------------------------------------------
    // ------------------------------------------------------
}

shim.start(new TradeNetwork());

