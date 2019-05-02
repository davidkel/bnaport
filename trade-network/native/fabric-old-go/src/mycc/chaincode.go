package main

import (
	//	"bytes"
	"encoding/json"
	"fmt"
	//	"strconv"
	//	"strings"
	//	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/core/chaincode/shim/ext/cid"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// need this to associate the invocable methods
type SimpleChaincode struct {
}

func main() {
	shim.Start(new(SimpleChaincode))
}

// create a function dispatch table
// could we do this using reflection. I guess so, need to learn more.
var functions = map[string]func(stub shim.ChaincodeStubInterface) pb.Response{
	"instantiate":  instantiate,
	"addTrader":    addTrader,
	"updateTrader": updateTrader,
	"getTrader":    getTrader,
	"deleteTrader": deleteTrader,
	"existsTrader": existsTrader,
	//"getTraderHistory": getTraderHistory,
	"addCommodity":    addCommodity,
	"updateCommodity": updateCommodity,
	"getCommodity":    getCommodity,
	"deleteCommodity": deleteCommodity,
	"existsCommodity": existsCommodity,
	//"getTraderHistory": getTraderHistory,
	//"runDynamicQuery": runDynamicQuery,
	//"runQuery": runQuery,
	//"resolveResource": resolveResource,
	//"tradeCommodity": tradeCommodity
	//"removeHighQuantityCommodities": removeHighQuantityCommodities
}

func dispatch(stub shim.ChaincodeStubInterface) pb.Response {
	id, _ := cid.GetID(stub)
	funcName, _ := stub.GetFunctionAndParameters()
	fmt.Println("dispatch is running " + funcName + " for id:" + id)
	if function, ok := functions[funcName]; ok {
		fmt.Printf("Invoking %s\n", funcName)
		return function(stub)
	}
	return shim.Error(fmt.Sprintf("Unknown function %s", funcName))
}

// Init
func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	return dispatch(stub)
}

// Invoke - Our entry point for Invocations
// ========================================
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	return dispatch(stub)
}

// actual methods

func instantiate(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("instantiated")
	return shim.Success(nil)
}

func addCommodity(stub shim.ChaincodeStubInterface) pb.Response {
	return crudCommodity(stub, "c")
}

func updateCommodity(stub shim.ChaincodeStubInterface) pb.Response {
	return crudCommodity(stub, "u")
}

func deleteCommodity(stub shim.ChaincodeStubInterface) pb.Response {
	return crudCommodity(stub, "d")
}

func existsCommodity(stub shim.ChaincodeStubInterface) pb.Response {
	return crudCommodity(stub, "e")
}

func getCommodity(stub shim.ChaincodeStubInterface) pb.Response {
	return crudCommodity(stub, "r")
}

func addTrader(stub shim.ChaincodeStubInterface) pb.Response {
	return crudTrader(stub, "c")
	/*
			// we get a string of JSON to represent the trader
			_, parameters := stub.GetFunctionAndParameters()
			if len(parameters) != 1 {
				return shim.Error("Wrong number of arguments supplied. ")
			}
			// cast the parameter to a byte array from a string
			traderJSON := []byte(parameters[0])
			var trader Trader
			// marshall into a trader object.
			err := json.Unmarshal(traderJSON, &trader)
			if err != nil {
				return shim.Error(err.Error())
			}
			trader.Class = TraderClass
			const restype = "Participant"
			objectKey := restype + ":" + TraderClass
			compositeKey, _ := stub.CreateCompositeKey(objectKey, []string{trader.TradeId})
			state, err := stub.GetState(compositeKey)
			if err != nil {
				return shim.Error(err.Error())
			}
			if state != nil {
				// what does the app expect in an error ?
				jsonResp := "{\"Error\":\"trader already exists: " + trader.TradeId + "\"}"
				return shim.Error(jsonResp)
			}
			traderJSONasBytes, err := json.Marshal(trader)
			if err != nil {
				return shim.Error(err.Error())
			}

			stub.PutState(compositeKey, traderJSONasBytes)
		    return shim.Success(traderJSONasBytes)
	*/
}

func updateTrader(stub shim.ChaincodeStubInterface) pb.Response {
	return crudTrader(stub, "u")

	/*
			// we get a string of JSON to represent the trader
			_, parameters := stub.GetFunctionAndParameters()
			if len(parameters) != 1 {
				return shim.Error("Wrong number of arguments supplied. ")
			}
			// cast the parameter to a byte array from a string
			traderJSON := []byte(parameters[0])
			var trader Trader
			// marshall into a trader object.
			err := json.Unmarshal(traderJSON, &trader)
			if err != nil {
				return shim.Error(err.Error())
			}
			trader.Class = TraderClass
			const restype = "Participant"
			objectKey := restype + ":" + TraderClass
			compositeKey, _ := stub.CreateCompositeKey(objectKey, []string{trader.TradeId})
			state, err := stub.GetState(compositeKey)
			if err != nil {
				return shim.Error(err.Error())
			}
			if state == nil {
				// what does the app expect in an error ?
				jsonResp := "{\"Error\":\"trader does not exist: " + trader.TradeId + "\"}"
				return shim.Error(jsonResp)
			}
			traderJSONasBytes, err := json.Marshal(trader)
			if err != nil {
				return shim.Error(err.Error())
			}

			stub.PutState(compositeKey, traderJSONasBytes)
		    return shim.Success(traderJSONasBytes)
	*/
}

func getTrader(stub shim.ChaincodeStubInterface) pb.Response {
	return crudTrader(stub, "r")

	/*
			// we get a string of JSON to represent the trader
			_, parameters := stub.GetFunctionAndParameters()
			if len(parameters) != 1 {
				return shim.Error("Wrong number of arguments supplied. ")
			}

			const restype = "Participant"
			objectKey := restype + ":" + TraderClass
			compositeKey, _ := stub.CreateCompositeKey(objectKey, []string{parameters[0]})
			state, err := stub.GetState(compositeKey)
			if err != nil {
				return shim.Error(err.Error())
			}
			if state == nil {
				// what does the app expect in an error ?
				jsonResp := "{\"Error\":\"trader does not exist: " + parameters[0] + "\"}"
				return shim.Error(jsonResp)
			}
		    return shim.Success(state)
	*/
}

func existsTrader(stub shim.ChaincodeStubInterface) pb.Response {
	return crudTrader(stub, "e")

	/*
			// we get a string of JSON to represent the trader
			_, parameters := stub.GetFunctionAndParameters()
			if len(parameters) != 1 {
				return shim.Error("Wrong number of arguments supplied. ")
			}

			const restype = "Participant"
			objectKey := restype + ":" + TraderClass
			compositeKey, _ := stub.CreateCompositeKey(objectKey, []string{parameters[0]})
			state, err := stub.GetState(compositeKey)
			if err != nil {
				return shim.Error(err.Error())
			}
			if state == nil {
				return shim.Success([]byte("false"))
			}
		    return shim.Success([]byte("true"))
	*/
}

func deleteTrader(stub shim.ChaincodeStubInterface) pb.Response {
	return crudTrader(stub, "d")

	/*
			// we get a string of JSON to represent the trader
			_, parameters := stub.GetFunctionAndParameters()
			if len(parameters) != 1 {
				return shim.Error("Wrong number of arguments supplied. ")
			}

			const restype = "Participant"
			objectKey := restype + ":" + TraderClass
			compositeKey, _ := stub.CreateCompositeKey(objectKey, []string{parameters[0]})
			state, err := stub.GetState(compositeKey)
			if err != nil {
				return shim.Error(err.Error())
			}
			if state == nil {
				// what does the app expect in an error ?
				jsonResp := "{\"Error\":\"trader does not exist: " + parameters[0] + "\"}"
				return shim.Error(jsonResp)
			}
			stub.DelState(compositeKey)
		    return shim.Success(nil)
	*/
}

func crudTrader(stub shim.ChaincodeStubInterface, action string) pb.Response {
	_, parameters := stub.GetFunctionAndParameters()
	if len(parameters) != 1 {
		return shim.Error("Wrong number of arguments supplied. ")
	}
	var traderJSON []byte

	if action == "r" || action == "e" || action == "d" {
		traderJSON = []byte("{\"" + TraderIdField + "\":\"" + parameters[0] + "\"}")
	} else {
		traderJSON = []byte(parameters[0])
	}

	var trader Trader
	// marshall into a trader object.
	err := json.Unmarshal(traderJSON, &trader)
	if err != nil {
		return shim.Error(err.Error())
	}
	trader.Class = TraderClass
	return crudResource(stub, trader, TraderType, TraderClass, trader.TradeId, action)
}

func crudCommodity(stub shim.ChaincodeStubInterface, action string) pb.Response {
	_, parameters := stub.GetFunctionAndParameters()
	if len(parameters) != 1 {
		return shim.Error("Wrong number of arguments supplied. ")
	}
	var commodityJSON []byte

	if action == "r" || action == "e" || action == "d" {
		commodityJSON = []byte("{\"" + CommodityIdField + "\":\"" + parameters[0] + "\"}")
	} else {
		commodityJSON = []byte(parameters[0])
	}
	var commodity Commodity
	// marshall into a commodity object.
	err := json.Unmarshal(commodityJSON, &commodity)
	if err != nil {
		return shim.Error(err.Error())
	}
	commodity.Class = CommodityClass
	return crudResource(stub, commodity, CommodityType, CommodityClass, commodity.TradingSymbol, action)
}

func crudResource(stub shim.ChaincodeStubInterface, resource interface{}, resType string, resClass string, resID string, action string) pb.Response {
	// TODO: maybe use strings.Builder

	/*  Could use this to determine the type and thus the relevant
	    model specific entries
	    whatAmI := func(i interface{}) {
	        switch t := i.(type) {
	        case bool:
	            fmt.Println("I'm a bool")
	        case int:
	            fmt.Println("I'm an int")
	        default:
	            fmt.Printf("Don't know type %T\n", t)
	        }
	    }
	*/

	objectKey := resType + ":" + resClass
	compositeKey, _ := stub.CreateCompositeKey(objectKey, []string{resID})

	state, err := stub.GetState(compositeKey)
	if err != nil {
		return shim.Error(err.Error())
	}

	switch action {
	case "c":
		if state != nil {
			// what does the app expect in an error ?
			jsonResp := "{\"Error\":\"resource already exists: " + resID + "\"}"
			return shim.Error(jsonResp)
		}
		traderJSONasBytes, err := json.Marshal(resource)
		if err != nil {
			return shim.Error(err.Error())
		}

		stub.PutState(compositeKey, traderJSONasBytes)
		return shim.Success(traderJSONasBytes)

	case "u":
		if state == nil {
			// what does the app expect in an error ?
			jsonResp := "{\"Error\":\"resource does not exist: " + resID + "\"}"
			return shim.Error(jsonResp)
		}
		traderJSONasBytes, err := json.Marshal(resource)
		if err != nil {
			return shim.Error(err.Error())
		}

		stub.PutState(compositeKey, traderJSONasBytes)
		return shim.Success(traderJSONasBytes)

	case "d":
		if state == nil {
			// what does the app expect in an error ?
			jsonResp := "{\"Error\":\"resource does not exist: " + resID + "\"}"
			return shim.Error(jsonResp)
		}
		stub.DelState(compositeKey)
		return shim.Success(nil)
	case "r":
		if state == nil {
			// what does the app expect in an error ?
			jsonResp := "{\"Error\":\"resource does not exist: " + resID + "\"}"
			return shim.Error(jsonResp)
		}
		return shim.Success(state)
	case "e":
		if state == nil {
			return shim.Success([]byte("false"))
		}
		return shim.Success([]byte("true"))
	}

	return shim.Error("oh bum")
}
