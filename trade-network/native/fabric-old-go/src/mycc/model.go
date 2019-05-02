package main

import (
//	"bytes"
//"encoding/json"
//"fmt"
//	"strconv"
//	"strings"
//	"time"
)

const assetType = "Asset"
const participantType = "Participant"

const Namespace = "org.example.trading"
const CommodityType = assetType
const CommodityClass = Namespace + ".Commodity"
const CommodityIdField = "tradingSymbol"
const TraderType = participantType
const TraderClass = Namespace + ".Trader"
const TraderIdField = "tradeId"

type Resource struct {
	Class string `json:"$class"`
}

type Trader struct {
	//    Resource
	Class     string `json:"$class"`
	TradeId   string `json:"tradeId"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

type Commodity struct {
	//    Resource
	Class         string `json:"$class"`
	TradingSymbol string `json:"tradingSymbol"`
	Description   string `json:"description"`
	MainExchange  string `json:"mainExchange"`
	Quantity      int64  `json:"quantity"`
	Owner         string `json:"owner"`
}

type Trade struct {
	//    Resource
	Class       string `json:"$class"`
	CommodityId string `json:"commodityId"`
	NewOwnerId  string `json:"newOwnerId"`
}

// this event format does differ from composer but there is
// no need for it to be identical.
type CommodityEvent struct {
	Action    string `json:"action"`
	Commodity Commodity
}
