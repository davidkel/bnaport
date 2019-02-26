/*
 * SPDX-License-Identifier:
 */

import { Context, Contract, Info } from 'fabric-contract-api';
import { Iterators, QueryResponseMetadata, StateQueryResponse } from 'fabric-shim';
import {
    Commodity,
    CommodityClass,
    CommodityEvent,
    CommodityIdField,
    CommodityType,
    Reference,
    Resource,
    Trade,
    Trader,
    TraderClass,
    TraderIdField,
    TraderType,
} from '../../model/trade-model';

// Org Composer queries
// const selectAllCommodities: string = '{"selector":{"\\$class":"org.example.trading.Commodity","\\$registryType":"Asset","\\$registryId":"org.example.trading.Commodity"}}';
// const selectAllByExchange: string = '{"selector":{"\\$class":"org.example.trading.Commodity","\\$registryType":"Asset","\\$registryId":"org.example.trading.Commodity","mainExchange":"%1"}}';
// const selectAllByOwner: string = '{"selector":{"\\$class":"org.example.trading.Commodity","\\$registryType":"Asset","\\$registryId":"org.example.trading.Commodity","owner":"%1"}}';
// const selectAllHigher: string = '{"selector":{"\\$class":"org.example.trading.Commodity","\\$registryType":"Asset","\\$registryId":"org.example.trading.Commodity","quantity":{"$gt":60}}}';

// Define the queries.
const selectCommodities: string = `{"selector":{"\\\\$class":"${CommodityClass}"}}`;
const selectCommoditiesByExchange: string = `{"selector":{"\\\\$class":"${CommodityClass}","mainExchange":"%1"}}`;
const selectCommoditiesByOwner: string = `{"selector":{"\\\\$class":"${CommodityClass}","owner":"%1"}}`;
const selectCommoditiesWithHighQuantity: string = `{"selector":{"\\\\$class":"${CommodityClass}","quantity":{"$gt":60}}}`;
const queryMap = {
    selectCommodities,
    selectCommoditiesByExchange,
    selectCommoditiesByOwner,
    selectCommoditiesWithHighQuantity,
};

@Info({
    license: 'Daves License',
})
export class MyContract extends Contract {

    public async beforeTransaction(ctx: Context): Promise<void> {
        // perform some Access Control checks
        const fcn: string = ctx.stub.getFunctionAndParameters().fcn;
        if (fcn === 'instantiate' || fcn === 'upgrade') {
            // check this is only being run by an administrator
            // nothing provided here in the example but should be considered
            // as this is a channel admin, may not have the appropriate
            // attribute in their cert.
            console.log('Only a demo, so access allowed for instantiate/upgrade for anyone');
        } else {
            // invoking other generally available functions
            // get an attribute from the cert
            const accessType: string = ctx.clientIdentity.getAttributeValue('trade-network');
            if (!accessType) {
                // If no access type has been provided, then no access is possible at all
                console.log('Only a demo, so access allowed, however this identity is not authorised');
                // throw new Error('Access denied');
            }
        }
    }

    public async afterTransaction(ctx: Context, returnVal: any): Promise<void> {
        // could use this to record any successful transactions similar to
        // composer historian if you really wanted.
        // const {fcn, params} = ctx.stub.getFunctionAndParameters();
        // const cert = ctx.clientIdentity.getX509Certificate();
    }

    public async instantiate(ctx: Context): Promise<void> {
        // maybe perform some meta-data or data initialisation
        console.info('instantiate');
    }

    public async upgrade(ctx: Context): Promise<void> {
        // maybe perform some meta-data or data update or migration
        console.info('upgrade');
    }

    // ------------------------------------------------------
    // methods to replicate in-built composer capability
    // ------------------------------------------------------

    public async addTrader(ctx: Context, traderStr: string): Promise<Trader> {
        return this.CRUDTrader(ctx, traderStr, 'c');
    }
    public async updateTrader(ctx: Context, traderStr: string): Promise<Trader> {
        return this.CRUDTrader(ctx, traderStr, 'u');
    }
    public async deleteTrader(ctx: Context, tradeId: string): Promise<void> {
        return this.CRUDTrader(ctx, `{"${TraderIdField}": "${tradeId}"}`, 'd');
    }
    public async getTrader(ctx: Context, tradeId: string): Promise<Trader> {
        return this.CRUDTrader(ctx, `{"${TraderIdField}": "${tradeId}"}`, 'r');
    }
    public async getTraderHistory(ctx: Context, tradeId: string): Promise<any> {
        return this._historyForResource(ctx, TraderType, TraderClass, tradeId);
    }
    public async existsTrader(ctx: Context, tradeId: string): Promise<boolean> {
        return this.CRUDTrader(ctx, `{"${TraderIdField}": "${tradeId}"}`, 'e');
    }

    public async addCommodity(ctx: Context, commodityStr: string): Promise<Commodity> {
        return this.CRUDCommodity(ctx, commodityStr, 'c');
    }
    public async updateCommodity(ctx: Context, commodityStr: string): Promise<Commodity> {
        return this.CRUDCommodity(ctx, commodityStr, 'u');
    }
    public async deleteCommodity(ctx: Context, tradingSymbol: string): Promise<void> {
        return this.CRUDCommodity(ctx, `{"${CommodityIdField}": "${tradingSymbol}"}`, 'd');
    }
    public async getCommodity(ctx: Context, tradingSymbol: string): Promise<Commodity> {
        return this.CRUDCommodity(ctx, `{"${CommodityIdField}": "${tradingSymbol}"}`, 'r');
    }
    public async getCommodityHistory(ctx: Context, tradingSymbol: string): Promise<any> {
        return this._historyForResource(ctx, CommodityType, CommodityClass, tradingSymbol);
    }
    public async existsCommodity(ctx: Context, tradingSymbol: string): Promise<boolean> {
        return this.CRUDCommodity(ctx, `{"${CommodityIdField}": "${tradingSymbol}"}`, 'e');
    }

    public async CRUDTrader(ctx: Context, traderStr: string, action: string): Promise<any> {
        const trader: Trader = JSON.parse(traderStr);
        trader.$class = TraderClass;
        return this._CRUDResource(ctx, TraderType, trader, TraderIdField, action);
    }

    public async CRUDCommodity(ctx: Context, commodityStr: string, action: string): Promise<any> {
        const commodity: Commodity = JSON.parse(commodityStr);
        commodity.$class = CommodityClass;
        return this._CRUDResource(ctx, CommodityType, commodity, CommodityIdField, action);
    }

    public async runDynamicQuery(ctx: Context, mango: string): Promise<any> {
        // not good for large datasets as this code will load
        // the complete result set into memory then return it
        // should consider pagination if the result set is going
        // to ge large
        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(mango);
        const results: Resource[] = await this._getAllResults(ctx, iterator);

        /*
        const info: StateQueryResponse<Iterators.StateQueryIterator> = await ctx.stub.getQueryResultWithPagination(mango, 100);
        const iterator2: Iterators.StateQueryIterator = info.iterator;
        const md: QueryResponseMetadata = info.metadata;
        const bm: string = md.bookmark;
        const cc: number = md.fetched_records_count;
        */

        return results;
    }

    public async runQuery(ctx: Context, queryName: string, queryParams: string[]): Promise<any> {
        let mango: string = queryMap[queryName];
        if (mango) {
            if (mango.indexOf('%1') > 0 && queryParams && queryParams.length > 0) {
                mango = mango.replace('%1', queryParams[0]);
            }
            return await this.runDynamicQuery(ctx, mango);
        }
        throw new Error(`query ${queryName} does not exist`);
    }

    public async resolveResource(ctx: Context, resource: Reference, type: string): Promise<any> {
        // this doesn't perform a nested resolve (ie only does 1 deep as trade-network doesn't need it)
        if (resource.startsWith('resource:')) {
            resource = resource.substr(9);
        }
        const keys: string[] = resource.split('#');
        const compositeKey: string = ctx.stub.createCompositeKey(type + ':' + keys[0], [keys[1]]);
        const state: Buffer = await ctx.stub.getState(compositeKey);
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

    public async tradeCommodity(ctx: Context, tradeStr: string): Promise<any> {
        // note, there is no runtime validation of the
        // data, you need to do this yourself.
        const trade: Trade = JSON.parse(tradeStr);

        // note here you have to dereference a resource uri
        const commodityToUpdate: Commodity = await this.resolveResource(ctx, `${CommodityClass}#${trade.commodityId}`, CommodityType);
        // here to continue consistency create a resource uri
        commodityToUpdate.owner = `resource:${TraderClass}#${trade.newOwnerId}`;

        // update the commodity.
        await this._CRUDResource(ctx, CommodityType, commodityToUpdate, CommodityIdField, 'u');

        // fire the chaincode event
        const events: CommodityEvent[] = [];
        const event: CommodityEvent = {action: 'trade', commodity: commodityToUpdate};
        events.push(event);
        ctx.stub.setEvent('trade-network', Buffer.from(JSON.stringify(events)));
    }

    public async removeHighQuantityCommodities(ctx: Context): Promise<any> {
        const results = await this.runQuery(ctx, 'selectCommoditiesWithHighQuantity', null);

        // since all registry requests have to be serialized anyway, there is no benefit to calling Promise.all
        // on an array of promises
        const events: CommodityEvent[] = [];
        results.forEach(async (commodity: Commodity) => {
            await this.deleteCommodity(ctx, commodity.tradingSymbol);
            const event: CommodityEvent = {action: 'remove', commodity};
            events.push(event);
        });
        ctx.stub.setEvent('trade-network', Buffer.from(JSON.stringify(events)));
    }

    // ------------------------------------------------------
    // ------------------------------------------------------
    // ------------------------------------------------------

    // ------------------------------------------------------
    // Private methods, not TP functions to be called. These
    // provide equivalent composer capabilities not directly
    // exposed
    // ------------------------------------------------------
    private async _historyForResource(ctx: Context, type: string, $class: string, id: string): Promise<any> {
        const compositeKey = ctx.stub.createCompositeKey(type + ':' + $class, [id]);
        const historyIterator: Iterators.HistoryQueryIterator = await ctx.stub.getHistoryForKey(compositeKey);
        return await this._getAllHistoryResults(ctx, historyIterator);
    }

    private async _CRUDResource(ctx: Context, type: string, resource: Resource, idField: string, action: string): Promise<any> {
        const compositeKey = ctx.stub.createCompositeKey(type + ':' + resource.$class, [resource[idField]]);
        const state: Buffer = await ctx.stub.getState(compositeKey);
        switch (action) {
            case 'c':
                if (state.length !== 0) {
                    throw new Error(`Resource ${resource.$class} with id ${resource[idField]} exists`);
                }
                await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(resource)));
                return resource;
            case 'u':
                if (state.length === 0) {
                    throw new Error(`Resource ${resource.$class} with id ${resource[idField]} doesn't exist`);
                }
                await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(resource)));
                return resource;
            case 'd':
                if (state.length === 0) {
                    throw new Error(`Resource ${resource.$class} with id ${resource[idField]} doesn't exist`);
                }
                await ctx.stub.deleteState(compositeKey);
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

    private async _getAllHistoryResults(ctx: Context, iterator: Iterators.HistoryQueryIterator): Promise<any> {
        const results = [];
        let res: Iterators.NextKeyModificationResult = {done: false, value: null};
        while (!res.done) {
            res = await iterator.next();
            const itVal: Iterators.KeyModification = res.value;
            if (itVal) {
                const resp: any = {
                    timestamp: itVal.timestamp,
                    txid: itVal.tx_id,
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

    private async _getAllResults(ctx: Context, iterator: Iterators.StateQueryIterator): Promise<any> {
        const results = [];
        let res: Iterators.NextResult = {done: false, value: null};
        while (!res.done) {
            res = await iterator.next();
            const itVal: Iterators.KV = res.value;
            if (itVal && itVal.value) {
                const val = itVal.value.toString('utf8');
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
