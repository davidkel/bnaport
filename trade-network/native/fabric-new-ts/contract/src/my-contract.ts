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

export class MyContract extends Contract {

    public async beforeTransaction(ctx: Context): Promise<void> {
        // perform some generic Access Control checks
        const fcn: string = ctx.stub.getFunctionAndParameters().fcn;
        if (fcn === 'instantiate' || fcn === 'upgrade') {
            // check this is only being run by an administrator as instantiate and
            // upgrade can only be done by a channel admin but without a check any
            // one could invoke the instantiate or upgrade functions.
            // nothing provided here in the example but should be considered
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

    // ------------------------------------------------------------------
    // Important point to note about input parameters and return values
    // when using a contract.
    // 1. As no contract metadata is defined for this contact all
    // input parameters will be strings
    // 2. The return values will be automatically converted to JSON strings
    // and inserted into a Buffer object so can return primitive's or
    // objects rather than a Buffer object.
    // ------------------------------------------------------------------

    // ------------------------------------------------------
    // methods to replicate in-built composer capability
    // ------------------------------------------------------

    // The following methods provide named CRUD type methods to work
    // on a trader.
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

    // The following methods provide named CRUD type methods to work
    // on a commodity.
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

    /**
     * This is used to perform generic CRUD operations on a Trader
     * @async
     * @param ctx The transaction context
     * @param traderStr The trader to work with as a JSON String
     * @param action The action to perform
     * @returns the result of the requested action
     */
    public async CRUDTrader(ctx: Context, traderStr: string, action: string): Promise<any> {
        // deserialize the trader object, no validation done to confirm it is correct
        // add in the class definition for the trader.
        const trader: Trader = JSON.parse(traderStr);
        trader.$class = TraderClass;
        return this._CRUDResource(ctx, TraderType, trader, TraderIdField, action);
    }

    /**
     * This is used to perform generic CRUD operations on a Commodity
     * @async
     * @param ctx The transaction context
     * @param commodityStr The commodity to work with as a JSON String
     * @param action The action to perform
     * @returns the result of the requested action
     */
    public async CRUDCommodity(ctx: Context, commodityStr: string, action: string): Promise<any> {
        // deserialize the commodity object, no validation is done to confirm it is correct
        // add in the class definition for the commodity
        const commodity: Commodity = JSON.parse(commodityStr);
        commodity.$class = CommodityClass;
        return this._CRUDResource(ctx, CommodityType, commodity, CommodityIdField, action);
    }

    /**
     * run a mango specified query. If the dataset is large, this could have performance impacts
     * so should consider using pagination.
     * @async
     * @param ctx The transaction context
     * @param mango The mango query to run
     * @returns all the results from that query
     */
    public async runDynamicQuery(ctx: Context, mango: string): Promise<any[]> {
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

    /**
     * callable method to run a named query defined in this contract. This is just a simple
     * example so only actually allows for a single parameter.
     * @async
     * @param ctx The transaction context
     * @param queryName The name of the query to run
     * @param queryParams the parameters to supply to that query
     * @returns all the results from that query
     */
    public async runQuery(ctx: Context, queryName: string, ...queryParams: string[]): Promise<any[]> {
        let mango: string = queryMap[queryName];
        if (mango) {
            if (mango.indexOf('%1') > 0 && queryParams && queryParams.length > 0) {
                mango = mango.replace('%1', queryParams[0]);
            }
            return await this.runDynamicQuery(ctx, mango);
        }
        throw new Error(`query ${queryName} does not exist`);
    }

    /**
     * Helper method that is also callable from the client to resolve a composer relationship
     * which takes for format of resource://class#identifier
     * @async
     * @param ctx The transaction context
     * @param resourceRef the reference to the resource
     * @param type the type of resource being referenced
     * @returns either an Asset or Participant.
     */
    public async resolveResource(ctx: Context, resourceRef: Reference, type: string): Promise<any> {
        // this doesn't perform a nested resolve (ie only does 1 deep as trade-network doesn't need it)
        if (resourceRef.startsWith('resource:')) {
            resourceRef = resourceRef.substr(9);
        }
        const keys: string[] = resourceRef.split('#');
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

    public async tradeCommodity(ctx: Context, tradeStr: string): Promise<void> {
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

    public async removeHighQuantityCommodities(ctx: Context): Promise<void> {
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

    /**
     * Get all the history for a resource. If a resource can have a long history
     * then this call could take a long time and performance considerations may be
     * needed, for example you may want to introduce pagination support.
     * @param ctx The transaction context
     * @param type the type of resource Asset or Participant
     * @param $class the class of resource
     * @param id the identitier of the resource
     */
    private async _historyForResource(ctx: Context, type: string, $class: string, id: string): Promise<any> {
        // create the composite key in composer format
        const compositeKey = ctx.stub.createCompositeKey(type + ':' + $class, [id]);
        const historyIterator: Iterators.HistoryQueryIterator = await ctx.stub.getHistoryForKey(compositeKey);
        return await this._getAllHistoryResults(ctx, historyIterator);
    }

    /**
     * This is used to perform generic CRUD operations on a Resource and a Resource
     * here is either an Asset or Participant.
     * @async
     * @param ctx The transaction context
     * @param type Asset or Participant
     * @param resource information about the asset or participant
     * @param idField the field in the resource that is the identifier for this resource
     * @param action the action to perform
     */
    private async _CRUDResource(ctx: Context, type: string, resource: Resource, idField: string, action: string): Promise<any> {
        // create the composite key in composer format
        const compositeKey = ctx.stub.createCompositeKey(type + ':' + resource.$class, [resource[idField]]);
        const state: Buffer = await ctx.stub.getState(compositeKey);
        switch (action) {
            case 'c':
                // create an Asset or Participant and check it doesn't exist first
                if (state.length !== 0) {
                    throw new Error(`Resource ${resource.$class} with id ${resource[idField]} exists`);
                }
                await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(resource)));
                // return back that created Asset or Participant
                return resource;
            case 'u':
                // update an Asset or Participant and check it does exist first
                if (state.length === 0) {
                    throw new Error(`Resource ${resource.$class} with id ${resource[idField]} doesn't exist`);
                }
                await ctx.stub.putState(compositeKey, Buffer.from(JSON.stringify(resource)));
                // return back that resource
                return resource;
            case 'd':
                // delete the Asset or Participant so long as it exists
                if (state.length === 0) {
                    throw new Error(`Resource ${resource.$class} with id ${resource[idField]} doesn't exist`);
                }
                await ctx.stub.deleteState(compositeKey);
                return;
            case 'r':
                // return the requested Asset or Participant if it exists
                if (state.length) {
                    return JSON.parse(state.toString('utf8'));
                }
                throw new Error(`${type}:${resource.$class} with id ${resource[idField]} does not exist`);
            case 'e':
                // return whether the asset or participant exists or not.
                // Due to a bug JIRA FAB-14442, this will return 'true' to the client for true
                // but an empty buffer for false.
                return state.length !== 0;
        }
    }

    /**
     * Helper method to get all the history results from an iterator
     * @async
     * @param ctx The transaction context
     * @param iterator The iterator
     * @returns an array of the objects that represent the information.
     */
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

    /**
     * Helper method to get all the query results from an iterator
     * @async
     * @param ctx The transaction context
     * @param iterator The iterator
     * @returns an array of the objects that represent the information.
     */
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
