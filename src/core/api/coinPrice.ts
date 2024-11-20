import axios from 'axios';
export async function getPriceSol (){
    try {
        const data = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT')
        const price = parseFloat(data.data.price).toFixed(2);
        console.log(price)
        return price
    } catch (error) {
        console.log("error getting data price")
    }
}
export async function getPriceBNB (){
    try {
        const data = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT')
        const price = parseFloat(data.data.price).toFixed(2);
        console.log(price)
        return price
    } catch (error) {
        console.log("error getting data price")
    }
}
export async function getPriceMATIC (){
    try {
        const data = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=MATICUSDT')
        const price = parseFloat(data.data.price).toFixed(2);
        console.log(price)
        return price
    } catch (error) {
        console.log("error getting data price")
    }
}