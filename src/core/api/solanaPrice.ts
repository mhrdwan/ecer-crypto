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