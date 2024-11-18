import axios from 'axios';

export async function getCyreency() {
  try {
    const response = await axios.get('https://open.er-api.com/v6/latest/USD');
    const rate = response.data.rates; 
    return rate;
  } catch (error : any) {
    console.error('Error fetching exchange rate:', error.message);
    return null;
  }
}

