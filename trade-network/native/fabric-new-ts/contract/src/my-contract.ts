/*
 * SPDX-License-Identifier:
 */

import { Context, Contract, Info } from 'fabric-contract-api';
import { Iterators, QueryResponseMetadata, StateQueryResponse } from 'fabric-shim';
import {
    Commodity,
    CommodityClass,
    CommodityIdField,
    Reference,
    Resource,
    Trade,
    Trader,
    TraderClass,
    TraderIdField,
} from '../../model/trade-model';

// TODO: Should the transaction request be modelled or just a set of parameters (currently modelled)
// TODO: Should the events be modelled ? currently not and different from composer

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

    public async instantiate(ctx: Context): Promise<any> {
        console.info('instantiate');
    }

    // ------------------------------------------------------
    // methods to replicate in-built composer capability
    // ------------------------------------------------------

    public async addTrader(ctx: Context, traderStr: string): Promise<any> {
        return this.CRUDTrader(ctx, traderStr, 'c');
    }
    public async updateTrader(ctx: Context, traderStr: string): Promise<any> {
        return this.CRUDTrader(ctx, traderStr, 'u');
    }
    public async deleteTrader(ctx: Context, tradeId: string): Promise<any> {
        return this.CRUDTrader(ctx, `{${TraderIdField}: ${tradeId}}`, 'd');
    }
    public async getTrader(ctx: Context, tradeId: string): Promise<any> {
        return this.CRUDTrader(ctx, `{${TraderIdField}: ${tradeId}}`, 'r');
    }

    public async addCommodity(ctx: Context, commodityStr: string): Promise<any> {
        return this.CRUDCommodity(ctx, commodityStr, 'c');
    }
    public async updateCommodity(ctx: Context, commodityStr: string): Promise<any> {
        return this.CRUDCommodity(ctx, commodityStr, 'u');
    }
    public async deleteCommodity(ctx: Context, tradingSymbol: string): Promise<any> {
        return this.CRUDCommodity(ctx, `{${CommodityIdField}: ${tradingSymbol}}`, 'd');
    }
    public async getCommodity(ctx: Context, tradingSymbol: string): Promise<any> {
        return this.CRUDCommodity(ctx, `{${CommodityIdField}: ${tradingSymbol}}`, 'r');
    }

    public async CRUDTrader(ctx: Context, traderStr: string, action: string): Promise<any> {
        const trader: Trader = JSON.parse(traderStr);
        trader.$class = TraderClass;
        return this._CRUDResource(ctx, 'Participant', trader, TraderIdField, action);
    }

    public async CRUDCommodity(ctx: Context, commodityStr: string, action: string): Promise<any> {
        const commodity: Commodity = JSON.parse(commodityStr);
        commodity.$class = CommodityClass;
        return this._CRUDResource(ctx, 'Asset', commodity, CommodityIdField, action);
    }

    public async runDynamicQuery(ctx: Context, mango: string) {
        console.log(mango);
        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(mango);
        const results: Resource[] = await this._getAllResults(ctx, iterator);

        const info: StateQueryResponse<Iterators.StateQueryIterator> = await ctx.stub.getQueryResultWithPagination(mango, 100);
        const iterator2: Iterators.StateQueryIterator = info.iterator;
        const md: QueryResponseMetadata = info.metadata;
        const bm: string = md.bookmark;
        const cc: number = md.fetched_records_count;

        console.log('results', results);
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
        const commodityToUpdate: Commodity = await this.resolveResource(ctx, `${CommodityClass}#${trade.commodityId}`, 'Asset');
        // here to continue consistency create a resource uri
        commodityToUpdate.owner = `resource:${TraderClass}#${trade.newOwnerId}`;

        // update the commodity.
        const compositeKey = ctx.stub.createCompositeKey(`Asset:${CommodityClass}`, [commodityToUpdate.tradingSymbol]);
        await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(commodityToUpdate)));

        // fire the chaincode event
        const event = [{action: 'trade', commodity: commodityToUpdate}];
        ctx.stub.setEvent('trade-network', Buffer.from(JSON.stringify(event)));
    }

    public async removeHighQuantityCommodities(ctx: Context): Promise<any> {
        const results = await this.runQuery(ctx, 'selectCommoditiesWithHighQuantity', null);

        // since all registry requests have to be serialized anyway, there is no benefit to calling Promise.all
        // on an array of promises
        const events = [];
        results.forEach(async (trade: Commodity) => {
            await this.deleteCommodity(ctx, trade.tradingSymbol);
            const event = {action: 'remove', commodity: trade};
            events.push(event);
        });
        ctx.stub.setEvent('trade-network', Buffer.from(JSON.stringify(events)));
    }

    // ------------------------------------------------------
    // ------------------------------------------------------
    // ------------------------------------------------------

    // bug in contract api, cannot be used.
    /*
    public async unknownTransaction(ctx) {
        const {fcn, arg1} = ctx.stub.getFunctionAndParameters();
        switch (fcn) {
            case 'addCommodity':
                return await this.CRUDCommodity(ctx, arg1, 'c');
            case 'updateCommodity':
                return await this.CRUDCommodity(ctx, arg1, 'u');
            case 'readCommodity':
                return await this.CRUDCommodity(ctx, arg1, 'r');
            case 'deleteCommodity':
                return await this.CRUDCommodity(ctx, arg1, 'd');
            case 'addTrader':
                return await this.CRUDTrader(ctx, arg1, 'c');
            case 'updateTrader':
                return await this.CRUDTrader(ctx, arg1, 'u');
            case 'readTrader':
                return await this.CRUDTrader(ctx, arg1, 'r');
            case 'deleteTrader':
                return await this.CRUDTrader(ctx, arg1, 'd');
            default:
                throw new Error(`You've asked to invoke a function that does not exist: ${fcn}`);
        }
    }
    */

    // ------------------------------------------------------
    // Private methods, not TP functions to be called. These
    // provide equivalent composer capabilities not directly
    // exposed
    // ------------------------------------------------------
    private async _CRUDResource(ctx: Context, type: string, resource: Resource, idField: string, action: string): Promise<any> {
        const compositeKey = ctx.stub.createCompositeKey(type + ':' + resource.$class, [resource[idField]]);
        switch (action) {
            case 'c':
            case 'u':
                await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(resource)));
                return resource;
            case 'd':
                // TODO: Should check it exists first
                await ctx.stub.deleteState(compositeKey);
                return;
            case 'r':
                const state: Buffer = await ctx.stub.getState(compositeKey);
                if (state.length) {
                    return JSON.parse(state.toString('utf8'));
                }
                throw new Error(`${type}:${resource.$class} with id ${resource[idField]} does not exist`);
            case 'e':
                const state2: Buffer = await ctx.stub.getState(compositeKey);
                return state2.length !== 0;
        }
    }

    private async _getAllResults(ctx: Context, iterator: Iterators.StateQueryIterator): Promise<any> {
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
