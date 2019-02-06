'use strict';
const shim = require('fabric-shim');

const namespace = 'org.example.trading';
const CommodityClass = namespace + '.Commodity';
const TraderClass = namespace + '.Trader';

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
                            let val = res.toString();
                            return shim.success(Buffer.from(val));
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

    async instantiate(stub) {
        console.info('instantiate');
    }

    async addTrader(stub, traderStr) {
        return this.CRUDTrader(ctx, traderStr, 'c');
    }
    async updateTrader(stub, traderStr) {
        return this.CRUDTrader(ctx, traderStr, 'u');
    }
    async deleteTrader(stub, traderStr) {
        return this.CRUDTrader(ctx, traderStr, 'd');
    }
    async getTrader(stub, traderStr) {
        return this.CRUDTrader(ctx, traderStr, 'r');
    }

    async addCommodity(stub, commodityStr) {
        return this.CRUDCommodity(ctx, commodityStr, 'c');
    }
    async updateCommodity(stub, commodityStr) {
        return this.CRUDCommodity(ctx, commodityStr, 'u');
    }
    async deleteCommodity(stub, commodityStr) {
        return this.CRUDCommodity(ctx, commodityStr, 'd');
    }
    async getCommodity(stub, commodityStr) {
        return this.CRUDCommodity(ctx, commodityStr, 'R');
    }

    async CRUDTrader(stub, traderStr, action) {
        const trader = JSON.parse(traderStr);
        trader.$class = TraderClass;
        return this.CRUDResource(stub, 'Participant', trader, 'tradeId', action);
    }

    async CRUDCommodity(stub, commodityStr, action) {
        const commodity = JSON.parse(commodityStr);
        commodity.$class = CommodityClass;
        return this.CRUDResource(stub, 'Asset', commodity, 'tradingSymbol', action);
    } 
    
    async runDynamicQuery(stub, mango) {
        console.log(mango);
        const iterator = await stub.getQueryResult(mango);
        const results = await this.getAllResults(stub, iterator);
        console.log('results', results);
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
    // equivalent of the TP functions in trade-network
    // ------------------------------------------------------

    async tradeCommodity(stub, tradeStr) {
        // note, there is no runtime validation of the
        // data, you need to do this yourself.
        const trade = JSON.parse(tradeStr);
        const commodityToUpdate = await this.resolveResource(stub, `${CommodityClass}#${trade.commodityId}`, 'Asset');
        commodityToUpdate.owner = `resource:${TraderClass}#${trade.newOwnerId}`;
        const compositeKey = stub.createCompositeKey(`Asset:${CommodityClass}`, [commodityToUpdate.tradingSymbol]);
        await stub.putState(compositeKey, Buffer.from(JSON.stringify(commodityToUpdate)));
        const event = [{action: 'trade', commodity: commodityToUpdate}];
        stub.setEvent('trade-network', Buffer.from(JSON.stringify(event)));
    }

    async removeHighQuantityCommodities(stub) {
        const results = await this.runQuery(stub, 'selectCommoditiesWithHighQuantity', null);

        // since all registry requests have to be serialized anyway, there is no benefit to calling Promise.all
        // on an array of promises
        const events = [];
        results.forEach(async (trade) => {
            const compositeKey = stub.createCompositeKey('Asset:' + trade.$class, [trade.tradingSymbol]);
            const event = {action: 'remove', commodity: trade};
            events.push(event);
            await stub.deleteState(compositeKey);
        });
        stub.setEvent('trade-network', Buffer.from(JSON.stringify(events)));
    }

    async CRUDResource(stub, type, resource, idField, action) {
        const compositeKey = stub.createCompositeKey(type + ':' + resource.$class, [resource[idField]]);
        console.log(compositeKey, action);
        switch (action) {
            case 'c':
            case 'u':
                await stub.putState(compositeKey, Buffer.from(JSON.stringify(resource)));
                return resource;
            case 'd':
                // TODO: Should check it exists first
                await stub.deleteState(compositeKey);
                return;
            case 'r':
                const state = await stub.getState(compositeKey);
                if (state.length) {
                    return JSON.parse(state.toString('utf8'));
                }
                throw new Error(`${type}:${resource.$class} with id ${resource[idField]} does not exist`);
            case 'e':
                const state2 = await stub.getState(compositeKey);
                return state2.length !== 0;
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
}

shim.start(new TradeNetwork());

